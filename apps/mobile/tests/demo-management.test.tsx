import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { OfflineManagementViews } from '../src/demo/OfflineManagementViews';
import { createOfflineDemoState, offlineDemoReducer, offlineRoleTabs, type OfflineDemoAction } from '../src/demo/offline-demo';

function Harness() {
  const [state, dispatch] = React.useReducer(offlineDemoReducer, { ...createOfflineDemoState('management'), selectedTab: 'map' });
  return <OfflineManagementViews state={state} onAction={dispatch} />;
}

describe('Management Command Centre and Geo Location', () => {
  it('preserves management Geo reducer selection, validation, and direct-chat handoff coverage', () => {
    const reduce = (state: ReturnType<typeof createOfflineDemoState>, action: OfflineDemoAction) => offlineDemoReducer(state, action);
    let state = reduce(createOfflineDemoState('management'), { type: 'select-tab', tab: 'map' });
    const count = state.chatThreads.find((thread) => thread.id === 'dev-direct')!.messages.length;
    expect(() => offlineDemoReducer(createOfflineDemoState('employee'), { type: 'select-map-project', projectId: 'amaravati-solar-commons' })).toThrow(/Senior Management/);
    state = reduce(state, { type: 'select-map-project', projectId: 'amaravati-solar-commons' });
    expect(state).toEqual(expect.objectContaining({ surface: 'map-detail', selectedMapProjectId: 'amaravati-solar-commons' }));
    expect(() => reduce(state, { type: 'select-map-project', projectId: 'unknown-project' } as unknown as OfflineDemoAction)).toThrow(/Unknown demo project/);
    state = reduce(state, { type: 'select-map-employee', employeeId: 'dev-employee' });
    expect(() => reduce(state, { type: 'select-map-employee', employeeId: 'unknown-employee' } as unknown as OfflineDemoAction)).toThrow(/Unknown management employee/);
    state = reduce(state, { type: 'message-map-employee', employeeId: 'dev-employee' });
    expect(state).toEqual(expect.objectContaining({ selectedTab: 'chat', surface: 'chat-thread', selectedChatThreadId: 'dev-direct' }));
    expect(state.chatThreads.find((thread) => thread.id === 'dev-direct')!.messages).toHaveLength(count);
  });

  it('keeps the map tab contract and exact screenshot overview copy', () => {
    expect(offlineRoleTabs.management.find((tab) => tab.key === 'map')).toEqual(expect.objectContaining({ label: 'Geo Location' }));
    const screen = render(<Harness />);
    ['FIELD OPERATIONS', 'Select a project to view live workforce locations and site activity.', 'Updated 10:42 AM', '08', '3,912', '628', '12', '4,860'].forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
  });

  it('renders all six exact project identities and status details', () => {
    const screen = render(<Harness />);
    ['Aarohan Medical City', 'Amaravati Riverfront District', 'Surya Integrated Energy Park', 'Amaravati Integrated Logistics Hub', 'Sanjeevani Advanced Care Hospital', 'Karaa Lakeside Resort', '426', '782', '518', '694', '356', '214'].forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
    ['Pune, Maharashtra', 'Vijayawada, Andhra Pradesh', 'Hyderabad, Telangana'].forEach((text) => expect(screen.getByText(new RegExp(text))).toBeTruthy());
    expect(screen.getAllByText('Open live map  ➤')).toHaveLength(6);
  });

  it('searches and exposes an honest detail notice for every project', () => {
    const screen = render(<Harness />);
    fireEvent.changeText(screen.getByLabelText('Search Geo Location'), 'Hyderabad');
    expect(screen.getAllByText('Sanjeevani Advanced Care Hospital').length).toBeGreaterThan(0);
    expect(screen.queryByText('Karaa Lakeside Resort')).toBeNull();
    fireEvent.changeText(screen.getByLabelText('Search Geo Location'), '');
    ['Aarohan Medical City', 'Amaravati Riverfront District', 'Surya Integrated Energy Park', 'Amaravati Integrated Logistics Hub', 'Sanjeevani Advanced Care Hospital', 'Karaa Lakeside Resort'].forEach((name) => {
      fireEvent.press(screen.getByRole('button', { name: `Open ${name}` }));
      expect(screen.getByText(`${name} details opened locally. No live tracking connection is used.`)).toBeTruthy();
    });
  });

  it('filters all chips and keeps each chip a 44px semantic target', () => {
    const screen = render(<Harness />);
    for (const name of ['All Projects', 'On Track', 'Attention', 'Location Alerts']) {
      const chip = screen.getByRole('tab', { name });
      expect(StyleSheet.flatten(chip.props.style).minHeight).toBeGreaterThanOrEqual(44);
      fireEvent.press(chip);
      expect(screen.getByRole('tab', { name }).props.accessibilityState.selected).toBe(true);
    }
    expect(screen.getAllByText('Surya Integrated Energy Park').length).toBeGreaterThan(0);
    expect(screen.queryByText('Aarohan Medical City')).toBeNull();
  });

  it('exercises refresh, filter, sort, and view controls with local prototype semantics', () => {
    const screen = render(<Harness />);
    fireEvent.press(screen.getByRole('button', { name: 'Refresh location status' }));
    expect(screen.getByText(/refreshed locally at 10:42 AM/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Refresh data' }));
    expect(screen.getByText(/bundled prototype data/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Filter projects' }));
    expect(screen.getByRole('tab', { name: 'Location Alerts' }).props.accessibilityState.selected).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Sort projects' }));
    fireEvent.press(screen.getByRole('button', { name: 'Change project view' }));
    expect(screen.getByText(/Compact list view/)).toBeTruthy();
  });

  it('renders and opens all exact alerts plus View all', () => {
    const screen = render(<Harness />);
    for (const title of ['3 personnel outside geofence', '1 tracking device offline', '2 personnel near site boundary']) {
      fireEvent.press(screen.getByRole('button', { name: `Open alert ${title}` }));
      expect(screen.getByText(`${title} — prototype alert details only.`)).toBeTruthy();
    }
    ['8 min ago', '14 min ago', '22 min ago'].forEach((time) => expect(screen.getByText(time)).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'View all 12 alerts' }));
    expect(screen.getByText('Showing projects with location alerts.')).toBeTruthy();
  });

  it('matches privacy copy and opens the honest tracking policy locally', () => {
    const screen = render(<Harness />);
    expect(screen.getByText('Authorised tracking only')).toBeTruthy();
    expect(screen.getByText('Live location is visible only during assigned work hours.')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Tracking policy' }));
    expect(screen.getByText(/does not collect or transmit location data/)).toBeTruthy();
  });
});
