import { createHash, randomUUID } from 'node:crypto';

import { locationStateSchema, progressUpdateCreatedEvent, type ProgressUpdateCreatedEvent, type ProgressUpdateMedia } from '@karaa/contracts';
import sharp from 'sharp';
import { z } from 'zod';

import type { AuthenticatedUser } from './auth.js';
import type { KaraaDatabase } from './db.js';

export const maxMediaSizeBytes = 10_000_000;
const maxMediaPixels = 40_000_000;
const acceptedMediaTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const acceptedMediaTypeSchema = z.enum(acceptedMediaTypes);

const fieldRecordSchema = z.object({
  eventId: z.string().uuid(),
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  occurredAt: z.string().datetime().transform((value) => new Date(value).toISOString()),
  latitude: z.number().finite().gte(-90).lte(90).nullable().optional().transform((value) => value ?? null),
  longitude: z.number().finite().gte(-180).lte(180).nullable().optional().transform((value) => value ?? null),
  locationState: locationStateSchema,
  claimedProgress: z.number().finite().gte(0).lte(100),
  workDescription: z.string().trim().min(1).max(4_000),
  nextAction: z.string().trim().min(1).max(2_000),
  crewCount: z.number().int().gte(0),
  crewHours: z.number().finite().gte(0),
  quantityValue: z.number().finite().gte(0).nullable().optional().transform((value) => value ?? null),
  quantityUnit: z.string().trim().min(1).max(128).nullable().optional().transform((value) => value ?? null),
  siteConditions: z.string().trim().min(1).max(1_000),
  blocker: z.string().trim().min(1).max(1_000).nullable().optional().transform((value) => value ?? null),
}).strict().superRefine((value, context) => {
  if (value.quantityValue === null && value.quantityUnit !== null) {
    context.addIssue({ code: 'custom', path: ['quantityUnit'], message: 'quantityUnit requires quantityValue' });
  }
  if (value.quantityValue !== null && value.quantityUnit === null) {
    context.addIssue({ code: 'custom', path: ['quantityUnit'], message: 'quantityValue requires quantityUnit' });
  }
  const coordinatesRequired = value.locationState === 'active' || value.locationState === 'simulated';
  if (coordinatesRequired && (value.latitude === null || value.longitude === null)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'coordinates are required for active or simulated location' });
  }
  if (!coordinatesRequired && (value.latitude !== null || value.longitude !== null)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'coordinates must be absent when location is denied or unavailable' });
  }
});

export interface UploadedProgressPhoto {
  bytes: Buffer;
  mimeType: z.infer<typeof acceptedMediaTypeSchema>;
}

export type ProgressUpdateInput = z.infer<typeof fieldRecordSchema> & UploadedProgressPhoto;

export class ProgressUpdateConflictError extends Error {}
export class ProgressUpdateForbiddenError extends Error {}
export class ProgressUpdateValidationError extends Error {}

export interface PersistedNotification {
  id: string;
  userId: string;
  projectId: string;
  progressUpdateId: string;
  body: string;
  createdAt: string;
}

export type CreateProgressUpdateResult =
  | { replayed: false; update: ProgressUpdateCreatedEvent; projectProgress: number; notifications: PersistedNotification[] }
  | { replayed: true; update: ProgressUpdateCreatedEvent };

interface UpdateRow {
  id: string;
  event_id: string;
  project_id: string;
  milestone_id: string;
  author_id: string;
  body: string;
  next_action: string;
  crew_count: number;
  crew_hours: number;
  quantity_value: number | null;
  quantity_unit: string | null;
  site_conditions: string;
  blocker: string | null;
  latitude: number | null;
  longitude: number | null;
  location_state: z.infer<typeof locationStateSchema>;
  claimed_progress: number;
  occurred_at: string;
  server_timestamp: string;
  payload_hash: string;
}

interface MediaRow {
  id: string;
  media_url: string;
  media_type: z.infer<typeof acceptedMediaTypeSchema>;
  size_bytes: number;
  is_demo_visual: number;
}

function toEvent(db: KaraaDatabase, row: UpdateRow): ProgressUpdateCreatedEvent {
  const media = db.prepare(
    'SELECT id, media_url, media_type, size_bytes, is_demo_visual FROM update_media WHERE progress_update_id = ? ORDER BY id',
  ).all(row.id) as MediaRow[];
  const event = {
    id: row.id,
    eventId: row.event_id,
    projectId: row.project_id,
    milestoneId: row.milestone_id,
    authorId: row.author_id,
    occurredAt: row.occurred_at,
    serverTimestamp: row.server_timestamp,
    latitude: row.latitude,
    longitude: row.longitude,
    locationState: row.location_state,
    claimedProgress: row.claimed_progress,
    workDescription: row.body,
    nextAction: row.next_action,
    crewCount: row.crew_count,
    crewHours: row.crew_hours,
    quantityValue: row.quantity_value,
    quantityUnit: row.quantity_unit,
    siteConditions: row.site_conditions,
    blocker: row.blocker,
    media: media.map((item): ProgressUpdateMedia => ({
      id: item.id,
      mediaPath: item.media_url,
      mimeType: item.media_type,
      sizeBytes: item.size_bytes,
      isDemoVisual: Boolean(item.is_demo_visual),
    })),
  };
  return progressUpdateCreatedEvent.parse(event);
}

function payloadHash(authorId: string, input: ProgressUpdateInput): string {
  const { bytes, mimeType, ...fieldRecord } = input;
  const contentDigest = createHash('sha256').update(bytes).digest('hex');
  return createHash('sha256').update(JSON.stringify({ authorId, fieldRecord, mimeType, contentDigest })).digest('hex');
}

function mimeTypeForDecodedFormat(format: string): z.infer<typeof acceptedMediaTypeSchema> | undefined {
  switch (format) {
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    default: return undefined;
  }
}

export async function parseProgressUpdateInput(input: unknown, photo: { bytes: Buffer; mimeType: string } | undefined): Promise<ProgressUpdateInput | undefined> {
  const parsedFields = fieldRecordSchema.safeParse(input);
  if (!parsedFields.success || !photo || photo.bytes.length === 0 || photo.bytes.length > maxMediaSizeBytes) return undefined;

  try {
    const { info } = await sharp(photo.bytes, { failOn: 'error', limitInputPixels: maxMediaPixels }).toBuffer({ resolveWithObject: true });
    const mimeType = mimeTypeForDecodedFormat(info.format);
    if (!mimeType || photo.mimeType !== mimeType) return undefined;
    return { ...parsedFields.data, bytes: photo.bytes, mimeType };
  } catch {
    return undefined;
  }
}

export function createProgressUpdate(
  db: KaraaDatabase,
  author: AuthenticatedUser,
  input: ProgressUpdateInput,
): CreateProgressUpdateResult {
  const hash = payloadHash(author.id, input);

  return db.transaction(() => {
    const membership = db.prepare(
      'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
    ).get(input.projectId, author.id);
    if (!membership) throw new ProgressUpdateForbiddenError('Employee is not assigned to this project');

    const milestone = db.prepare('SELECT id FROM milestones WHERE id = ? AND project_id = ?').get(input.milestoneId, input.projectId);
    if (!milestone) throw new ProgressUpdateValidationError('Milestone is not part of the project');

    const existing = db.prepare('SELECT * FROM progress_updates WHERE event_id = ?').get(input.eventId) as UpdateRow | undefined;
    if (existing) {
      if (existing.payload_hash !== hash) throw new ProgressUpdateConflictError('eventId was already used with different validated content');
      return { replayed: true as const, update: toEvent(db, existing) };
    }

    const now = new Date().toISOString();
    const updateId = randomUUID();
    const mediaId = randomUUID();
    const mediaPath = `/v1/media/${mediaId}`;
    const contentDigest = createHash('sha256').update(input.bytes).digest('hex');
    db.prepare(`
      INSERT INTO progress_updates (
        id, event_id, payload_hash, project_id, milestone_id, author_id, body, next_action,
        crew_count, crew_hours, quantity_value, quantity_unit, site_conditions, blocker,
        latitude, longitude, location_state, claimed_progress, occurred_at, server_timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      updateId, input.eventId, hash, input.projectId, input.milestoneId, author.id, input.workDescription, input.nextAction,
      input.crewCount, input.crewHours, input.quantityValue, input.quantityUnit, input.siteConditions, input.blocker,
      input.latitude, input.longitude, input.locationState, input.claimedProgress, input.occurredAt, now, now,
    );
    db.prepare(`
      INSERT INTO update_media (id, progress_update_id, media_url, media_type, size_bytes, is_demo_visual, content_sha256, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mediaId, updateId, mediaPath, input.mimeType, input.bytes.length, 0, contentDigest, input.bytes);

    db.prepare('UPDATE milestones SET progress = ? WHERE id = ?').run(input.claimedProgress, input.milestoneId);
    const progressRow = db.prepare(`
      SELECT COALESCE(SUM(weight * progress) / NULLIF(SUM(weight), 0), 0) AS progress
      FROM milestones WHERE project_id = ?
    `).get(input.projectId) as { progress: number };
    db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(progressRow.progress, input.projectId);

    const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(input.projectId) as { name: string } | undefined;
    if (!project) throw new ProgressUpdateValidationError('Project does not exist');

    const recipients = db.prepare(`
      SELECT users.id, users.role
      FROM project_memberships
      JOIN users ON users.id = project_memberships.user_id
      WHERE project_memberships.project_id = ? AND users.role IN ('customer', 'management')
      ORDER BY CASE users.role WHEN 'customer' THEN 0 WHEN 'management' THEN 1 END, users.id
    `).all(input.projectId) as Array<{ id: string; role: 'customer' | 'management' }>;
    if (recipients.length === 0) throw new ProgressUpdateValidationError('Project has no customer or management recipients');

    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, project_id, progress_update_id, body, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const notifications = recipients.map((recipient) => {
      const notification: PersistedNotification = {
        id: randomUUID(), userId: recipient.id, projectId: input.projectId, progressUpdateId: updateId,
        body: `New progress update for project ${project.name}`, createdAt: now,
      };
      insertNotification.run(notification.id, notification.userId, notification.projectId, notification.progressUpdateId, notification.body, notification.createdAt);
      return notification;
    });

    const created = db.prepare('SELECT * FROM progress_updates WHERE id = ?').get(updateId) as UpdateRow;
    return { replayed: false, update: toEvent(db, created), projectProgress: progressRow.progress, notifications };
  })();
}
