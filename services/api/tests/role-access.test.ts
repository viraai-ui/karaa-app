import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';

const apps: KaraaApp[] = [];

function createApp(): KaraaApp {
  const app = buildApp({ jwtSecret: 'test-secret-that-is-long-enough-for-hs256' });
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
  return response.json().token;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('role-aware protected routes', () => {
  it('rejects an unauthenticated projects request', async () => {
    const app = createApp();

    const response = await app.inject({ method: 'GET', url: '/v1/projects' });

    expect(response.statusCode).toBe(401);
  });

  it('allows the customer to read seeded project data', async () => {
    const app = createApp();
    const token = await login(app, 'anika.customer@karaa.demo');

    const response = await app.inject({
      method: 'GET',
      url: '/v1/projects',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().projects).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Amaravati Solar Commons' }),
    ]));
  });

  it('returns 403 when an employee requests the management summary', async () => {
    const app = createApp();
    const token = await login(app, 'dev.employee@karaa.demo');

    const response = await app.inject({
      method: 'GET',
      url: '/v1/management/summary',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
  });

  it('allows the persisted management account to read the management summary', async () => {
    const app = createApp();
    const token = await login(app, 'mira.management@karaa.demo');

    const response = await app.inject({
      method: 'GET',
      url: '/v1/management/summary',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().projects).toHaveLength(9);
    expect(response.json().projects).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Amaravati Solar Commons' }),
    ]));
  });
});
