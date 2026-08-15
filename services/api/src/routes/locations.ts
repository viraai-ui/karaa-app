import { randomUUID } from 'node:crypto';

import { currentLocationSchema, locationsResponseSchema } from '@karaa/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase } from '../db.js';

const locationInputSchema = z.object({
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
  state: z.enum(['active', 'simulated']),
}).strict();

function hasProjectMembership(db: KaraaDatabase, projectId: string, userId: string): boolean {
  return Boolean(db.prepare(
    'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
  ).get(projectId, userId));
}

export function registerLocationRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService): void {
  app.put('/v1/locations/current', { preHandler: auth.requireRole('employee') }, (request, reply) => {
    const parsed = locationInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'LOCATION_INVALID' });

    const recordedAt = new Date().toISOString();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO current_locations (id, user_id, latitude, longitude, state, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        state = excluded.state,
        recorded_at = excluded.recorded_at
    `).run(id, request.karaaUser!.id, parsed.data.latitude, parsed.data.longitude, parsed.data.state, recordedAt);

    return currentLocationSchema.parse({
      userId: request.karaaUser!.id,
      displayName: request.karaaUser!.display_name,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      state: parsed.data.state,
      recordedAt,
    });
  });

  app.get('/v1/projects/:projectId/locations', { preHandler: auth.requireRole('management') }, (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!hasProjectMembership(db, projectId, request.karaaUser!.id)) {
      return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });
    }

    const rows = db.prepare(`
      SELECT current_locations.user_id, users.display_name, current_locations.latitude,
        current_locations.longitude, current_locations.state, current_locations.recorded_at
      FROM current_locations
      JOIN users ON users.id = current_locations.user_id AND users.role = 'employee'
      JOIN project_memberships ON project_memberships.user_id = current_locations.user_id
      WHERE project_memberships.project_id = ?
      ORDER BY current_locations.recorded_at DESC, current_locations.user_id ASC
    `).all(projectId) as Array<{
      user_id: string;
      display_name: string;
      latitude: number;
      longitude: number;
      state: 'active' | 'simulated';
      recorded_at: string;
    }>;

    return locationsResponseSchema.parse({
      locations: rows.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        latitude: row.latitude,
        longitude: row.longitude,
        state: row.state,
        recordedAt: row.recorded_at,
      })),
    });
  });
}
