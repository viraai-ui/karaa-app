import { fileURLToPath } from 'node:url';

import { buildApp } from '../services/api/src/app.js';
import { createDatabase } from '../services/api/src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const milestoneId = '40000001-0000-4000-8000-000000000001';
const employeeId = '30000002-0000-4000-8000-000000000002';
const managementId = '30000003-0000-4000-8000-000000000003';
const demoPassword = 'demo-password';
const smokeJwtSecret = 'demo-smoke-secret-that-is-long-enough-for-hs256';
const evidencePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWO442YEAANWAVUhsPJLAAAAAElFTkSuQmCC',
  'base64',
);
const updateEventId = '50000099-0000-4000-8000-000000000099';
const replyBody = 'Smoke check: review the inverter row before commissioning.';

export interface DemoSmokeResult {
  employeePersistedUpdate: boolean;
  customerSawAuthorizedCanonicalUpdate: boolean;
  managementSawAuthorizedCanonicalUpdate: boolean;
  managementPersistedReply: boolean;
  employeeSawAuthorizedCanonicalReply: boolean;
  progressUpdateRows: number;
  messageRows: number;
}

interface JsonResponse {
  status: number;
  body: unknown;
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function record() {
  return {
    eventId: updateEventId,
    projectId,
    milestoneId,
    occurredAt: '2026-08-11T12:00:00.000Z',
    latitude: 16.5062,
    longitude: 80.648,
    locationState: 'simulated',
    claimedProgress: 65,
    workDescription: 'Smoke check: installed the first solar inverter row.',
    nextAction: 'Smoke check: inspect completed electrical connections.',
    crewCount: 4,
    crewHours: 28.5,
    quantityValue: 18,
    quantityUnit: 'panels',
    siteConditions: 'Dry demo site with clear access.',
    blocker: null,
  };
}

async function jsonRequest(baseUrl: string, path: string, init: RequestInit = {}): Promise<JsonResponse> {
  const response = await fetch(`${baseUrl}${path}`, init);
  return { status: response.status, body: await response.json() };
}

async function login(baseUrl: string, email: string): Promise<string> {
  const response = await jsonRequest(baseUrl, '/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: demoPassword }),
  });
  const token = (response.body as { token?: unknown }).token;
  requireCondition(response.status === 200 && typeof token === 'string', `Expected authenticated login for ${email}.`);
  return token;
}

function authorized(token: string): HeadersInit {
  return { authorization: `Bearer ${token}` };
}

function hasUpdate(body: unknown): boolean {
  const updates = (body as { updates?: unknown }).updates;
  return Array.isArray(updates) && updates.some((update) => (
    typeof update === 'object' && update !== null && (update as { eventId?: unknown }).eventId === updateEventId
  ));
}

function hasReply(body: unknown, conversationId: string): boolean {
  const conversations = (body as { conversations?: unknown }).conversations;
  return Array.isArray(conversations) && conversations.some((conversation) => {
    if (!conversation || typeof conversation !== 'object') return false;
    const typedConversation = conversation as { id?: unknown; messages?: unknown };
    return typedConversation.id === conversationId
      && Array.isArray(typedConversation.messages)
      && typedConversation.messages.some((message) => (
        typeof message === 'object'
        && message !== null
        && (message as { body?: unknown; senderId?: unknown }).body === replyBody
        && (message as { senderId?: unknown }).senderId === managementId
      ));
  });
}

/**
 * Exercises the real local HTTP API using its isolated SQLite database. It deliberately
 * reads each result back through role-authorized canonical endpoints; no transport is mocked.
 */
export async function runDemoFlow(): Promise<DemoSmokeResult> {
  const database = createDatabase();
  const app = buildApp({ database, jwtSecret: smokeJwtSecret });
  await app.listen({ host: '127.0.0.1', port: 0 });
  const address = app.server.address();
  requireCondition(address && typeof address !== 'string', 'Expected the smoke API to bind an ephemeral TCP port.');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const [customerToken, employeeToken, managementToken] = await Promise.all([
      login(baseUrl, 'anika.customer@karaa.demo'),
      login(baseUrl, 'dev.employee@karaa.demo'),
      login(baseUrl, 'mira.management@karaa.demo'),
    ]);

    const form = new FormData();
    form.append('payload', JSON.stringify(record()));
    form.append('photo', new Blob([evidencePng], { type: 'image/png' }), 'smoke-evidence.png');
    const postedUpdate = await jsonRequest(baseUrl, '/v1/progress-updates', {
      method: 'POST',
      headers: authorized(employeeToken),
      body: form,
    });
    const createdUpdate = postedUpdate.body as { update?: { eventId?: unknown; authorId?: unknown } };
    const employeePersistedUpdate = postedUpdate.status === 201
      && createdUpdate.update?.eventId === updateEventId
      && createdUpdate.update?.authorId === employeeId;
    requireCondition(employeePersistedUpdate, 'Employee update was not accepted as one persisted record.');

    const [customerProject, managementProject] = await Promise.all([
      jsonRequest(baseUrl, `/v1/projects/${projectId}`, { headers: authorized(customerToken) }),
      jsonRequest(baseUrl, `/v1/projects/${projectId}`, { headers: authorized(managementToken) }),
    ]);
    const customerSawAuthorizedCanonicalUpdate = customerProject.status === 200 && hasUpdate(customerProject.body);
    const managementSawAuthorizedCanonicalUpdate = managementProject.status === 200 && hasUpdate(managementProject.body);
    requireCondition(customerSawAuthorizedCanonicalUpdate, 'Customer canonical project read did not include the employee update.');
    requireCondition(managementSawAuthorizedCanonicalUpdate, 'Management canonical project read did not include the employee update.');

    const opened = await jsonRequest(baseUrl, `/v1/projects/${projectId}/conversations/direct`, {
      method: 'POST',
      headers: { ...authorized(managementToken), 'content-type': 'application/json' },
      body: JSON.stringify({ employeeId }),
    });
    const conversationId = (opened.body as { conversation?: { id?: unknown } }).conversation?.id;
    requireCondition(opened.status === 201 && typeof conversationId === 'string', 'Management direct conversation was not created.');

    const postedReply = await jsonRequest(baseUrl, `/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { ...authorized(managementToken), 'content-type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    });
    const createdReply = postedReply.body as { message?: { conversationId?: unknown; senderId?: unknown; body?: unknown } };
    const managementPersistedReply = postedReply.status === 201
      && createdReply.message?.conversationId === conversationId
      && createdReply.message?.senderId === managementId
      && createdReply.message?.body === replyBody;
    requireCondition(managementPersistedReply, 'Management reply was not persisted.');

    const employeeConversations = await jsonRequest(
      baseUrl,
      `/v1/projects/${projectId}/conversations`,
      { headers: authorized(employeeToken) },
    );
    const employeeSawAuthorizedCanonicalReply = employeeConversations.status === 200 && hasReply(employeeConversations.body, conversationId);
    requireCondition(employeeSawAuthorizedCanonicalReply, 'Employee canonical conversation read did not include the management reply.');

    const progressUpdateRows = (database.prepare('SELECT COUNT(*) AS count FROM progress_updates').get() as { count: number }).count;
    const messageRows = (database.prepare('SELECT COUNT(*) AS count FROM messages').get() as { count: number }).count;
    requireCondition(progressUpdateRows === 1, `Expected one persisted progress update; found ${progressUpdateRows}.`);
    requireCondition(messageRows === 1, `Expected one persisted message; found ${messageRows}.`);

    return {
      employeePersistedUpdate,
      customerSawAuthorizedCanonicalUpdate,
      managementSawAuthorizedCanonicalUpdate,
      managementPersistedReply,
      employeeSawAuthorizedCanonicalReply,
      progressUpdateRows,
      messageRows,
    };
  } finally {
    await app.close();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = await runDemoFlow();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
