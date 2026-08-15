import {
  conversationsResponseSchema,
  currentLocationSchema,
  projectDetailResponseSchema,
  projectsResponseSchema,
  type Conversation,
  type ProjectSummary,
} from '@karaa/contracts';
import type { z } from 'zod';

import { KaraaApiError } from '../../lib/api';
import type { BrowserSession } from '../../lib/session';

export type EmployeeProjectRecord = z.infer<typeof projectDetailResponseSchema>;

export type FieldRecordDraft = {
  eventId: string;
  occurredAt: string;
  projectId: string;
  milestoneId: string;
  workDescription: string;
  claimedProgress: number;
  crewCount: number;
  crewHours: number;
  quantityValue: number | null;
  quantityUnit: string | null;
  siteConditions: string;
  blocker: string | null;
  nextAction: string;
  photo: File;
  location: { state: 'simulated'; latitude: number; longitude: number };
};

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_KARAA_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

function authorization(session: BrowserSession): HeadersInit {
  return { authorization: `Bearer ${session.token}` };
}

async function readJson(response: Response, message: string): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new KaraaApiError('SERVER_RESPONSE_INVALID', message);
  }
}

async function authorizedGet(path: string, session: BrowserSession): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), { headers: authorization(session), cache: 'no-store' });
  } catch {
    throw new KaraaApiError('OFFLINE', 'Connection unavailable — try again.');
  }
  if (response.status === 401) throw new KaraaApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new KaraaApiError('REQUEST_FAILED', 'You do not have access to these assigned records.');
  if (!response.ok) throw new KaraaApiError('REQUEST_FAILED', 'Connection unavailable — try again.');
  return readJson(response, 'Karaa returned an invalid authorized project record.');
}

function chooseAuthorizedProject(projects: ProjectSummary[]): ProjectSummary {
  const project = projects.find(({ showcase }) => showcase) ?? projects[0];
  if (!project) throw new KaraaApiError('REQUEST_FAILED', 'No assigned project is available for this workspace.');
  return project;
}

/** Reads canonical REST records only, using the server's project membership filter. */
export async function loadEmployeeWorkspace(session: BrowserSession): Promise<{
  record: EmployeeProjectRecord;
  conversation: Conversation | undefined;
}> {
  const projectList = projectsResponseSchema.safeParse(await authorizedGet('/v1/projects', session));
  if (!projectList.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid assigned-project list.');
  const project = chooseAuthorizedProject(projectList.data.projects);
  const [detailBody, conversationBody] = await Promise.all([
    authorizedGet(`/v1/projects/${project.id}`, session),
    authorizedGet(`/v1/projects/${project.id}/conversations`, session),
  ]);
  const detail = projectDetailResponseSchema.safeParse(detailBody);
  if (!detail.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid authorized project record.');
  const conversations = conversationsResponseSchema.safeParse(conversationBody);
  if (!conversations.success) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid project conversation.');
  return { record: detail.data, conversation: conversations.data.conversations[0] };
}

export async function persistSimulatedFieldLocation(session: BrowserSession): Promise<void> {
  let response: Response;
  try {
    response = await fetch(apiUrl('/v1/locations/current'), {
      method: 'PUT',
      cache: 'no-store',
      headers: { ...authorization(session), 'content-type': 'application/json' },
      body: JSON.stringify({ latitude: 16.5062, longitude: 80.648, state: 'simulated' }),
    });
  } catch {
    throw new KaraaApiError('OFFLINE', 'Connection unavailable — try again.');
  }
  if (response.status === 401) throw new KaraaApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new KaraaApiError('REQUEST_FAILED', 'You do not have access to share this field location.');
  if (!response.ok) throw new KaraaApiError('REQUEST_FAILED', 'Connection unavailable — try again.');
  const parsed = currentLocationSchema.safeParse(await readJson(response, 'Karaa returned an invalid saved field location.'));
  if (!parsed.success || parsed.data.state !== 'simulated' || parsed.data.latitude !== 16.5062 || parsed.data.longitude !== 80.648) {
    throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved field location.');
  }
}

/** Posts the exact two-part browser contract accepted by POST /v1/progress-updates. */
export async function publishEmployeeFieldRecord(session: BrowserSession, draft: FieldRecordDraft): Promise<void> {
  const payload = {
    eventId: draft.eventId,
    projectId: draft.projectId,
    milestoneId: draft.milestoneId,
    occurredAt: draft.occurredAt,
    latitude: draft.location.latitude,
    longitude: draft.location.longitude,
    locationState: draft.location.state,
    claimedProgress: draft.claimedProgress,
    workDescription: draft.workDescription,
    nextAction: draft.nextAction,
    crewCount: draft.crewCount,
    crewHours: draft.crewHours,
    quantityValue: draft.quantityValue,
    quantityUnit: draft.quantityUnit,
    siteConditions: draft.siteConditions,
    blocker: draft.blocker,
  };
  const multipart = new FormData();
  multipart.append('payload', JSON.stringify(payload));
  multipart.append('photo', draft.photo, draft.photo.name);

  let response: Response;
  try {
    response = await fetch(apiUrl('/v1/progress-updates'), {
      method: 'POST',
      headers: authorization(session),
      body: multipart,
    });
  } catch {
    throw new KaraaApiError('OFFLINE', 'Connection unavailable — try again.');
  }
  if (response.status === 401) throw new KaraaApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new KaraaApiError('REQUEST_FAILED', 'You are not assigned to this project.');
  if (response.status === 409) throw new KaraaApiError('REQUEST_FAILED', 'This field record conflicts with an existing Karaa event.');
  if (response.status !== 200 && response.status !== 201) throw new KaraaApiError('REQUEST_FAILED', 'Connection unavailable — try again.');
  await readJson(response, 'Karaa returned an invalid saved field record.');
}
