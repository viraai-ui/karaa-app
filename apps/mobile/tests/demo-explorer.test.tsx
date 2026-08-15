import { useReducer } from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';

import { DemoExplorer } from '../src/demo/DemoExplorer';
import { OfflineCustomerViews } from '../src/demo/OfflineCustomerViews';
import { OfflineEmployeeViews } from '../src/demo/OfflineEmployeeViews';
import { OfflineManagementViews } from '../src/demo/OfflineManagementViews';
import { createOfflineDemoState, offlineDemoReducer } from '../src/demo/offline-demo';

function selectedEnergyState() {
  return offlineDemoReducer(createOfflineDemoState(), {
    type: 'select-vertical',
    verticalId: 'energy-utilities',
  });
}

function selectedSolarState() {
  return offlineDemoReducer(selectedEnergyState(), {
    type: 'select-subvertical',
    subverticalId: 'solar-generation',
  });
}

function ReducerBackedExplorer() {
  const [state, dispatch] = useReducer(offlineDemoReducer, undefined, createOfflineDemoState);
  return <DemoExplorer onAction={dispatch} state={state} />;
}

describe('Power-of-9 explorer', () => {
  it('renders all nine catalog verticals as labelled root actions', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    expect(rendered.getAllByRole('button', { name: /Open .* vertical/i })).toHaveLength(9);
  });

  it('uses a dense opening grid with resolved 32px visual anchors', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    rendered.getAllByRole('button', { name: /Open .* vertical/i }).forEach((card) => {
      expect(StyleSheet.flatten(card.props.style).minHeight).toBeLessThanOrEqual(130);
    });
    rendered.getAllByLabelText('Demo visual: Amaravati solar campus').forEach((visual) => {
      expect(StyleSheet.flatten(visual.props.style).height).toBe(32);
    });
  });

  it('allows long vertical names three lines without breaking the compact grid budget', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    [
      'Infrastructure & Urban Development',
      'Manufacturing & Industrial Solutions',
      'Spiritual Renaissance for Bharat',
      'Education, Technology & Innovation',
    ].forEach((title) => {
      expect(rendered.getByText(title).props.numberOfLines).toBe(3);
    });
  });

  it('dispatches the canonical Energy vertical selection', () => {
    const onAction = jest.fn();
    const rendered = render(<DemoExplorer onAction={onAction} state={createOfflineDemoState()} />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' }));

    expect(onAction).toHaveBeenCalledWith({ type: 'select-vertical', verticalId: 'energy-utilities' });
  });

  it('drives Energy to Amaravati through the reducer-backed explorer path', () => {
    const rendered = render(<ReducerBackedExplorer />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Solar generation sub-vertical' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Amaravati Solar Commons project' }));

    expect(rendered.queryByText('PROJECT SELECTED')).toBeNull();
    expect(rendered.getByText('Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByText('Project timeline')).toBeTruthy();
    expect(rendered.getAllByRole('tab')).toHaveLength(4);
    expect(rendered.getByRole('tab', { name: 'Timeline' }).props.accessibilityState).toEqual({ selected: true });

    fireEvent.press(rendered.getByRole('button', { name: 'Back to Power of 9' }));
    expect(rendered.getByText('Power of 9')).toBeTruthy();
  });

  it('dispatches the canonical Solar generation selection from Energy', () => {
    const onAction = jest.fn();
    const rendered = render(<DemoExplorer onAction={onAction} state={selectedEnergyState()} />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Solar generation sub-vertical' }));

    expect(onAction).toHaveBeenCalledWith({ type: 'select-subvertical', subverticalId: 'solar-generation' });
  });

  it('dispatches the canonical Amaravati project selection from solar generation', () => {
    const onAction = jest.fn();
    const rendered = render(<DemoExplorer onAction={onAction} state={selectedSolarState()} />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Amaravati Solar Commons project' }));

    expect(onAction).toHaveBeenCalledWith({ type: 'select-project', projectId: 'amaravati-solar-commons' });
  });

  it('filters root catalog cards through its cosmetic search field', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    fireEvent.changeText(rendered.getByLabelText('Search Power of 9'), 'Energy');

    expect(rendered.getAllByRole('button', { name: /Open .* vertical/i })).toHaveLength(1);
    expect(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' })).toBeTruthy();
  });

  it('discovers a vertical when a featured project title matches the root search', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    fireEvent.changeText(rendered.getByLabelText('Search Power of 9'), 'Amaravati Solar Commons');

    expect(rendered.getAllByRole('button', { name: /Open .* vertical/i })).toHaveLength(1);
    expect(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' })).toBeTruthy();
  });

  it('keeps a vertical visual stable when root search changes its render position', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);
    const energyCard = rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' });
    const initialVisualLabel = within(energyCard).getByLabelText(/Demo visual:/).props.accessibilityLabel;

    fireEvent.changeText(rendered.getByLabelText('Search Power of 9'), 'Energy');

    const filteredEnergyCard = rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' });
    expect(within(filteredEnergyCard).getByLabelText(initialVisualLabel)).toBeTruthy();
  });

  it('changes the visible project list when an explicit project-status filter is pressed', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={selectedSolarState()} />);

    expect(rendered.getByRole('button', { name: 'Open Amaravati Solar Commons project' })).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Filter Attention' }));

    expect(rendered.queryByRole('button', { name: 'Open Amaravati Solar Commons project' })).toBeNull();
    expect(rendered.getByText('No projects match these filters.')).toBeTruthy();
  });

  it('replaces every role Power adapter with the full catalog rather than a four-card subset', () => {
    const adapters = [OfflineCustomerViews, OfflineEmployeeViews, OfflineManagementViews];

    adapters.forEach((Adapter) => {
      const rendered = render(<Adapter onAction={jest.fn()} state={createOfflineDemoState()} />);
      expect(rendered.getAllByRole('button', { name: /Open .* vertical/i })).toHaveLength(9);
    });
  });
});
