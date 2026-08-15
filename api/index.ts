import type { IncomingMessage, ServerResponse } from 'node:http';

import { buildApp } from '../services/api/src/app.js';

const defaultOrigins = ['https://karaa-global-app.vercel.app'];

function allowedOrigins(): string[] {
  const configured = process.env.KARAA_WEB_ORIGINS;
  return configured
    ? configured.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultOrigins;
}

const jwtSecret = process.env.KARAA_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('KARAA_JWT_SECRET must be set in the Vercel project');
}

// A warm function instance reuses this database. Vercel may discard /tmp or
// start another instance at any time, so this is intentionally demo-only.
const app = buildApp({
  allowedWebOrigins: allowedOrigins(),
  databasePath: '/tmp/karaa-demo.sqlite',
  includeAudienceEvidence: true,
  jwtSecret,
  realtime: false,
});
const ready = app.ready();

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await ready;

  const incomingUrl = new URL(request.url ?? '/', 'https://karaa-api-demo.vercel.app');
  const rewrittenRoute = incomingUrl.searchParams.get('route');
  if (rewrittenRoute) request.url = rewrittenRoute;

  // Vercel exposes this function below /api; the existing long-lived API has
  // root-level routes. Remove only that deployment prefix before dispatching.
  if (request.url === '/api') request.url = '/';
  else if (request.url?.startsWith('/api/')) request.url = request.url.slice(4);

  response.setHeader('x-karaa-demo-storage', 'ephemeral');
  response.setHeader('x-karaa-realtime', 'disabled');
  app.server.emit('request', request, response);
}