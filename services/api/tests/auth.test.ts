import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';

const apps: KaraaApp[] = [];

function createApp(): KaraaApp {
  const app = buildApp({ jwtSecret: 'test-secret-that-is-long-enough-for-hs256' });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('GET /health', () => {
  it('refuses to construct an app without an injected signing secret', () => {
    expect(() => buildApp()).toThrow('JWT signing secret');
  });

  it('returns the API health contract', async () => {
    const app = createApp();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });
});

describe('POST /v1/auth/login', () => {
  it('returns a signed token and persisted customer role for seeded Anika', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        email: 'anika.customer@karaa.demo',
        password: 'demo-password',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      token: expect.any(String),
      user: {
        email: 'anika.customer@karaa.demo',
        role: 'customer',
      },
    });
  });

  it('rejects a login payload with a client-supplied role', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        email: 'anika.customer@karaa.demo',
        password: 'demo-password',
        role: 'management',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Invalid request' });
  });

  it('rejects invalid credentials without disclosing account details', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        email: 'anika.customer@karaa.demo',
        password: 'not-the-demo-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Invalid credentials' });
  });

  it('rejects malformed login payloads', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'not-an-email' },
    });

    expect(response.statusCode).toBe(400);
  });
});
