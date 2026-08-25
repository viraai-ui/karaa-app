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
    const rendered = shell();
    expect(rendered.getByText('FIELD EMPLOYEE')).toBeTruthy();
    expect(rendered.getByText('Ready to check in')).toBeTruthy();
    expect(rendered.getByText('Check in, verify your location and manage your day on site.')).toBeTruthy();
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

  it('requires a long press and transitions to an accessible checked-in state', () => {
    const rendered = render(<AttendanceView />);
    const control = rendered.getByRole('button', { name: 'Long press to check in' });
    expect(StyleSheet.flatten(control.props.style).height).toBeGreaterThanOrEqual(44);
    fireEvent.press(control);
    expect(rendered.getByText('Ready to check in')).toBeTruthy();
    fireEvent(control, 'longPress');
    expect(rendered.getAllByText('Checked in').length).toBeGreaterThanOrEqual(1);
    expect(rendered.getByText('Checked in successfully')).toBeTruthy();
    expect(rendered.getByTestId('attendance-feedback').props.children).toContain('Checked in successfully');
    expect(rendered.getByLabelText('Checked in at Amaravati Solar Commons').props.accessibilityState).toEqual({ disabled: true });
  });

  it('offers an assistive-technology activation path without weakening long-press touch behavior', () => {
    const rendered = render(<AttendanceView />);
    const control = rendered.getByRole('button', { name: 'Long press to check in' });
    expect(control.props.accessibilityActions).toEqual([{ name: 'activate', label: 'Check in' }]);
    fireEvent(control, 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(rendered.getByLabelText('Checked in at Amaravati Solar Commons')).toBeDisabled();
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
