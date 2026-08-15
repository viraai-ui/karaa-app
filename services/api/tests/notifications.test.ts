import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase, type KaraaDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const milestoneId = '40000001-0000-4000-8000-000000000001';
const employeeEmail = 'dev.employee@karaa.demo';
const customerEmail = 'anika.customer@karaa.demo';
const additionalCustomerId = '30000004-0000-4000-8000-000000000004';
const validPngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWO442YEAANWAVUhsPJLAAAAAElFTkSuQmCC',
  'base64',
);
const apps: KaraaApp[] = [];
const databases: KaraaDatabase[] = [];

function createApp(): { app: KaraaApp; db: KaraaDatabase } {
  const db = createDatabase();
  const app = buildApp({ database: db, jwtSecret: 'test-secret-that-is-long-enough-for-hs256' });
  apps.push(app);
  databases.push(db);
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

function fieldRecord() {
  return {
    eventId: '50000012-0000-4000-8000-000000000012',
    projectId,
    milestoneId,
    occurredAt: '2026-08-11T12:00:00.000Z',
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
    method: 'POST', url: '/v1/progress-updates',
    headers: { authorization: `Bearer ${token}`, 'content-type': contentType }, payload: Buffer.from(await encoded.arrayBuffer()),
  });
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  databases.splice(0);
});

describe('GET /v1/notifications', () => {
  it('returns only notifications persisted for the authenticated user in newest-first order', async () => {
    const { app, db } = createApp();
    db.prepare('INSERT INTO users (id, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)').run(
      additionalCustomerId, 'other.customer@karaa.demo', 'unused', 'customer', 'Other Customer',
    );
    db.prepare('INSERT INTO project_memberships (project_id, user_id) VALUES (?, ?)').run(projectId, additionalCustomerId);

    const employeeToken = await login(app, employeeEmail);
    const customerToken = await login(app, customerEmail);
    const created = await postMultipart(app, employeeToken);
    expect(created.statusCode).toBe(201);
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, project_id, progress_update_id, body, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertNotification.run(
      '70000012-0000-4000-8000-000000000012',
      '30000001-0000-4000-8000-000000000001',
      projectId,
      created.json().update.id,
      'Older customer-only notification.',
      '2099-01-01T00:00:00.000Z',
    );
    insertNotification.run(
      '80000012-0000-4000-8000-000000000012',
      '30000001-0000-4000-8000-000000000001',
      projectId,
      created.json().update.id,
      'Newest customer-only notification.',
      '2099-01-02T00:00:00.000Z',
    );

    const response = await app.inject({
      method: 'GET',
      url: '/v1/notifications',
      headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().notifications).toEqual([
      expect.objectContaining({
        id: '80000012-0000-4000-8000-000000000012',
        projectId,
        progressUpdateId: created.json().update.id,
        body: 'Newest customer-only notification.',
        readAt: null,
      }),
      expect.objectContaining({
        id: '70000012-0000-4000-8000-000000000012',
        projectId,
        progressUpdateId: created.json().update.id,
        body: 'Older customer-only notification.',
        readAt: null,
      }),
      expect.objectContaining({
        projectId,
        progressUpdateId: created.json().update.id,
        body: 'New progress update for project Amaravati Solar Commons',
        readAt: null,
      }),
    ]);
    expect(response.json().notifications).toHaveLength(3);
    expect(JSON.stringify(response.json())).not.toContain(additionalCustomerId);
  });

  it('requires authentication', async () => {
    const { app } = createApp();

    const response = await app.inject({ method: 'GET', url: '/v1/notifications' });

    expect(response.statusCode).toBe(401);
  });
});
