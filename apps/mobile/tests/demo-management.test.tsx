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
    expect(offlineRoleTabs.management.find((tab) => tab.key === 'map')).toEqual(expect.objectContaining({ label: 'Track' }));
    const screen = render(<Harness />);
    ['FIELD OPERATIONS', 'Updated 10:42 AM', '08', '3,912', '628', '12', '4,860'].forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
    expect(screen.queryByText('Select a project to view live workforce locations and site activity.')).toBeNull();
  });

  it('renders all six exact project identities and status details', () => {
    const screen = render(<Harness />);
    ['Aarohan Medical City', 'Amaravati Riverfront District', 'Surya Integrated Energy Park', 'Amaravati Integrated Logistics Hub', 'Sanjeevani Advanced Care Hospital', 'Karaa Lakeside Resort', '426', '782', '518', '694', '356', '214'].forEach((text) => expect(screen.getAllByText(text).length).toBeGreaterThan(0));
    ['Pune, Maharashtra', 'Vijayawada, Andhra Pradesh', 'Hyderabad, Telangana'].forEach((text) => expect(screen.getByText(new RegExp(text))).toBeTruthy());
    expect(screen.getAllByText('Open live map  ➤')).toHaveLength(6);
  });

  it('opens every project as a data-driven detail and returns to the project list', () => {
    const names = ['Aarohan Medical City', 'Amaravati Riverfront District', 'Surya Integrated Energy Park', 'Amaravati Integrated Logistics Hub', 'Sanjeevani Advanced Care Hospital', 'Karaa Lakeside Resort'];
    for (const name of names) {
      const screen = render(<Harness />);
      fireEvent.press(screen.getByRole('button', { name: `Open ${name}` }));
      expect(screen.getByTestId('live-workforce-map')).toBeTruthy();
      expect(screen.getByText(name)).toBeTruthy();
      fireEvent.press(screen.getByRole('button', { name: 'Back to Geo Location' }));
      expect(screen.getByText('Geo Location')).toBeTruthy();
      screen.unmount();
    }
  });

  it('matches Aarohan detail content and provides honest functional actions', () => {
    const screen = render(<Harness />);
    fireEvent.press(screen.getByRole('button', { name: 'Open Aarohan Medical City' }));
    ['LIVE WORKFORCE MAP','Pune, Maharashtra','Updated just now','Rohan Mehta','Project Manager','EMP-KG-0243','08:12 AM','06:30 PM','10:41 AM','8h 18m','Structural frame inspection','Clinical Block · East Wing','184m travelled today','View all 426 people →'].forEach(text=>expect(screen.getAllByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))).length).toBeGreaterThan(0));
    fireEvent.press(screen.getByRole('button',{name:'Refresh workforce map'}));
    expect(screen.getByText('Bundled map data refreshed')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Dismiss map notice'));
    for (const name of ['Map layers','Change map time','Zoom in','Zoom out','Recenter map','Open mini map layers','Select Rohan Mehta','Message Rohan Mehta','View full activity','More employee actions','View all 426 people']) expect(screen.getByRole('button',{name})).toBeTruthy();
    for (const name of ['All Personnel','Field Teams','Managers','Alerts']) expect(StyleSheet.flatten(screen.getByRole('tab',{name}).props.style).minHeight).toBeGreaterThanOrEqual(44);
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
    expect(screen.getAllByText('Updated 10:42 AM').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByRole('button', { name: 'Refresh data' }));
    expect(screen.queryByText(/prototype/i)).toBeNull();
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
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    }
    ['8 min ago', '14 min ago', '22 min ago'].forEach((time) => expect(screen.getByText(time)).toBeTruthy());
    fireEvent.press(screen.getByRole('button', { name: 'View all 12 alerts' }));
    expect(screen.getByText('Showing projects with location alerts.')).toBeTruthy();
  });

  it('preserves Geo Location filters and search after opening and returning from Aarohan', () => {
    const screen = render(<Harness />);
    fireEvent.press(screen.getByRole('tab', { name: 'On Track' }));
    fireEvent.changeText(screen.getByLabelText('Search Geo Location'), 'Aarohan');
    fireEvent.press(screen.getByRole('button', { name: 'Open Aarohan Medical City' }));
    fireEvent.press(screen.getByRole('button', { name: 'Back to Geo Location' }));
    expect(screen.getByRole('tab', { name: 'On Track' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Search Geo Location').props.value).toBe('Aarohan');
    expect(screen.getByText('Aarohan Medical City')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Open Surya Integrated Energy Park' })).toBeNull();
  });

  it('exercises every map control, marker, movement route, and employee action honestly', () => {
    const screen = render(<Harness />);
    fireEvent.press(screen.getByRole('button', { name: 'Open Aarohan Medical City' }));
    for (const name of ['Field Teams', 'Managers', 'Alerts', 'All Personnel']) fireEvent.press(screen.getByRole('tab', { name }));
    fireEvent.changeText(screen.getByLabelText('Search map personnel'), 'Rohan');
    for (const name of ['Select map marker 24', 'Select map marker 12', 'Select map marker 38', 'Select map marker !', 'Select Rohan Mehta']) fireEvent.press(screen.getByRole('button', { name }));
    for (const name of ['Map layers', 'Change map time', 'Zoom in', 'Zoom out', 'Recenter map', 'Open mini map layers', 'Message Rohan Mehta', 'Open movement 08:12 Check in', 'Open movement 09:05 Gate A', 'Open movement 10:18 Clinical Block', 'Open movement 10:41 East Wing', 'View full activity', 'Send message to Rohan Mehta', 'More employee actions', 'View all 426 people']) {
      fireEvent.press(screen.getByRole('button', { name }));
      expect(screen.queryByText(/Prototype preview only/)).toBeNull();
    }
  });

  it('keeps all interactive map targets at least 44px in one dimension', () => {
    const screen = render(<Harness />);
    fireEvent.press(screen.getByRole('button', { name: 'Open Aarohan Medical City' }));
    const names = ['Back to Geo Location', 'Refresh workforce map', 'Map layers', 'Change map time', 'Zoom in', 'Zoom out', 'Recenter map', 'Open mini map layers', 'Message Rohan Mehta', 'View full activity', 'Send message to Rohan Mehta', 'More employee actions', 'View all 426 people'];
    for (const name of names) {
      const style = StyleSheet.flatten(screen.getByRole('button', { name }).props.style);
      expect(Math.max(style.minHeight ?? style.height ?? 0, style.minWidth ?? style.width ?? 0)).toBeGreaterThanOrEqual(44);
    }
  });

  it('matches privacy copy and opens the honest tracking policy locally', () => {
    const screen = render(<Harness />);
    expect(screen.getByText('Authorised tracking only')).toBeTruthy();
    expect(screen.getByText('Live location is visible only during assigned work hours.')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Tracking policy' }));
    expect(screen.getAllByText('Authorised tracking only').length).toBeGreaterThan(0);
  });
});
