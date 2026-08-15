import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { EmployeeWorkspace } from '../src/features/employee/EmployeeWorkspace';

const projectId = '10000001-0000-4000-8000-000000000001';
const milestoneId = '11000001-0000-4000-8000-000000000001';
const employeeId = '30000002-0000-4000-8000-000000000002';

const session = {
  token: 'employee-token',
  user: {
    id: employeeId,
    email: 'dev.employee@karaa.demo',
    role: 'employee' as const,
    displayName: 'Dev Employee',
  },
};

const project = {
  id: projectId,
  name: 'Amaravati Solar Commons',
  verticalName: 'Construction',
  showcase: true,
  progress: 36,
};

const detail = {
  project,
  milestones: [{ id: milestoneId, projectId, name: 'Structural works', dueAt: null, weight: 1, progress: 36 }],
  updates: [{
    id: '12000001-0000-4000-8000-000000000001',
    eventId: '13000001-0000-4000-8000-000000000001',
    projectId,
    milestoneId,
    authorId: employeeId,
    occurredAt: '2026-08-12T08:00:00.000Z',
    serverTimestamp: '2026-08-12T08:00:01.000Z',
    latitude: 16.5062,
    longitude: 80.648,
    locationState: 'simulated',
    claimedProgress: 36,
    workDescription: 'Existing canonical update',
    nextAction: 'Continue structural checks',
    crewCount: 8,
    crewHours: 64,
    quantityValue: null,
    quantityUnit: null,
    siteConditions: 'Dry',
    blocker: null,
    media: [{
      id: '16000001-0000-4000-8000-000000000001',
      mediaPath: '/v1/media/16000001-0000-4000-8000-000000000001',
      mimeType: 'image/png',
      sizeBytes: 11,
    }],
  }],
  notifications: [],
  documents: [],
  paymentDemoRecords: [],
};

const conversation = {
  id: '14000001-0000-4000-8000-000000000001',
  projectId,
  kind: 'direct' as const,
  createdAt: '2026-08-12T08:00:00.000Z',
  messages: [{
    id: '15000001-0000-4000-8000-000000000001',
    conversationId: '14000001-0000-4000-8000-000000000001',
    senderId: '30000003-0000-4000-8000-000000000003',
    body: 'Please confirm the handover timing.',
    createdAt: '2026-08-12T08:00:00.000Z',
  }],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function installFetch(post: () => Response | Promise<Response> = () => json({ replayed: false }, 201)) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/v1/projects')) return json({ projects: [project] });
    if (url.endsWith(`/v1/projects/${projectId}`)) return json(detail);
    if (url.endsWith(`/v1/projects/${projectId}/conversations`)) return json({ conversations: [conversation] });
    if (url.endsWith('/v1/locations/current')) return json({
      userId: employeeId,
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-12T09:00:00.000Z',
    });
    if (url.endsWith('/v1/progress-updates')) return post();
    throw new Error(`Unexpected request ${url}`);
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

async function renderLoadedWorkspace() {
  render(<EmployeeWorkspace session={session} onSignOut={vi.fn()} />);
  await screen.findByRole('heading', { name: 'Publish progress update' });
}

async function completeRequiredFieldRecord() {
  fireEvent.change(screen.getByLabelText('Work completed'), { target: { value: 'Installed the north frame anchors.' } });
  fireEvent.change(screen.getByLabelText('Claimed progress (%)'), { target: { value: '44' } });
  fireEvent.change(screen.getByLabelText('Crew count'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Crew hours'), { target: { value: '42' } });
  fireEvent.change(screen.getByLabelText('Site conditions'), { target: { value: 'Dry access road.' } });
  fireEvent.change(screen.getByLabelText('Next action'), { target: { value: 'Inspect the completed anchors.' } });
  fireEvent.change(screen.getByLabelText('Evidence photo'), {
    target: { files: [new File(['photo bytes'], 'evidence.png', { type: 'image/png' })] },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Use simulated PC location' }));
  await screen.findByText('Field location saved to Karaa');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Employee browser workspace', () => {
  it('reads only canonical authorized project updates and existing messages', async () => {
    const fetcher = installFetch();

    await renderLoadedWorkspace();

    expect(screen.getByText('Amaravati Solar Commons')).toBeInTheDocument();
    expect(screen.getByText('Existing canonical update')).toBeInTheDocument();
    expect(screen.getByText('Please confirm the handover timing.')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith('/v1/projects', expect.objectContaining({
      headers: expect.objectContaining({ authorization: 'Bearer employee-token' }),
    }));
  });

  it('persists a selected simulated field location before allowing it to be attached to a field record', async () => {
    const fetcher = installFetch();
    await renderLoadedWorkspace();

    fireEvent.click(screen.getByRole('button', { name: 'Use simulated PC location' }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/v1/locations/current', expect.objectContaining({
      method: 'PUT',
      headers: expect.objectContaining({ authorization: 'Bearer employee-token', 'content-type': 'application/json' }),
      body: JSON.stringify({ latitude: 16.5062, longitude: 80.648, state: 'simulated' }),
    })));
    expect(await screen.findByText('Field location saved to Karaa')).toBeInTheDocument();
    expect(screen.getByText('Presentation simulator — not a real location')).toBeInTheDocument();
  });

  it('posts exactly payload JSON and one real image File, then clears only after canonical refetch', async () => {
    const fetcher = installFetch();
    await renderLoadedWorkspace();
    await completeRequiredFieldRecord();

    expect(screen.getByText('Presentation simulator — not a real location')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish progress update' }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/v1/progress-updates', expect.objectContaining({ method: 'POST' })));
    const [, request] = fetcher.mock.calls.find(([url]) => String(url).endsWith('/v1/progress-updates'))!;
    const body = request!.body as FormData;
    expect(Array.from(body.keys())).toEqual(['payload', 'photo']);
    expect(body.get('photo')).toBeInstanceOf(File);
    expect((body.get('photo') as File).name).toBe('evidence.png');
    expect(JSON.parse(String(body.get('payload')))).toMatchObject({
      projectId,
      milestoneId,
      locationState: 'simulated',
      latitude: 16.5062,
      longitude: 80.648,
      claimedProgress: 44,
      workDescription: 'Installed the north frame anchors.',
    });
    expect(await screen.findByText('Saved to Karaa')).toBeInTheDocument();
    expect(screen.getByLabelText('Work completed')).toHaveValue('');
    expect(screen.getByLabelText('Evidence photo')).toHaveValue('');
    expect(screen.queryByText('Field location saved to Karaa')).not.toBeInTheDocument();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith(`/v1/projects/${projectId}`))).toHaveLength(2);
  });

  it('validates required evidence before posting', async () => {
    const fetcher = installFetch();
    await renderLoadedWorkspace();
    fireEvent.click(screen.getByRole('button', { name: 'Publish progress update' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Add an evidence photo.');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/v1/progress-updates'))).toBe(false);
  });

  it('keeps form values and does not report success when canonical refetch fails after a 201', async () => {
    let detailReads = 0;
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/v1/projects')) return json({ projects: [project] });
      if (url.endsWith(`/v1/projects/${projectId}`)) {
        detailReads += 1;
        if (detailReads === 2) throw new Error('network unavailable');
        return json(detail);
      }
      if (url.endsWith(`/v1/projects/${projectId}/conversations`)) return json({ conversations: [conversation] });
      if (url.endsWith('/v1/locations/current')) return json({
        userId: employeeId,
        displayName: 'Dev Employee',
        latitude: 16.5062,
        longitude: 80.648,
        state: 'simulated',
        recordedAt: '2026-08-12T09:00:00.000Z',
      });
      if (url.endsWith('/v1/progress-updates')) return json({ replayed: false }, 201);
      throw new Error(`Unexpected request ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);
    await renderLoadedWorkspace();
    await completeRequiredFieldRecord();

    fireEvent.click(screen.getByRole('button', { name: 'Publish progress update' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    expect(screen.getByLabelText('Work completed')).toHaveValue('Installed the north frame anchors.');
    expect(screen.queryByText('Saved to Karaa')).not.toBeInTheDocument();
  });

  it('preserves the unchanged failed record and retries with the same event ID', async () => {
    let attempts = 0;
    const fetcher = installFetch(() => {
      attempts += 1;
      return attempts === 1 ? json({ error: 'Unavailable' }, 503) : json({ replayed: false }, 201);
    });
    await renderLoadedWorkspace();
    await completeRequiredFieldRecord();

    fireEvent.click(screen.getByRole('button', { name: 'Publish progress update' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    expect(screen.getByLabelText('Work completed')).toHaveValue('Installed the north frame anchors.');

    fireEvent.click(screen.getByRole('button', { name: 'Retry publishing update' }));
    await screen.findByText('Saved to Karaa');

    const submittedPayloads = fetcher.mock.calls
      .filter(([url]) => String(url).endsWith('/v1/progress-updates'))
      .map(([, request]) => JSON.parse(String((request!.body as FormData).get('payload'))));
    expect(submittedPayloads).toHaveLength(2);
    expect(submittedPayloads[0].eventId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(submittedPayloads[1].eventId).toBe(submittedPayloads[0].eventId);
  });
});
