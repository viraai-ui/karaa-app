import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from 'expo-secure-store';

export const roles = ['customer', 'employee', 'management'] as const;
export type Role = (typeof roles)[number];

export interface SessionUser {
  id: string;
  email?: string;
  displayName?: string;
  role: Role;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: SessionUser;
}

export interface RoleRoute {
  pathname: '/login' | '/customer' | '/employee' | '/management';
  title: 'Sign in' | 'Power of 9' | 'My Work' | 'Command Centre';
}

const sessionStorageKey = 'karaa.active-session.v1';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && roles.includes(value as Role);
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SessionUser>;
  return typeof candidate.id === 'string'
    && uuidPattern.test(candidate.id)
    && typeof candidate.email === 'string'
    && /^\S+@\S+\.\S+$/.test(candidate.email)
    && typeof candidate.displayName === 'string'
    && candidate.displayName.trim().length > 0
    && isRole(candidate.role);
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Session>;
  const tokenExpiresAt = typeof candidate.token === 'string' ? expiresAtFromJwt(candidate.token) : undefined;
  return typeof candidate.token === 'string'
    && candidate.token.length > 0
    && Boolean(tokenExpiresAt)
    && typeof candidate.expiresAt === 'string'
    && Number.isFinite(Date.parse(candidate.expiresAt))
    && Date.parse(candidate.expiresAt) === Date.parse(tokenExpiresAt ?? '')
    && isSessionUser(candidate.user);
}

export function expiresAtFromJwt(token: string): string | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !base64UrlPattern.test(part))) return undefined;
    const decodeJsonSegment = (encoded: string): unknown => {
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(encoded.length / 4) * 4, '=');
      return JSON.parse(globalThis.atob(padded));
    };
    const header = decodeJsonSegment(parts[0]);
    const payload = decodeJsonSegment(parts[1]);
    if (!header || typeof header !== 'object' || (header as { alg?: unknown }).alg !== 'HS256') return undefined;
    if (!payload || typeof payload !== 'object') return undefined;
    const expiresAt = (payload as { exp?: unknown }).exp;
    if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) return undefined;
    return new Date(expiresAt * 1_000).toISOString();
  } catch {
    return undefined;
  }
}

export function selectRoleRoute(session: Session | undefined): RoleRoute {
  if (!session) return { pathname: '/login', title: 'Sign in' };
  switch (session.user.role) {
    case 'customer':
      return { pathname: '/customer', title: 'Power of 9' };
    case 'employee':
      return { pathname: '/employee', title: 'My Work' };
    case 'management':
      return { pathname: '/management', title: 'Command Centre' };
  }
}

export async function saveSession(session: Session): Promise<void> {
  await setItemAsync(sessionStorageKey, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | undefined> {
  const raw = await getItemAsync(sessionStorageKey);
  if (!raw) return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSession(parsed) && Date.parse(parsed.expiresAt) > Date.now()) return parsed;
  } catch {
    // Clear malformed persisted state before returning the user to sign in.
  }

  await deleteItemAsync(sessionStorageKey);
  throw new Error('SESSION_EXPIRED');
}

export async function clearSession(): Promise<void> {
  await deleteItemAsync(sessionStorageKey);
}
