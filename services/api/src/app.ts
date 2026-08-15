import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

import { createAuthService } from './auth.js';
import { createDatabase, type KaraaDatabase } from './db.js';
import { createRealtimeGateway } from './realtime.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerConversationRoutes } from './routes/conversations.js';
import { registerLocationRoutes } from './routes/locations.js';
import { registerManagementRoutes } from './routes/management.js';
import { registerNotificationRoutes } from './routes/notifications.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerProgressUpdateRoutes } from './routes/updates.js';
import { requireJwtSecret } from './server-config.js';
import { maxMediaSizeBytes } from './progress.js';

export interface AppOptions {
  database?: KaraaDatabase;
  /** SQLite filename. Use a path on a persistent volume outside tests. */
  databasePath?: string;
  /** Enable the local fictional seed record used by the audience-demo server. */
  includeAudienceEvidence?: boolean;
  jwtSecret?: string;
  /** Exact browser origins permitted to call this API directly. */
  allowedWebOrigins?: readonly string[];
}

export type KaraaApp = FastifyInstance;

export function buildApp(options: AppOptions = {}): KaraaApp {
  const jwtSecret = requireJwtSecret(options.jwtSecret);
  const app = Fastify({ bodyLimit: maxMediaSizeBytes + 65_536 });
  const allowedWebOrigins = new Set(options.allowedWebOrigins ?? []);
  app.register(cors, {
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
    origin(origin, callback) {
      callback(null, !origin || allowedWebOrigins.has(origin));
    },
  });
  app.register(multipart, {
    limits: {
      fieldNameSize: 32,
      fieldSize: 16_384,
      fields: 1,
      fileSize: maxMediaSizeBytes,
      files: 1,
      parts: 2,
    },
  });
  const db = options.database ?? createDatabase(options.databasePath ?? ':memory:', { includeAudienceEvidence: options.includeAudienceEvidence });
  const auth = createAuthService(db, jwtSecret);
  const realtime = createRealtimeGateway(app.server, db, jwtSecret);

  app.get('/health', () => ({ ok: true }));
  registerAuthRoutes(app, db, auth);
  registerProjectRoutes(app, db, auth);
  registerNotificationRoutes(app, db, auth);
  registerLocationRoutes(app, db, auth);
  registerManagementRoutes(app, db, auth);
  registerConversationRoutes(app, db, auth, realtime);
  registerProgressUpdateRoutes(app, db, auth, realtime);

  app.addHook('onClose', () => {
    realtime.close();
    db.close();
  });

  return app;
}
