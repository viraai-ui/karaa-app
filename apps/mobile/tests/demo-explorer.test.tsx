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

  it('uses a dense photographic three-column opening grid', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    rendered.getAllByRole('button', { name: /Open .* vertical/i }).forEach((card) => {
      expect(StyleSheet.flatten(card.props.style).height).toBe(112);
    });
    rendered.getAllByLabelText(/Demo visual:/).forEach((visual) => {
      expect(StyleSheet.flatten(visual.props.style).height).toBe('100%');
    });
  });

  it('clamps long vertical names to two lines in the photographic grid', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);

    [
      'Infrastructure & Urban Development',
      'Manufacturing & Industrial Solutions',
      'Spiritual Renaissance for Bharat',
      'Education, Technology & Innovation',
    ].forEach((title) => {
      expect(rendered.getAllByText(title)[0].props.numberOfLines).toBe(2);
    });
  });

  it('dispatches the canonical Energy vertical selection', () => {
    const onAction = jest.fn();
    const rendered = render(<DemoExplorer onAction={onAction} state={createOfflineDemoState()} />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' }));

    expect(onAction).toHaveBeenCalledWith({ type: 'select-vertical', verticalId: 'energy-utilities' });
  });

  it('opens and backs out of the polished Energy detail', () => {
    const rendered = render(<ReducerBackedExplorer />);

    fireEvent.press(rendered.getByRole('button', { name: 'Open Energy & Utilities vertical' }));
    expect(rendered.getByText('Powering responsible progress')).toBeTruthy();
    expect(rendered.getAllByRole('button', { name: /Explore / })).toHaveLength(4);

    fireEvent.press(rendered.getByRole('button', { name: 'Back to Power of 9' }));
    expect(rendered.getByText('The Power of 9')).toBeTruthy();
  });

  it('renders every section of the customer dashboard in the mockup order', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState()} />);
    const dashboard = rendered.getByTestId('karaa-home-dashboard');
    ['Welcome back, Aaryan.', 'The Power of 9', 'Projects to watch', 'My portfolio', 'Latest progress', 'Important notice', 'Quick access'].forEach((text) => {
      expect(within(dashboard).getByText(text)).toBeTruthy();
    });
    expect(within(dashboard).getByText('Payment schedule')).toBeTruthy();
    expect(within(dashboard).getAllByRole('button')).toHaveLength(18);
  });

  it('renders four pathways and three Why It Matters rows for every vertical', () => {
    const ids = ['infrastructure-urban-development','ports-airports-logistics','energy-utilities','healthcare-life-sciences','hospitality-tourism-leisure','real-estate-asset-development','manufacturing-industrial-solutions','spiritual-renaissance-for-bharat','education-technology-innovation'];
    ids.forEach((verticalId) => {
      const rendered = render(<DemoExplorer onAction={jest.fn()} state={offlineDemoReducer(createOfflineDemoState(), { type:'select-vertical', verticalId })} />);
      expect(rendered.getByTestId(`vertical-detail-${verticalId}`)).toBeTruthy();
      expect(within(rendered.getByTestId('pathway-list')).getAllByRole('button')).toHaveLength(4);
      expect(rendered.getByTestId('matters-list').props.children).toHaveLength(3);
      rendered.unmount();
    });
  });

  it('uses the reference Healthcare composition and copy', () => {
    const rendered = render(<DemoExplorer onAction={jest.fn()} state={offlineDemoReducer(createOfflineDemoState(), { type:'select-vertical', verticalId:'healthcare-life-sciences' })} />);
    expect(rendered.queryByText('POWER OF 9  •  04')).toBeNull();
    expect(rendered.getByText('Care designed as a continuum')).toBeTruthy();
    expect(rendered.getByRole('button', { name:'Explore Multi-Specialty Hospitals' })).toBeTruthy();
    expect(rendered.getByText('Why continuity matters')).toBeTruthy();
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

  it('uses the full catalog for each role surface that owns the Power or Projects explorer', () => {
    const adapters = [
      [OfflineCustomerViews, createOfflineDemoState('customer')],
      [OfflineEmployeeViews, { ...createOfflineDemoState('employee'), selectedTab: 'projects' as const }],
      [OfflineManagementViews, createOfflineDemoState('management')],
    ] as const;

    adapters.forEach(([Adapter, state]) => {
      const rendered = render(<Adapter onAction={jest.fn()} state={state} />);
      expect(rendered.getAllByRole('button', { name: /Open .* vertical/i })).toHaveLength(9);
    });
  });
});
