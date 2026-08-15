import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ProjectConversation } from '../src/features/conversations/ProjectConversation';
import { colors } from '../src/theme/tokens';

const conversation = {
  id: '90000001-0000-4000-8000-000000000001',
  projectId: '20000001-0000-4000-8000-000000000001',
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

describe('ProjectConversation', () => {
  it('shows persisted project context and only confirms a reply after the API persists it', async () => {
    let resolveSend: (() => void) | undefined;
    const sendMessage = jest.fn(() => new Promise<void>((resolve) => { resolveSend = resolve; }));
    const loadConversation = jest.fn().mockResolvedValue(conversation);
    const rendered = render(
      <ProjectConversation
        currentUserId="30000002-0000-4000-8000-000000000002"
        loadConversation={loadConversation}
        sendMessage={sendMessage}
        title="Management reply"
      />,
    );

    expect(await rendered.findByText('Verify the inverter row before commissioning.')).toBeTruthy();
    fireEvent.changeText(rendered.getByLabelText('Project reply'), 'Clearance is verified and attached to today’s field record.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send project reply' }));

    expect(await rendered.findByText('Saving reply…')).toBeTruthy();
    expect(rendered.queryByText('Reply saved to Karaa')).toBeNull();
    expect(sendMessage).toHaveBeenCalledWith(
      '90000001-0000-4000-8000-000000000001',
      'Clearance is verified and attached to today’s field record.',
    );

    resolveSend?.();
    await waitFor(() => expect(rendered.getByText('Reply saved to Karaa')).toBeTruthy());
  });

  it('renders sender-aware high-contrast text for both received and own replies', async () => {
    const ownReply = 'The evidence is uploaded and ready for review.';
    const rendered = render(
      <ProjectConversation
        currentUserId="30000002-0000-4000-8000-000000000002"
        loadConversation={async () => ({
          ...conversation,
          messages: [
            ...conversation.messages,
            { ...conversation.messages[0], id: '91000002-0000-4000-8000-000000000002', senderId: '30000002-0000-4000-8000-000000000002', body: ownReply },
          ],
        })}
        sendMessage={async () => undefined}
        title="Management reply"
      />,
    );

    const receivedStyle = StyleSheet.flatten((await rendered.findByText('Verify the inverter row before commissioning.')).props.style);
    const ownStyle = StyleSheet.flatten(rendered.getByText(ownReply).props.style);

    expect(receivedStyle.color).toBe(colors.ink);
    expect(ownStyle.color).toBe(colors.paper);
  });

  it('refetches the canonical conversation after an authorized message notification instead of trusting event content', async () => {
    let notify: ((eventName: string, payload: unknown) => void) | undefined;
    const refreshedConversation = {
      ...conversation,
      messages: [{ ...conversation.messages[0], body: 'Canonical reply from Karaa.' }],
    };
    const loadConversation = jest.fn()
      .mockResolvedValueOnce(conversation)
      .mockResolvedValueOnce(refreshedConversation);
    const rendered = render(
      <ProjectConversation
        currentUserId="30000002-0000-4000-8000-000000000002"
        loadConversation={loadConversation}
        loadRealtimeSession={async () => ({ token: 'server-issued-token', user: { role: 'employee' } })}
        sendMessage={async () => undefined}
        subscribeRealtime={({ onEvent }) => {
          notify = onEvent;
          return () => undefined;
        }}
        title="Field replies"
      />,
    );

    expect(await rendered.findByText('Verify the inverter row before commissioning.')).toBeTruthy();
    await waitFor(() => expect(notify).toBeDefined());
    await act(async () => {
      notify?.('message.created', { body: 'Untrusted socket payload' });
    });

    expect(await rendered.findByText('Canonical reply from Karaa.')).toBeTruthy();
    expect(rendered.queryByText('Untrusted socket payload')).toBeNull();
    expect(loadConversation).toHaveBeenCalledTimes(2);
  });

  it('does not pretend a connection failure or rejected reply was saved', async () => {
    const rendered = render(
      <ProjectConversation
        currentUserId="30000002-0000-4000-8000-000000000002"
        loadConversation={async () => conversation}
        sendMessage={async () => { throw new Error('Connection unavailable — try again.'); }}
        title="Management reply"
      />,
    );

    await rendered.findByText('Verify the inverter row before commissioning.');
    fireEvent.changeText(rendered.getByLabelText('Project reply'), 'I am checking this now.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send project reply' }));

    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
    expect(rendered.queryByText('Reply saved to Karaa')).toBeNull();
  });
});
