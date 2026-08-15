import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase, type KaraaDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const unrelatedProjectId = '20000002-0000-4000-8000-000000000002';
const milestoneId = '40000001-0000-4000-8000-000000000001';
const unrelatedMilestoneId = '40000002-0000-4000-8000-000000000002';
const employeeEmail = 'dev.employee@karaa.demo';
const customerEmail = 'anika.customer@karaa.demo';
const validPngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWO442YEAANWAVUhsPJLAAAAAElFTkSuQmCC',
  'base64',
);
const alternateValidPngBytes = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWPQTXUDAAGbANn8lKFwAAAAAElFTkSuQmCC',
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

function fieldRecord(eventId = '50000001-0000-4000-8000-000000000001') {
  return {
    eventId,
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
    blocker: 'No active blocker.',
  };
}

async function encodedForm(form: FormData): Promise<{ payload: Buffer; contentType: string }> {
  const response = new Response(form);
  const contentType = response.headers.get('content-type');
  if (!contentType) throw new Error('Expected multipart content type');
  return { payload: Buffer.from(await response.arrayBuffer()), contentType };
}

async function multipartPayload(
  payload: unknown = fieldRecord(),
  photo: Blob = new Blob([validPngBytes], { type: 'image/png' }),
  options: { omitPayload?: boolean; omitPhoto?: boolean; duplicatePayload?: boolean; duplicatePhoto?: boolean; extraFile?: boolean } = {},
): Promise<{ payload: Buffer; contentType: string }> {
  const form = new FormData();
  if (!options.omitPayload) form.append('payload', typeof payload === 'string' ? payload : JSON.stringify(payload));
  if (options.duplicatePayload) form.append('payload', JSON.stringify(payload));
  if (!options.omitPhoto) form.append('photo', photo, 'evidence.png');
  if (options.duplicatePhoto) form.append('photo', photo, 'second.png');
  if (options.extraFile) form.append('other', photo, 'other.png');
  return encodedForm(form);
}

async function postMultipart(
  app: KaraaApp,
  token: string | undefined,
  payload: unknown = fieldRecord(),
  photo?: Blob,
  options?: Parameters<typeof multipartPayload>[2],
) {
  const encoded = await multipartPayload(payload, photo, options);
  return app.inject({
    method: 'POST',
    url: '/v1/progress-updates',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': encoded.contentType },
    payload: encoded.payload,
  });
}

function count(db: KaraaDatabase, table: 'progress_updates' | 'update_media' | 'notifications'): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;
}

function expectNoPartialWrite(db: KaraaDatabase): void {
  expect(count(db, 'progress_updates')).toBe(0);
  expect(count(db, 'update_media')).toBe(0);
  expect(count(db, 'notifications')).toBe(0);
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  databases.splice(0);
});

describe('POST /v1/progress-updates', () => {
  it('authenticates the employee before accepting multipart field data', async () => {
    const { app, db } = createApp();
    const unauthenticated = await postMultipart(app, undefined, '{malformed-json');
    expect(unauthenticated.statusCode).toBe(401);

    const customerToken = await login(app, customerEmail);
    const forbidden = await postMultipart(app, customerToken);
    expect(forbidden.statusCode).toBe(403);
    expectNoPartialWrite(db);
  });

  it('rejects bytes that only claim to be an image without partial persistence', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);

    const response = await postMultipart(app, token, fieldRecord(), new Blob([Buffer.from('<script>not an image</script>')], { type: 'image/png' }));

    expect(response.statusCode).toBe(400);
    expectNoPartialWrite(db);
  });

  it('rejects a multipart MIME declaration that does not match validated image bytes', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);

    const response = await postMultipart(app, token, fieldRecord(), new Blob([validPngBytes], { type: 'image/jpeg' }));

    expect(response.statusCode).toBe(400);
    expectNoPartialWrite(db);
  });

  it('persists one authenticated multipart field record and its exact image bytes', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);
    const photoBytes = validPngBytes;

    const response = await postMultipart(app, token, fieldRecord(), new Blob([photoBytes], { type: 'image/png' }));

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      replayed: false,
      update: {
        eventId: fieldRecord().eventId,
        projectId,
        milestoneId,
        authorId: '30000002-0000-4000-8000-000000000002',
        crewCount: 4,
        crewHours: 28.5,
        quantityValue: 18,
        quantityUnit: 'panels',
        siteConditions: 'Dry ground with clear access.',
        blocker: 'No active blocker.',
        locationState: 'simulated',
        media: [{ mediaPath: expect.stringMatching(/^\/v1\/media\//), mimeType: 'image/png', sizeBytes: photoBytes.length }],
      },
    });
    const stored = db.prepare('SELECT content, content_sha256, media_url, media_type, size_bytes FROM update_media').get() as {
      content: Buffer; content_sha256: string; media_url: string; media_type: string; size_bytes: number;
    };
    expect(stored.content).toEqual(photoBytes);
    expect(stored.content_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.media_url).toBe(response.json().update.media[0].mediaPath);
    expect(stored.media_type).toBe('image/png');
    expect(stored.size_bytes).toBe(photoBytes.length);
    expect(db.prepare('SELECT crew_count, crew_hours, quantity_value, quantity_unit, site_conditions, blocker, location_state FROM progress_updates').get()).toEqual({
      crew_count: 4, crew_hours: 28.5, quantity_value: 18, quantity_unit: 'panels', site_conditions: 'Dry ground with clear access.', blocker: 'No active blocker.', location_state: 'simulated',
    });
    expect(db.prepare('SELECT progress FROM milestones WHERE id = ?').get(milestoneId)).toEqual({ progress: 65 });
    expect(db.prepare('SELECT progress FROM projects WHERE id = ?').get(projectId)).toEqual({ progress: 65 });
    expect(count(db, 'notifications')).toBe(2);
  });

  it('persists denied and unavailable location states without invented coordinates', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);

    for (const [state, eventId] of [['denied', '50000002-0000-4000-8000-000000000002'], ['unavailable', '50000003-0000-4000-8000-000000000003']] as const) {
      const { latitude: _latitude, longitude: _longitude, ...record } = fieldRecord(eventId);
      const response = await postMultipart(app, token, { ...record, locationState: state });
      expect(response.statusCode).toBe(201);
      expect(response.json().update).toMatchObject({ locationState: state, latitude: null, longitude: null });
    }

    const locations = db.prepare('SELECT location_state, latitude, longitude FROM progress_updates ORDER BY event_id').all();
    expect(locations).toEqual([
      { location_state: 'denied', latitude: null, longitude: null },
      { location_state: 'unavailable', latitude: null, longitude: null },
    ]);
  });

  it.each([
    ['missing payload', undefined, undefined, { omitPayload: true }],
    ['missing photo', fieldRecord(), undefined, { omitPhoto: true }],
    ['duplicate payload', fieldRecord(), undefined, { duplicatePayload: true }],
    ['duplicate photo', fieldRecord(), undefined, { duplicatePhoto: true }],
    ['extra file', fieldRecord(), undefined, { extraFile: true }],
    ['malformed JSON', '{malformed-json', undefined, undefined],
    ['unknown payload field', { ...fieldRecord(), authorId: 'client-controlled' }, undefined, undefined],
    ['missing crew count', (() => { const { crewCount: _crewCount, ...rest } = fieldRecord(); return rest; })(), undefined, undefined],
    ['negative crew hours', { ...fieldRecord(), crewHours: -0.1 }, undefined, undefined],
    ['quantity value with blank unit', { ...fieldRecord(), quantityUnit: ' ' }, undefined, undefined],
    ['blank site conditions', { ...fieldRecord(), siteConditions: ' ' }, undefined, undefined],
    ['invalid coordinates', { ...fieldRecord(), latitude: 91 }, undefined, undefined],
    ['project and milestone mismatch', { ...fieldRecord(), milestoneId: unrelatedMilestoneId }, undefined, undefined],
    ['unsupported image type', fieldRecord(), new Blob([Buffer.from('pdf')], { type: 'application/pdf' }), undefined],
    ['zero-byte image', fieldRecord(), new Blob([], { type: 'image/png' }), undefined],
    ['over-limit image', fieldRecord(), new Blob([Buffer.alloc(10_000_001)], { type: 'image/png' }), undefined],
  ])('rejects %s without partial persistence', async (_label, payload, photo, options) => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);

    const response = await postMultipart(app, token, payload, photo, options);

    expect(response.statusCode).toBe(400);
    expectNoPartialWrite(db);
  });

  it('rejects membership failures before persisting a record', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);

    const response = await postMultipart(app, token, { ...fieldRecord(), projectId: unrelatedProjectId, milestoneId: unrelatedMilestoneId });

    expect(response.statusCode).toBe(403);
    expectNoPartialWrite(db);
  });

  it('replays normalized equivalent records and conflicts when the image bytes differ', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);
    const first = await postMultipart(app, token, fieldRecord(), new Blob([validPngBytes], { type: 'image/png' }));
    const replay = await postMultipart(app, token, {
      ...fieldRecord(), occurredAt: '2026-08-10T09:15:00Z', workDescription: '  Installed the first solar inverter row.  ',
    }, new Blob([validPngBytes], { type: 'image/png' }));
    const conflict = await postMultipart(app, token, fieldRecord(), new Blob([alternateValidPngBytes], { type: 'image/png' }));

    expect(first.statusCode).toBe(201);
    expect(replay.statusCode).toBe(200);
    expect(replay.json()).toMatchObject({ replayed: true, update: first.json().update });
    expect(conflict.statusCode).toBe(409);
    expect(count(db, 'progress_updates')).toBe(1);
    expect(count(db, 'update_media')).toBe(1);
    expect(count(db, 'notifications')).toBe(2);
  });

  it('rolls back update, media, progress, and notifications if a post-media insert fails', async () => {
    const { app, db } = createApp();
    const token = await login(app, employeeEmail);
    db.exec("CREATE TRIGGER fail_notifications BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT, 'injected notification failure'); END;");

    const response = await postMultipart(app, token);

    expect(response.statusCode).toBe(500);
    expectNoPartialWrite(db);
    expect(db.prepare('SELECT progress FROM milestones WHERE id = ?').get(milestoneId)).toEqual({ progress: 0 });
  });
});
