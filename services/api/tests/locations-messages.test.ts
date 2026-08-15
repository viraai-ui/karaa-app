import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const employeeId = '30000002-0000-4000-8000-000000000002';
const apps: KaraaApp[] = [];

function createApp(): KaraaApp {
  const app = buildApp({
    database: createDatabase(),
    jwtSecret: 'test-secret-that-is-long-enough-for-hs256',
  });
  apps.push(app);
  return app;
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

function authenticated(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('authorized current location and project conversation routes', () => {
  it('persists an employee location with a server timestamp and only exposes it to project management', async () => {
    const app = createApp();
    const employeeToken = await login(app, 'dev.employee@karaa.demo');
    const managementToken = await login(app, 'mira.management@karaa.demo');
    const customerToken = await login(app, 'anika.customer@karaa.demo');

    const written = await app.inject({
      method: 'PUT',
      url: '/v1/locations/current',
      headers: authenticated(employeeToken),
      payload: { latitude: 16.5062, longitude: 80.648, state: 'simulated' },
    });
    expect(written.statusCode).toBe(200);
    expect(written.json()).toMatchObject({
      userId: employeeId,
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: expect.stringMatching(/Z$/),
    });

    const visible = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/locations`,
      headers: authenticated(managementToken),
    });
    expect(visible.statusCode).toBe(200);
    expect(visible.json()).toMatchObject({ locations: [expect.objectContaining({ userId: employeeId, state: 'simulated' })] });

    const unsupportedState = await app.inject({
      method: 'PUT',
      url: '/v1/locations/current',
      headers: authenticated(employeeToken),
      payload: { latitude: 16.5062, longitude: 80.648, state: 'denied' },
    });
    expect(unsupportedState.statusCode).toBe(400);

    const customerRead = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/locations`,
      headers: authenticated(customerToken),
    });
    expect(customerRead.statusCode).toBe(403);
  });

  it('rejects a customer message in a direct conversation even if the customer is improperly added as a member', async () => {
    const database = createDatabase();
    const app = buildApp({
      database,
      jwtSecret: 'test-secret-that-is-long-enough-for-hs256',
    });
    apps.push(app);
    const managementToken = await login(app, 'mira.management@karaa.demo');
    const customerToken = await login(app, 'anika.customer@karaa.demo');

    const opened = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/conversations/direct`,
      headers: authenticated(managementToken),
      payload: { employeeId },
    });
    expect(opened.statusCode).toBe(201);
    const conversationId = opened.json().conversation.id as string;
    database.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)').run(
      conversationId,
      '30000001-0000-4000-8000-000000000001',
    );
    const managementMessage = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: authenticated(managementToken),
      payload: { body: 'Management-only confidential direct reply.' },
    });
    expect(managementMessage.statusCode).toBe(201);

    const customerList = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/conversations`,
      headers: authenticated(customerToken),
    });
    expect(customerList.statusCode).toBe(200);
    expect(customerList.json().conversations).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: conversationId }),
    ]));

    const attempted = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: authenticated(customerToken),
      payload: { body: 'This must stay inside customer support.' },
    });

    expect(attempted.statusCode).toBe(403);
    expect(attempted.json()).toEqual({ error: 'CONVERSATION_ACCESS_DENIED' });
    expect(database.prepare('SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?').get(conversationId)).toEqual({ count: 1 });
  });

  it('creates one project-linked conversation and persists a management message before returning it to its employee member', async () => {
    const app = createApp();
    const managementToken = await login(app, 'mira.management@karaa.demo');
    const employeeToken = await login(app, 'dev.employee@karaa.demo');

    const opened = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/conversations/direct`,
      headers: authenticated(managementToken),
      payload: { employeeId },
    });
    expect(opened.statusCode).toBe(201);
    expect(opened.json()).toMatchObject({ conversation: { kind: 'direct' } });
    const conversationId = opened.json().conversation.id as string;

    const sent = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: authenticated(managementToken),
      payload: { body: 'Check the east-array clearance before commissioning.' },
    });
    expect(sent.statusCode).toBe(201);
    expect(sent.json()).toMatchObject({
      message: {
        conversationId,
        senderId: '30000003-0000-4000-8000-000000000003',
        body: 'Check the east-array clearance before commissioning.',
        createdAt: expect.stringMatching(/Z$/),
      },
    });

    const employeeRead = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/conversations`,
      headers: authenticated(employeeToken),
    });
    expect(employeeRead.statusCode).toBe(200);
    expect(employeeRead.json()).toMatchObject({
      conversations: [expect.objectContaining({ id: conversationId, messages: [expect.objectContaining({ body: 'Check the east-array clearance before commissioning.' })] })],
    });
  });
});
