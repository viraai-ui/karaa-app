import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase, Role } from '../db.js';
import {
  ProgressUpdateConflictError,
  ProgressUpdateForbiddenError,
  ProgressUpdateValidationError,
  createProgressUpdate,
  maxMediaSizeBytes,
  parseProgressUpdateInput,
} from '../progress.js';
import type { RealtimeGateway } from '../realtime.js';

const mediaReaderRoles: Role[] = ['customer', 'employee', 'management'];

async function parseMultipartFieldRecord(request: FastifyRequest) {
  if (!request.isMultipart()) return undefined;
  let payload: string | undefined;
  let photo: { bytes: Buffer; mimeType: string } | undefined;
  let invalid = false;

  try {
    for await (const part of request.parts()) {
      if (part.type === 'field') {
        if (part.fieldname !== 'payload' || payload !== undefined || part.valueTruncated || typeof part.value !== 'string') {
          invalid = true;
          continue;
        }
        payload = part.value;
        continue;
      }

      const bytes = await part.toBuffer();
      if (part.fieldname !== 'photo' || photo !== undefined || !part.filename || bytes.length === 0 || bytes.length > maxMediaSizeBytes) {
        invalid = true;
        continue;
      }
      photo = { bytes, mimeType: part.mimetype };
    }
  } catch {
    return undefined;
  }

  if (invalid || payload === undefined || photo === undefined) return undefined;
  try {
    return parseProgressUpdateInput(JSON.parse(payload), photo);
  } catch {
    return undefined;
  }
}

export function registerProgressUpdateRoutes(
  app: FastifyInstance,
  db: KaraaDatabase,
  auth: AuthService,
  realtime: RealtimeGateway,
): void {
  app.post('/v1/progress-updates', { preHandler: auth.requireRole('employee') }, async (request, reply) => {
    const input = await parseMultipartFieldRecord(request);
    if (!input) return reply.code(400).send({ error: 'Invalid request' });

    try {
      const result = createProgressUpdate(db, request.karaaUser!, input);
      if (!result.replayed) realtime.emitCommittedProgress(result);
      return reply.code(result.replayed ? 200 : 201).send({ replayed: result.replayed, update: result.update });
    } catch (error) {
      if (error instanceof ProgressUpdateConflictError) return reply.code(409).send({ error: 'Idempotency conflict' });
      if (error instanceof ProgressUpdateValidationError) return reply.code(400).send({ error: 'Invalid request' });
      if (error instanceof ProgressUpdateForbiddenError) return reply.code(403).send({ error: 'Forbidden' });
      throw error;
    }
  });

  app.get('/v1/media/:mediaId', { preHandler: auth.requireRole(...mediaReaderRoles) }, (request, reply) => {
    const { mediaId } = request.params as { mediaId: string };
    const media = db.prepare(`
      SELECT update_media.content, update_media.media_type, progress_updates.project_id
      FROM update_media
      JOIN progress_updates ON progress_updates.id = update_media.progress_update_id
      WHERE update_media.id = ?
    `).get(mediaId) as { content: Buffer; media_type: string; project_id: string } | undefined;
    if (!media) return reply.code(403).send({ error: 'Forbidden' });

    const membership = db.prepare(
      'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
    ).get(media.project_id, request.karaaUser!.id);
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    return reply.header('Cache-Control', 'private, no-store').type(media.media_type).send(media.content);
  });
}
