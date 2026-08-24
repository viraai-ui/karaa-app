import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineAppShell } from '../src/demo/OfflineAppShell';
import { CUSTOMER_NAV_INACTIVE } from '../src/demo/CustomerNavIcons';
import { SENIOR_MANAGEMENT_NAV_INACTIVE } from '../src/demo/SeniorManagementNavIcons';
import { colors } from '../src/theme/tokens';
import {
  createOfflineDemoState,
  offlineDemoReducer,
  offlineDemoStore,
  offlineRoleTabs,
  type OfflineDemoRole,
} from '../src/demo/offline-demo';

const canonical = {
  customer: ['Dashboard', 'Tenders', 'My Portfolio', 'Support'],
  employee: ['Attendance', 'My Projects', 'My Tasks', 'Chat'],
  management: ['Dashboard', 'Tenders', 'Command Centre', 'Geo Location', 'Chat'],
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

  it.each(['customer', 'employee', 'management'] as const)('%s shares the role-free premium shell', (role) => {
    const screen = render(<Shell role={role} />);
    expect(screen.getByTestId('karaa-brand-lockup')).toBeTruthy();
    expect(screen.getAllByLabelText('Karaa Global')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications, unread' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toHaveStyle({ height: 44, width: 44 });
    expect(screen.getByRole('button', { name: 'Notifications, unread' })).toHaveStyle({ height: 44, width: 44 });
    expect(screen.getByRole('button', { name: 'Switch workspace' })).toHaveStyle({ height: 44, width: 44 });
  });

  it.each(['customer', 'employee', 'management'] as const)('%s header utilities produce deterministic, dismissible outcomes', (role) => {
    const screen = render(<Shell role={role} />);
    fireEvent.press(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByLabelText('Search panel')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Search projects and tenders'), 'Aarohan');
    expect(screen.getByText('No saved demo results for “Aarohan”.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close search' }));
    fireEvent.press(screen.getByRole('button', { name: 'Notifications, unread' }));
    expect(screen.getByLabelText('Notifications panel')).toBeTruthy();
    expect(screen.getByLabelText('Unread: Aarohan Medical City field update is ready for review')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close notifications' }));
    expect(screen.queryByLabelText('Notifications panel')).toBeNull();
  });

  it('keeps back, compact brand, utilities, and workspace access in the customer vertical header', () => {
    const screen = render(<Shell role="customer" />);
    fireEvent.press(screen.getByRole('button', { name: 'Open Healthcare & Life Sciences vertical' }));
    expect(screen.getByRole('button', { name: 'Back to Power of 9' })).toBeTruthy();
    expect(screen.getByTestId('karaa-brand-crown')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications, unread' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Switch workspace' })).toBeTruthy();
  });

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

  it('renders the four customer-only reference icons in canonical order with visual semantics', () => {
    const screen = render(<Shell role="customer" />);
    const icons = ['power', 'tenders', 'portfolio', 'support'] as const;
    icons.forEach((key) => expect(screen.getByTestId(`customer-nav-icon-${key}`).props.accessible).toBe(false));
    expect(screen.getAllByTestId(/customer-nav-icon-power-tile-/)).toHaveLength(4);
    expect(screen.getByTestId('customer-nav-icon-power-tile-1')).toHaveStyle({ borderColor: colors.brass });
    expect(screen.getByTestId('customer-nav-icon-tenders').props.children.props.style[1].borderColor).toBe(CUSTOMER_NAV_INACTIVE);
  });

  it('switches customer icon colors and preserves icon order', () => {
    const screen = render(<Shell role="customer" />);
    fireEvent.press(screen.getByRole('tab', { name: 'Tenders' }));
    expect(screen.getByTestId('customer-nav-icon-power-tile-1')).toHaveStyle({ borderColor: CUSTOMER_NAV_INACTIVE });
    expect(screen.getByTestId('customer-nav-icon-tenders').props.children.props.style[1].borderColor).toBe(colors.brass);
    expect(bottomTabs(screen).map((tab) => tab.props.accessibilityLabel)).toEqual(canonical.customer);
  });

  it.each(['customer', 'employee', 'management'] as const)('keeps the %s canvas and footer role-scoped', (role) => {
    const screen = render(<Shell role={role} />);
    if (role === 'customer') {
      expect(screen.getByTestId('demo-content-viewport')).toHaveStyle({ backgroundColor: '#FFFFFF' });
      expect(screen.getByTestId('demo-bottom-navigation')).toHaveStyle({ backgroundColor: '#FFFFFF', marginHorizontal: 8 });
      expect(StyleSheet.flatten(screen.getByTestId('demo-bottom-navigation').props.style).overflow).toBeUndefined();
    } else {
      expect(screen.getByTestId('demo-content-viewport')).not.toHaveStyle({ backgroundColor: '#FFFFFF' });
      expect(screen.getByTestId('demo-bottom-navigation')).toHaveStyle({ backgroundColor: '#050605' });
    }
  });

  it('resets every stale customer nested route field from each canonical tab', () => {
    const stale = { ...createOfflineDemoState('customer'), surface: 'project' as const, selectedVerticalId: 'healthcare-life-sciences', selectedSubverticalId: 'multi-specialty-hospitals', selectedProjectId: 'aarohan-medical-city-pune', selectedProjectDetailTab: 'documents' as const, projectReturnTarget: 'portfolio' as const, selectedTenderId: 'metro-extension-package', selectedTenderDetailTab: 'docs' as const, selectedChatThreadId: 'customer-support-1' };
    (['power', 'tenders', 'portfolio', 'support'] as const).forEach((tab) => {
      expect(offlineDemoReducer(stale, { type: 'select-tab', tab })).toMatchObject({ selectedTab: tab, surface: 'root', selectedVerticalId: null, selectedSubverticalId: null, selectedProjectId: null, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'subvertical', selectedTenderId: null, selectedTenderDetailTab: 'updates', selectedChatThreadId: null });
    });
  });

  it.each(['employee', 'management'] as const)('does not leak customer icon components into %s navigation', (role) => {
    const screen = render(<Shell role={role} />);
    expect(screen.queryAllByTestId(/customer-nav-icon-/)).toHaveLength(0);
    offlineRoleTabs[role].forEach((tab) => expect(screen.getByTestId(role === 'management' ? `senior-management-nav-icon-${tab.key}` : `role-nav-icon-${tab.key}`)).toBeTruthy());
  });

  it('renders the five senior-management reference silhouettes and polished dashboard tiles', () => {
    const screen = render(<Shell role="management" />);
    const keys = ['power', 'tenders', 'command', 'map', 'chat'] as const;
    keys.forEach((key) => expect(screen.getByTestId(`senior-management-nav-icon-${key}`).props.accessible).toBe(false));
    expect(screen.getAllByTestId(/senior-management-nav-icon-power-tile-/)).toHaveLength(4);
    expect(screen.getByTestId('senior-management-nav-icon-power-tile-1')).toHaveStyle({ borderColor: colors.brass });
    expect(screen.getByTestId('senior-management-nav-document')).toHaveStyle({ borderColor: SENIOR_MANAGEMENT_NAV_INACTIVE });
    expect(screen.getAllByTestId(/senior-management-nav-gauge-tick-/)).toHaveLength(5);
  });

  it('switches senior-management icon and label color without changing canonical order', () => {
    const screen = render(<Shell role="management" />);
    fireEvent.press(screen.getByRole('tab', { name: 'Geo Location' }));
    expect(screen.getByTestId('senior-management-nav-icon-power-tile-1')).toHaveStyle({ borderColor: SENIOR_MANAGEMENT_NAV_INACTIVE });
    expect(screen.getByTestId('senior-management-nav-pin-outline')).toHaveStyle({ borderColor: colors.brass });
    expect(screen.getAllByText('Geo Location').at(-1)).toHaveStyle({ color: colors.brass });
    expect(bottomTabs(screen).map((tab) => tab.props.accessibilityLabel)).toEqual(canonical.management);
  });

  it.each(['customer', 'employee'] as const)('keeps senior-management icons isolated from %s navigation', (role) => {
    const screen = render(<Shell role={role} />);
    expect(screen.queryAllByTestId(/senior-management-nav-icon-/)).toHaveLength(0);
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
    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(true);
    expect(screen.queryByRole('tab', { name: 'My Tasks' })).toBeNull();
  });

  it('rejects cross-role tab selection in the state model', () => {
    expect(() => offlineDemoReducer(createOfflineDemoState('customer'), { type: 'select-tab', tab: 'command' })).toThrow(/not available/);
    expect(() => offlineDemoReducer(createOfflineDemoState('employee'), { type: 'select-tab', tab: 'support' })).toThrow(/not available/);
    expect(() => offlineDemoReducer(createOfflineDemoState('management'), { type: 'select-tab', tab: 'tasks' })).toThrow(/not available/);
  });

  it('opens Aarohan atomically from the real portfolio shell and returns to My Portfolio', () => {
    const screen = render(<Shell role="customer" />);
    fireEvent.press(screen.getByRole('tab', { name: 'My Portfolio' }));
    expect(screen.getByTestId('my-portfolio-page')).toBeTruthy();
    expect(() => fireEvent.press(screen.getByRole('button', { name: 'View project Aarohan Medical City' }))).not.toThrow();
    expect(offlineDemoStore.getState()).toMatchObject({
      selectedTab: 'portfolio', surface: 'project', selectedVerticalId: 'healthcare-life-sciences',
      selectedSubverticalId: 'multi-specialty-hospitals', selectedProjectId: 'aarohan-medical-city-pune', projectReturnTarget: 'portfolio',
    });
    fireEvent.press(screen.getByRole('button', { name: 'Back to My Portfolio' }));
    expect(screen.getByTestId('my-portfolio-page')).toBeTruthy();
    expect(offlineDemoStore.getState()).toMatchObject({ selectedTab: 'portfolio', surface: 'root', selectedProjectId: null });
  });
});
