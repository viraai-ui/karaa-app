import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DemoChatExperience } from '../src/demo/DemoChatExperience';
import { DemoSupportExperience } from '../src/demo/DemoSupportExperience';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  type OfflineDemoAction,
  type OfflineDemoState,
} from '../src/demo/offline-demo';

function reduce(state: OfflineDemoState, action: unknown): OfflineDemoState {
  return offlineDemoReducer(state, action as OfflineDemoAction);
}

function SupportHarness() {
  const [state, dispatch] = React.useReducer(offlineDemoReducer, createOfflineDemoState('customer'));
  React.useEffect(() => {
    dispatch({ type: 'select-tab', tab: 'support' });
  }, []);
  return <DemoSupportExperience onAction={dispatch} state={state} />;
}

describe('Karaa Customer Support state and shared chat', () => {
  it('seeds a credible Amaravati ticket linked to its support thread', () => {
    const state = createOfflineDemoState('customer');
    const ticket = state.supportTickets[0];
    const thread = state.chatThreads.find((candidate) => candidate.id === ticket.threadId);

    expect(ticket).toEqual(expect.objectContaining({
      id: 'SUP-001',
      projectOrCategory: 'Amaravati Solar Commons',
      status: 'in-review',
    }));
    expect(thread).toEqual(expect.objectContaining({
      id: ticket.threadId,
      kind: 'support',
      participantRoles: ['customer', 'management'],
    }));
  });

  it('rejects forged role and author fields when the active role is not Customer', () => {
    const employee = createOfflineDemoState('employee');

    expect(() => reduce(employee, {
      type: 'create-support-ticket',
      projectOrCategory: 'Amaravati Solar Commons',
      subject: 'Forged request',
      description: 'This must not be accepted from the employee workspace.',
      priority: 'urgent',
      role: 'customer',
      authorRole: 'customer',
      authorName: 'Anika Customer',
      id: 'SUP-900',
      threadId: 'forged-thread',
    })).toThrow('Support ticket creation requires Customer');
  });

  it('creates deterministic normal and urgent tickets with role-derived authorship while remaining on Support', () => {
    let state = createOfflineDemoState('customer');
    state = reduce(state, {
      type: 'create-support-ticket',
      projectOrCategory: 'Amaravati Solar Commons',
      subject: 'Investment note question',
      description: 'Please clarify which commissioning note is included.',
      priority: 'normal',
      id: 'SUP-900',
      threadId: 'forged-thread',
      authorRole: 'management',
    });

    const normal = state.supportTickets.at(-1)!;
    const normalThread = state.chatThreads.find((thread) => thread.id === normal.threadId)!;
    expect(normal).toEqual(expect.objectContaining({ id: 'SUP-002', priority: 'normal', status: 'in-review' }));
    expect(normalThread).toEqual(expect.objectContaining({ id: 'sup-002-support', kind: 'support' }));
    expect(normalThread.messages[0]).toEqual(expect.objectContaining({
      authorRole: 'customer',
      authorName: 'Anika Customer',
      body: normal.description,
    }));
    expect(state).toEqual(expect.objectContaining({
      selectedTab: 'support',
      selectedChatThreadId: null,
      surface: 'root',
    }));

    state = reduce(state, {
      type: 'create-support-ticket',
      projectOrCategory: 'Energy & Utilities',
      subject: 'Document sequence',
      description: 'Please confirm the order of the project records.',
      priority: 'urgent',
    });

    expect(state.supportTickets.at(-1)).toEqual(expect.objectContaining({ id: 'SUP-003', priority: 'urgent' }));
    expect(state.chatThreads.at(-1)).toEqual(expect.objectContaining({ id: 'sup-003-support', kind: 'support' }));
  });

  it('retains a created ticket on the Support root', () => {
    let state = reduce(createOfflineDemoState('customer'), {
      type: 'create-support-ticket',
      projectOrCategory: 'Amaravati Solar Commons',
      subject: 'Checklist context',
      description: 'Please add context for the commissioning checklist.',
      priority: 'normal',
    });

    expect(state).toEqual(expect.objectContaining({ selectedTab: 'support', surface: 'root', selectedChatThreadId: null }));
    expect(state.supportTickets.some((ticket) => ticket.id === 'SUP-002')).toBe(true);
  });

  it('appends an outgoing customer support message and updates management unread and preview state', () => {
    let state = reduce(createOfflineDemoState('customer'), { type: 'open-support-ticket', ticketId: 'SUP-001' });
    const before = state.chatThreads.find((thread) => thread.id === state.selectedChatThreadId)!;
    const managementUnread = before.unreadByRole.management;

    state = reduce(state, {
      type: 'send-chat-message',
      threadId: before.id,
      body: '  Please include the revised checklist reference.  ',
      senderRole: 'management',
    });

    const after = state.chatThreads.find((thread) => thread.id === before.id)!;
    expect(after.messages.at(-1)).toEqual(expect.objectContaining({
      authorRole: 'customer',
      body: 'Please include the revised checklist reference.',
    }));
    expect(after.messages.at(-1)?.body).toBe('Please include the revised checklist reference.');
    expect(after.unreadByRole.management).toBe(managementUnread + 1);
    expect(after.unreadByRole.customer).toBe(0);
  });

  it('excludes support threads from the employee Chat inbox', () => {
    const state = reduce(createOfflineDemoState('employee'), { type: 'select-tab', tab: 'chat' });
    const rendered = render(<DemoChatExperience onAction={() => undefined} state={state} />);

    expect(rendered.queryByRole('button', { name: 'Open Commissioning checklist context conversation' })).toBeNull();
  });

  it('routes management support conversations back through Chat while Customer remains in Support', () => {
    let management = reduce(createOfflineDemoState('management'), { type: 'select-chat-thread', threadId: 'sup-001-support' });
    expect(management).toEqual(expect.objectContaining({ selectedTab: 'chat', surface: 'chat-thread' }));
    management = reduce(management, { type: 'return-to-chat-inbox' });
    expect(management).toEqual(expect.objectContaining({ selectedTab: 'chat', surface: 'root' }));

    let customer = reduce(createOfflineDemoState('customer'), { type: 'select-chat-thread', threadId: 'sup-001-support' });
    expect(customer).toEqual(expect.objectContaining({ selectedTab: 'support', surface: 'chat-thread' }));
    customer = reduce(customer, { type: 'return-to-chat-inbox' });
    expect(customer).toEqual(expect.objectContaining({ selectedTab: 'support', surface: 'root' }));
  });

  it('opens the accessible ticket modal, validates required fields and dispatches nothing when blank', () => {
    const onAction = jest.fn();
    const rendered = render(<DemoSupportExperience onAction={onAction} state={createOfflineDemoState('customer')} />);

    fireEvent.press(rendered.getByRole('button', { name: 'Raise a Ticket' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Submit ticket' }));

    expect(rendered.getByText('Choose a project.')).toBeTruthy();
    expect(rendered.getByText('Choose a category.')).toBeTruthy();
    expect(rendered.getByText('Enter a subject.')).toBeTruthy();
    expect(rendered.getByText('Enter a description.')).toBeTruthy();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('renders accessible 44px history and form actions with selected priority states', () => {
    const rendered = render(<DemoSupportExperience onAction={() => undefined} state={createOfflineDemoState('customer')} />);
    const create = rendered.getByRole('button', { name: 'Raise a Ticket' });
    const seededRow = rendered.getByRole('button', { name: 'Open Commissioning checklist context ticket thread' });

    expect(StyleSheet.flatten(create.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(seededRow.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(rendered.getByText('Commissioning checklist context')).toBeTruthy();
    expect(rendered.getByText('IN REVIEW')).toBeTruthy();
    fireEvent.press(create);
    expect(rendered.getByLabelText('Select project')).toBeTruthy();
    expect(rendered.getByLabelText('Ticket subject')).toBeTruthy();
    expect(rendered.getByLabelText('Ticket description')).toBeTruthy();

    const normal = rendered.getByLabelText('Normal priority');
    const urgent = rendered.getByLabelText('Urgent priority');
    expect(normal.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(urgent.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
    expect(StyleSheet.flatten(normal.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(urgent.props.style).minHeight).toBeGreaterThanOrEqual(44);

    fireEvent.press(urgent);
    expect(rendered.getByLabelText('Urgent priority').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(StyleSheet.flatten(rendered.getByRole('button', { name: 'Submit ticket' }).props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it('creates an urgent ticket and keeps it available in canonical history and detail', () => {
    const rendered = render(<SupportHarness />);
    fireEvent.press(rendered.getByRole('button', { name: 'Raise a Ticket' }));
    fireEvent.press(rendered.getByLabelText('Select project'));
    fireEvent.press(rendered.getByLabelText('Aarohan Medical City'));
    fireEvent.press(rendered.getByLabelText('Select category'));
    fireEvent.press(rendered.getByLabelText('Documents'));
    fireEvent.changeText(rendered.getByLabelText('Ticket subject'), ' Revised checklist reference ');
    fireEvent.changeText(rendered.getByLabelText('Ticket description'), ' Please clarify the revised checklist sequence. ');
    fireEvent.press(rendered.getByLabelText('Urgent priority'));
    fireEvent.press(rendered.getByRole('button', { name: 'Submit ticket' }));

    expect(rendered.getByText('Revised checklist reference')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Open Revised checklist reference ticket thread' }));
    expect(rendered.getByText('Revised checklist reference')).toBeTruthy();
  });
});
