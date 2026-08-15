import { describe, expect, it } from 'vitest';

import { resolveJwtSecret, resolveServerConfig } from '../src/server-config.js';

describe('resolveServerConfig', () => {
  it('uses the documented Karaa host and port variables', () => {
    expect(resolveServerConfig({ KARAA_API_HOST: '0.0.0.0', KARAA_API_PORT: '4310' })).toEqual({
      host: '0.0.0.0',
      port: 4310,
      allowedWebOrigins: ['http://127.0.0.1:4173'],
      databasePath: ':memory:',
    });
  });

  it('uses the local demo defaults when no environment is supplied', () => {
    expect(resolveServerConfig({})).toEqual({
      host: '127.0.0.1',
      port: 4310,
      allowedWebOrigins: ['http://127.0.0.1:4173'],
      databasePath: ':memory:',
    });
  });

  it('accepts only absolute configured browser origins', () => {
    expect(resolveServerConfig({
      KARAA_WEB_ORIGINS: 'http://127.0.0.1:4177, https://karaa.example, /not-an-origin',
    }).allowedWebOrigins).toEqual(['http://127.0.0.1:4177', 'https://karaa.example']);
  });

  it('uses an explicitly configured persistent database path', () => {
    expect(resolveServerConfig({ KARAA_DATABASE_PATH: ' /var/data/karaa.sqlite ' }).databasePath)
      .toBe('/var/data/karaa.sqlite');
  });

  it('uses the documented demo JWT secret before the legacy secret variable', () => {
    expect(resolveJwtSecret({
      KARAA_DEMO_JWT_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      KARAA_JWT_SECRET: 'legacy-secret',
    })).toBe('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  });

  it.each([
    ['missing', {}],
    ['too short', { KARAA_DEMO_JWT_SECRET: 'x' }],
    ['placeholder', { KARAA_DEMO_JWT_SECRET: 'replace-with-a-local-secret' }],
    ['legacy fallback', { KARAA_JWT_SECRET: 'karaa-demo-development-secret' }],
  ])('rejects a %s JWT signing secret', (_label, environment) => {
    expect(() => resolveJwtSecret(environment)).toThrow('KARAA_DEMO_JWT_SECRET');
  });
});
