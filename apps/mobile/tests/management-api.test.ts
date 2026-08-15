import {
  createManagementIssue,
  fetchManagementDirectConversation,
  fetchManagementProjectLocations,
  openManagementDirectConversation,
  sendManagementDirectMessage,
} from '../src/features/management/management-api';
import type { Session } from '../src/lib/session';

const session: Session = {
  token: 'management-token',
  expiresAt: '2026-08-12T09:00:00.000Z',
  user: {
    id: '30000003-0000-4000-8000-000000000003',
    email: 'mira.management@karaa.demo',
    displayName: 'Mira Management',
    role: 'management',
  },
};

const projectId = '20000001-0000-4000-8000-000000000001';
const employeeId = '30000002-0000-4000-8000-000000000002';
const conversationId = '90000001-0000-4000-8000-000000000001';
const conversation = {
  id: conversationId,
  projectId,
  kind: 'direct' as const,
  createdAt: '2026-08-11T09:00:00.000Z',
  messages: [{
    id: '91000001-0000-4000-8000-000000000001',
    conversationId,
    senderId: employeeId,
    body: 'The inverter clearance photo is ready for review.',
    createdAt: '2026-08-11T09:05:00.000Z',
  }],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('management conversation API', () => {
  it('opens the selected employee direct thread, reads only its authorized id, and sends into that persisted thread', async () => {
    const fetcher = jest.fn()
      .mockResolvedValueOnce(jsonResponse({ conversation: { ...conversation, messages: [] } }, 201))
      .mockResolvedValueOnce(jsonResponse({ conversations: [conversation] }))
      .mockResolvedValueOnce(jsonResponse({ message: {
        id: '92000001-0000-4000-8000-000000000001',
        conversationId,
        senderId: session.user.id,
        body: 'Please attach it to today’s field record.',
        createdAt: '2026-08-11T09:06:00.000Z',
      } }, 201));

    const opened = await openManagementDirectConversation(session, projectId, employeeId, fetcher, 'https://api.karaa.test');
    const loaded = await fetchManagementDirectConversation(session, projectId, opened.id, fetcher, 'https://api.karaa.test');
    await sendManagementDirectMessage(session, opened.id, 'Please attach it to today’s field record.', fetcher, 'https://api.karaa.test');

    expect(loaded).toEqual(conversation);
    expect(fetcher).toHaveBeenNthCalledWith(1,
      `https://api.karaa.test/v1/projects/${projectId}/conversations/direct`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer management-token', 'content-type': 'application/json' }),
        body: JSON.stringify({ employeeId }),
      }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(2,
      `https://api.karaa.test/v1/projects/${projectId}/conversations`,
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ authorization: 'Bearer management-token' }) }),
    );
    expect(fetcher).toHaveBeenNthCalledWith(3,
      `https://api.karaa.test/v1/conversations/${conversationId}/messages`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer management-token', 'content-type': 'application/json' }),
        body: JSON.stringify({ body: 'Please attach it to today’s field record.' }),
      }),
    );
  });

  it('loads management-authorized field locations with explicit stored provenance', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ locations: [{
      userId: employeeId,
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-11T18:43:16.990Z',
    }] }));

    await expect(fetchManagementProjectLocations(session, projectId, fetcher, 'https://api.karaa.test')).resolves.toEqual([{
      userId: employeeId,
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-11T18:43:16.990Z',
    }]);
    expect(fetcher).toHaveBeenCalledWith(
      `https://api.karaa.test/v1/projects/${projectId}/locations`,
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ authorization: 'Bearer management-token' }) }),
    );
  });

  it('strips the UI-only project id before posting a strict intervention payload', async () => {
    const issue = {
      id: '70000001-0000-4000-8000-000000000001',
      projectId,
      description: 'Verify south-array permit evidence.',
      assigneeId: employeeId,
      assigneeName: 'Dev Employee',
      dueAt: '2026-08-13T12:00:00.000Z',
      rootCause: 'Permit checklist awaits review.',
      status: 'open',
      createdAt: '2026-08-11T20:31:19.413Z',
      resolvedAt: null,
    };
    const composerInput = {
      projectId,
      description: issue.description,
      assigneeId: employeeId,
      dueAt: issue.dueAt,
      rootCause: issue.rootCause,
    };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ issue }, 201));

    await expect(createManagementIssue(session, projectId, composerInput, fetcher, 'https://api.karaa.test')).resolves.toEqual(issue);
    expect(fetcher).toHaveBeenCalledWith(
      `https://api.karaa.test/v1/projects/${projectId}/issues`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer management-token', 'content-type': 'application/json' }),
        body: JSON.stringify({
          description: issue.description,
          assigneeId: employeeId,
          dueAt: issue.dueAt,
          rootCause: issue.rootCause,
        }),
      }),
    );
  });
});
