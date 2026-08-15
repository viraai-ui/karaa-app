const mockGetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  getItemAsync: mockGetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
  setItemAsync: jest.fn(),
}));

const { loadSession } = require('../src/lib/session') as typeof import('../src/lib/session');

const storageKey = 'karaa.active-session.v1';
const validUser = {
  id: '30000003-0000-4000-8000-000000000003',
  email: 'mira.management@karaa.demo',
  displayName: 'Mira Management',
  role: 'management',
};

function futurePayload() {
  return btoa(JSON.stringify({ exp: 2_000_000_000 }));
}

describe('persisted session recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['an empty token', ''],
    ['a malformed JWT header', `malformed-header.${futurePayload()}.signature`],
  ])('clears stored session data with %s before returning authentication', async (_label, token) => {
    mockGetItemAsync.mockResolvedValue(JSON.stringify({
      token,
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: validUser,
    }));

    await expect(loadSession()).rejects.toThrow('SESSION_EXPIRED');
    expect(mockDeleteItemAsync).toHaveBeenCalledWith(storageKey);
  });
});
