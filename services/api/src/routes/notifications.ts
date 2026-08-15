import { notificationsResponseSchema, type Notification } from '@karaa/contracts';
import type { FastifyInstance } from 'fastify';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase, Role } from '../db.js';

const allRoles: Role[] = ['customer', 'employee', 'management'];

interface NotificationRow {
  id: string;
  project_id: string;
  progress_update_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export function registerNotificationRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService): void {
  app.get('/v1/notifications', { preHandler: auth.requireRole(...allRoles) }, (request) => {
    const rows = db.prepare(`
      SELECT id, project_id, progress_update_id, body, created_at, read_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `).all(request.karaaUser!.id) as NotificationRow[];
    const notifications: Notification[] = rows.map((row) => ({
      id: row.id,
      projectId: row.project_id,
      progressUpdateId: row.progress_update_id,
      body: row.body,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));

    return notificationsResponseSchema.parse({ notifications });
  });
}
