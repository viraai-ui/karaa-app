import { afterEach, describe, expect, it } from 'vitest';

import { buildApp, type KaraaApp } from '../src/app.js';
import { createDatabase } from '../src/db.js';

const projectId = '20000001-0000-4000-8000-000000000001';
const employeeId = '30000002-0000-4000-8000-000000000002';
const apps: KaraaApp[] = [];

function createApp(): KaraaApp {
  const app = buildApp({
    database: createDatabase(),
    jwtSecret: 'test-secret-that-is-long-enough-for-hs256',
  });
  apps.push(app);
  return app;
}

async function login(app: KaraaApp, email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email, password: 'demo-password' },
  });
  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

function authenticated(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('management project issues', () => {
  it('creates and resolves a project-linked accountable issue that appears in the management summary', async () => {
    const app = createApp();
    const managementToken = await login(app, 'mira.management@karaa.demo');

    const created = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/issues`,
      headers: authenticated(managementToken),
      payload: {
        description: 'East-array clearance needs a commissioning check.',
        assigneeId: employeeId,
        dueAt: '2026-08-13T12:00:00.000Z',
        rootCause: 'Clearance sign-off is not attached to the field record.',
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({
      issue: {
        projectId,
        assigneeId: employeeId,
        status: 'open',
        description: 'East-array clearance needs a commissioning check.',
      },
    });
    const issueId = created.json().issue.id as string;

    const summary = await app.inject({
      method: 'GET',
      url: '/v1/management/summary',
      headers: authenticated(managementToken),
    });
    expect(summary.statusCode).toBe(200);
    expect((summary.json().projects as Array<{ id: string; openIssueCount: number; priority: string }>).find((project) => project.id === projectId)).toMatchObject({
      id: projectId,
      openIssueCount: 1,
      priority: 'attention',
      assignees: [expect.objectContaining({ id: employeeId, displayName: 'Dev Employee' })],
    });

    const resolved = await app.inject({
      method: 'PATCH',
      url: `/v1/issues/${issueId}`,
      headers: authenticated(managementToken),
      payload: { status: 'resolved' },
    });
    expect(resolved.statusCode).toBe(200);
    expect(resolved.json()).toMatchObject({ issue: { id: issueId, status: 'resolved' } });
  });

  it('rejects an employee attempting to create a management issue', async () => {
    const app = createApp();
    const employeeToken = await login(app, 'dev.employee@karaa.demo');

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/issues`,
      headers: authenticated(employeeToken),
      payload: {
        description: 'Must not write.',
        assigneeId: employeeId,
        dueAt: '2026-08-13T12:00:00.000Z',
        rootCause: 'Role test.',
      },
    });
    expect(response.statusCode).toBe(403);
  });
});
