import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase, type KaraaDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const unrelatedProjectId = '20000002-0000-4000-8000-000000000002';
const milestoneId = '40000001-0000-4000-8000-000000000001';
const customerEmail = 'anika.customer@karaa.demo';
const employeeEmail = 'dev.employee@karaa.demo';
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
    method: 'POST', url: '/v1/auth/login', payload: { email, password: 'demo-password' },
  });
  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

function fieldRecord() {
  return {
    eventId: '50000011-0000-4000-8000-000000000011', projectId, milestoneId,
    occurredAt: '2026-08-11T12:00:00.000Z', latitude: 16.5062, longitude: 80.648, locationState: 'simulated',
    claimedProgress: 65, workDescription: 'Installed the first solar inverter row.',
    nextAction: 'Inspect the completed electrical connections.', crewCount: 4, crewHours: 28.5,
    quantityValue: 18, quantityUnit: 'panels', siteConditions: 'Dry ground with clear access.', blocker: null,
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
    method: 'POST', url: '/v1/progress-updates', headers: { authorization: `Bearer ${token}`, 'content-type': contentType },
    payload: Buffer.from(await encoded.arrayBuffer()),
  });
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  databases.splice(0);
});

describe('authorized project and media read models', () => {
  it('returns only membership-authorized project summaries', async () => {
    const { app } = createApp();
    const customerToken = await login(app, customerEmail);

    const response = await app.inject({
      method: 'GET', url: '/v1/projects', headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().projects).toEqual([expect.objectContaining({ id: projectId, name: 'Amaravati Solar Commons' })]);
  });

  it('returns authorized public field-record facts and metadata, never stored bytes or internal digest columns', async () => {
    const { app } = createApp();
    const employeeToken = await login(app, employeeEmail);
    const customerToken = await login(app, customerEmail);
    const created = await postMultipart(app, employeeToken);
    expect(created.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET', url: `/v1/projects/${projectId}`, headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      project: { id: projectId, name: 'Amaravati Solar Commons', progress: 65 },
      milestones: [{ id: milestoneId, progress: 65 }],
      updates: [{
        eventId: fieldRecord().eventId, workDescription: fieldRecord().workDescription,
        crewCount: 4, crewHours: 28.5, quantityValue: 18, quantityUnit: 'panels', siteConditions: 'Dry ground with clear access.', blocker: null, locationState: 'simulated',
        media: [{ id: created.json().update.media[0].id, mediaPath: `/v1/media/${created.json().update.media[0].id}`, mimeType: 'image/png', sizeBytes: validPngBytes.length }],
      }],
      notifications: [expect.objectContaining({ projectId, progressUpdateId: created.json().update.id })],
    });
    const body = JSON.stringify(response.json());
    expect(body).not.toContain('content_sha256');
    expect(body).not.toContain('project-detail-png');
    expect(body).not.toContain('payload_hash');
    expect(body).not.toContain('password_hash');
  });

  it('serves stored media bytes only to a member and makes unknown and unauthorized media indistinguishable', async () => {
    const { app, db } = createApp();
    const employeeToken = await login(app, employeeEmail);
    const customerToken = await login(app, customerEmail);
    const created = await postMultipart(app, employeeToken);
    expect(created.statusCode).toBe(201);
    const mediaId = created.json().update.media[0].id as string;

    const authorized = await app.inject({ method: 'GET', url: `/v1/media/${mediaId}`, headers: { authorization: `Bearer ${customerToken}` } });
    expect(authorized.statusCode).toBe(200);
    expect(authorized.headers['content-type']).toContain('image/png');
    expect(authorized.headers['cache-control']).toBe('private, no-store');
    expect(authorized.rawPayload).toEqual(validPngBytes);

    const outsiderId = '30000009-0000-4000-8000-000000000009';
    const outsiderPasswordHash = (db.prepare('SELECT password_hash FROM users WHERE email = ?').get(customerEmail) as { password_hash: string }).password_hash;
    db.prepare('INSERT INTO users (id, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)').run(
      outsiderId, 'outsider.customer@karaa.demo', outsiderPasswordHash, 'customer', 'Outside Customer',
    );
    const outsiderToken = await login(app, 'outsider.customer@karaa.demo');
    const unauthorized = await app.inject({ method: 'GET', url: `/v1/media/${mediaId}`, headers: { authorization: `Bearer ${outsiderToken}` } });
    const unknown = await app.inject({ method: 'GET', url: '/v1/media/00000000-0000-4000-8000-000000000000', headers: { authorization: `Bearer ${outsiderToken}` } });
    expect(unauthorized.statusCode).toBe(403);
    expect(unknown.statusCode).toBe(403);
    expect(unauthorized.json()).toEqual(unknown.json());
  });

  it('does not disclose project detail outside membership', async () => {
    const { app } = createApp();
    const customerToken = await login(app, customerEmail);

    const response = await app.inject({
      method: 'GET', url: `/v1/projects/${unrelatedProjectId}`, headers: { authorization: `Bearer ${customerToken}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'PROJECT_ACCESS_DENIED' });
  });
});
