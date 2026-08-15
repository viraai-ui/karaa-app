import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { ApiError } from '../src/lib/api';
import { ManagementWorkspace } from '../src/features/management/ManagementWorkspace';
import type { ManagementSummary } from '../src/features/management/management-api';

const summary: ManagementSummary = {
  projects: [{
    id: '20000001-0000-4000-8000-000000000001',
    name: 'Amaravati Solar Commons',
    verticalName: 'Renewable Infrastructure',
    showcase: true,
    progress: 65,
    latestUpdateAt: '2026-08-11T08:16:00.000Z',
    openIssueCount: 1,
    priority: 'attention',
    assignees: [{ id: '30000002-0000-4000-8000-000000000002', displayName: 'Dev Employee' }],
    issues: [{
      id: '80000001-0000-4000-8000-000000000001',
      projectId: '20000001-0000-4000-8000-000000000001',
      description: 'East-array clearance needs a commissioning check.',
      assigneeId: '30000002-0000-4000-8000-000000000002',
      assigneeName: 'Dev Employee',
      dueAt: '2026-08-13T12:00:00.000Z',
      rootCause: 'Clearance sign-off is not attached to the field record.',
      status: 'open',
      createdAt: '2026-08-11T09:00:00.000Z',
      resolvedAt: null,
    }],
  }],
};

describe('ManagementWorkspace', () => {
  it('renders authenticated portfolio evidence and resolves a persisted management intervention', async () => {
    const resolveIssue = jest.fn().mockResolvedValue(undefined);
    const loadSummary = jest.fn().mockResolvedValue(summary);
    const rendered = render(
      <ManagementWorkspace loadSummary={loadSummary} resolveIssue={resolveIssue} />,
    );

    expect((await rendered.findAllByText('Amaravati Solar Commons')).length).toBeGreaterThan(0);
    expect(rendered.getByText('open intervention')).toBeTruthy();
    expect(rendered.getByText('East-array clearance needs a commissioning check.')).toBeTruthy();
    expect(rendered.getByText(/Owner:/)).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Resolve intervention' }));

    await waitFor(() => {
      expect(resolveIssue).toHaveBeenCalledWith('80000001-0000-4000-8000-000000000001');
      expect(loadSummary).toHaveBeenCalledTimes(2);
    });
  });

  it('renders a server-recorded simulated field location as a no-map provenance card', async () => {
    const loadProjectLocations = jest.fn().mockResolvedValue([{
      userId: '30000002-0000-4000-8000-000000000002',
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated' as const,
      recordedAt: '2026-08-11T18:43:16.990Z',
    }]);
    const rendered = render(
      <ManagementWorkspace loadSummary={async () => summary} loadProjectLocations={loadProjectLocations} />,
    );

    expect(await rendered.findByText('FIELD LOCATIONS')).toBeTruthy();
    expect(rendered.getAllByText('Dev Employee').length).toBeGreaterThan(1);
    expect(rendered.getByText('16.5062, 80.6480')).toBeTruthy();
    expect(rendered.getByText('Presentation simulator — not a real location')).toBeTruthy();
    expect(loadProjectLocations).toHaveBeenCalledWith('20000001-0000-4000-8000-000000000001');
  });

  it('renders fresh project and location records as updated, but stale records as last reported', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-12T00:00:30.000Z'));
    const loadProjectLocations = jest.fn().mockResolvedValue([{
      userId: '30000002-0000-4000-8000-000000000002',
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated' as const,
      recordedAt: '2026-08-12T00:00:20.000Z',
    }]);
    const fresh = render(
      <ManagementWorkspace
        loadSummary={async () => ({ projects: [{ ...summary.projects[0], latestUpdateAt: '2026-08-12T00:00:00.000Z' }] })}
        loadProjectLocations={loadProjectLocations}
      />,
    );

    expect((await fresh.findByTestId('priority-project-freshness')).props.children).toContain('Updated 30 seconds ago');
    expect((await fresh.findByTestId('field-location-freshness-30000002-0000-4000-8000-000000000002')).props.children).toBe('Updated 10 seconds ago');
    fresh.unmount();

    const stale = render(
      <ManagementWorkspace
        loadSummary={async () => ({ projects: [{ ...summary.projects[0], latestUpdateAt: '2026-08-10T00:00:00.000Z' }] })}
        loadProjectLocations={async () => [{
          userId: '30000002-0000-4000-8000-000000000002',
          displayName: 'Dev Employee',
          latitude: 16.5062,
          longitude: 80.648,
          state: 'simulated' as const,
          recordedAt: '2026-08-09T00:00:00.000Z',
        }]}
      />,
    );

    expect((await stale.findByTestId('priority-project-freshness')).props.children).toContain('Last reported 10 Aug 2026');
    expect((await stale.findByTestId('field-location-freshness-30000002-0000-4000-8000-000000000002')).props.children).toBe('Last reported 9 Aug 2026');
    now.mockRestore();
  });

  it('opens a persisted direct thread for the selected employee before loading and sending within that exact thread', async () => {
    const openedConversation = {
      id: '90000001-0000-4000-8000-000000000001',
      projectId: summary.projects[0].id,
      createdAt: '2026-08-11T09:00:00.000Z',
      messages: [],
    };
    const loadedConversation = {
      ...openedConversation,
      messages: [{
        id: '91000001-0000-4000-8000-000000000001',
        conversationId: openedConversation.id,
        senderId: summary.projects[0].assignees[0].id,
        body: 'The inverter clearance photo is ready for review.',
        createdAt: '2026-08-11T09:05:00.000Z',
      }],
    };
    const openDirectConversation = jest.fn().mockResolvedValue({
      conversation: openedConversation,
      currentUserId: '30000003-0000-4000-8000-000000000003',
    });
    const loadDirectConversation = jest.fn().mockResolvedValue(loadedConversation);
    const sendDirectMessage = jest.fn().mockResolvedValue(undefined);
    const rendered = render(
      <ManagementWorkspace
        loadSummary={async () => summary}
        loadDirectConversation={loadDirectConversation}
        openDirectConversation={openDirectConversation}
        sendDirectMessage={sendDirectMessage}
      />,
    );

    expect((await rendered.findAllByText('Amaravati Solar Commons')).length).toBeGreaterThan(0);
    expect(openDirectConversation).not.toHaveBeenCalled();
    fireEvent.press(rendered.getByRole('button', { name: 'Open direct thread with Dev Employee' }));

    expect(await rendered.findByText('The inverter clearance photo is ready for review.')).toBeTruthy();
    expect(openDirectConversation).toHaveBeenCalledWith(
      '20000001-0000-4000-8000-000000000001',
      '30000002-0000-4000-8000-000000000002',
    );
    expect(loadDirectConversation).toHaveBeenCalledWith(
      '20000001-0000-4000-8000-000000000001',
      '90000001-0000-4000-8000-000000000001',
    );

    fireEvent.changeText(rendered.getByLabelText('Project reply'), 'Please attach it to today’s field record.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send project reply' }));
    await waitFor(() => expect(sendDirectMessage).toHaveBeenCalledWith(
      '90000001-0000-4000-8000-000000000001',
      'Please attach it to today’s field record.',
    ));
  });

  it('prefers a showcase project with an assigned field employee over an earlier unassigned showcase project', async () => {
    const actionableProject = {
      ...summary.projects[0],
      issues: [],
      openIssueCount: 0,
      priority: 'healthy' as const,
    };
    const unassignedShowcase = {
      ...actionableProject,
      id: '20000002-0000-4000-8000-000000000002',
      name: 'Kondapalli Logistics Yard',
      assignees: [],
    };
    const rendered = render(
      <ManagementWorkspace loadSummary={async () => ({ projects: [unassignedShowcase, actionableProject] })} />,
    );

    expect(await rendered.findByRole('button', { name: 'Open direct thread with Dev Employee' })).toBeTruthy();
  });

  it('refetches the canonical management summary after an authorized project notification', async () => {
    let notify: ((eventName: string, payload: unknown) => void) | undefined;
    const refreshedSummary: ManagementSummary = { projects: [{ ...summary.projects[0], progress: 71 }] };
    const loadSummary = jest.fn()
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce(refreshedSummary);
    const rendered = render(
      <ManagementWorkspace
        loadSummary={loadSummary}
        loadRealtimeSession={async () => ({ token: 'server-issued-token', user: { role: 'management' } })}
        subscribeRealtime={({ onEvent }) => {
          notify = onEvent;
          return () => undefined;
        }}
      />,
    );

    expect((await rendered.findAllByText(/65.*delivery recorded/)).length).toBeGreaterThan(0);
    await waitFor(() => expect(notify).toBeDefined());
    await act(async () => {
      notify?.('project.progress_changed', { progress: 999, projectId: 'untrusted' });
    });

    expect((await rendered.findAllByText(/71.*delivery recorded/)).length).toBeGreaterThan(0);
    expect(rendered.queryByText('999% delivery recorded')).toBeNull();
    expect(loadSummary).toHaveBeenCalledTimes(2);
  });

  it('shows a truthful retry state instead of a decorative dashboard when the API is unavailable', async () => {
    const loadSummary = jest.fn()
      .mockRejectedValueOnce(new ApiError('OFFLINE', 'Connection unavailable — try again.'))
      .mockResolvedValueOnce(summary);
    const rendered = render(<ManagementWorkspace loadSummary={loadSummary} />);

    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Retry command centre' }));
    expect((await rendered.findAllByText('Amaravati Solar Commons')).length).toBeGreaterThan(0);
    expect(loadSummary).toHaveBeenCalledTimes(2);
  });
});
