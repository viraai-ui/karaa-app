import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Conversation, CurrentLocation, ManagementProject, ProjectIssue } from '@karaa/contracts';

import { ManagementWorkspace } from '../src/features/management/ManagementWorkspace';
import {
  createManagementIssue,
  fetchManagementSummary,
  resolveManagementIssue,
  sendManagementDirectMessage,
} from '../src/features/management/management-api';

const projectId = '20000001-0000-4000-8000-000000000001';
const secondaryProjectId = '20000002-0000-4000-8000-000000000002';
const employeeId = '30000002-0000-4000-8000-000000000002';
const managerId = '30000003-0000-4000-8000-000000000003';
const issueId = '70000001-0000-4000-8000-000000000001';
const conversationId = '90000001-0000-4000-8000-000000000001';

const session = {
  token: 'management-token',
  user: {
    id: managerId,
    email: 'mira.management@karaa.demo',
    role: 'management' as const,
    displayName: 'Mira Management',
  },
};

const issue: ProjectIssue = {
  id: issueId,
  projectId,
  description: 'East-array clearance needs a commissioning check.',
  assigneeId: employeeId,
  assigneeName: 'Dev Employee',
  dueAt: '2026-08-13T12:00:00.000Z',
  rootCause: 'Clearance sign-off is not attached to the field record.',
  status: 'open',
  createdAt: '2026-08-11T09:00:00.000Z',
  resolvedAt: null,
};

const attentionProject: ManagementProject = {
  id: projectId,
  name: 'Amaravati Solar Commons',
  verticalName: 'Renewable Infrastructure',
  showcase: true,
  progress: 65,
  latestUpdateAt: '2026-08-11T08:16:00.000Z',
  openIssueCount: 1,
  priority: 'attention',
  assignees: [{ id: employeeId, displayName: 'Dev Employee' }],
  issues: [issue],
};

const healthyProject: ManagementProject = {
  ...attentionProject,
  id: secondaryProjectId,
  name: 'Kondapalli Logistics Yard',
  priority: 'healthy',
  openIssueCount: 0,
  issues: [],
};

function summary(projects: ManagementProject[] = [healthyProject, attentionProject]) {
  return { projects };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('ManagementWorkspace', () => {
  it('uses the canonical summary to select attention first, lets management select another authorized project, and labels stored field location provenance', async () => {
    const loadLocations = vi.fn(async (requestedProjectId: string): Promise<CurrentLocation[]> => requestedProjectId === projectId ? [{
      userId: employeeId,
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-11T18:43:16.990Z',
    }] : []);

    render(<ManagementWorkspace session={session} onSignOut={vi.fn()} api={{
      loadSummary: async () => summary(),
      loadLocations,
    }} />);

    expect(await screen.findByRole('heading', { name: 'Amaravati Solar Commons' })).toBeInTheDocument();
    expect(await screen.findByText('16.5062, 80.6480')).toBeInTheDocument();
    expect(screen.getByText('Presentation simulator — not a real location')).toBeInTheDocument();
    expect(screen.getByText(/server-recorded field location/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Selected project'), { target: { value: secondaryProjectId } });

    expect(await screen.findByRole('heading', { name: 'Kondapalli Logistics Yard' })).toBeInTheDocument();
    expect(screen.getByText(/no authorized employee has shared a current field location/i)).toBeInTheDocument();
    expect(loadLocations).toHaveBeenLastCalledWith(secondaryProjectId);
  });

  it('selects an assigned attention project before an unassigned attention project so the opening audience walkthrough remains actionable', async () => {
    const unassignedAttention: ManagementProject = {
      ...attentionProject,
      id: '20000003-0000-4000-8000-000000000003',
      name: 'Delta Harvest Exchange',
      assignees: [],
    };

    render(<ManagementWorkspace session={session} onSignOut={vi.fn()} api={{
      loadSummary: async () => summary([unassignedAttention, attentionProject, healthyProject]),
      loadLocations: async () => [],
    }} />);

    expect(await screen.findByRole('heading', { name: 'Amaravati Solar Commons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open direct thread with Dev Employee' })).toBeInTheDocument();
  });

  it('keeps issue input unsaved on failure, only refreshes canonical summary after persisted create or resolve, and excludes UI projectId from the API input', async () => {
    const createIssue = vi.fn()
      .mockRejectedValueOnce(new Error('Connection unavailable — try again.'))
      .mockResolvedValueOnce({ ...issue, id: '70000002-0000-4000-8000-000000000002' });
    const resolveIssue = vi.fn().mockResolvedValue({ ...issue, status: 'resolved' as const, resolvedAt: '2026-08-12T10:00:00.000Z' });
    const loadSummary = vi.fn().mockResolvedValue(summary());

    render(<ManagementWorkspace session={session} onSignOut={vi.fn()} api={{ loadSummary, createIssue, resolveIssue }} />);
    await screen.findByRole('heading', { name: 'Amaravati Solar Commons' });

    fireEvent.change(screen.getByLabelText('Intervention description'), { target: { value: 'Verify permit evidence.' } });
    fireEvent.change(screen.getByLabelText('Root cause'), { target: { value: 'Permit checklist awaits review.' } });
    fireEvent.change(screen.getByLabelText('Intervention due time'), { target: { value: '2026-08-13T12:00:00.000Z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save intervention' }));

    const intervention = screen.getByRole('region', { name: 'Open accountable intervention' });
    expect(await within(intervention).findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    expect(screen.getByLabelText('Intervention description')).toHaveValue('Verify permit evidence.');
    expect(screen.queryByText(/intervention saved/i)).not.toBeInTheDocument();
    expect(loadSummary).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save intervention' }));
    await waitFor(() => expect(loadSummary).toHaveBeenCalledTimes(2));
    expect(createIssue).toHaveBeenLastCalledWith(projectId, {
      description: 'Verify permit evidence.',
      assigneeId: employeeId,
      dueAt: '2026-08-13T12:00:00.000Z',
      rootCause: 'Permit checklist awaits review.',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resolve intervention' }));
    await waitFor(() => expect(resolveIssue).toHaveBeenCalledWith(issueId));
    await waitFor(() => expect(loadSummary).toHaveBeenCalledTimes(3));
  });

  it('opens a management-only employee thread, reloads its exact persisted conversation after send, and leaves no sent state on failure', async () => {
    const conversation: Conversation = {
      id: conversationId,
      projectId,
      kind: 'direct',
      createdAt: '2026-08-11T09:00:00.000Z',
      messages: [{
        id: '91000001-0000-4000-8000-000000000001',
        conversationId,
        senderId: employeeId,
        body: 'The clearance photo is ready for review.',
        createdAt: '2026-08-11T09:05:00.000Z',
      }],
    };
    const openDirectConversation = vi.fn().mockResolvedValue({ ...conversation, messages: [] });
    const loadConversation = vi.fn().mockResolvedValue(conversation);
    const sendMessage = vi.fn().mockRejectedValueOnce(new Error('Connection unavailable — try again.')).mockResolvedValueOnce(undefined);

    render(<ManagementWorkspace session={session} onSignOut={vi.fn()} api={{
      loadSummary: async () => summary([attentionProject]),
      openDirectConversation,
      loadConversation,
      sendMessage,
    }} />);
    await screen.findByRole('heading', { name: 'Amaravati Solar Commons' });

    fireEvent.click(screen.getByRole('button', { name: 'Open direct thread with Dev Employee' }));
    expect(await screen.findByText('The clearance photo is ready for review.')).toBeInTheDocument();
    expect(openDirectConversation).toHaveBeenCalledWith(projectId, employeeId);
    expect(loadConversation).toHaveBeenCalledWith(projectId, conversationId);

    fireEvent.change(screen.getByLabelText('Direct reply'), { target: { value: 'Please attach it to today’s field record.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send direct reply' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    expect(screen.getByLabelText('Direct reply')).toHaveValue('Please attach it to today’s field record.');

    fireEvent.click(screen.getByRole('button', { name: 'Send direct reply' }));
    await waitFor(() => expect(sendMessage).toHaveBeenLastCalledWith(conversationId, 'Please attach it to today’s field record.'));
    await waitFor(() => expect(loadConversation).toHaveBeenCalledTimes(2));
  });

  it('shows loading, empty, error and retry states instead of decorative management data', async () => {
    const loadSummary = vi.fn().mockRejectedValueOnce(new Error('Connection unavailable — try again.')).mockResolvedValueOnce(summary([]));
    render(<ManagementWorkspace session={session} onSignOut={vi.fn()} api={{ loadSummary }} />);

    expect(screen.getByText(/loading authorized management record/i)).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry command centre' }));
    expect(await screen.findByText(/no authorized projects/i)).toBeInTheDocument();
  });
});

describe('management browser API contracts', () => {
  it('uses the Fastify management issue endpoints with strict bodies and validates canonical response contracts', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(jsonResponse(summary([attentionProject])))
      .mockResolvedValueOnce(jsonResponse({ issue }, 201))
      .mockResolvedValueOnce(jsonResponse({ issue: { ...issue, status: 'resolved', resolvedAt: '2026-08-12T10:00:00.000Z' } }));

    await expect(fetchManagementSummary(session, fetcher)).resolves.toEqual(summary([attentionProject]));
    await createManagementIssue(session, projectId, {
      projectId,
      description: issue.description,
      assigneeId: employeeId,
      dueAt: issue.dueAt,
      rootCause: issue.rootCause,
    }, fetcher);
    await resolveManagementIssue(session, issueId, fetcher);

    expect(fetcher).toHaveBeenNthCalledWith(1, '/v1/management/summary', expect.objectContaining({
      method: 'GET', headers: { authorization: 'Bearer management-token' },
    }));
    expect(fetcher).toHaveBeenNthCalledWith(2, `/v1/projects/${projectId}/issues`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ description: issue.description, assigneeId: employeeId, dueAt: issue.dueAt, rootCause: issue.rootCause }),
    }));
    expect(fetcher).toHaveBeenNthCalledWith(3, `/v1/issues/${issueId}`, expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ status: 'resolved' }),
    }));
  });

  it('sends only a strict message body to the persisted conversation endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ message: {
      id: '92000001-0000-4000-8000-000000000001',
      conversationId,
      senderId: managerId,
      body: 'Please attach it to today’s field record.',
      createdAt: '2026-08-11T09:06:00.000Z',
    } }, 201));

    await sendManagementDirectMessage(session, conversationId, 'Please attach it to today’s field record.', fetcher);
    expect(fetcher).toHaveBeenCalledWith(`/v1/conversations/${conversationId}/messages`, expect.objectContaining({
      method: 'POST', body: JSON.stringify({ body: 'Please attach it to today’s field record.' }),
    }));
  });
});
