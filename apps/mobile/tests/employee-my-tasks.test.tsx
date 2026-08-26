import { fireEvent, render } from '@testing-library/react-native';

import { EMPLOYEE_TASK_VISUAL_METRICS, OfflineEmployeeViews } from '../src/demo/OfflineEmployeeViews';
import { createOfflineDemoState } from '../src/demo/offline-demo';

const state = { ...createOfflineDemoState('employee'), selectedTab: 'tasks' as const };
const renderTasks = () => render(<OfflineEmployeeViews state={state} onAction={jest.fn()} />);

const titles = [
  'Capture inverter cabinet photos', 'Verify cable tagging', 'Upload alignment checklist',
  'Update row commissioning note', 'Mark cabinet 4A inspection', 'Submit safety observation', 'Confirm torque log',
];

describe('Employee My Tasks mock surface', () => {
  it('contains the exact package copy and seven-task inventory', () => {
    const screen = renderTasks();
    expect(screen.getByText('AMARAVATI SOLAR COMMONS')).toBeTruthy();
    expect(screen.getByText('My Tasks')).toBeTruthy();
    expect(screen.getByText('ACTIVE PACKAGE')).toBeTruthy();
    expect(screen.getByText('Inverter row commissioning')).toBeTruthy();
    expect(screen.getByText('22 Aug')).toBeTruthy();
    expect(screen.getByText('65%')).toBeTruthy();
    titles.forEach(title => expect(screen.getByText(title)).toBeTruthy());
    expect(EMPLOYEE_TASK_VISUAL_METRICS).toMatchObject({ minimumTarget: 44, pageGutter: 21, packageHeight: 203, filterWidths: [52, 78, 72, 95], taskRowHeight: 62, taskCount: 7, footerHeight: 89 });
  });

  it('filters pending, upload, and completed tasks', () => {
    const screen = renderTasks();
    fireEvent.press(screen.getByRole('tab', { name: 'Pending' }));
    expect(screen.getByText('Verify cable tagging')).toBeTruthy();
    expect(screen.queryByText('Confirm torque log')).toBeNull();
    fireEvent.press(screen.getByRole('tab', { name: 'Upload' }));
    expect(screen.getByText('Submit safety observation')).toBeTruthy();
    expect(screen.queryByText('Verify cable tagging')).toBeNull();
    fireEvent.press(screen.getByRole('tab', { name: 'Completed' }));
    titles.forEach(title => expect(screen.queryByText(title)).toBeNull());
  });

  it('opens upload and detail sheets and expands submissions', () => {
    const screen = renderTasks();
    fireEvent.press(screen.getByRole('button', { name: 'Upload Capture inverter cabinet photos' }));
    expect(screen.getByText('UPLOAD EVIDENCE')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close task sheet' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Verify cable tagging details' }));
    expect(screen.getByText('TASK DETAILS')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Close task sheet' }));
    expect(screen.queryByText('Row commissioning note')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'View all submissions' }));
    expect(screen.getByText('Row commissioning note')).toBeTruthy();
  });

  it('is role isolated from customer and management copy', () => {
    const screen = renderTasks();
    expect(screen.queryByText('My Portfolio')).toBeNull();
    expect(screen.queryByText('Command Centre')).toBeNull();
  });
});
