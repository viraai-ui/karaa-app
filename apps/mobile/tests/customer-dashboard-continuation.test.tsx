import { fireEvent, render } from '@testing-library/react-native';

import { DemoExplorer, selectLatestProgressProject, selectWatchProjects } from '../src/demo/DemoExplorer';
import { portfolioForProjectId } from '../src/demo/subvertical-projects';
import { createOfflineDemoState, offlineDemoReducer } from '../src/demo/offline-demo';
import { customerPortfolioProjectAction, customerPortfolioProjects } from '../src/demo/CustomerPortfolio';

describe('customer dashboard continuation', () => {
  it('renders every canonical portfolio project and preserves its destination', () => {
    const onAction = jest.fn();
    const screen = render(<DemoExplorer onAction={onAction} random={() => 0} state={createOfflineDemoState('customer')} />);

    customerPortfolioProjects.forEach(project => {
      expect(screen.getByText(project.name)).toBeTruthy();
      expect(screen.getByText(project.location)).toBeTruthy();
      expect(screen.getByRole('progressbar', { name: `${project.name} progress: ${project.progress}%` }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: project.progress });
      fireEvent.press(screen.getByRole('button', { name: `Open ${project.name}, ${project.progress} percent complete, ${project.status.toLowerCase()}` }));
    });

    expect(onAction.mock.calls.map(([action]) => action)).toEqual(customerPortfolioProjects.map(customerPortfolioProjectAction));
  });

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
    const latest = selectLatestProgressProject(random, new Set(selected.map(project => project.id)));
    const screen = render(<DemoExplorer onAction={onAction} random={random} state={createOfflineDemoState('customer')} />);

    selected.forEach(project => fireEvent.press(screen.getByRole('button', { name: `Open ${project.name} project` })));
    fireEvent.press(screen.getByRole('button', { name: 'Open My Portfolio' }));
    expect(screen.queryByRole('button', { name: 'View all Projects to watch' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: `Open ${latest.name} latest progress` }));
    fireEvent.press(screen.getByRole('button', { name: 'View all Latest Progress' }));
    fireEvent.press(screen.getByRole('button', { name: `Open Track Progress for ${latest.name}` }));
    fireEvent.press(screen.getByRole('button', { name: `Open Milestones for ${latest.name}` }));
    fireEvent.press(screen.getByRole('button', { name: `Open Media Gallery for ${latest.name}` }));
    fireEvent.press(screen.getByRole('button', { name: `Open Notices for ${latest.name}` }));

    expect(onAction.mock.calls.map(([action]) => action)).toEqual([
      ...selected.map(project => ({ type: 'open-dashboard-project', projectId: project.id, tab: 'timeline' })),
      { type: 'select-tab', tab: 'portfolio' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'timeline' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'media' },
      { type: 'open-dashboard-project', projectId: latest.id, tab: 'documents' },
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

  it('selects Latest Progress from a real project outside the watch carousel', () => {
    const watched = selectWatchProjects(() => 0);
    const latest = selectLatestProgressProject(() => 0, new Set(watched.map(project => project.id)));
    expect(watched.map(project => project.id)).not.toContain(latest.id);
    expect(portfolioForProjectId(latest.id).projects).toContainEqual(expect.objectContaining({ id: latest.id }));
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
