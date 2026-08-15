import { File } from 'expo-file-system';
import { z } from 'zod';

import type { EmployeeAssignedWork, EmployeeFieldRecord } from './EmployeeWorkScreen';
import { ApiError, apiBaseUrl } from '../../lib/api';
import type { Session } from '../../lib/session';
import {
  conversationsResponseSchema,
  messageResponseSchema,
  projectDetailResponseSchema,
  projectsResponseSchema,
  type Conversation,
  type Message,
} from '@karaa/contracts/events';

const requestTimeoutMs = 10_000;
const progressUpdateResponseSchema = z.object({ replayed: z.boolean() }).passthrough();
const projectReplySchema = z.object({ body: z.string().trim().min(1).max(2_000) }).strict();

type Fetcher = typeof fetch;

type EmployeeApiOptions = {
  fetcher?: Fetcher;
  baseUrl?: string;
};

function requestUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function ensureEmployeeSession(session: Session): void {
  if (session.user.role !== 'employee') {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to field records.');
  }
}

async function readJson(response: Response, message: string): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiError('SERVER_RESPONSE_INVALID', message);
  }
}

async function authorizedGet(path: string, session: Session, fetcher: Fetcher, baseUrl: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
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

  if (response.status === 401) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You do not have access to these assigned records.');
  if (!response.ok) throw new ApiError('REQUEST_FAILED', 'Karaa could not load assigned work.');
  return readJson(response, 'Karaa returned an invalid assigned-work record.');
}

async function authorizedPost(path: string, body: unknown, session: Session, fetcher: Fetcher, baseUrl: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
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
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You do not have access to this project conversation.');
  if (response.status !== 201) throw new ApiError('REQUEST_FAILED', 'Karaa could not save this project reply.');
  return readJson(response, 'Karaa returned an invalid saved project reply.');
}

/** Reads the authenticated Employee's first server-authorized project and its milestones. */
export async function fetchEmployeeWork(
  session: Session,
  { fetcher = fetch, baseUrl = apiBaseUrl }: Pick<EmployeeApiOptions, 'fetcher' | 'baseUrl'> = {},
): Promise<EmployeeAssignedWork> {
  ensureEmployeeSession(session);
  const summaries = projectsResponseSchema.safeParse(await authorizedGet('/v1/projects', session, fetcher, baseUrl));
  if (!summaries.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid assigned-work list.');

  const project = summaries.data.projects.find(({ showcase }) => showcase) ?? summaries.data.projects[0];
  if (!project) throw new ApiError('REQUEST_FAILED', 'No assigned project is available for this workspace.');

  const detail = projectDetailResponseSchema.safeParse(
    await authorizedGet(`/v1/projects/${project.id}`, session, fetcher, baseUrl),
  );
  if (!detail.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid assigned-work record.');

  return detail.data;
}

/** Loads an existing Employee-visible project conversation; it never creates one. */
export async function fetchEmployeeProjectConversation(
  session: Session,
  projectId: string,
  { fetcher = fetch, baseUrl = apiBaseUrl }: Pick<EmployeeApiOptions, 'fetcher' | 'baseUrl'> = {},
): Promise<Conversation | undefined> {
  ensureEmployeeSession(session);
  const response = conversationsResponseSchema.safeParse(
    await authorizedGet(`/v1/projects/${projectId}/conversations`, session, fetcher, baseUrl),
  );
  if (!response.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project conversation.');
  return response.data.conversations[0];
}

/** Sends a reply only to an existing authorized project conversation. */
export async function sendEmployeeProjectMessage(
  session: Session,
  conversationId: string,
  body: string,
  { fetcher = fetch, baseUrl = apiBaseUrl }: Pick<EmployeeApiOptions, 'fetcher' | 'baseUrl'> = {},
): Promise<Message> {
  ensureEmployeeSession(session);
  const request = projectReplySchema.safeParse({ body });
  if (!request.success) throw new ApiError('REQUEST_FAILED', 'Enter a project reply before sending.');
  const response = messageResponseSchema.safeParse(
    await authorizedPost(`/v1/conversations/${conversationId}/messages`, request.data, session, fetcher, baseUrl),
  );
  if (!response.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved project reply.');
  return response.data.message;
}

/** Posts the one exact multipart shape accepted by the Employee evidence API. */
export async function submitEmployeeFieldRecord(
  session: Session,
  record: EmployeeFieldRecord,
  { fetcher = fetch, baseUrl = apiBaseUrl }: EmployeeApiOptions = {},
): Promise<{ replayed: boolean }> {
  ensureEmployeeSession(session);

  const coordinates = 'latitude' in record.location
    ? { latitude: record.location.latitude, longitude: record.location.longitude }
    : { latitude: null, longitude: null };

  const payload = {
    eventId: record.eventId,
    projectId: record.projectId,
    milestoneId: record.milestoneId,
    occurredAt: record.occurredAt,
    ...coordinates,
    locationState: record.location.state,
    claimedProgress: record.claimedProgress,
    workDescription: record.workDescription,
    nextAction: record.nextAction,
    crewCount: record.crewCount,
    crewHours: record.crewHours,
    quantityValue: record.quantityValue,
    quantityUnit: record.quantityUnit,
    siteConditions: record.siteConditions,
    blocker: record.blocker,
  };
  const multipart = new FormData();
  multipart.append('payload', JSON.stringify(payload));
  const photo = new File(record.photo.uri);
  multipart.append('photo', photo, record.photo.fileName);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
  try {
    response = await fetcher(requestUrl(baseUrl, '/v1/progress-updates'), {
      method: 'POST',
      headers: { authorization: `Bearer ${session.token}` },
      body: multipart,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You are not assigned to this project.');
  if (response.status === 409) throw new ApiError('REQUEST_FAILED', 'This field record conflicts with an existing Karaa event.');
  if (response.status !== 200 && response.status !== 201) throw new ApiError('REQUEST_FAILED', 'Karaa could not save this field record.');

  const result = progressUpdateResponseSchema.safeParse(await readJson(response, 'Karaa returned an invalid saved field record.'));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved field record.');
  return { replayed: result.data.replayed };
}
