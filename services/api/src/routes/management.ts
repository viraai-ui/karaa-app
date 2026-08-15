import { randomUUID } from 'node:crypto';

import {
  issueResponseSchema,
  managementSummaryResponseSchema,
  projectIssueSchema,
  type ProjectIssue,
} from '@karaa/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase } from '../db.js';

const issueInputSchema = z.object({
  description: z.string().trim().min(1).max(2_000),
  assigneeId: z.string().uuid(),
  dueAt: z.string().datetime(),
  rootCause: z.string().trim().min(1).max(2_000),
}).strict();
const resolveInputSchema = z.object({ status: z.literal('resolved') }).strict();

interface IssueRow {
  id: string;
  project_id: string;
  description: string;
  assignee_id: string;
  assignee_name: string;
  due_at: string;
  root_cause: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

function hasProjectMembership(db: KaraaDatabase, projectId: string, userId: string): boolean {
  return Boolean(db.prepare(
    'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
  ).get(projectId, userId));
}

function toIssue(row: IssueRow): ProjectIssue {
  return projectIssueSchema.parse({
    id: row.id,
    projectId: row.project_id,
    description: row.description,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    dueAt: row.due_at,
    rootCause: row.root_cause,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  });
}

function readIssue(db: KaraaDatabase, issueId: string): IssueRow | undefined {
  return db.prepare(`
    SELECT project_issues.id, project_issues.project_id, project_issues.description,
      project_issues.assignee_id, users.display_name AS assignee_name, project_issues.due_at,
      project_issues.root_cause, project_issues.status, project_issues.created_at, project_issues.resolved_at
    FROM project_issues JOIN users ON users.id = project_issues.assignee_id
    WHERE project_issues.id = ?
  `).get(issueId) as IssueRow | undefined;
}

export function registerManagementRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService): void {
  app.get('/v1/management/summary', { preHandler: auth.requireRole('management') }, (request) => {
    const projects = db.prepare(`
      SELECT projects.id, projects.name, projects.progress, projects.showcase, vertical_nodes.name AS vertical_name,
        (SELECT MAX(progress_updates.server_timestamp) FROM progress_updates WHERE progress_updates.project_id = projects.id) AS latest_update_at,
        (SELECT COUNT(*) FROM project_issues WHERE project_issues.project_id = projects.id AND project_issues.status = 'open') AS open_issue_count
      FROM projects
      JOIN vertical_nodes ON vertical_nodes.id = projects.vertical_node_id
      JOIN project_memberships ON project_memberships.project_id = projects.id
      WHERE project_memberships.user_id = ?
      ORDER BY open_issue_count DESC, latest_update_at ASC, projects.name ASC
    `).all(request.karaaUser!.id) as Array<{
      id: string; name: string; vertical_name: string; progress: number; showcase: number; latest_update_at: string | null; open_issue_count: number;
    }>;
    const assignees = db.prepare(`
      SELECT users.id, users.display_name FROM users
      JOIN project_memberships ON project_memberships.user_id = users.id
      WHERE project_memberships.project_id = ? AND users.role = 'employee'
      ORDER BY users.display_name ASC, users.id ASC
    `);
    const issues = db.prepare(`
      SELECT project_issues.id, project_issues.project_id, project_issues.description,
        project_issues.assignee_id, users.display_name AS assignee_name, project_issues.due_at,
        project_issues.root_cause, project_issues.status, project_issues.created_at, project_issues.resolved_at
      FROM project_issues JOIN users ON users.id = project_issues.assignee_id
      WHERE project_issues.project_id = ? ORDER BY project_issues.status ASC, project_issues.due_at ASC
    `);

    return managementSummaryResponseSchema.parse({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        verticalName: project.vertical_name,
        progress: project.progress,
        showcase: Boolean(project.showcase),
        latestUpdateAt: project.latest_update_at,
        openIssueCount: project.open_issue_count,
        priority: project.open_issue_count > 0 ? 'attention' : project.latest_update_at === null ? 'stale' : 'healthy',
        assignees: (assignees.all(project.id) as Array<{ id: string; display_name: string }>).map((assignee) => ({
          id: assignee.id,
          displayName: assignee.display_name,
        })),
        issues: (issues.all(project.id) as IssueRow[]).map(toIssue),
      })),
    });
  });

  app.post('/v1/projects/:projectId/issues', { preHandler: auth.requireRole('management') }, (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const parsed = issueInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'ISSUE_INVALID' });
    if (!hasProjectMembership(db, projectId, request.karaaUser!.id)) {
      return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });
    }
    const assignee = db.prepare(`
      SELECT users.id FROM users JOIN project_memberships ON project_memberships.user_id = users.id
      WHERE users.id = ? AND users.role = 'employee' AND project_memberships.project_id = ?
    `).get(parsed.data.assigneeId, projectId) as { id: string } | undefined;
    if (!assignee) return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });

    const issueId = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO project_issues (id, project_id, description, assignee_id, due_at, root_cause, status, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, 'open', ?, NULL)
    `).run(issueId, projectId, parsed.data.description, assignee.id, parsed.data.dueAt, parsed.data.rootCause, createdAt);
    return reply.code(201).send(issueResponseSchema.parse({ issue: toIssue(readIssue(db, issueId)!) }));
  });

  app.patch('/v1/issues/:issueId', { preHandler: auth.requireRole('management') }, (request, reply) => {
    const { issueId } = request.params as { issueId: string };
    const parsed = resolveInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'ISSUE_INVALID' });
    const issue = readIssue(db, issueId);
    if (!issue || !hasProjectMembership(db, issue.project_id, request.karaaUser!.id)) {
      return reply.code(403).send({ error: 'ISSUE_ACCESS_DENIED' });
    }
    if (issue.status === 'open') {
      db.prepare("UPDATE project_issues SET status = 'resolved', resolved_at = ? WHERE id = ?").run(new Date().toISOString(), issueId);
    }
    return issueResponseSchema.parse({ issue: toIssue(readIssue(db, issueId)!) });
  });
}
