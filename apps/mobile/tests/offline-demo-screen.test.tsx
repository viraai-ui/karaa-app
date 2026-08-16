import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineAppShell } from '../src/demo/OfflineAppShell';
import { offlineDemoStore } from '../src/demo/offline-demo';
import { OfflineCustomerViews } from '../src/demo/OfflineCustomerViews';
import { OfflineEmployeeViews } from '../src/demo/OfflineEmployeeViews';
import { OfflineManagementViews } from '../src/demo/OfflineManagementViews';
import { DemoImageFrame, DemoProgressRail } from '../src/demo/OfflineDemoPrimitives';
import { createOfflineDemoState } from '../src/demo/offline-demo';

function renderDemoShell(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}>
      {ui}
    </SafeAreaProvider>,
  );
}

describe('Karaa Global role demo surfaces', () => {
  it('renders a Karaa Global shell with a workspace switcher and no implementation badge', () => {
    const rendered = renderDemoShell(<OfflineAppShell role="employee" onSwitchRole={jest.fn()} />);

    expect(rendered.getByText('KARAA')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Switch workspace' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'My Work' })).toBeTruthy();
    expect(rendered.queryByText(/offline presentation|local session|presentation session/i)).toBeNull();
  });

  it('reserves safe-area clearance for the demo app bar and fixed navigation', () => {
    const rendered = render(
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 24, right: 0, bottom: 34, left: 0 },
      }}>
        <OfflineAppShell role="employee" onSwitchRole={jest.fn()} />
      </SafeAreaProvider>,
    );

    expect(StyleSheet.flatten(rendered.getByTestId('demo-app-bar').props.style).paddingTop).toBe(24);
    expect(StyleSheet.flatten(rendered.getByTestId('demo-content-viewport').props.style).overflow).toBe('hidden');
    expect(StyleSheet.flatten(rendered.getByTestId('demo-scroll-surface').props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(109);
    expect(StyleSheet.flatten(rendered.getByTestId('demo-bottom-navigation').props.style).paddingBottom).toBeGreaterThanOrEqual(42);
  });

  it('gives a selected chat thread a keyboard-safe viewport outside the page scroller', () => {
    offlineDemoStore.reset();
    const rendered = renderDemoShell(<OfflineAppShell role="employee" onSwitchRole={jest.fn()} />);

    fireEvent.press(rendered.getByRole('tab', { name: 'Chat' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Mira Management conversation' }));

    expect(rendered.queryByTestId('demo-scroll-surface')).toBeNull();
    expect(rendered.getByTestId('demo-chat-keyboard-surface')).toBeTruthy();
    expect(StyleSheet.flatten(rendered.getByTestId('chat-thread-page').props.style).flex).toBe(1);
    expect(StyleSheet.flatten(rendered.getByTestId('chat-thread-messages').props.style).flex).toBe(1);
    expect(rendered.getByTestId('chat-composer')).toBeTruthy();
    cleanup();
    offlineDemoStore.reset();
  });

  it('keeps only actionable header controls focusable and gives the workspace switcher a 44px target', () => {
    const rendered = renderDemoShell(<OfflineAppShell role="employee" onSwitchRole={jest.fn()} />);

    expect(rendered.queryByRole('button', { name: 'Search projects' })).toBeNull();
    expect(rendered.queryByRole('button', { name: 'Notifications' })).toBeNull();
    const switchWorkspaceStyle = StyleSheet.flatten(rendered.getByRole('button', { name: 'Switch workspace' }).props.style);
    expect(switchWorkspaceStyle.height).toBeGreaterThanOrEqual(44);
    expect(switchWorkspaceStyle.width).toBeGreaterThanOrEqual(44);

    fireEvent.press(rendered.getByRole('button', { name: 'Switch workspace' }));
    const closeStyle = StyleSheet.flatten(rendered.getByRole('button', { name: 'Close workspace switcher' }).props.style);
    expect(closeStyle.height).toBeGreaterThanOrEqual(44);
    expect(closeStyle.width).toBeGreaterThanOrEqual(44);
  });

  it('exposes resolved media geometry and a clamped accessible progress value', () => {
    const rendered = render(
      <>
        <DemoImageFrame accessibilityLabel="Demo visual: compact test" height={50} source={1} />
        <DemoImageFrame accessibilityLabel="Demo visual: ratio test" source={1} />
        <DemoProgressRail label="CURRENT DELIVERY" progress={138} />
      </>,
    );

    const compactVisual = StyleSheet.flatten(rendered.getByLabelText('Demo visual: compact test').props.style);
    expect(compactVisual.height).toBe(50);
    expect(compactVisual.width).toBe('100%');
    expect(rendered.getByLabelText('Demo visual: compact test').props.accessibilityRole).toBe('image');
    expect(StyleSheet.flatten(rendered.getByLabelText('Demo visual: ratio test').props.style).aspectRatio).toBe(16 / 9);
    const progress = rendered.getByRole('progressbar', { name: 'CURRENT DELIVERY: 100%' });
    expect(progress.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 100 });
  });

  it('adds horizontal safe-area insets without losing the Karaa content gutter', () => {
    const rendered = render(
      <SafeAreaProvider initialMetrics={{
        frame: { x: 0, y: 0, width: 844, height: 390 },
        insets: { top: 0, right: 10, bottom: 0, left: 14 },
      }}>
        <OfflineAppShell role="employee" onSwitchRole={jest.fn()} />
      </SafeAreaProvider>,
    );

    const contentStyle = StyleSheet.flatten(rendered.getByTestId('demo-scroll-surface').props.contentContainerStyle);
    expect(contentStyle.paddingLeft).toBeGreaterThanOrEqual(30);
    expect(contentStyle.paddingRight).toBeGreaterThanOrEqual(26);
  });

  it('moves Employee from My Work into a visual field-update review and activity result', () => {
    const rendered = renderDemoShell(<OfflineAppShell role="employee" onSwitchRole={jest.fn()} />);

    fireEvent.press(rendered.getByRole('tab', { name: 'My Work' }));
    expect(rendered.getByText('Current work package')).toBeTruthy();
    expect(rendered.getByText('Inverter row commissioning')).toBeTruthy();
    expect(StyleSheet.flatten(rendered.getByTestId('employee-work-progress-label').props.style).color).toBe('#FFFDF8');
    expect(StyleSheet.flatten(rendered.getByText('Project delivery').props.style).color).toBe('#D6D3CD');

    fireEvent.press(rendered.getByRole('button', { name: 'Record progress update' }));
    expect(rendered.getByText('Review field update')).toBeTruthy();
    expect(rendered.getByText('Demo visual')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Add update to project timeline' }));
    expect(rendered.getByText('Update added to project activity')).toBeTruthy();
    expect(rendered.getByText('68% delivery recorded')).toBeTruthy();
  });

  it('carries an Employee field update into Customer and Management after a workspace switch', () => {
    offlineDemoStore.reset();
    const App = () => {
      const [role, setRole] = useState<'employee' | 'customer' | 'management'>('employee');
      return <OfflineAppShell onSwitchRole={setRole} role={role} />;
    };
    const rendered = renderDemoShell(<App />);

    fireEvent.press(rendered.getByRole('tab', { name: 'My Work' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Record progress update' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Add update to project timeline' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Switch workspace' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Customer / Investor workspace' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'My Portfolio' }));
    expect(rendered.getByText('Aarohan Medical City')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Switch workspace' }));
    fireEvent.press(rendered.getByRole('button', { name: 'Open Senior Management workspace' }));
    fireEvent.press(rendered.getByRole('tab', { name: 'Command Centre' }));
    expect(rendered.getByText('Inverter row alignment has been added to the project activity.')).toBeTruthy();
    cleanup();
    offlineDemoStore.reset();
  });

  it('renders the Customer subscribed portfolio with labelled local project media without management controls', () => {
    const state = { ...createOfflineDemoState('customer'), currentProgress: 68, fieldUpdateReviewed: true, selectedTab: 'portfolio' as const };
    const rendered = render(<OfflineCustomerViews state={state} onAction={jest.fn()} />);

    expect(rendered.getByText('My Portfolio')).toBeTruthy();
    expect(rendered.getByText('Aarohan Medical City')).toBeTruthy();
    expect(rendered.getByLabelText('Aarohan Medical City project')).toBeTruthy();
    expect(rendered.getByTestId('portfolio-card-aarohan-medical-city-pune')).toBeTruthy();
    expect(rendered.queryByText('Geo Location')).toBeNull();
    expect(rendered.queryByText(/offline|local session|presentation session/i)).toBeNull();
  });

  it('renders Customer support ticket history and linked-conversation controls', () => {
    const state = { ...createOfflineDemoState('customer'), selectedTab: 'support' as const };
    const rendered = render(<OfflineCustomerViews state={state} onAction={jest.fn()} />);

    expect(rendered.getByText('Support')).toBeTruthy();
    expect(rendered.getByText('TICKET HISTORY')).toBeTruthy();
    expect(rendered.getByText('Commissioning checklist context')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Create support ticket' })).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Open SUP-001 support ticket' })).toBeTruthy();
    expect(rendered.queryByText('Karaa project team')).toBeNull();
  });

  it('renders the Management Command Centre blocker action', () => {
    const state = { ...createOfflineDemoState('management'), currentProgress: 68, fieldUpdateReviewed: true, selectedTab: 'command' as const };
    const onAction = jest.fn();
    const rendered = render(<OfflineManagementViews state={state} onAction={onAction} />);

    expect(rendered.getByText('Command Centre')).toBeTruthy();
    expect(rendered.getByText('Transformer delivery risk')).toBeTruthy();

    fireEvent.press(rendered.getByRole('button', { name: 'Assign Transformer delivery risk' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'assign-blocker', blockerId: 'commissioning-readiness', assignee: 'Mira Management' });
  });

  it('renders the field employee identity and conceptual evidence in Management Geo Location', () => {
    const state = {
      ...createOfflineDemoState('management'),
      selectedTab: 'map' as const,
      surface: 'map-detail' as const,
      selectedMapProjectId: 'amaravati-solar-commons',
      selectedEmployeeId: 'dev-employee',
    };
    const rendered = render(<OfflineManagementViews state={state} onAction={jest.fn()} />);

    expect(rendered.getByText('Geo Location')).toBeTruthy();
    expect(rendered.getAllByText('Dev Employee').length).toBeGreaterThan(0);
    expect(rendered.getAllByText('Demo visual').length).toBeGreaterThan(0);
    expect(rendered.getByRole('button', { name: 'Message Dev Employee' })).toBeTruthy();
  });
});
