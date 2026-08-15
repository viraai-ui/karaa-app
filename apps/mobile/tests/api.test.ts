import { ApiError, login, resolveApiBaseUrl } from '../src/lib/api';

const validUser = {
  id: '30000003-0000-4000-8000-000000000003',
  email: 'mira.management@karaa.demo',
  role: 'management',
  displayName: 'Mira Management',
} as const;

function jwtWithExpiration(exp: number) {
  return `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ exp }))}.signature`;
}

describe('login API client', () => {
  it('uses the documented Expo public API base URL before legacy configuration', () => {
    expect(resolveApiBaseUrl({
      EXPO_PUBLIC_API_BASE_URL: 'http://192.168.1.2:4310',
      EXPO_PUBLIC_API_URL: 'http://legacy.example:4310',
    })).toBe('http://192.168.1.2:4310');
  });

  it('sends only email and password and trusts the server-returned role', async () => {
    let request: RequestInit | undefined;
    const fetcher: typeof fetch = async (_input, init) => {
      request = init;
      return new Response(JSON.stringify({
        token: jwtWithExpiration(2_000_000_000),
        user: validUser,
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const session = await login(
      { email: 'mira.management@karaa.demo', password: 'demo-password' },
      fetcher,
      'http://karaa.test',
    );

    expect(JSON.parse(String(request?.body))).toEqual({
      email: 'mira.management@karaa.demo',
      password: 'demo-password',
    });
    expect(session.user.role).toBe('management');
    expect(new Date(session.expiresAt).getTime()).toBe(2_000_000_000_000);
  });

  it('rejects a success response without a JWT expiration claim', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      token: 'not-a-jwt',
      user: validUser,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(login({ email: 'mira.management@karaa.demo', password: 'demo-password' }, fetcher)).rejects.toMatchObject({
      code: 'SERVER_RESPONSE_INVALID',
    });
  });

  it('rejects a token whose payload expires but whose header is not valid JWT JSON', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      token: `malformed-header.${btoa(JSON.stringify({ exp: 2_000_000_000 }))}.signature`,
      user: validUser,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(login({ email: 'mira.management@karaa.demo', password: 'demo-password' }, fetcher)).rejects.toMatchObject({
      code: 'SERVER_RESPONSE_INVALID',
    });
  });

  it('rejects a well-formed JWT whose finite expiration is already expired', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({
      token: jwtWithExpiration(0),
      user: validUser,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(login({ email: 'mira.management@karaa.demo', password: 'demo-password' }, fetcher)).rejects.toMatchObject({
      code: 'SERVER_RESPONSE_INVALID',
    });
  });

  it('reports an expired or rejected session response without creating a session', async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    await expect(login({ email: 'mira.management@karaa.demo', password: 'demo-password' }, fetcher)).rejects.toMatchObject({
      code: 'AUTHENTICATION_REJECTED',
    });
  });

  it('reports a rejected login request as a connection-unavailable API error', async () => {
    const fetcher: typeof fetch = async () => Promise.reject(new Error('network failure'));

    const error = await login(
      { email: 'mira.management@karaa.demo', password: 'demo-password' },
      fetcher,
      'http://karaa.test',
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toHaveProperty('message', 'Connection unavailable — try again.');
  });

  it('maps a stalled login request to the offline state instead of submitting forever', async () => {
    jest.useFakeTimers();
    try {
      const fetcher: typeof fetch = async (_input, init) => {
        if (!init?.signal) {
          return new Response(JSON.stringify({ token: jwtWithExpiration(2_000_000_000), user: validUser }), { status: 200 });
        }
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      };

      const attempt = login(
        { email: 'mira.management@karaa.demo', password: 'demo-password' },
        fetcher,
        'http://karaa.test',
        50,
      );
      const expectedFailure = expect(attempt).rejects.toMatchObject({ code: 'OFFLINE' });
      await jest.advanceTimersByTimeAsync(50);

      await expectedFailure;
    } finally {
      jest.useRealTimers();
    }
  });
});
