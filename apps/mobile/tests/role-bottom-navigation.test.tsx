import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineAppShell } from '../src/demo/OfflineAppShell';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  offlineDemoStore,
  offlineRoleTabs,
  type OfflineDemoRole,
} from '../src/demo/offline-demo';

const canonical = {
  customer: ['Power of 9', 'Tenders', 'My Portfolio', 'Support'],
  employee: ['Attendance', 'My Projects', 'My Tasks', 'Chat'],
  management: ['Power of 9', 'Tenders', 'Command Centre', 'Geo Location', 'Chat'],
} as const;

function Shell({ role, onSwitchRole = jest.fn() }: { role: OfflineDemoRole; onSwitchRole?: (role: OfflineDemoRole) => void }) {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}><OfflineAppShell role={role} onSwitchRole={onSwitchRole} /></SafeAreaProvider>;
}

function bottomTabs(screen: ReturnType<typeof render>) {
  const labels = new Set(Object.values(canonical).flat());
  return screen.getAllByRole('tab').filter((tab) => labels.has(tab.props.accessibilityLabel));
}

describe('canonical role bottom navigation', () => {
  beforeEach(() => offlineDemoStore.reset());
  afterEach(() => { cleanup(); offlineDemoStore.reset(); });

  it.each(Object.entries(canonical) as [OfflineDemoRole, readonly string[]][])('%s has only its canonical ordered tabs and count', (role, labels) => {
    const screen = render(<Shell role={role} />);
    const tabs = bottomTabs(screen);
    expect(tabs).toHaveLength(labels.length);
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual(labels);
    expect(tabs.filter((tab) => tab.props.accessibilityState.selected)).toHaveLength(1);
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    const foreign = Object.entries(canonical).filter(([other]) => other !== role).flatMap(([, values]) => values).filter((label) => !labels.includes(label as never));
    foreign.forEach((label) => expect(screen.queryByRole('tab', { name: label })).toBeNull());
  });

  it('routes every Employee tab to its named surface and keeps exactly one active tab', () => {
    const screen = render(<Shell role="employee" />);
    for (const label of canonical.employee) {
      fireEvent.press(screen.getByRole('tab', { name: label }));
      expect(screen.getByRole('tab', { name: label }).props.accessibilityState.selected).toBe(true);
      expect(bottomTabs(screen).filter((tab) => tab.props.accessibilityState.selected)).toHaveLength(1);
      if (label !== 'Chat') expect(screen.getAllByText(label).length).toBeGreaterThan(1);
    }
  });

  it('resets nested state when changing tabs while preserving the owning active tab on detail back', () => {
    let state = createOfflineDemoState('management');
    state = offlineDemoReducer(state, { type: 'select-tab', tab: 'map' });
    state = offlineDemoReducer(state, { type: 'select-map-project', projectId: 'amaravati-solar-commons' });
    expect(state.selectedTab).toBe('map');
    expect(state.surface).toBe('map-detail');
    state = offlineDemoReducer(state, { type: 'back-to-root' });
    expect(state.selectedTab).toBe('map');
    state = offlineDemoReducer(state, { type: 'select-tab', tab: 'command' });
    expect(state).toMatchObject({ selectedTab: 'command', surface: 'root', selectedMapProjectId: null });
  });

  it('switches roles atomically to the canonical first tab without leaking the previous role', () => {
    const App = () => {
      const [role, setRole] = useState<OfflineDemoRole>('employee');
      return <Shell role={role} onSwitchRole={setRole} />;
    };
    const screen = render(<App />);
    fireEvent.press(screen.getByRole('tab', { name: 'My Tasks' }));
    fireEvent.press(screen.getByRole('button', { name: 'Switch workspace' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Senior Management workspace' }));
    expect(bottomTabs(screen).map((tab) => tab.props.accessibilityLabel)).toEqual(canonical.management);
    expect(screen.getByRole('tab', { name: 'Power of 9' }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByRole('tab', { name: 'My Tasks' })).toBeNull();
  });

  it('rejects cross-role tab selection in the state model', () => {
    expect(() => offlineDemoReducer(createOfflineDemoState('customer'), { type: 'select-tab', tab: 'command' })).toThrow(/not available/);
    expect(() => offlineDemoReducer(createOfflineDemoState('employee'), { type: 'select-tab', tab: 'support' })).toThrow(/not available/);
    expect(() => offlineDemoReducer(createOfflineDemoState('management'), { type: 'select-tab', tab: 'tasks' })).toThrow(/not available/);
  });
});
