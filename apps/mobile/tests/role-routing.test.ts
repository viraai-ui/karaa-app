import { expiresAtFromJwt, selectRoleRoute } from '../src/lib/session';

describe('server-defined role routing', () => {
  it.each([
    ['customer', '/customer', 'Power of 9'],
    ['employee', '/employee', 'My Work'],
    ['management', '/management', 'Command Centre'],
  ] as const)('routes an authenticated %s user to the URL-addressable %s workspace', (role, pathname, title) => {
    expect(selectRoleRoute({
      token: 'token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: 'm1', role },
    })).toEqual({ pathname, title });
  });

  it('contains native deep-link route files for every role workspace', () => {
    for (const role of ['customer', 'employee', 'management']) {
      expect(() => require(`../app/${role}/index`)).not.toThrow();
    }
  });

  it('lands an authenticated management user in the command centre rather than a role selector', () => {
    const route = selectRoleRoute({
      token: 'token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: 'm1', role: 'management' },
    });

    expect(route.title).toBe('Command Centre');
    expect(route.title).not.toBe('Choose your role');
  });

  it('routes an absent session to sign in', () => {
    expect(selectRoleRoute(undefined)).toEqual({ pathname: '/login', title: 'Sign in' });
  });

  it('derives a session-expiry timestamp from the server-issued JWT expiry claim', () => {
    const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ exp: 2_000_000_000 }))}.signature`;

    expect(new Date(expiresAtFromJwt(token) ?? '').getTime()).toBe(2_000_000_000_000);
  });
});
