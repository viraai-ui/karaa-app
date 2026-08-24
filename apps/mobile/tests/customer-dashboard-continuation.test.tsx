import { fireEvent, render } from '@testing-library/react-native';

import { DemoExplorer } from '../src/demo/DemoExplorer';
import { createOfflineDemoState, offlineDemoReducer } from '../src/demo/offline-demo';

describe('customer dashboard continuation', () => {
  it('is customer Dashboard-root only', () => {
    const customer = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState('customer')} />);
    expect(customer.getByTestId('customer-dashboard-continuation')).toBeTruthy();

    const management = render(<DemoExplorer onAction={jest.fn()} state={createOfflineDemoState('management')} />);
    expect(management.queryByTestId('customer-dashboard-continuation')).toBeNull();
  });

  it('wires cards, aggregate links, notices, and quick access to identified destinations', () => {
    const onAction = jest.fn();
    const screen = render(<DemoExplorer onAction={onAction} state={createOfflineDemoState('customer')} />);

    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Smart Mobility Corridor project' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Solar Commons project' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open My Portfolio' }));
    fireEvent.press(screen.getByRole('button', { name: 'View all Projects to watch' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Smart Mobility Corridor latest progress' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Smart Mobility Corridor important notice' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Track Progress for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Milestones for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Media Gallery for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Notices for Amaravati Smart Mobility Corridor' }));

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-solar-commons', tab: 'timeline' },
      { type: 'select-tab', tab: 'portfolio' },
      { type: 'select-vertical', verticalId: 'infrastructure-urban-development' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'documents' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'media' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'documents' },
    ]);
    expect(screen.getByRole('progressbar', { name: 'Amaravati Smart Mobility Corridor progress: 54%' }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: 54 });
  });

  it('opens a dashboard project atomically and returns reliably to Dashboard', () => {
    const initial = createOfflineDemoState('customer');
    const project = offlineDemoReducer(initial, { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'documents' });
    expect(project).toMatchObject({ surface: 'project', selectedVerticalId: 'infrastructure-urban-development', selectedSubverticalId: 'smart-mobility', selectedProjectId: 'amaravati-smart-mobility-corridor', selectedProjectDetailTab: 'documents', projectReturnTarget: 'dashboard' });

    const onAction = jest.fn();
    const screen = render(<DemoExplorer onAction={onAction} state={project} />);
    expect(screen.getByRole('tab', { name: 'Documents' }).props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(screen.getByRole('button', { name: 'Back to Dashboard' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'return-to-subvertical' });

    expect(offlineDemoReducer(project, { type: 'return-to-subvertical' })).toMatchObject({ selectedTab: 'power', surface: 'root', selectedProjectId: null, projectReturnTarget: 'subvertical' });
  });

  it('rejects dashboard deep links outside the customer Dashboard root', () => {
    expect(() => offlineDemoReducer(createOfflineDemoState('management'), { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor' })).toThrow('Customer Dashboard root');
    const portfolio = offlineDemoReducer(createOfflineDemoState('customer'), { type: 'select-tab', tab: 'portfolio' });
    expect(() => offlineDemoReducer(portfolio, { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor' })).toThrow('Customer Dashboard root');
  });
});
