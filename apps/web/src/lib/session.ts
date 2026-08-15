import { z } from 'zod';

const sessionKey = 'karaa.browser.session.v1';

const browserSessionSchema = z.object({
  token: z.string().trim().min(1),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['customer', 'employee', 'management']),
    displayName: z.string().trim().min(1).max(256),
  }).strict(),
}).strict();

export type BrowserSession = z.infer<typeof browserSessionSchema>;

function hasUnexpiredJwtExpiry(token: string): boolean {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return false;
  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: unknown };
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1_000 > Date.now();
  } catch {
    return false;
  }
}

export function isUsableBrowserSession(value: unknown): value is BrowserSession {
  const parsed = browserSessionSchema.safeParse(value);
  return parsed.success && hasUnexpiredJwtExpiry(parsed.data.token);
}

function storage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.sessionStorage;
}

export function readSession(): BrowserSession | null {
  const value = storage()?.getItem(sessionKey);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (isUsableBrowserSession(parsed)) return parsed;
  } catch {
    // Invalid browser data must never become application authority.
  }
  storage()?.removeItem(sessionKey);
  return null;
}

export function writeSession(session: BrowserSession): void {
  const parsed = browserSessionSchema.parse(session);
  if (!hasUnexpiredJwtExpiry(parsed.token)) throw new Error('Karaa rejected an expired sign-in session.');
  storage()?.setItem(sessionKey, JSON.stringify(parsed));
}

export function clearSession(): void {
  storage()?.removeItem(sessionKey);
}
