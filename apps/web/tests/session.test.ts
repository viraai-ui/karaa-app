import { clearSession, readSession, writeSession } from '../src/lib/session';

const futureJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature';
const expiredJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.signature';

describe('browser session boundary', () => {
  beforeEach(() => sessionStorage.clear());

  it('removes malformed browser session data instead of trusting it', () => {
    sessionStorage.setItem('karaa.browser.session.v1', '{bad json');

    expect(readSession()).toBeNull();
    expect(sessionStorage.getItem('karaa.browser.session.v1')).toBeNull();
  });

  it('removes an expired JWT session instead of restoring it into the workspace', () => {
    sessionStorage.setItem('karaa.browser.session.v1', JSON.stringify({
      token: expiredJwt,
      user: {
        id: '30000002-0000-4000-8000-000000000002',
        email: 'dev.employee@karaa.demo',
        role: 'employee',
        displayName: 'Dev Employee',
      },
    }));

    expect(readSession()).toBeNull();
    expect(sessionStorage.getItem('karaa.browser.session.v1')).toBeNull();
  });

  it('retains only a validated signed-in session for the current browser session', () => {
    writeSession({
      token: futureJwt,
      user: {
        id: '30000002-0000-4000-8000-000000000002',
        email: 'dev.employee@karaa.demo',
        role: 'employee',
        displayName: 'Dev Employee',
      },
    });

    expect(readSession()).toEqual({
      token: futureJwt,
      user: {
        id: '30000002-0000-4000-8000-000000000002',
        email: 'dev.employee@karaa.demo',
        role: 'employee',
        displayName: 'Dev Employee',
      },
    });
    expect(localStorage.getItem('karaa.browser.session.v1')).toBeNull();
  });

  it('clears only the session boundary on sign out', () => {
    writeSession({
      token: futureJwt,
      user: {
        id: '30000001-0000-4000-8000-000000000001',
        email: 'anika.customer@karaa.demo',
        role: 'customer',
        displayName: 'Anika Customer',
      },
    });

    clearSession();

    expect(readSession()).toBeNull();
  });
});
