import {
  conversationResponseSchema,
  conversationsResponseSchema,
  issueResponseSchema,
  locationsResponseSchema,
  managementSummaryResponseSchema,
  messageResponseSchema,
  type Conversation,
  type CurrentLocation,
  type ManagementProject,
  type ProjectIssue,
} from '@karaa/contracts';

import { KaraaApiError } from '../../lib/api';
import type { BrowserSession } from '../../lib/session';

type Fetcher = typeof fetch;

export type ManagementSummary = { projects: ManagementProject[] };
export type CreateIssueInput = {
  projectId: string;
  description: string;
  assigneeId: string;
  dueAt: string;
  rootCause: string;
};

export type CreateIssueBody = Omit<CreateIssueInput, 'projectId'>;

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_KARAA_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

function errorMessage(cause: unknown): string {
  return cause instanceof KaraaApiError ? cause.message : 'Connection unavailable — try again.';
}

async function managementRequest(
  session: BrowserSession,
  path: string,
  init: RequestInit,
  fetcher: Fetcher = fetch,
): Promise<unknown> {
  if (session.user.role !== 'management') {
    throw new KaraaApiError('REQUEST_FAILED', 'You do not have access to this management action.');
  }

  let response: Response;
  try {
    response = await fetcher(apiUrl(path), {
      ...init,
      headers: { authorization: `Bearer ${session.token}`, ...init.headers },
    });
  } catch {
    throw new KaraaApiError('OFFLINE', 'Connection unavailable — try again.');
  }
  if (response.status === 401) throw new KaraaApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new KaraaApiError('REQUEST_FAILED', 'You do not have access to this management action.');
  if (!response.ok) throw new KaraaApiError('REQUEST_FAILED', 'Karaa could not complete this management action.');
  try {
    return await response.json();
  } catch {
    throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid management record.');
  }
}

export async function fetchManagementSummary(session: BrowserSession, fetcher?: Fetcher): Promise<ManagementSummary> {
  const parsed = managementSummaryResponseSchema.safeParse(await managementRequest(session, '/v1/management/summary', { method: 'GET' }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid management record.');
  return parsed.data;
}

export async function fetchManagementProjectLocations(session: BrowserSession, projectId: string, fetcher?: Fetcher): Promise<CurrentLocation[]> {
  const parsed = locationsResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/locations`, { method: 'GET' }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid field-location record.');
  return parsed.data.locations;
}

export async function createManagementIssue(
  session: BrowserSession,
  projectId: string,
  input: CreateIssueBody | CreateIssueInput,
  fetcher?: Fetcher,
): Promise<ProjectIssue> {
  const { description, assigneeId, dueAt, rootCause } = input;
  const parsed = issueResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/issues`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ description, assigneeId, dueAt, rootCause }),
  }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid intervention record.');
  return parsed.data.issue;
}

export async function resolveManagementIssue(session: BrowserSession, issueId: string, fetcher?: Fetcher): Promise<ProjectIssue> {
  const parsed = issueResponseSchema.safeParse(await managementRequest(session, `/v1/issues/${issueId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid intervention record.');
  return parsed.data.issue;
}

export async function openManagementDirectConversation(
  session: BrowserSession,
  projectId: string,
  employeeId: string,
  fetcher?: Fetcher,
): Promise<Conversation> {
  const parsed = conversationResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/conversations/direct`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid direct conversation.');
  return parsed.data.conversation;
}

export async function fetchManagementDirectConversation(
  session: BrowserSession,
  projectId: string,
  conversationId: string,
  fetcher?: Fetcher,
): Promise<Conversation> {
  const parsed = conversationsResponseSchema.safeParse(await managementRequest(session, `/v1/projects/${projectId}/conversations`, { method: 'GET' }, fetcher));
  if (!parsed.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid direct conversation list.');
  const conversation = parsed.data.conversations.find((candidate) => candidate.id === conversationId && candidate.projectId === projectId && candidate.kind === 'direct');
  if (!conversation) throw new KaraaApiError('REQUEST_FAILED', 'Karaa could not load the authorized direct conversation.');
  return conversation;
}

export async function sendManagementDirectMessage(
  session: BrowserSession,
  conversationId: string,
  body: string,
  fetcher?: Fetcher,
): Promise<void> {
  const parsed = messageResponseSchema.safeParse(await managementRequest(session, `/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body }),
  }, fetcher));
  if (!parsed.success || parsed.data.message.conversationId !== conversationId) {
    throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved direct reply.');
  }
}

export { errorMessage };
