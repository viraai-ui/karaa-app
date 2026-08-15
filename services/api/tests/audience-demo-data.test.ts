import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase, type KaraaDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const apps: KaraaApp[] = [];
const databases: KaraaDatabase[] = [];

function createAudienceApp(): KaraaApp {
  const app = buildApp({ includeAudienceEvidence: true, jwtSecret: 'test-secret-that-is-long-enough-for-hs256' });
  apps.push(app);
  return app;
}

async function loginAsCustomer(app: KaraaApp): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: 'anika.customer@karaa.demo', password: 'demo-password' },
  });

  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  databases.splice(0);
});

describe('audience demo seed', () => {
  it('exposes a persisted fictional progress record with deterministic local image bytes through authorized APIs', async () => {
    const app = createAudienceApp();
    const customerToken = await loginAsCustomer(app);

    const detail = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}`,
      headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      project: { id: projectId, progress: 65 },
      milestones: [{ progress: 65 }],
      updates: [{
        authorId: '30000002-0000-4000-8000-000000000002',
        claimedProgress: 65,
        workDescription: 'Installed and aligned the first solar inverter row.',
        nextAction: 'Inspect the completed electrical connections before commissioning.',
        media: [{ mediaPath: expect.stringMatching(/^\/v1\/media\//), mimeType: 'image/png' }],
      }],
      notifications: [{ projectId, body: 'New progress update for project Amaravati Solar Commons' }],
      documents: [expect.objectContaining({
        projectId,
        disclaimer: 'Demo data — verify with issuing authority',
      })],
      paymentDemoRecords: [expect.objectContaining({
        projectId,
        currency: 'INR',
        amountMinor: expect.any(Number),
        disclaimer: 'Demo data — verify with issuing authority',
      })],
    });
    const mediaId = detail.json().updates[0].media[0].id as string;
    const media = await app.inject({
      method: 'GET', url: `/v1/media/${mediaId}`, headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(media.statusCode).toBe(200);
    expect(media.headers['content-type']).toContain('image/png');
    expect(media.rawPayload.length).toBeGreaterThan(0);
  });

  it('returns only the persisted customer support thread and saves customer replies through the authorized conversation API', async () => {
    const app = createAudienceApp();
    const customerToken = await loginAsCustomer(app);

    const listed = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/conversations`,
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(listed.statusCode).toBe(200);
    const support = listed.json().conversations.find((conversation: { kind: string }) => conversation.kind === 'support');
    expect(support).toMatchObject({
      projectId,
      kind: 'support',
      messages: [expect.objectContaining({
        id: '91000001-0000-4000-8000-000000000001',
        senderId: '30000003-0000-4000-8000-000000000003',
        body: 'Karaa project support is ready to help with your commissioning records.',
        createdAt: '2026-08-11T08:31:00.000Z',
      })],
    });

    const sent = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${support.id}/messages`,
      headers: { authorization: `Bearer ${customerToken}` },
      payload: { body: 'Please confirm the next assurance document review.' },
    });
    expect(sent.statusCode).toBe(201);

    const reloaded = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/conversations`,
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(reloaded.statusCode).toBe(200);
    expect(reloaded.json()).toMatchObject({
      conversations: [expect.objectContaining({
        id: support.id,
        kind: 'support',
        messages: [
          expect.objectContaining({
            id: '91000001-0000-4000-8000-000000000001',
            body: 'Karaa project support is ready to help with your commissioning records.',
          }),
          expect.objectContaining({ body: 'Please confirm the next assurance document review.' }),
        ],
      })],
    });
  });

  it('keeps default test databases empty of audience evidence', () => {
    const db = createDatabase();
    databases.push(db);

    expect(db.prepare('SELECT COUNT(*) AS count FROM progress_updates').get()).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM notifications').get()).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM project_documents').get()).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM payment_demo_records').get()).toEqual({ count: 0 });
    expect(db.prepare('SELECT COUNT(*) AS count FROM conversations').get()).toEqual({ count: 0 });
  });
});
