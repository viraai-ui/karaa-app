import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';

const apps: KaraaApp[] = [];

function createApp(): KaraaApp {
  const app = buildApp({
    allowedWebOrigins: ['http://127.0.0.1:4177'],
    jwtSecret: 'test-secret-that-is-long-enough-for-hs256',
  });
  apps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('configured browser CORS boundary', () => {
  it('allows preflight only from the exact configured browser origin', async () => {
    const app = createApp();

    const allowed = await app.inject({
      method: 'OPTIONS',
      url: '/v1/projects',
      headers: {
        origin: 'http://127.0.0.1:4177',
        'access-control-request-method': 'GET',
      },
    });
    const rejected = await app.inject({
      method: 'OPTIONS',
      url: '/v1/projects',
      headers: {
        origin: 'http://malicious.example',
        'access-control-request-method': 'GET',
      },
    });

    expect(allowed.statusCode).toBe(204);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://127.0.0.1:4177');
    expect(allowed.headers['access-control-allow-headers']).toContain('authorization');
    expect(allowed.headers['access-control-allow-headers']).toContain('content-type');
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
  });
});
