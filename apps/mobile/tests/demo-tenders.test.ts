import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DemoTenderExperience } from '../src/demo/DemoTenderExperience';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  tenderBoardRows,
  tenderUpdatesFor,
} from '../src/demo/offline-demo';

describe('Karaa tender lifecycle demo', () => {
  it('keeps the Amaravati change ledger as the immutable baseline source', () => {
    const state = createOfflineDemoState('management');
    const updates = tenderUpdatesFor(state, 'solar-bop');

    expect(updates.map((update) => update.id)).toEqual([
      'CHG-014',
      'CHG-021',
      'CHG-024',
      'CHG-027',
      'CHG-031',
    ]);
    expect(updates.map(({ effect, headline, id, origin }) => ({ id, headline, effect, origin }))).toEqual([
      { id: 'CHG-014', headline: 'Technical schedule issued', effect: 'Notice', origin: null },
      { id: 'CHG-021', headline: 'Cable-routing schedule Rev 02', effect: 'Supersedes', origin: 'CHG-014' },
      { id: 'CHG-024', headline: 'Submission horizon revised', effect: 'Supersedes', origin: 'CHG-021' },
      { id: 'CHG-027', headline: 'Inverter interface clarification', effect: 'Clarifies', origin: 'CHG-024' },
      { id: 'CHG-031', headline: 'Technical review advanced', effect: 'Advances review', origin: 'CHG-027' },
    ]);
    expect(updates.find((update) => update.id === 'CHG-024')).toEqual(expect.objectContaining({
      kind: 'deadline-change',
      headline: 'Submission horizon revised',
      origin: 'CHG-021',
      deadline: {
        previousLabel: '18 Aug · 17:00 IST',
        revisedLabel: '22 Aug · 17:00 IST',
        timezone: 'IST',
      },
      nextAction: 'Review submission plan',
    }));
    expect(tenderBoardRows(state).find((row) => row.tenderId === 'solar-bop')).toEqual(expect.objectContaining({
      updateCount: 5,
      attention: true,
      lifecycleLabel: 'Technical review',
    }));
  });

  it('appends a deadline record without rewriting the original five records', () => {
    const initial = createOfflineDemoState('management');
    const baseline = tenderUpdatesFor(initial, 'solar-bop');
    const next = offlineDemoReducer(initial, {
      type: 'append-tender-deadline-change',
      tenderId: 'solar-bop',
    });
    const updates = tenderUpdatesFor(next, 'solar-bop');

    expect(updates).toHaveLength(6);
    expect(updates.slice(0, 5)).toEqual(baseline);
    expect(tenderUpdatesFor(initial, 'solar-bop')).toEqual(baseline);
    expect(updates.at(-1)).toEqual(expect.objectContaining({
      kind: 'deadline-change',
      origin: 'CHG-031',
      nextAction: 'Review revised submission plan.',
    }));
    expect(tenderBoardRows(next).find((row) => row.tenderId === 'solar-bop')?.nextAction).toBe('Review revised submission plan.');
  });

  it('creates a unique immutable change ID for every deadline revision', () => {
    const initial = createOfflineDemoState('management');
    const once = offlineDemoReducer(initial, { type: 'append-tender-deadline-change', tenderId: 'solar-bop' });
    const twice = offlineDemoReducer(once, { type: 'append-tender-deadline-change', tenderId: 'solar-bop' });
    const ids = tenderUpdatesFor(twice, 'solar-bop').map((update) => update.id);

    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
    expect(ids.slice(-2)).toEqual(['CHG-032', 'CHG-033']);
  });

  it('acknowledges only the stated role for a tender update', () => {
    const initial = createOfflineDemoState('management');
    const acknowledged = offlineDemoReducer(initial, {
      type: 'acknowledge-tender-update',
      tenderId: 'solar-bop',
      updateId: 'CHG-024',
    });
    const initialUpdate = tenderUpdatesFor(initial, 'solar-bop').find((update) => update.id === 'CHG-024');
    const updated = tenderUpdatesFor(acknowledged, 'solar-bop').find((update) => update.id === 'CHG-024');

    expect(initialUpdate?.acknowledgedByRoles).toEqual([]);
    expect(updated?.acknowledgedByRoles).toEqual(['management']);
    expect(tenderUpdatesFor(acknowledged, 'solar-bop').filter((update) => update.id !== 'CHG-024')).toEqual(
      tenderUpdatesFor(initial, 'solar-bop').filter((update) => update.id !== 'CHG-024'),
    );
  });

  it.each([
    ['customer', false],
    ['employee', false],
    ['management', true],
  ] as const)('renders acknowledgement, review, and assignment actions only for %s management visibility', (role, canAct) => {
    let state = createOfflineDemoState(role);
    state = offlineDemoReducer(state, { type: 'select-tender', tenderId: 'solar-bop' });
    const onAction = jest.fn();
    const rendered = render(React.createElement(DemoTenderExperience, { onAction, role, state }));

    expect(rendered.getByText('Demo data — verify with issuing authority')).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Overview' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Updates' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Activity' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Docs' })).toBeTruthy();
    expect(Boolean(rendered.queryByRole('button', { name: 'Acknowledge update' }))).toBe(canAct);
    expect(Boolean(rendered.queryByRole('button', { name: 'Assign review' }))).toBe(canAct);
    expect(Boolean(rendered.queryByRole('button', { name: 'Revise deadline' }))).toBe(canAct);

    if (canAct) {
      fireEvent.press(rendered.getByRole('button', { name: 'Revise deadline' }));
      expect(onAction).toHaveBeenCalledWith({ type: 'append-tender-deadline-change', tenderId: 'solar-bop' });
    }
  });

  it('renders the screenshot tender overview and selected ledger detail', () => {
    const board = render(React.createElement(DemoTenderExperience, {
      onAction: jest.fn(),
      role: 'customer' as const,
      state: createOfflineDemoState('customer'),
    }));
    expect(board.getByText('OPPORTUNITIES & PROCUREMENT')).toBeTruthy();
    expect(board.getByText('Tender overview')).toBeTruthy();
    expect(board.getByText('46')).toBeTruthy();
    expect(board.getByText('76%')).toBeTruthy();
    expect(board.getAllByText('400kV Substation at Bhopal')).toHaveLength(2);

    let state = createOfflineDemoState('customer');
    state = offlineDemoReducer(state, { type: 'select-tender', tenderId: 'solar-bop' });
    const detail = render(React.createElement(DemoTenderExperience, { onAction: jest.fn(), role: 'customer' as const, state }));
    expect(detail.getByRole('image', { name: 'Demo visual: Solar balance-of-plant package tender' })).toBeTruthy();
    expect(detail.getByText('CHG-024')).toBeTruthy();
    expect(detail.getByText('18 Aug · 17:00 IST → 22 Aug · 17:00 IST')).toBeTruthy();
    expect(detail.getByText('Demo data — verify with issuing authority')).toBeTruthy();
  });

  it('returns from tender detail to the tender board', () => {
    let state = createOfflineDemoState('customer');
    state = offlineDemoReducer(state, { type: 'select-tender', tenderId: 'solar-bop' });
    const onAction = jest.fn();
    const detail = render(React.createElement(DemoTenderExperience, { onAction, role: 'customer' as const, state }));

    fireEvent.press(detail.getByRole('button', { name: 'Back to tender board' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'return-to-tender-board' });
    const returned = offlineDemoReducer(state, { type: 'return-to-tender-board' } as never);
    expect(returned).toEqual(expect.objectContaining({ selectedTab: 'tenders', selectedTenderId: null, surface: 'root' }));
  });

  it('exposes selected states for compact tender controls and accessible detail actions', () => {
    const board = render(React.createElement(DemoTenderExperience, { onAction: jest.fn(), role: 'customer' as const, state: createOfflineDemoState('customer') }));
    const allFilter = board.getByRole('tab', { name: 'Filter All' });
    expect(allFilter.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(StyleSheet.flatten(allFilter.props.style).height).toBe(24);

    let managementState = createOfflineDemoState('management');
    managementState = offlineDemoReducer(managementState, { type: 'select-tender', tenderId: 'solar-bop' });
    const detail = render(React.createElement(DemoTenderExperience, { onAction: jest.fn(), role: 'management' as const, state: managementState }));
    expect(StyleSheet.flatten(detail.getByRole('tab', { name: 'Overview' }).props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(detail.getByRole('button', { name: 'Revise deadline' }).props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it('rejects a non-management acknowledgement before mutating the tender ledger', () => {
    const initial = createOfflineDemoState('customer');

    expect(() => offlineDemoReducer(initial, {
      type: 'acknowledge-tender-update',
      tenderId: 'solar-bop',
      updateId: 'CHG-024',
    })).toThrow('Tender action requires Senior Management');
    expect(tenderUpdatesFor(initial, 'solar-bop').find((update) => update.id === 'CHG-024')?.acknowledgedByRoles).toEqual([]);
  });

  it('binds tender mutation permission to the active workspace rather than a caller-supplied role', () => {
    const management = createOfflineDemoState('management');
    const customerWorkspace = offlineDemoReducer(management, { type: 'set-active-role', role: 'customer' } as never);

    expect(customerWorkspace).toEqual(expect.objectContaining({ activeRole: 'customer' }));
    expect(() => offlineDemoReducer(customerWorkspace, {
      type: 'append-tender-deadline-change',
      tenderId: 'solar-bop',
      role: 'management',
    } as never)).toThrow('Tender action requires Senior Management');
  });

  it.each(['customer', 'employee'] as const)('rejects %s tender mutations before changing the ledger', (role) => {
    const initial = createOfflineDemoState(role);

    expect(() => offlineDemoReducer(initial, { type: 'append-tender-deadline-change', tenderId: 'solar-bop' })).toThrow('Tender action requires Senior Management');
    expect(() => offlineDemoReducer(initial, { type: 'assign-tender-review', tenderId: 'solar-bop', assignee: 'Mira Management' })).toThrow('Tender action requires Senior Management');
    expect(tenderUpdatesFor(initial, 'solar-bop')).toHaveLength(5);
  });

  it('supports tender search, secondary status filtering, sort, details, analytics, and calendar', () => {
    const board = render(React.createElement(DemoTenderExperience, { onAction: jest.fn(), role: 'customer' as const, state: createOfflineDemoState('customer') }));
    fireEvent.press(board.getByRole('tab', { name: 'Show Applied tenders' }));
    expect(board.getByRole('button', { name: 'Open Supply of Electrical Equipment tender details' })).toBeTruthy();
    fireEvent.changeText(board.getByLabelText('Search tenders'), 'electrical');
    fireEvent.press(board.getByRole('button', { name: 'Open Supply of Electrical Equipment tender details' }));
    expect(board.getByText('Local opportunity preview — verify details with the issuing authority.')).toBeTruthy();
    fireEvent.press(board.getByRole('button', { name: 'Close tender details' }));
    fireEvent.press(board.getByRole('button', { name: 'View analytics' }));
    expect(board.getByText('Tender analytics')).toBeTruthy();
    fireEvent.press(board.getByRole('button', { name: 'Close Tender analytics' }));
    fireEvent.press(board.getByRole('button', { name: 'View calendar' }));
    expect(board.getByText('Tender calendar')).toBeTruthy();
    fireEvent.press(board.getByRole('button', { name: 'Close Tender calendar' }));
    fireEvent.press(board.getByRole('button', { name: 'Sort tenders ascending' }));
    expect(board.getByRole('button', { name: 'Sort tenders descending' })).toBeTruthy();
  });

  it('keeps primary and secondary status controls coherent and exercises every board affordance', () => {
    const board = render(React.createElement(DemoTenderExperience, { onAction: jest.fn(), role: 'customer' as const, state: createOfflineDemoState('customer') }));
    expect(board.getAllByRole('button', { name: /Open .* tender details/ })).toHaveLength(5);

    fireEvent.press(board.getByRole('tab', { name: 'Filter Applied' }));
    expect(board.getByRole('tab', { name: 'Show Applied tenders' }).props.accessibilityState.selected).toBe(true);
    expect(board.getByRole('button', { name: 'Open Supply of Electrical Equipment tender details' })).toBeTruthy();

    for (const [button, title, close] of [
      ['Filter tenders', 'Search & filters', 'Close Search & filters'],
      ['View all latest applied tenders', 'Latest applied tenders', 'Close Latest applied tenders'],
      ['Change tender list view', 'List view', 'Close List view'],
    ] as const) {
      fireEvent.press(board.getByRole('button', { name: button }));
      expect(board.getByText(title)).toBeTruthy();
      fireEvent.press(board.getByRole('button', { name: close }));
    }

    const compactChip = board.getByRole('tab', { name: 'Filter Applied' });
    expect(StyleSheet.flatten(compactChip.props.style).height).toBe(24);
    expect(compactChip.props.hitSlop).toBe(10);
    expect(board.getByTestId('tenders-page')).toBeTruthy();
  });
});
