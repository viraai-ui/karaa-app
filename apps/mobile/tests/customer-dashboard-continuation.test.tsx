import { fireEvent, render } from '@testing-library/react-native';

import { DemoExplorer, selectWatchProjects } from '../src/demo/DemoExplorer';
import { portfolioForProjectId } from '../src/demo/subvertical-projects';
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
    const random = () => 0;
    const selected = selectWatchProjects(random);
    const screen = render(<DemoExplorer onAction={onAction} random={random} state={createOfflineDemoState('customer')} />);

    selected.forEach(project => fireEvent.press(screen.getByRole('button', { name: `Open ${project.name} project` })));
    fireEvent.press(screen.getByRole('button', { name: 'Open My Portfolio' }));
    fireEvent.press(screen.getByRole('button', { name: 'View all Projects to watch' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Smart Mobility Corridor latest progress' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Amaravati Smart Mobility Corridor important notice' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Track Progress for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Milestones for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Media Gallery for Amaravati Smart Mobility Corridor' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open Notices for Amaravati Smart Mobility Corridor' }));

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      ...selected.map(project => ({ type: 'open-dashboard-project', projectId: project.id, tab: 'timeline' })),
      { type: 'select-tab', tab: 'portfolio' },
      { type: 'select-vertical', verticalId: 'infrastructure-urban-development' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'documents' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'media' },
      { type: 'open-dashboard-project', projectId: 'amaravati-smart-mobility-corridor', tab: 'documents' },
    ]);
    expect(screen.getAllByRole('button', { name: /Open .* project$/ })).toHaveLength(4);
    expect(screen.getByRole('progressbar', { name: `${selected[0].name} progress: ${selected[0].progress}%` }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: selected[0].progress });
  });

  it('selects four unique real catalogue records deterministically without mutating the catalogue', () => {
    const first = selectWatchProjects(() => 0);
    const repeated = selectWatchProjects(() => 0);
    expect(first).toEqual(repeated);
    expect(first).toHaveLength(4);
    expect(new Set(first.map(project => project.id)).size).toBe(4);
    expect(new Set(first.map(project => project.verticalId)).size).toBe(4);
    expect(new Set(first.map(project => project.subverticalId)).size).toBe(4);
    first.forEach(project => expect(portfolioForProjectId(project.id).projects).toContainEqual(expect.objectContaining({ id: project.id })));
  });

  it('keeps its random selection stable across rerenders', () => {
    const random = jest.fn(() => 0.5);
    const screen = render(<DemoExplorer onAction={jest.fn()} random={random} state={createOfflineDemoState('customer')} />);
    const initialCalls = random.mock.calls.length;
    const names = screen.getAllByRole('button', { name: /Open .* project$/ }).map(node => node.props.accessibilityLabel);
    screen.rerender(<DemoExplorer onAction={jest.fn()} random={random} state={createOfflineDemoState('customer')} />);
    expect(screen.getAllByRole('button', { name: /Open .* project$/ }).map(node => node.props.accessibilityLabel)).toEqual(names);
    expect(random).toHaveBeenCalledTimes(initialCalls);
  });

  it('opens a real catalogue card on its universal timeline and returns to Dashboard', () => {
    const selected = selectWatchProjects(() => 0)[0];
    const initial = createOfflineDemoState('customer');
    const project = offlineDemoReducer(initial, { type: 'open-dashboard-project', projectId: selected.id });
    const portfolio = portfolioForProjectId(selected.id);
    expect(project).toMatchObject({ surface: 'project', selectedVerticalId: portfolio.verticalId, selectedSubverticalId: portfolio.id, selectedProjectId: selected.id, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'dashboard' });
    const onAction = jest.fn();
    const screen = render(<DemoExplorer onAction={onAction} state={project} />);
    expect(screen.getByRole('tab', { name: 'Timeline' }).props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(screen.getByRole('button', { name: 'Back to Dashboard' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'return-to-subvertical' });
    expect(offlineDemoReducer(project, { type: 'return-to-subvertical' })).toMatchObject({ selectedTab: 'power', surface: 'root', selectedProjectId: null });
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
