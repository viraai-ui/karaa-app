import {
  conversationResponseSchema,
  conversationsResponseSchema,
  issueResponseSchema,
  locationsResponseSchema,
  managementSummaryResponseSchema,
  messageResponseSchema,
  type Conversation,
} from '@karaa/contracts/events';
import { z } from 'zod';

import { ApiError, apiBaseUrl } from '../../lib/api';
import type { Session } from '../../lib/session';

export type ManagementSummary = z.infer<typeof managementSummaryResponseSchema>;
type ProjectIssue = ManagementSummary['projects'][number]['issues'][number];
type Fetcher = typeof fetch;

const requestTimeoutMs = 10_000;

function requestUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function managementRequest(
  session: Session,
  path: string,
  init: RequestInit,
  fetcher: Fetcher,
  baseUrl: string,
): Promise<unknown> {
  if (session.user.role !== 'management') {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to the command centre.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
  try {
    response = await fetcher(requestUrl(baseUrl, path), {
      ...init,
      headers: { authorization: `Bearer ${session.token}`, ...init.headers },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 401) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You do not have access to this management action.');
  if (!response.ok) throw new ApiError('REQUEST_FAILED', 'Karaa could not complete this management action.');
  try {
    return await response.json();
  } catch {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid management record.');
  }
}

export async function fetchManagementSummary(session: Session, fetcher: Fetcher = fetch, baseUrl = apiBaseUrl): Promise<ManagementSummary> {
  const result = managementSummaryResponseSchema.safeParse(await managementRequest(session, '/v1/management/summary', { method: 'GET' }, fetcher, baseUrl));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid management record.');
  return result.data;
}

/** Reads server-authorized current field locations for one Management project. */
export async function fetchManagementProjectLocations(
  session: Session,
  projectId: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
) {
  const result = locationsResponseSchema.safeParse(await managementRequest(
    session,
    `/v1/projects/${projectId}/locations`,
    { method: 'GET' },
    fetcher,
    baseUrl,
  ));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid field-location record.');
  return result.data.locations;
}

export async function openManagementDirectConversation(
  session: Session,
  projectId: string,
  employeeId: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<Conversation> {
  const result = conversationResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/conversations/direct`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  }, fetcher, baseUrl));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid direct conversation.');
  return result.data.conversation;
}

/** Reads exactly the persisted direct thread just opened by Management, never an arbitrary project thread. */
export async function fetchManagementDirectConversation(
  session: Session,
  projectId: string,
  conversationId: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<Conversation> {
  const result = conversationsResponseSchema.safeParse(await managementRequest(
    session,
    `/v1/projects/${projectId}/conversations`,
    { method: 'GET' },
    fetcher,
    baseUrl,
  ));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid direct conversation list.');
  const conversation = result.data.conversations.find((item) => item.id === conversationId && item.projectId === projectId);
  if (!conversation) throw new ApiError('REQUEST_FAILED', 'Karaa could not load the authorized direct conversation.');
  return conversation;
}

export async function sendManagementDirectMessage(
  session: Session,
  conversationId: string,
  body: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<void> {
  const result = messageResponseSchema.safeParse(await managementRequest(session, `/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body }),
  }, fetcher, baseUrl));
  if (!result.success || result.data.message.conversationId !== conversationId) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved direct reply.');
  }
}

export async function createManagementIssue(
  session: Session,
  projectId: string,
  input: { description: string; assigneeId: string; dueAt: string; rootCause: string },
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<ProjectIssue> {
  const { description, assigneeId, dueAt, rootCause } = input;
  const result = issueResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/issues`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description, assigneeId, dueAt, rootCause }),
  }, fetcher, baseUrl));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid intervention record.');
  return result.data.issue;
}

export async function resolveManagementIssue(
  session: Session,
  issueId: string,
  fetcher: Fetcher = fetch,
  baseUrl = apiBaseUrl,
): Promise<ProjectIssue> {
  const result = issueResponseSchema.safeParse(await managementRequest(session, `/v1/issues/${issueId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  }, fetcher, baseUrl));
  if (!result.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid intervention record.');
  return result.data.issue;
}
