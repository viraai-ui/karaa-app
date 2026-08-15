import { saveEmployeeCurrentLocation } from '../src/features/employee/location-api';
import type { Session } from '../src/lib/session';

const session: Session = {
  token: 'server-issued-token',
  expiresAt: '2033-05-18T03:33:20.000Z',
  user: { id: '30000002-0000-4000-8000-000000000002', role: 'employee' },
};

describe('employee current-location API', () => {
  it('persists selected simulated field coordinates through the authenticated current-location endpoint', async () => {
    const fetcher = jest.fn(async () => new Response(JSON.stringify({
      userId: session.user.id,
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-11T18:43:16.990Z',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(saveEmployeeCurrentLocation(session, {
      state: 'simulated',
      latitude: 16.5062,
      longitude: 80.648,
    }, { fetcher, baseUrl: 'http://karaa.test' })).resolves.toMatchObject({
      state: 'simulated',
      recordedAt: '2026-08-11T18:43:16.990Z',
    });

    expect(fetcher).toHaveBeenCalledWith('http://karaa.test/v1/locations/current', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({
        authorization: 'Bearer server-issued-token',
        'content-type': 'application/json',
      }),
      body: JSON.stringify({ latitude: 16.5062, longitude: 80.648, state: 'simulated' }),
      signal: expect.any(AbortSignal),
    }));
  });
});
