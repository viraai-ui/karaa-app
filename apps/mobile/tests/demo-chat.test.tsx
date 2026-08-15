import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DemoChatExperience } from '../src/demo/DemoChatExperience';
import { OfflineEmployeeViews } from '../src/demo/OfflineEmployeeViews';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  type OfflineDemoAction,
  type OfflineDemoState,
} from '../src/demo/offline-demo';

function reduce(state: OfflineDemoState, action: unknown): OfflineDemoState {
  return offlineDemoReducer(state, action as OfflineDemoAction);
}

function ChatHarness() {
  const [state, dispatch] = React.useReducer(offlineDemoReducer, createOfflineDemoState('employee'));
  React.useEffect(() => {
    dispatch({ type: 'select-tab', tab: 'chat' });
  }, []);
  return <OfflineEmployeeViews onAction={dispatch} state={state} />;
}

function ManagementChatHarness() {
  const [state, dispatch] = React.useReducer(offlineDemoReducer, {
    ...createOfflineDemoState('management'),
    selectedTab: 'chat' as const,
  });
  return <DemoChatExperience onAction={dispatch} state={state} />;
}

describe('Karaa shared chat demo', () => {
  it('seeds credible direct, project, tender, and support threads and clears only the active role unread state when opened', () => {
    const initial = createOfflineDemoState('employee');

    expect(initial.chatThreads.map((thread) => thread.id)).toEqual([
      'dev-direct',
      'amaravati-project',
      'solar-bop-tender',
      'sup-001-support',
    ]);
    const selected = reduce(initial, { type: 'select-chat-thread', threadId: 'dev-direct' });
    const read = reduce(selected, { type: 'mark-chat-thread-read', threadId: 'dev-direct' });

    expect(selected).toEqual(expect.objectContaining({ selectedTab: 'chat', selectedChatThreadId: 'dev-direct', surface: 'chat-thread' }));
    expect(read.chatThreads.find((thread) => thread.id === 'dev-direct')?.unreadByRole).toEqual(expect.objectContaining({ employee: 0 }));
    expect(read.chatThreads.find((thread) => thread.id === 'dev-direct')?.unreadByRole.management).toBeGreaterThan(0);
  });

  it('derives authorship and the recipient unread preview from activeRole rather than an action-supplied role', () => {
    let state = reduce(createOfflineDemoState('employee'), { type: 'select-chat-thread', threadId: 'dev-direct' });
    state = reduce(state, {
      type: 'send-chat-message',
      threadId: 'dev-direct',
      body: 'Cabinet checks are ready for the review note.',
      senderRole: 'management',
    });

    const thread = state.chatThreads.find((candidate) => candidate.id === 'dev-direct')!;
    expect(thread.messages.at(-1)).toEqual(expect.objectContaining({ authorRole: 'employee', body: 'Cabinet checks are ready for the review note.' }));
    expect(thread.unreadByRole.management).toBeGreaterThan(0);
    expect(thread.unreadByRole.employee).toBe(0);
  });

  it('adds one idempotent Amaravati project activity message when the employee review is accepted', () => {
    const initial = createOfflineDemoState('employee');
    const once = reduce(initial, { type: 'review-field-update' });
    const twice = reduce(once, { type: 'review-field-update' });
    const messages = twice.chatThreads.find((thread) => thread.id === 'amaravati-project')!.messages;

    expect(once.currentProgress).toBe(68);
    expect(messages.filter((message) => message.id === 'amaravati-review-recorded')).toHaveLength(1);
    expect(messages.find((message) => message.id === 'amaravati-review-recorded')).toEqual(expect.objectContaining({
      authorRole: 'employee',
      body: expect.stringContaining('68%'),
    }));
  });

  it('renders a compact five-option horizontal filter rail', () => {
    const rendered = render(<ChatHarness />);
    const rail = rendered.getByTestId('chat-filter-rail');
    const controls = rendered.getAllByRole('tab');

    expect(StyleSheet.flatten(rail.props.style).flexDirection).toBe('row');
    expect(controls).toHaveLength(5);
    expect(controls.map((control) => control.props.accessibilityLabel)).toEqual([
      'Filter All',
      'Filter Tenders',
      'Filter Projects',
      'Filter Open',
      'Filter Resolved',
    ]);
    controls.forEach((control) => {
      expect(StyleSheet.flatten(control.props.style).flex).toBe(1);
      expect(StyleSheet.flatten(control.props.style).minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  it('renders a dense accessible inbox and sends a non-blank controlled composer message into the selected conversation', () => {
    const rendered = render(<ChatHarness />);

    expect(rendered.getByText('Chat')).toBeTruthy();
    expect(rendered.getByText('Conversations for project, tender, and field coordination.')).toBeTruthy();
    (['All', 'Tenders', 'Projects', 'Open', 'Resolved'] as const).forEach((filter) => {
      const control = rendered.getByRole('tab', { name: `Filter ${filter}` });
      expect(StyleSheet.flatten(control.props.style).minHeight).toBeGreaterThanOrEqual(44);
    });
    expect(rendered.getByRole('button', { name: 'Open Mira Management conversation' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open Amaravati Solar Commons conversation' })).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Open Mira Management conversation' }));
    expect(rendered.getByLabelText('Message Mira Management')).toBeTruthy();
    fireEvent.changeText(rendered.getByLabelText('Message Mira Management'), '  Cabinet checks are ready.  ');
    fireEvent.press(rendered.getByRole('button', { name: 'Send message to Mira Management' }));

    expect(rendered.getByText('Cabinet checks are ready.')).toBeTruthy();
    expect(rendered.getByLabelText('Message Mira Management').props.value).toBe('');
    expect(rendered.getByText('Added to this conversation')).toBeTruthy();
  });

  it('keeps short thread histories anchored above the composer instead of leaving a dead lower viewport', () => {
    const rendered = render(<ChatHarness />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Mira Management conversation' }));

    const messageList = rendered.getByTestId('chat-thread-messages');
    const contentStyle = StyleSheet.flatten(messageList.props.contentContainerStyle);
    expect(contentStyle.flexGrow).toBe(1);
    expect(contentStyle.justifyContent).toBe('flex-end');
  });

  it('keeps whitespace-only composer input from adding a message', () => {
    const rendered = render(<ChatHarness />);
    fireEvent.press(rendered.getByRole('button', { name: 'Open Mira Management conversation' }));
    fireEvent.changeText(rendered.getByLabelText('Message Mira Management'), '   ');
    fireEvent.press(rendered.getByRole('button', { name: 'Send message to Mira Management' }));

    expect(rendered.queryByText('Added to this conversation')).toBeNull();
  });

  it('presents the direct counterpart instead of Management messaging itself after the Geo handoff', () => {
    let state: OfflineDemoState = { ...createOfflineDemoState('management'), selectedTab: 'map' as const };
    state = reduce(state, { type: 'select-map-project', projectId: 'amaravati-solar-commons' });
    state = reduce(state, { type: 'select-map-employee', employeeId: 'dev-employee' });
    state = reduce(state, { type: 'message-map-employee', employeeId: 'dev-employee' });

    const rendered = render(<DemoChatExperience onAction={jest.fn()} state={state} />);

    expect(rendered.getByText('Dev Employee')).toBeTruthy();
    expect(rendered.getByLabelText('Message Dev Employee')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Send message to Dev Employee' })).toBeTruthy();
    expect(rendered.queryByLabelText('Message Mira Management')).toBeNull();
  });

  it('shows an accessible New query action only in the Management Chat inbox', () => {
    const managementState = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const management = render(<DemoChatExperience onAction={jest.fn()} state={managementState} />);
    const create = management.getByRole('button', { name: 'New query' });

    expect(StyleSheet.flatten(create.props.style).minHeight).toBeGreaterThanOrEqual(44);

    const employeeState = { ...createOfflineDemoState('employee'), selectedTab: 'chat' as const };
    const employee = render(<DemoChatExperience onAction={jest.fn()} state={employeeState} />);
    expect(employee.queryByRole('button', { name: 'New query' })).toBeNull();

    const threadState = reduce(managementState, { type: 'select-chat-thread', threadId: 'dev-direct' });
    const thread = render(<DemoChatExperience onAction={jest.fn()} state={threadState} />);
    expect(thread.queryByRole('button', { name: 'New query' })).toBeNull();
  });

  it('keeps Management inbox rows compact enough for the New query action above fixed navigation', () => {
    const state = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const rendered = render(<DemoChatExperience onAction={jest.fn()} state={state} />);

    const directRow = rendered.getByRole('button', { name: 'Open Dev Employee conversation' });
    const newQuery = rendered.getByRole('button', { name: 'New query' });
    expect(StyleSheet.flatten(directRow.props.style).minHeight).toBeLessThanOrEqual(100);
    expect(StyleSheet.flatten(directRow.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(newQuery.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it('opens the Management query form in its own keyboard-safe scroll surface', () => {
    const state = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const rendered = render(<DemoChatExperience onAction={jest.fn()} state={state} />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));

    const surface = rendered.getByTestId('management-query-scroll');
    expect(surface.props.keyboardShouldPersistTaps).toBe('handled');
    expect(StyleSheet.flatten(surface.props.style).flex).toBe(1);
    expect(StyleSheet.flatten(surface.props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(24);
  });

  it('renders controlled query fields and reconciles the related record when channel type changes', () => {
    const state = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const rendered = render(<DemoChatExperience onAction={jest.fn()} state={state} />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));

    const project = rendered.getByRole('tab', { name: 'Project' });
    const tender = rendered.getByRole('tab', { name: 'Tender' });
    expect(project.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(tender.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    expect(rendered.getByRole('radio', { name: 'Amaravati Solar Commons' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(rendered.getByLabelText('Query subject').props.value).toBe('');
    expect(rendered.getByLabelText('Query message').props.value).toBe('');

    fireEvent.changeText(rendered.getByLabelText('Query subject'), '  Commissioning review  ');
    fireEvent.changeText(rendered.getByLabelText('Query message'), '  Confirm the evidence sequence.  ');
    expect(rendered.getByLabelText('Query subject').props.value).toBe('  Commissioning review  ');
    expect(rendered.getByLabelText('Query message').props.value).toBe('  Confirm the evidence sequence.  ');

    fireEvent.press(tender);
    expect(rendered.getByRole('tab', { name: 'Tender' }).props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(rendered.queryByRole('radio', { name: 'Amaravati Solar Commons' })).toBeNull();
    expect(rendered.getByRole('radio', { name: 'Solar balance-of-plant package' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('shows validation for whitespace-only query fields and cancels without dispatching or losing inbox state', () => {
    const onAction = jest.fn();
    const state = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const rendered = render(<DemoChatExperience onAction={onAction} state={state} />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    fireEvent.changeText(rendered.getByLabelText('Query subject'), '   ');
    fireEvent.changeText(rendered.getByLabelText('Query message'), '\n  ');
    fireEvent.press(rendered.getByRole('button', { name: 'Create query' }));

    expect(rendered.getByText('Enter a query subject.')).toBeTruthy();
    expect(rendered.getByText('Enter a query message.')).toBeTruthy();
    expect(onAction).not.toHaveBeenCalled();

    fireEvent.press(rendered.getByRole('button', { name: 'Cancel query' }));
    expect(rendered.queryByLabelText('Query subject')).toBeNull();
    expect(rendered.getByRole('button', { name: 'New query' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open Dev Employee conversation' })).toBeTruthy();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('resets a drafted query when an existing conversation is opened before returning to the inbox', () => {
    const rendered = render(<ManagementChatHarness />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Tender' }));
    fireEvent.changeText(rendered.getByLabelText('Query subject'), 'Draft tender question');
    fireEvent.changeText(rendered.getByLabelText('Query message'), 'This draft must not survive the thread transition.');

    fireEvent.press(rendered.getByRole('button', { name: 'Open Dev Employee conversation' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Back to Chat inbox' }));

    expect(rendered.queryByLabelText('Query subject')).toBeNull();
    expect(rendered.getByRole('button', { name: 'New query' })).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    expect(rendered.getByRole('tab', { name: 'Project' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(rendered.getByLabelText('Query subject').props.value).toBe('');
    expect(rendered.getByLabelText('Query message').props.value).toBe('');
  });

  it('dispatches one minimal validated-input action from the query form', () => {
    const onAction = jest.fn();
    const state = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const rendered = render(<DemoChatExperience onAction={onAction} state={state} />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Tender' }));
    fireEvent.changeText(rendered.getByLabelText('Query subject'), '  Review cable schedule  ');
    fireEvent.changeText(rendered.getByLabelText('Query message'), '  Confirm the current tender revision.  ');
    fireEvent.press(rendered.getByRole('button', { name: 'Create query' }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith({
      type: 'create-management-query',
      channelType: 'tender',
      relatedRecordId: 'solar-bop',
      subject: 'Review cable schedule',
      message: 'Confirm the current tender revision.',
    });
    expect(Object.keys(onAction.mock.calls[0][0]).sort()).toEqual([
      'channelType',
      'message',
      'relatedRecordId',
      'subject',
      'type',
    ]);
  });

  it('authorizes Management and reducer-derives a selected open query with recipient unread state', () => {
    const initial = { ...createOfflineDemoState('management'), selectedTab: 'chat' as const };
    const created = reduce(initial, {
      type: 'create-management-query',
      channelType: 'project',
      relatedRecordId: 'amaravati-solar-commons',
      subject: '  Commissioning evidence  ',
      message: '  Please confirm the current evidence sequence.  ',
      role: 'employee',
      authorRole: 'employee',
      authorName: 'Forged Employee',
      threadId: 'forged-thread',
      messageId: 'forged-message',
      timestamp: 'Forged time',
      unreadByRole: { customer: 0, employee: 0, management: 99 },
    });

    const thread = created.chatThreads.at(-1)!;
    expect(thread).toEqual(expect.objectContaining({
      id: 'management-query-001',
      kind: 'project',
      status: 'open',
      title: 'Commissioning evidence',
      projectOrTender: 'Amaravati Solar Commons',
      participantRoles: ['customer', 'employee', 'management'],
      unreadByRole: { customer: 1, employee: 1, management: 0 },
    }));
    expect(thread.messages).toEqual([expect.objectContaining({
      id: 'management-query-001-message-1',
      authorRole: 'management',
      authorName: 'Mira Management',
      body: 'Please confirm the current evidence sequence.',
    })]);
    expect(thread.messages[0].timestamp).not.toBe('Forged time');
    expect(created).toEqual(expect.objectContaining({
      selectedTab: 'chat',
      selectedChatThreadId: 'management-query-001',
      surface: 'chat-thread',
    }));
  });

  it('rejects non-Management, blank, and mismatched-record query actions at the reducer boundary', () => {
    expect(() => reduce(createOfflineDemoState('employee'), {
      type: 'create-management-query',
      channelType: 'project',
      relatedRecordId: 'amaravati-solar-commons',
      subject: 'Forged Management query',
      message: 'This must not be accepted.',
      role: 'management',
      authorRole: 'management',
    })).toThrow(/Senior Management/);

    expect(() => reduce(createOfflineDemoState('management'), {
      type: 'create-management-query',
      channelType: 'project',
      relatedRecordId: 'amaravati-solar-commons',
      subject: '   ',
      message: 'Required body',
    })).toThrow(/Query subject and message are required/);

    expect(() => reduce(createOfflineDemoState('management'), {
      type: 'create-management-query',
      channelType: 'project',
      relatedRecordId: 'solar-bop',
      subject: 'Invalid context',
      message: 'This tender cannot be submitted as a project.',
    })).toThrow(/does not match project channel/);
  });

  it('creates deterministic collision-free query IDs repeatedly and retains them through workspace switches', () => {
    const action = {
      type: 'create-management-query',
      channelType: 'tender',
      relatedRecordId: 'solar-bop',
      subject: 'Tender review question',
      message: 'Confirm the current tender revision.',
    };
    let state = reduce(createOfflineDemoState('management'), action);
    state = reduce(state, { type: 'return-to-chat-inbox' });
    state = reduce(state, action);

    const created = state.chatThreads.filter((thread) => thread.id.startsWith('management-query-'));
    expect(created.map((thread) => thread.id)).toEqual(['management-query-001', 'management-query-002']);
    expect(created.flatMap((thread) => thread.messages.map((message) => message.id))).toEqual([
      'management-query-001-message-1',
      'management-query-002-message-1',
    ]);
    expect(new Set(state.chatThreads.map((thread) => thread.id)).size).toBe(state.chatThreads.length);

    state = reduce(state, { type: 'set-active-role', role: 'employee' });
    state = reduce(state, { type: 'set-active-role', role: 'management' });
    expect(state.chatThreads.filter((thread) => thread.id.startsWith('management-query-'))).toHaveLength(2);
  });

  it('opens the created outgoing message and keeps Project and Tender queries in their relevant inbox filters', () => {
    const rendered = render(<ManagementChatHarness />);

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    fireEvent.changeText(rendered.getByLabelText('Query subject'), 'Project evidence sequence');
    fireEvent.changeText(rendered.getByLabelText('Query message'), 'Please confirm the project evidence sequence.');
    fireEvent.press(rendered.getByRole('button', { name: 'Create query' }));

    expect(rendered.getByText('Project evidence sequence')).toBeTruthy();
    expect(rendered.getByText('Please confirm the project evidence sequence.')).toBeTruthy();
    expect(rendered.getByLabelText('Message Project evidence sequence')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Back to Chat inbox' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Filter Projects' }));
    expect(rendered.getByRole('button', { name: 'Open Project evidence sequence conversation' })).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'New query' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Tender' }));
    fireEvent.changeText(rendered.getByLabelText('Query subject'), 'Tender revision question');
    fireEvent.changeText(rendered.getByLabelText('Query message'), 'Please confirm the tender revision.');
    fireEvent.press(rendered.getByRole('button', { name: 'Create query' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Back to Chat inbox' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Filter Tenders' }));
    expect(rendered.getByRole('button', { name: 'Open Tender revision question conversation' })).toBeTruthy();
  });
});
