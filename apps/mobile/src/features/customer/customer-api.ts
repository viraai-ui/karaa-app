import {
  conversationsResponseSchema,
  messageResponseSchema,
  projectDetailResponseSchema,
  projectsResponseSchema,
  type Conversation,
  type Message,
} from '@karaa/contracts/events';
import { z } from 'zod';

import { ApiError, apiBaseUrl } from '../../lib/api';
import type { Session } from '../../lib/session';

export type CustomerProjectDetail = z.infer<typeof projectDetailResponseSchema>;

type Fetcher = typeof fetch;

const requestTimeoutMs = 10_000;
const maxEvidencePreviewBytes = 10_000_000;
const previewMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const projectReplySchema = z.object({ body: z.string().trim().min(1).max(2_000) }).strict();

function ensureCustomerSession(session: Session): void {
  if (session.user.role !== 'customer') {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to customer project evidence.');
  }
}

function requestUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project record.');
  }
}

async function authorizedGet(
  path: string,
  session: Session,
  fetcher: Fetcher,
  baseUrl: string,
): Promise<unknown> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    response = await fetcher(requestUrl(baseUrl, path), {
      headers: { authorization: `Bearer ${session.token}` },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  }
  if (response.status === 403) {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to this project evidence.');
  }
  if (!response.ok) {
    throw new ApiError('REQUEST_FAILED', 'Karaa could not load this project evidence.');
  }

  return readJson(response);
}

async function authorizedPost(path: string, body: unknown, session: Session, fetcher: Fetcher, baseUrl: string): Promise<unknown> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    response = await fetcher(requestUrl(baseUrl, path), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You do not have access to this project support conversation.');
  if (response.status !== 201) throw new ApiError('REQUEST_FAILED', 'Karaa could not save this project reply.');
  return readJson(response);
}

function toBase64DataUri(mimeType: string, bytes: ArrayBuffer): string {
  const binary = Array.from(new Uint8Array(bytes), (value) => String.fromCharCode(value)).join('');
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/** Loads protected evidence into component memory without writing project data to disk. */
export async function fetchProtectedEvidenceDataUri(
  mediaPath: string,
  session: Pick<Session, 'token'>,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<string> {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    response = await fetcher(requestUrl(baseUrl, mediaPath), {
      cache: 'no-store',
      headers: { authorization: `Bearer ${session.token}` },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  }
  if (response.status === 403) {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to this project evidence.');
  }
  if (!response.ok) {
    throw new ApiError('REQUEST_FAILED', 'Karaa could not load this project evidence.');
  }

  const mimeType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (!mimeType || !previewMimeTypes.has(mimeType)) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned invalid project evidence.');
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await response.arrayBuffer();
  } catch {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned invalid project evidence.');
  }
  if (bytes.byteLength === 0 || bytes.byteLength > maxEvidencePreviewBytes) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned invalid project evidence.');
  }

  return toBase64DataUri(mimeType, bytes);
}

/** Reads only the current Customer's server-authorized project detail. */
export async function fetchCustomerProject(
  session: Session,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<CustomerProjectDetail> {
  ensureCustomerSession(session);

  const summaries = projectsResponseSchema.safeParse(
    await authorizedGet('/v1/projects', session, fetcher, baseUrl),
  );
  if (!summaries.success) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project list.');
  }

  const project = summaries.data.projects.find(({ showcase }) => showcase) ?? summaries.data.projects[0];
  if (!project) {
    throw new ApiError('REQUEST_FAILED', 'No project evidence is available for this workspace.');
  }

  const detail = projectDetailResponseSchema.safeParse(
    await authorizedGet(`/v1/projects/${project.id}`, session, fetcher, baseUrl),
  );
  if (!detail.success) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project record.');
  }

  return detail.data;
}

/** Loads only the persisted Customer support thread; this client never opens Management direct threads. */
export async function fetchCustomerSupportConversation(
  session: Session,
  projectId: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<Conversation | undefined> {
  ensureCustomerSession(session);
  const response = conversationsResponseSchema.safeParse(
    await authorizedGet(`/v1/projects/${projectId}/conversations`, session, fetcher, baseUrl),
  );
  if (!response.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project support conversation.');
  return response.data.conversations.find((conversation) => conversation.kind === 'support');
}

/** Sends a reply only to an existing, server-authorized Customer support conversation. */
export async function sendCustomerSupportMessage(
  session: Session,
  conversationId: string,
  body: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<Message> {
  ensureCustomerSession(session);
  const request = projectReplySchema.safeParse({ body });
  if (!request.success) throw new ApiError('REQUEST_FAILED', 'Enter a project reply before sending.');
  const response = messageResponseSchema.safeParse(
    await authorizedPost(`/v1/conversations/${conversationId}/messages`, request.data, session, fetcher, baseUrl),
  );
  if (!response.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved project reply.');
  return response.data.message;
}
