import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AttendanceView, EMPLOYEE_ATTENDANCE_VISUAL_METRICS } from '../src/demo/OfflineEmployeeViews';
import { OfflineAppShell } from '../src/demo/OfflineAppShell';
import { offlineDemoStore } from '../src/demo/offline-demo';

function shell(width = 480) {
  offlineDemoStore.reset();
  return render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 1280 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}><OfflineAppShell role="employee" onSwitchRole={jest.fn()} /></SafeAreaProvider>);
}

describe('Employee attendance screenshot surface', () => {
  it('renders the target content and real employee shell navigation', () => {
    const rendered = shell(390);
    expect(rendered.getAllByText('Attendance')).toHaveLength(1);
    expect(rendered.queryByRole('heading', { name: 'Attendance' })).toBeNull();
    expect(rendered.queryByText('FIELD EMPLOYEE')).toBeNull();
    expect(rendered.getByText('Ready to check in')).toBeTruthy();
    expect(rendered.queryByText('Check in, verify your location and manage your day on site.')).toBeNull();
    expect(rendered.queryByText('Photo verification and live location will be confirmed after check-in.')).toBeNull();
    expect(rendered.queryByText('You are within the allowed site area.')).toBeNull();
    expect(rendered.getByText('CHECK IN')).toBeTruthy();
    expect(rendered.getByText('HOLD 0.8 SEC')).toBeTruthy();
    expect(rendered.getAllByText('Amaravati Solar Commons').length).toBeGreaterThanOrEqual(2);
    expect(rendered.getByText(/Geofence active/)).toBeTruthy();
    expect(rendered.getByText(/Today’s details/)).toBeTruthy();
    expect(rendered.getByText(/This week/)).toBeTruthy();
    expect(rendered.getByText(/Recent activity/)).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Attendance', selected: true })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'My Projects' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'My Tasks' })).toBeTruthy();
    expect(rendered.getByRole('tab', { name: 'Chat' })).toBeTruthy();
    expect(StyleSheet.flatten(rendered.getByTestId('demo-content-viewport').props.style).overflow).toBe('hidden');
    expect(rendered.getByTestId('demo-bottom-navigation')).toBeTruthy();
  });

  it('cancels an early release, then completes a long press exactly once at the injected time', () => {
    const clock = jest.fn(() => new Date(2026, 7, 26, 9, 7));
    const rendered = render(<AttendanceView now={clock} />);
    const control = rendered.getByRole('button', { name: 'Long press to check in' });
    expect(StyleSheet.flatten(control.props.style).height).toBeGreaterThanOrEqual(44);
    fireEvent.press(control);
    expect(rendered.getByText('Ready to check in')).toBeTruthy();
    fireEvent(control, 'pressIn');
    expect(rendered.getByTestId('attendance-progress-ring')).toBeTruthy();
    expect(rendered.getByText('Checking in')).toBeTruthy();
    expect(rendered.getByText('KEEP HOLDING')).toBeTruthy();
    fireEvent(control, 'pressOut');
    expect(rendered.queryByTestId('attendance-progress-ring')).toBeNull();
    expect(rendered.getByText('Ready to check in')).toBeTruthy();
    fireEvent(control, 'longPress');
    expect(rendered.getAllByText('Checked in').length).toBeGreaterThanOrEqual(1);
    expect(rendered.getByTestId('attendance-feedback').props.children).toContain('Checked in successfully');
    expect(rendered.getAllByText('09:07 AM IST').length).toBeGreaterThanOrEqual(1);
    expect(rendered.getByLabelText('Today, Checked in, 09:07 AM IST')).toBeTruthy();
    expect(rendered.getByRole('button', { name: 'Long press to check out' })).toBeTruthy();
    expect(rendered.getAllByLabelText(/Today, Checked in/)).toHaveLength(1);
    expect(clock).toHaveBeenCalledTimes(1);
  });

  it('offers an assistive-technology activation path without weakening long-press touch behavior', () => {
    const rendered = render(<AttendanceView />);
    const control = rendered.getByRole('button', { name: 'Long press to check in' });
    expect(control.props.accessibilityActions).toEqual([{ name: 'activate', label: 'Check in' }]);
    fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(rendered.getByRole('button', { name: 'Long press to check out' })).toBeTruthy();
  });

  it('checks in then out, ticks today, computes worked time, and prepends activity in order', () => {
    const times = [new Date(2026, 7, 26, 9, 0), new Date(2026, 7, 26, 17, 31)];
    const rendered = render(<AttendanceView now={() => times.shift() ?? new Date(2026, 7, 26, 17, 31)} />);
    fireEvent(rendered.getByTestId('attendance-check-in-control'), 'longPress');
    expect(rendered.getByTestId('attendance-weekly-summary')).toBeTruthy();
    expect(rendered.getAllByText('✓').length).toBeGreaterThanOrEqual(4);
    fireEvent(rendered.getByTestId('attendance-check-in-control'), 'longPress');
    expect(rendered.getAllByText('Checked out').length).toBeGreaterThanOrEqual(1);
    expect(rendered.getByText('08h 31m')).toBeTruthy();
    const activity = rendered.getByTestId('attendance-recent-activity');
    const labels = activity.findAll(node => typeof node.props.accessibilityLabel === 'string').map(node => node.props.accessibilityLabel as string);
    const todayLabels = [...new Set(labels.filter(label => label.startsWith('Today,')))];
    expect(todayLabels).toEqual(['Today, Checked out, 05:31 PM IST', 'Today, Checked in, 09:00 AM IST']);
    expect(rendered.getByLabelText('Yesterday, Checked out, 06:14 PM')).toBeTruthy();
  });

  it('does not expose non-interactive activity history as dead buttons', () => {
    const rendered = render(<AttendanceView />);
    expect(rendered.queryByRole('button', { name: 'Yesterday, Checked out, 06:14 PM' })).toBeNull();
    expect(rendered.getByLabelText('Yesterday, Checked out, 06:14 PM')).toBeTruthy();
  });

  it('provides feedback for View all and publishes narrow viewport contracts', () => {
    const rendered = render(<AttendanceView />);
    fireEvent.press(rendered.getByRole('button', { name: 'View all recent activity' }));
    expect(rendered.getByText('All recent attendance activity is shown.')).toBeTruthy();
    expect(EMPLOYEE_ATTENDANCE_VISUAL_METRICS.supportedWidths).toEqual([320, 360, 390, 480]);
    expect(EMPLOYEE_ATTENDANCE_VISUAL_METRICS.minimumTarget).toBeGreaterThanOrEqual(44);
    for (const width of EMPLOYEE_ATTENDANCE_VISUAL_METRICS.supportedWidths) {
      expect(width).toBeGreaterThanOrEqual(320);
    }
  });
});
