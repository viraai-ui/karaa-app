import { afterEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase, type KaraaDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const otherProjectId = '20000002-0000-4000-8000-000000000002';
const milestoneId = '40000001-0000-4000-8000-000000000001';
const validPngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWO442YEAANWAVUhsPJLAAAAAElFTkSuQmCC',
  'base64',
);
const apps: KaraaApp[] = [];
const sockets: Socket[] = [];

function createApp(): { app: KaraaApp; db: KaraaDatabase } {
  const db = createDatabase();
  const app = buildApp({ database: db, jwtSecret: 'test-secret-that-is-long-enough-for-hs256' });
  apps.push(app);
  return { app, db };
}

async function login(app: KaraaApp, email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email, password: 'demo-password' },
  });

  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

function captureEventSet(socket: Socket): { received: string[]; payloads: Map<string, unknown>; complete: Promise<void> } {
  const received: string[] = [];
  const payloads = new Map<string, unknown>();
  let resolveComplete: (() => void) | undefined;
  const complete = new Promise<void>((resolve) => { resolveComplete = resolve; });
  for (const eventName of ['progress_update.created', 'project.progress_changed', 'notification.created']) {
    socket.on(eventName, (payload) => {
      received.push(eventName);
      payloads.set(eventName, payload);
      if (received.length === 3) resolveComplete?.();
    });
  }
  return { received, payloads, complete };
}

function waitForEvent(socket: Socket, eventName: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), 1_000);
    socket.once(eventName, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for connect')), 1_000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function subscribe(socket: Socket, project: string): Promise<{ ok: boolean }> {
  return new Promise((resolve) => socket.emit('project.subscribe', { projectId: project }, resolve));
}

function fieldRecord() {
  return {
    eventId: '70000001-0000-4000-8000-000000000001',
    projectId,
    milestoneId,
    occurredAt: '2026-08-10T09:15:00.000Z',
    latitude: 16.5062,
    longitude: 80.648,
    locationState: 'simulated',
    claimedProgress: 65,
    workDescription: 'Installed the first solar inverter row.',
    nextAction: 'Inspect the completed electrical connections.',
    crewCount: 4,
    crewHours: 28.5,
    quantityValue: 18,
    quantityUnit: 'panels',
    siteConditions: 'Dry ground with clear access.',
    blocker: null,
  };
}

async function postMultipart(app: KaraaApp, token: string) {
  const form = new FormData();
  form.append('payload', JSON.stringify(fieldRecord()));
  form.append('photo', new Blob([validPngBytes], { type: 'image/png' }), 'evidence.png');
  const encoded = new Response(form);
  const contentType = encoded.headers.get('content-type');
  if (!contentType) throw new Error('Expected multipart content type');
  return app.inject({
    method: 'POST',
    url: '/v1/progress-updates',
    headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
    payload: Buffer.from(await encoded.arrayBuffer()),
  });
}

afterEach(async () => {
  const closingSockets = sockets.splice(0);
  closingSockets.forEach((socket) => socket.close());
  expect(closingSockets.every((socket) => !socket.connected)).toBe(true);
  const closingApps = apps.splice(0);
  await Promise.all(closingApps.map((app) => app.close()));
  expect(closingApps.every((app) => !app.server.listening)).toBe(true);
});

describe('Socket.IO progress-update fan-out', () => {
  it('authenticates persisted roles, restricts subscriptions, and emits one ordered event set only after a new committed update', async () => {
    const { app, db } = createApp();
    const employeeToken = await login(app, 'dev.employee@karaa.demo');
    const customerToken = await login(app, 'anika.customer@karaa.demo');
    const managementToken = await login(app, 'mira.management@karaa.demo');

    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral loopback address');
    const url = `http://127.0.0.1:${address.port}`;
    const customer = io(url, { auth: { token: customerToken, role: 'employee' }, transports: ['websocket'] });
    const management = io(url, { auth: { token: managementToken }, transports: ['websocket'] });
    const employee = io(url, { auth: { token: employeeToken }, transports: ['websocket'] });
    sockets.push(customer, management, employee);

    await Promise.all([
      waitForConnect(customer),
      waitForConnect(management),
      waitForConnect(employee),
    ]);
    expect(await subscribe(customer, projectId)).toEqual({ ok: true });
    expect(await subscribe(management, projectId)).toEqual({ ok: true });
    expect(await subscribe(customer, otherProjectId)).toEqual({ ok: false });
    expect(await subscribe(employee, projectId)).toEqual({ ok: false });

    const customerEvents = captureEventSet(customer);
    const managementEvents = captureEventSet(management);
    const employeeEvents = captureEventSet(employee);

    const create = await postMultipart(app, employeeToken);

    expect(create.statusCode).toBe(201);
    await Promise.all([customerEvents.complete, managementEvents.complete]);
    expect(customerEvents.received).toEqual(['progress_update.created', 'project.progress_changed', 'notification.created']);
    expect(managementEvents.received).toEqual(['progress_update.created', 'project.progress_changed', 'notification.created']);
    expect(customerEvents.payloads.get('progress_update.created')).toEqual({ projectId });
    expect(managementEvents.payloads.get('progress_update.created')).toEqual({ projectId });
    expect(customerEvents.payloads.get('project.progress_changed')).toEqual({ projectId });
    expect(managementEvents.payloads.get('project.progress_changed')).toEqual({ projectId });
    expect(customerEvents.payloads.get('notification.created')).toEqual({ projectId });
    expect(managementEvents.payloads.get('notification.created')).toEqual({ projectId });
    expect(employeeEvents.received).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS count FROM progress_updates').get()).toEqual({ count: 1 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM notifications').get()).toEqual({ count: 2 });

    const replay = await postMultipart(app, employeeToken);
    expect(replay.statusCode).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(customerEvents.received).toHaveLength(3);
    expect(managementEvents.received).toHaveLength(3);
    expect(employeeEvents.received).toEqual([]);
    expect(db.prepare('SELECT COUNT(*) AS count FROM progress_updates').get()).toEqual({ count: 1 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM notifications').get()).toEqual({ count: 2 });
  });

  it('emits only a conversation refresh hint after a committed message', async () => {
    const { app, db } = createApp();
    const managementToken = await login(app, 'mira.management@karaa.demo');
    const employeeToken = await login(app, 'dev.employee@karaa.demo');
    const employee = db.prepare('SELECT id FROM users WHERE email = ?').get('dev.employee@karaa.demo') as { id: string };

    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral loopback address');
    const url = `http://127.0.0.1:${address.port}`;
    const managementSocket = io(url, { auth: { token: managementToken }, transports: ['websocket'] });
    const employeeSocket = io(url, { auth: { token: employeeToken }, transports: ['websocket'] });
    sockets.push(managementSocket, employeeSocket);
    await Promise.all([waitForConnect(managementSocket), waitForConnect(employeeSocket)]);

    const createdConversation = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/conversations/direct`,
      headers: { authorization: `Bearer ${managementToken}` },
      payload: { employeeId: employee.id },
    });
    expect(createdConversation.statusCode).toBe(201);
    const conversationId = createdConversation.json().conversation.id as string;

    const managementHint = waitForEvent(managementSocket, 'message.created');
    const employeeHint = waitForEvent(employeeSocket, 'message.created');
    const createdMessage = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: { authorization: `Bearer ${managementToken}` },
      payload: { body: 'socket confidential reply' },
    });

    expect(createdMessage.statusCode).toBe(201);
    await expect(managementHint).resolves.toEqual({ conversationId });
    await expect(employeeHint).resolves.toEqual({ conversationId });
  });
});
