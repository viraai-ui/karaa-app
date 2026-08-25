import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { OfflineCustomerViews } from '../src/demo/OfflineCustomerViews';
import { createOfflineDemoState, offlineDemoReducer } from '../src/demo/offline-demo';

function Harness() {
  const [state, dispatch] = React.useReducer(offlineDemoReducer, createOfflineDemoState('customer'));
  React.useEffect(() => { dispatch({ type: 'select-tab', tab: 'support' }); }, []);
  return <OfflineCustomerViews onAction={dispatch} state={state} />;
}

function openTicketForm(rendered: ReturnType<typeof render>) {
  fireEvent.press(rendered.getByRole('button', { name: 'Raise a Ticket' }));
}

function completeTicket(rendered: ReturnType<typeof render>) {
  fireEvent.press(rendered.getByLabelText('Select project'));
  fireEvent.press(rendered.getByLabelText('Amaravati Solar Commons'));
  fireEvent.press(rendered.getByLabelText('Select category'));
  fireEvent.press(rendered.getByLabelText('Documents'));
  fireEvent.changeText(rendered.getByLabelText('Ticket subject'), 'Missing completion plan');
  fireEvent.changeText(rendered.getByLabelText('Ticket description'), 'Please share the latest completion plan.');
}

describe('simplified customer Support experience', () => {
  it('shows the polished hero, exactly two help cards, then canonical ticket history without inline clutter', () => {
    const rendered = render(<Harness />);
    expect(rendered.getByText('HELP & ASSISTANCE')).toBeTruthy();
    expect(rendered.getByText('How can we help?')).toBeTruthy();
    expect(rendered.getAllByRole('button', { name: /Live Chat|Raise a Ticket/ })).toHaveLength(2);
    expect(rendered.getByText('Ticket History')).toBeTruthy();
    expect(rendered.getByText('Commissioning checklist context')).toBeTruthy();
    expect(rendered.queryByText('Raise a request')).toBeNull();
    expect(rendered.queryByText('Live support')).toBeNull();
  });

  it('opens an accessible modal with project, category, content, priority, cancel and submit controls', () => {
    const rendered = render(<Harness />);
    openTicketForm(rendered);
    expect(rendered.getByTestId('support-ticket-modal')).toBeTruthy();
    expect(rendered.getByLabelText('Ticket subject')).toBeTruthy();
    expect(rendered.getByLabelText('Ticket description')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Cancel ticket' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Submit ticket' })).toBeTruthy();
    ['Normal priority', 'Urgent priority', 'Cancel ticket', 'Submit ticket'].forEach((name) => expect(StyleSheet.flatten(rendered.getByLabelText(name).props.style).minHeight).toBeGreaterThanOrEqual(44));
  });

  it('creates exactly one canonical ticket, closes, and immediately adds it to history', () => {
    const rendered = render(<Harness />);
    openTicketForm(rendered); completeTicket(rendered);
    const submit = rendered.getByRole('button', { name: 'Submit ticket' });
    fireEvent.press(submit);
    fireEvent.press(submit);
    expect(rendered.queryByTestId('support-ticket-modal')).toBeNull();
    expect(rendered.getAllByText('Missing completion plan')).toHaveLength(1);
    expect(rendered.getByText('02')).toBeTruthy();
  });

  it('routes live chat and ticket rows to the dedicated canonical, keyboard-safe thread and sends messages', () => {
    const rendered = render(<Harness />);
    fireEvent.press(rendered.getByRole('button', { name: 'Live Chat' }));
    expect(rendered.getByTestId('chat-thread-page')).toBeTruthy();
    expect(rendered.getByText('Karaa Support')).toBeTruthy();
    expect(rendered.getByText(/Online/)).toBeTruthy();
    const input = rendered.getByLabelText('Message Commissioning checklist context');
    fireEvent.changeText(input, 'Please help with the checklist.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send message to Commissioning checklist context' }));
    expect(rendered.getByText('Please help with the checklist.')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Back to Support history' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Commissioning checklist context ticket thread' }));
    expect(rendered.getByTestId('chat-thread-page')).toBeTruthy();
  });
});
