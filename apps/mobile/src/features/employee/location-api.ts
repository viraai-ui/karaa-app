import { currentLocationSchema, type CurrentLocation } from '@karaa/contracts/events';

import type { EmployeeLocation } from './EmployeeWorkScreen';
import { ApiError, apiBaseUrl } from '../../lib/api';
import type { Session } from '../../lib/session';

const requestTimeoutMs = 10_000;
type Fetcher = typeof fetch;

export type PersistableEmployeeLocation = Extract<EmployeeLocation, { latitude: number; longitude: number }>;

type EmployeeLocationApiOptions = {
  fetcher?: Fetcher;
  baseUrl?: string;
};

function requestUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function saveEmployeeCurrentLocation(
  session: Session,
  location: PersistableEmployeeLocation,
  { fetcher = fetch, baseUrl = apiBaseUrl }: EmployeeLocationApiOptions = {},
): Promise<CurrentLocation> {
  if (session.user.role !== 'employee') {
    throw new ApiError('REQUEST_FAILED', 'You do not have access to field locations.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;
  try {
    response = await fetcher(requestUrl(baseUrl, '/v1/locations/current'), {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${session.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        state: location.state,
      }),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('OFFLINE', 'Connection unavailable — try again.');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new ApiError('REQUEST_FAILED', 'You do not have access to field locations.');
  if (!response.ok) throw new ApiError('REQUEST_FAILED', 'Karaa could not save this field location.');

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved field location.');
  }
  const parsed = currentLocationSchema.safeParse(body);
  if (!parsed.success) throw new ApiError('SERVER_RESPONSE_INVALID', 'Karaa returned an invalid saved field location.');
  return parsed.data;
}
