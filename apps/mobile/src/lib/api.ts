import { z } from 'zod';

import { expiresAtFromJwt, type Role, type Session } from './session';

const roleSchema = z.enum(['customer', 'employee', 'management']);
const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
}).strict();
const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string().uuid(),
    email: z.email(),
    role: roleSchema,
    displayName: z.string().min(1),
  }).strict(),
}).strict();

export type ApiErrorCode = 'AUTHENTICATION_REJECTED' | 'OFFLINE' | 'SERVER_RESPONSE_INVALID' | 'REQUEST_FAILED';

export class ApiError extends Error {
  constructor(readonly code: ApiErrorCode, message: string) {
    super(message);
  }
}

type ApiEnvironment = Record<string, string | undefined>;

export function resolveApiBaseUrl(environment: ApiEnvironment): string {
  return environment.EXPO_PUBLIC_API_BASE_URL?.trim()
    || environment.EXPO_PUBLIC_API_URL?.trim()
    || 'http://10.0.2.2:4310';
}

export const apiBaseUrl = resolveApiBaseUrl({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

export async function login(
  credentials: { email: string; password: string },
  fetcher: typeof fetch = fetch,
  baseUrl = apiBaseUrl,
  timeoutMs = 10_000,
): Promise<Session> {
  const request = loginRequestSchema.safeParse(credentials);
  if (!request.success) throw new ApiError('REQUEST_FAILED', 'Enter a valid email and password.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/$/, '')}/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request.data),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    throw new ApiError('AUTHENTICATION_REJECTED', 'Your email or password was not accepted.');
  }
  if (!response.ok) throw new ApiError('REQUEST_FAILED', 'Karaa could not complete the sign-in request.');

  const payload = loginResponseSchema.safeParse(await response.json());
  if (!payload.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid session.');

  const role: Role = payload.data.user.role;
  const expiresAt = expiresAtFromJwt(payload.data.token);
  if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned a session without a usable expiration time.');
  }

  return {
    token: payload.data.token,
    expiresAt,
    user: { ...payload.data.user, role },
  };
}
