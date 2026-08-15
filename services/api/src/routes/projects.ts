import {
  progressUpdateCreatedEvent,
  projectDetailResponseSchema,
  projectsResponseSchema,
  type Notification,
  type PaymentDemoRecord,
  type ProgressUpdateCreatedEvent,
  type ProjectDocument,
  type ProjectSummary,
} from '@karaa/contracts';
import type { FastifyInstance } from 'fastify';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase, Role } from '../db.js';

const allRoles: Role[] = ['customer', 'employee', 'management'];

interface ProjectRow {
  id: string;
  name: string;
  showcase: number;
  vertical_name: string;
  progress: number;
}

interface MilestoneRow {
  id: string;
  project_id: string;
  name: string;
  due_at: string | null;
  weight: number;
  progress: number;
}

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
  location_state: string;
  claimed_progress: number;
  occurred_at: string;
  server_timestamp: string;
}

interface MediaRow {
  id: string;
  media_url: string;
  media_type: string;
  size_bytes: number;
  is_demo_visual: number;
}

interface NotificationRow {
  id: string;
  project_id: string;
  progress_update_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ProjectDocumentRow {
  id: string;
  project_id: string;
  title: string;
  issuing_authority: string;
  reference: string;
  issued_at: string;
  disclaimer: 'Demo data — verify with issuing authority';
}

interface PaymentDemoRecordRow {
  id: string;
  project_id: string;
  reference: string;
  description: string;
  amount_minor: number;
  currency: 'INR';
  recorded_at: string;
  disclaimer: 'Demo data — verify with issuing authority';
}

function toProjectSummary(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    verticalName: row.vertical_name,
    showcase: Boolean(row.showcase),
    progress: row.progress,
  };
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    projectId: row.project_id,
    progressUpdateId: row.progress_update_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function readProjectUpdates(db: KaraaDatabase, projectId: string): ProgressUpdateCreatedEvent[] {
  const updates = db.prepare(`
    SELECT id, event_id, project_id, milestone_id, author_id, body, next_action,
      crew_count, crew_hours, quantity_value, quantity_unit, site_conditions, blocker, latitude, longitude,
      claimed_progress, occurred_at, server_timestamp, location_state
    FROM progress_updates
    WHERE project_id = ?
    ORDER BY server_timestamp DESC, id DESC
  `).all(projectId) as UpdateRow[];
  const selectMedia = db.prepare(`
    SELECT id, media_url, media_type, size_bytes, is_demo_visual
    FROM update_media
    WHERE progress_update_id = ?
    ORDER BY id
  `);

  return updates.map((update) => progressUpdateCreatedEvent.parse({
    id: update.id,
    eventId: update.event_id,
    projectId: update.project_id,
    milestoneId: update.milestone_id,
    authorId: update.author_id,
    occurredAt: update.occurred_at,
    serverTimestamp: update.server_timestamp,
    latitude: update.latitude,
    longitude: update.longitude,
    locationState: update.location_state,
    claimedProgress: update.claimed_progress,
    workDescription: update.body,
    nextAction: update.next_action,
    crewCount: update.crew_count,
    crewHours: update.crew_hours,
    quantityValue: update.quantity_value,
    quantityUnit: update.quantity_unit,
    siteConditions: update.site_conditions,
    blocker: update.blocker,
    media: (selectMedia.all(update.id) as MediaRow[]).map((media) => ({
      id: media.id,
      mediaPath: media.media_url,
      mimeType: media.media_type,
      sizeBytes: media.size_bytes,
      isDemoVisual: Boolean(media.is_demo_visual),
    })),
  }));
}

function readNotifications(db: KaraaDatabase, userId: string, projectId?: string): Notification[] {
  const rows = projectId
    ? db.prepare(`
        SELECT id, project_id, progress_update_id, body, created_at, read_at
        FROM notifications
        WHERE user_id = ? AND project_id = ?
        ORDER BY created_at DESC, id DESC
      `).all(userId, projectId) as NotificationRow[]
    : db.prepare(`
        SELECT id, project_id, progress_update_id, body, created_at, read_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `).all(userId) as NotificationRow[];

  return rows.map(toNotification);
}

function readProjectDocuments(db: KaraaDatabase, projectId: string): ProjectDocument[] {
  const rows = db.prepare(`
    SELECT id, project_id, title, issuing_authority, reference, issued_at, disclaimer
    FROM project_documents
    WHERE project_id = ?
    ORDER BY issued_at DESC, id DESC
  `).all(projectId) as ProjectDocumentRow[];
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    issuingAuthority: row.issuing_authority,
    reference: row.reference,
    issuedAt: row.issued_at,
    disclaimer: row.disclaimer,
  }));
}

function readPaymentDemoRecords(db: KaraaDatabase, projectId: string): PaymentDemoRecord[] {
  const rows = db.prepare(`
    SELECT id, project_id, reference, description, amount_minor, currency, recorded_at, disclaimer
    FROM payment_demo_records
    WHERE project_id = ?
    ORDER BY recorded_at DESC, id DESC
  `).all(projectId) as PaymentDemoRecordRow[];
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    reference: row.reference,
    description: row.description,
    amountMinor: row.amount_minor,
    currency: row.currency,
    recordedAt: row.recorded_at,
    disclaimer: row.disclaimer,
  }));
}

export function registerProjectRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService): void {
  app.get('/v1/projects', { preHandler: auth.requireRole(...allRoles) }, (request) => {
    const projects = db.prepare(`
      SELECT projects.id, projects.name, projects.showcase, projects.progress, vertical_nodes.name AS vertical_name
      FROM projects
      JOIN vertical_nodes ON vertical_nodes.id = projects.vertical_node_id
      JOIN project_memberships ON project_memberships.project_id = projects.id
      WHERE project_memberships.user_id = ?
      ORDER BY projects.id
    `).all(request.karaaUser!.id) as ProjectRow[];

    return projectsResponseSchema.parse({ projects: projects.map(toProjectSummary) });
  });

  app.get('/v1/projects/:projectId', { preHandler: auth.requireRole(...allRoles) }, (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const membership = db.prepare(
      'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
    ).get(projectId, request.karaaUser!.id);
    if (!membership) return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });

    const project = db.prepare(`
      SELECT projects.id, projects.name, projects.showcase, projects.progress, vertical_nodes.name AS vertical_name
      FROM projects
      JOIN vertical_nodes ON vertical_nodes.id = projects.vertical_node_id
      WHERE projects.id = ?
    `).get(projectId) as ProjectRow | undefined;
    if (!project) return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });

    const milestones = db.prepare(`
      SELECT id, project_id, name, due_at, weight, progress
      FROM milestones
      WHERE project_id = ?
      ORDER BY due_at ASC, id ASC
    `).all(projectId) as MilestoneRow[];

    return projectDetailResponseSchema.parse({
      project: toProjectSummary(project),
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        projectId: milestone.project_id,
        name: milestone.name,
        dueAt: milestone.due_at,
        weight: milestone.weight,
        progress: milestone.progress,
      })),
      updates: readProjectUpdates(db, projectId),
      notifications: readNotifications(db, request.karaaUser!.id, projectId),
      documents: readProjectDocuments(db, projectId),
      paymentDemoRecords: readPaymentDemoRecords(db, projectId),
    });
  });
}
