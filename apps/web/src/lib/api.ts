import { z } from 'zod';

import { isUsableBrowserSession, type BrowserSession } from './session';

const loginResponseSchema = z.object({
  token: z.string().trim().min(1),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['customer', 'employee', 'management']),
    displayName: z.string().trim().min(1).max(256),
  }).strict(),
}).strict();

const timeoutMs = 10_000;

export class KaraaApiError extends Error {
  constructor(public readonly code: 'OFFLINE' | 'AUTHENTICATION_REJECTED' | 'REQUEST_FAILED' | 'SERVER_RESPONSE_INVALID', message: string) {
    super(message);
  }
}

function url(path: string): string {
  const base = import.meta.env.VITE_KARAA_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url(path), { ...init, cache: 'no-store', signal: controller.signal });
  } catch {
    throw new KaraaApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function authenticate(input: { email: string; password: string }): Promise<BrowserSession> {
  const response = await request('/v1/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (response.status === 401) throw new KaraaApiError('REQUEST_FAILED', 'Invalid credentials.');
  if (!response.ok) throw new KaraaApiError('REQUEST_FAILED', 'Karaa could not sign you in.');

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid sign-in response.');
  }
  const parsed = loginResponseSchema.safeParse(body);
  if (!parsed.success || !isUsableBrowserSession(parsed.data)) throw new KaraaApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid sign-in response.');
  return parsed.data;
}
