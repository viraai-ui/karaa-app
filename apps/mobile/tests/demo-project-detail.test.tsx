import { StyleSheet } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';

import { DemoExplorer } from '../src/demo/DemoExplorer';
import { DemoProjectDetail } from '../src/demo/DemoProjectDetail';
import { projectForId } from '../src/demo/demo-catalog';
import { createOfflineDemoState, offlineDemoReducer, type OfflineDemoState } from '../src/demo/offline-demo';

function selectedProjectState(
  projectId = 'amaravati-solar-commons',
  overrides: Partial<OfflineDemoState> = {},
): OfflineDemoState {
  const project = projectForId(projectId);
  const verticalState = offlineDemoReducer(createOfflineDemoState(), {
    type: 'select-vertical',
    verticalId: project.verticalId,
  });
  const subverticalState = offlineDemoReducer(verticalState, {
    type: 'select-subvertical',
    subverticalId: project.subverticalId,
  });
  return {
    ...offlineDemoReducer(subverticalState, { type: 'select-project', projectId }),
    ...overrides,
  };
}

function renderDetail(
  overrides: Partial<OfflineDemoState> = {},
  onAction = jest.fn(),
  projectId = 'amaravati-solar-commons',
) {
  const state = selectedProjectState(projectId, overrides);
  return {
    onAction,
    rendered: render(
      <DemoProjectDetail
        onAction={onAction}
        project={projectForId(projectId)}
        state={state}
      />,
    ),
  };
}

const tabCases = [
  ['timeline', 'Project timeline'],
  ['overview', 'Project facts'],
  ['documents', 'Project documents'],
  ['media', 'Project media'],
] as const;

describe('Power-of-9 project detail', () => {
  it('replaces the selected-project placeholder with the default Timeline record', () => {
    const rendered = render(
      <DemoExplorer onAction={jest.fn()} state={selectedProjectState()} />,
    );

    expect(rendered.queryByText('PROJECT SELECTED')).toBeNull();
    expect(rendered.getByText('Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByText('Amaravati, Andhra Pradesh')).toBeTruthy();
    expect(rendered.getByText('Project timeline')).toBeTruthy();
    expect(rendered.getByRole('progressbar', { name: 'PROJECT DELIVERY: 65% delivery recorded' })).toBeTruthy();
    expect(rendered.getAllByRole('tab')).toHaveLength(4);
    expect(rendered.getByRole('tab', { name: 'Timeline' }).props.accessibilityState).toEqual({ selected: true });
  });

  it('dispatches exact project-detail tab actions and exposes 44px tab targets', () => {
    const { onAction, rendered } = renderDetail();

    (['Timeline', 'Overview', 'Documents', 'Media'] as const).forEach((label) => {
      const tab = rendered.getByRole('tab', { name: label });
      expect(StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(44);
      fireEvent.press(tab);
    });

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      { type: 'select-project-detail-tab', tab: 'timeline' },
      { type: 'select-project-detail-tab', tab: 'overview' },
      { type: 'select-project-detail-tab', tab: 'documents' },
      { type: 'select-project-detail-tab', tab: 'media' },
    ]);
  });

  it.each(tabCases)('renders only the selected %s content', (tab, heading) => {
    const { rendered } = renderDetail({ selectedProjectDetailTab: tab });

    expect(rendered.getByText(heading)).toBeTruthy();
    tabCases
      .filter(([candidate]) => candidate !== tab)
      .forEach(([, otherHeading]) => expect(rendered.queryByText(otherHeading)).toBeNull());
    expect(rendered.getByRole('tab', { name: heading.replace('Project ', '').replace('facts', 'Overview').replace('timeline', 'Timeline').replace('documents', 'Documents').replace('media', 'Media') }).props.accessibilityState).toEqual({ selected: true });
  });

  it('shows the complete Timeline without secondary filter controls', () => {
    const { rendered } = renderDetail();

    expect(rendered.getByText('Inverter row commissioning review recorded')).toBeTruthy();
    expect(rendered.getByText('Amaravati Solar Commons field coordination')).toBeTruthy();
    expect(rendered.getByText('Inverter row commissioning brief')).toBeTruthy();

    expect(rendered.queryByRole('button', { name: 'Filter All updates' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Filter Milestones' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Filter Site updates' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Filter Documents' })).toBeNull();
  });

  it('shows the reviewed Amaravati field update once with shared Customer and Management state', () => {
    const { rendered } = renderDetail({
      activeRole: 'management',
      currentProgress: 68,
      fieldUpdateReviewed: true,
    });

    expect(rendered.getAllByText('Cabinet checks and inverter-row alignment')).toHaveLength(1);
    const update = rendered.getByTestId('reviewed-field-update');
    expect(within(update).getByText('68% delivery recorded')).toBeTruthy();
    expect(within(update).getByText('Today · Field update')).toBeTruthy();
    expect(rendered.getByRole('progressbar', { name: 'PROJECT DELIVERY: 68% delivery recorded' })).toBeTruthy();
  });

  it('renders only canonical generated media with visible Demo visual provenance', () => {
    const { rendered } = renderDetail({ selectedProjectDetailTab: 'media' });

    expect(rendered.getAllByText('Demo visual')).toHaveLength(4);
    expect(rendered.getAllByRole('image', { name: /Demo visual:/ })).toHaveLength(4);
  });

  it('keeps non-Amaravati Media coherent instead of exposing Amaravati-specific visuals', () => {
    const { rendered } = renderDetail(
      { selectedProjectDetailTab: 'media' },
      jest.fn(),
      'vijayawada-integrated-logistics-hub',
    );

    expect(rendered.getByText('Project media')).toBeTruthy();
    expect(rendered.getByText('No project media listed')).toBeTruthy();
    expect(rendered.getByText(/Vijayawada Integrated Logistics Hub has no generated project media/)).toBeTruthy();
    expect(rendered.queryByRole('image', { name: /Amaravati/ })).toBeNull();
  });

  it('renders a non-Amaravati catalog project with its own facts and catalog progress', () => {
    const { rendered } = renderDetail(
      { currentProgress: 68, fieldUpdateReviewed: true, selectedProjectDetailTab: 'overview' },
      jest.fn(),
      'vijayawada-integrated-logistics-hub',
    );

    expect(rendered.getByText('Vijayawada Integrated Logistics Hub')).toBeTruthy();
    expect(rendered.getAllByText('Vijayawada, Andhra Pradesh')).toHaveLength(2);
    expect(rendered.getAllByText('Freight yard works')).toHaveLength(2);
    expect(rendered.getByText('Warehouse systems review')).toBeTruthy();
    expect(rendered.getByRole('progressbar', { name: 'PROJECT DELIVERY: 62% delivery recorded' })).toBeTruthy();
    expect(rendered.queryByText('Cabinet checks and inverter-row alignment')).toBeNull();
  });
});
