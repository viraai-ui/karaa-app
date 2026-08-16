import * as React from 'react';
import { fireEvent, render, within } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { OfflineManagementViews } from '../src/demo/OfflineManagementViews';
import { demoProjects, demoVerticals } from '../src/demo/demo-catalog';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  offlineRoleTabs,
  type OfflineDemoAction,
  type OfflineDemoState,
} from '../src/demo/offline-demo';

function reduce(state: OfflineDemoState, action: unknown): OfflineDemoState {
  return offlineDemoReducer(state, action as OfflineDemoAction);
}

function ManagementHarness({ tab = 'command', seed }: { tab?: 'command' | 'map'; seed?: OfflineDemoState }) {
  const initial = seed ?? { ...createOfflineDemoState('management'), selectedTab: tab };
  const [state, dispatch] = React.useReducer(offlineDemoReducer, initial);
  return (
    <>
      <OfflineManagementViews onAction={dispatch} state={state} />
      <Text testID="management-state-probe">
        {JSON.stringify({
          selectedTab: state.selectedTab,
          surface: state.surface,
          selectedMapProjectId: state.selectedMapProjectId,
          selectedEmployeeId: state.selectedEmployeeId,
          selectedChatThreadId: state.selectedChatThreadId,
        })}
      </Text>
    </>
  );
}

describe('Management Command Centre and Geo Location', () => {

  it('selects Amaravati and Dev Employee before handing off to the shared unread-cleared direct Chat thread', () => {
    let state = reduce(createOfflineDemoState('management'), { type: 'select-tab', tab: 'map' });
    const originalMessageCount = state.chatThreads.find((thread) => thread.id === 'dev-direct')!.messages.length;

    expect(() => reduce(createOfflineDemoState('employee'), { type: 'select-map-project', projectId: 'amaravati-solar-commons' })).toThrow(/Senior Management/);

    state = reduce(state, { type: 'select-map-project', projectId: 'amaravati-solar-commons' });
    expect(state).toEqual(expect.objectContaining({ surface: 'map-detail', selectedMapProjectId: 'amaravati-solar-commons' }));
    expect(() => reduce(state, { type: 'select-map-project', projectId: 'unknown-project' })).toThrow(/Unknown demo project/);

    state = reduce(state, { type: 'select-map-employee', employeeId: 'dev-employee' });
    expect(state).toEqual(expect.objectContaining({ selectedEmployeeId: 'dev-employee' }));
    expect(() => reduce(state, { type: 'select-map-employee', employeeId: 'unknown-employee' })).toThrow(/Unknown management employee/);

    state = reduce(state, { type: 'message-map-employee', employeeId: 'dev-employee' });
    expect(state).toEqual(expect.objectContaining({ selectedTab: 'chat', surface: 'chat-thread', selectedChatThreadId: 'dev-direct' }));
    expect(state.chatThreads.find((thread) => thread.id === 'dev-direct')!.unreadByRole.management).toBe(0);
    expect(state.chatThreads.find((thread) => thread.id === 'dev-direct')!.messages).toHaveLength(originalMessageCount);
  });

  it('renders a clearly conceptual Geo schematic with a text legend and no prohibited location claims', () => {
    const rendered = render(<ManagementHarness tab="map" />);
    fireEvent.press(rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' }));

    expect(rendered.getByText('Demo visual')).toBeTruthy();
    expect(rendered.getByLabelText('Demo visual')).toBeTruthy();
    expect(rendered.queryByText(/GPS|live location|actual location|map tracking/i)).toBeNull();
    expect(rendered.queryByText(/offline|local session|bundled|reset|simulator|presentation/i)).toBeNull();
    (['Assigned', 'Manager', 'Attention', 'Unavailable'] as const).forEach((label) => {
      expect(rendered.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('keeps the map tab key while presenting the Geo Location label', () => {
    expect(offlineRoleTabs.management.find((tab) => tab.key === 'map')).toEqual(
      expect.objectContaining({ key: 'map', label: 'Geo Location' }),
    );
  });

  it('provides full-width 44px filters and selected states for meaningful Geo and panel controls', () => {
    const rendered = render(<ManagementHarness tab="map" />);
    const filters = ['All personnel', 'Field teams', 'Managers', 'Alerts'].map((name) => rendered.getByRole('tab', { name }));

    filters.forEach((control) => {
      const style = StyleSheet.flatten(control.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
      expect(style.flex).toBe(1);
    });
    expect(filters[0].props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(filters[1]);
    expect(rendered.getByRole('tab', { name: 'Field teams' }).props.accessibilityState).toEqual({ selected: true });
    expect(rendered.getByText('Showing Field teams')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' }));
    const project = rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' });
    expect(StyleSheet.flatten(project.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(project.props.accessibilityState).toEqual({ selected: true });

    const employee = rendered.getByRole('button', { name: 'Select Dev Employee' });
    expect(StyleSheet.flatten(employee.props.style).minHeight).toBeGreaterThanOrEqual(44);
    fireEvent.press(employee);
    expect(rendered.getByRole('button', { name: 'Select Dev Employee' }).props.accessibilityState).toEqual({ selected: true });
    expect(rendered.getByText('Inverter cabinet alignment & connection checks')).toBeTruthy();
  });

  it('filters Dev Employee out of Managers and Alerts without leaving hidden detail visible', () => {
    const rendered = render(<ManagementHarness tab="map" />);
    fireEvent.press(rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Select Dev Employee' }));
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();

    fireEvent.press(rendered.getByRole('tab', { name: 'Managers' }));
    expect(rendered.getByText('Showing Managers')).toBeTruthy();
    expect(rendered.getByText('No personnel match Managers')).toBeTruthy();
    expect(rendered.queryByRole('button', { name: 'Select Dev Employee' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Message Dev Employee' })).toBeNull();

    fireEvent.press(rendered.getByRole('tab', { name: 'Alerts' }));
    expect(rendered.getByText('Showing Alerts')).toBeTruthy();
    expect(rendered.getByText('No personnel match Alerts')).toBeTruthy();
    expect(rendered.queryByRole('button', { name: 'Select Dev Employee' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Message Dev Employee' })).toBeNull();
  });

  it('hides selected Geo project and employee detail while project search does not match', () => {
    const rendered = render(<ManagementHarness tab="map" />);
    fireEvent.press(rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Select Dev Employee' }));

    expect(rendered.getByText('Demo visual')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Select Dev Employee' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();

    fireEvent.changeText(rendered.getByLabelText('Search Geo Location'), 'nonmatching project');

    expect(rendered.getByText('No matching project coverage')).toBeTruthy();
    expect(rendered.queryByText('Demo visual')).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Select Dev Employee' })).toBeNull();
    expect(rendered.queryByText('Inverter cabinet alignment & connection checks')).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Message Dev Employee' })).toBeNull();

    fireEvent.changeText(rendered.getByLabelText('Search Geo Location'), 'Amaravati');
    expect(rendered.getByRole('button', { name: 'Select Dev Employee' }).props.accessibilityState).toEqual({ selected: true });
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();
  });

  it('shows Dev Employee for All personnel and Field teams using reducer selection', () => {
    const rendered = render(<ManagementHarness tab="map" />);
    fireEvent.press(rendered.getByRole('button', { name: 'Select Amaravati Solar Commons' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Select Dev Employee' }));

    fireEvent.press(rendered.getByRole('tab', { name: 'Managers' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Field teams' }));
    expect(rendered.getByText('Showing Field teams')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Select Dev Employee' }).props.accessibilityState).toEqual({ selected: true });
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();

    fireEvent.press(rendered.getByRole('tab', { name: 'All personnel' }));
    expect(rendered.getByText('Showing All personnel')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Select Dev Employee' }).props.accessibilityState).toEqual({ selected: true });
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();
  });

  it('dispatches the exact blocker and direct-message actions from visible controls', () => {
    const commandAction = jest.fn();
    const command = render(<OfflineManagementViews onAction={commandAction} state={{ ...createOfflineDemoState('management'), selectedTab: 'command' }} />);
    fireEvent.press(command.getByRole('button', { name: 'Assign Transformer delivery risk' }));
    expect(commandAction).toHaveBeenCalledWith({ type: 'assign-blocker', blockerId: 'commissioning-readiness', assignee: 'Mira Management' });

    const mapAction = jest.fn();
    const selectedMapState = {
      ...createOfflineDemoState('management'),
      selectedTab: 'map' as const,
      surface: 'map-detail' as const,
      selectedMapProjectId: 'amaravati-solar-commons',
      selectedEmployeeId: 'dev-employee',
    } as OfflineDemoState;
    const map = render(<OfflineManagementViews onAction={mapAction} state={selectedMapState} />);
    fireEvent.press(map.getByRole('button', { name: 'Message Dev Employee' }));
    expect(mapAction).toHaveBeenCalledWith({ type: 'message-map-employee', employeeId: 'dev-employee' });
  });
});
