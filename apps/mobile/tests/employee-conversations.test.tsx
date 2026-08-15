import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { fetchEmployeeProjectConversation, sendEmployeeProjectMessage } from '../src/features/employee/employee-api';
import { EmployeeWorkScreen } from '../src/features/employee/EmployeeWorkScreen';
import type { Session } from '../src/lib/session';

const session: Session = {
  token: 'server-issued-token',
  expiresAt: '2033-05-18T03:33:20.000Z',
  user: { id: '30000002-0000-4000-8000-000000000002', role: 'employee' },
};

const projectDetail = {
  project: {
    id: '20000001-0000-4000-8000-000000000001',
    name: 'Amaravati Solar Commons',
    verticalName: 'Renewable Infrastructure',
  },
  milestones: [],
  updates: [],
};

const conversation = {
  id: '90000001-0000-4000-8000-000000000001',
  projectId: projectDetail.project.id,
  kind: 'direct' as const,
  createdAt: '2026-08-11T09:00:00.000Z',
  messages: [{
    id: '91000001-0000-4000-8000-000000000001',
    conversationId: '90000001-0000-4000-8000-000000000001',
    senderId: '30000003-0000-4000-8000-000000000003',
    body: 'Verify the inverter row before commissioning.',
    createdAt: '2026-08-11T09:05:00.000Z',
  }],
};

describe('employee project conversations', () => {
  it('loads only the assigned project conversation and sends a persisted reply through the Employee workflow', async () => {
    const loadConversation = jest.fn(async () => conversation);
    const sendMessage = jest.fn(async () => undefined);
    const rendered = render(
      <EmployeeWorkScreen
        loadWork={async () => projectDetail}
        choosePhoto={async () => undefined}
        resolveLocation={async () => ({ state: 'unavailable' })}
        submit={async () => ({ replayed: false })}
        currentUserId={session.user.id}
        loadConversation={loadConversation}
        sendMessage={sendMessage}
      />,
    );

    expect(await rendered.findByText('Verify the inverter row before commissioning.')).toBeTruthy();
    expect(loadConversation).toHaveBeenCalledWith(projectDetail.project.id);
    fireEvent.changeText(rendered.getByLabelText('Project reply'), 'The inverter row is verified.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send project reply' }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith(conversation.id, 'The inverter row is verified.'));
    expect(rendered.getByText('Reply saved to Karaa')).toBeTruthy();
  });

  it('refetches assigned work and the canonical employee conversation after a message notification', async () => {
    let notify: ((eventName: string, payload: unknown) => void) | undefined;
    const refreshedConversation = {
      ...conversation,
      messages: [{ ...conversation.messages[0], body: 'Canonical management reply.' }],
    };
    const loadWork = jest.fn().mockResolvedValue(projectDetail);
    const loadConversation = jest.fn()
      .mockResolvedValueOnce(conversation)
      .mockResolvedValueOnce(refreshedConversation);
    const rendered = render(
      <EmployeeWorkScreen
        choosePhoto={async () => undefined}
        currentUserId={session.user.id}
        loadConversation={loadConversation}
        loadRealtimeSession={async () => session}
        loadWork={loadWork}
        resolveLocation={async () => ({ state: 'unavailable' })}
        sendMessage={async () => undefined}
        submit={async () => ({ replayed: false })}
        subscribeRealtime={({ onEvent }) => {
          notify = onEvent;
          return () => undefined;
        }}
      />,
    );

    expect(await rendered.findByText('Verify the inverter row before commissioning.')).toBeTruthy();
    await waitFor(() => expect(notify).toBeDefined());
    await act(async () => {
      notify?.('message.created', { body: 'Untrusted socket payload' });
    });

    expect(await rendered.findByText('Canonical management reply.')).toBeTruthy();
    expect(rendered.queryByText('Untrusted socket payload')).toBeNull();
    expect(loadWork).toHaveBeenCalledTimes(2);
    expect(loadConversation).toHaveBeenCalledTimes(2);
  });

  it('uses authenticated persisted-conversation endpoints and never creates a conversation for an Employee', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      if (String(input).endsWith('/conversations')) {
        return new Response(JSON.stringify({ conversations: [conversation] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({ message: { ...conversation.messages[0], id: '91000001-0000-4000-8000-000000000002', body: 'The inverter row is verified.' } }), { status: 201, headers: { 'content-type': 'application/json' } });
    };

    await expect(fetchEmployeeProjectConversation(session, projectDetail.project.id, { fetcher, baseUrl: 'http://karaa.test' })).resolves.toEqual(conversation);
    await expect(sendEmployeeProjectMessage(session, conversation.id, 'The inverter row is verified.', { fetcher, baseUrl: 'http://karaa.test' })).resolves.toEqual(expect.objectContaining({ body: 'The inverter row is verified.' }));

    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      url: `http://karaa.test/v1/projects/${projectDetail.project.id}/conversations`,
      init: { headers: { authorization: 'Bearer server-issued-token' } },
    });
    expect(requests[1]).toMatchObject({
      url: `http://karaa.test/v1/conversations/${conversation.id}/messages`,
      init: {
        method: 'POST',
        headers: { authorization: 'Bearer server-issued-token', 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'The inverter row is verified.' }),
      },
    });
    expect(requests.map(({ url }) => url)).not.toContain(`http://karaa.test/v1/projects/${projectDetail.project.id}/conversations/direct`);
  });

  it('rejects an unauthorized role before making a conversation request', async () => {
    const fetcher: typeof fetch = jest.fn();
    await expect(fetchEmployeeProjectConversation({ ...session, user: { ...session.user, role: 'management' } }, projectDetail.project.id, { fetcher, baseUrl: 'http://karaa.test' }))
      .rejects.toThrow('You do not have access to field records.');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
