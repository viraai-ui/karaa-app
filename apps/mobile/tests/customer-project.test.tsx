import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ApiError } from '../src/lib/api';
import * as customerApi from '../src/features/customer/customer-api';
import { fetchCustomerProject, fetchCustomerSupportConversation, sendCustomerSupportMessage, type CustomerProjectDetail } from '../src/features/customer/customer-api';
import { CustomerProjectScreen } from '../src/features/customer/CustomerProjectScreen';

const projectDetail: CustomerProjectDetail = {
  project: {
    id: '20000001-0000-4000-8000-000000000001',
    name: 'Amaravati Solar Commons',
    verticalName: 'Renewable Infrastructure',
    showcase: true,
    progress: 65,
  },
  milestones: [{
    id: '40000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    name: 'Solar array installation',
    dueAt: null,
    weight: 1,
    progress: 65,
  }],
  updates: [{
    id: '51000001-0000-4000-8000-000000000001',
    eventId: '50000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    milestoneId: '40000001-0000-4000-8000-000000000001',
    authorId: '30000002-0000-4000-8000-000000000002',
    occurredAt: '2026-08-11T08:15:00.000Z',
    serverTimestamp: '2026-08-11T08:16:00.000Z',
    latitude: 16.5062,
    longitude: 80.648,
    locationState: 'simulated',
    claimedProgress: 65,
    workDescription: 'Installed and aligned the first solar inverter row.',
    nextAction: 'Inspect the completed electrical connections before commissioning.',
    crewCount: 4,
    crewHours: 28.5,
    quantityValue: 18,
    quantityUnit: 'inverter units',
    siteConditions: 'Dry demo site with clear access.',
    blocker: null,
    media: [{
      id: '60000001-0000-4000-8000-000000000001',
      mediaPath: '/v1/media/60000001-0000-4000-8000-000000000001',
      mimeType: 'image/png',
      sizeBytes: 2_871_655,
    }],
  }],
  notifications: [{
    id: '70000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    progressUpdateId: '51000001-0000-4000-8000-000000000001',
    body: 'New progress update for project Amaravati Solar Commons',
    createdAt: '2026-08-11T08:16:00.000Z',
    readAt: null,
  }],
  documents: [{
    id: '80000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    title: 'Commissioning readiness note',
    issuingAuthority: 'Karaa demo project office',
    reference: 'KAR-AA/AMR/CRN-01',
    issuedAt: '2026-08-11T08:20:00.000Z',
    disclaimer: 'Demo data — verify with issuing authority',
  }],
  paymentDemoRecords: [{
    id: '81000001-0000-4000-8000-000000000001',
    projectId: '20000001-0000-4000-8000-000000000001',
    reference: 'KAR-AA/AMR/PAY-01',
    description: 'Fictional mobilisation milestone record',
    amountMinor: 12_500_000,
    currency: 'INR',
    recordedAt: '2026-08-11T08:25:00.000Z',
    disclaimer: 'Demo data — verify with issuing authority',
  }],
};

describe('CustomerProjectScreen', () => {
  it('loads protected evidence through authenticated fetch into an in-memory data URI', async () => {
    const fetchProtectedEvidenceDataUri = (customerApi as typeof customerApi & {
      fetchProtectedEvidenceDataUri?: (
        mediaPath: string,
        session: { token: string },
        fetcher: typeof fetch,
        baseUrl: string,
      ) => Promise<string>;
    }).fetchProtectedEvidenceDataUri;
    expect(fetchProtectedEvidenceDataUri).toBeDefined();

    const fetcher = jest.fn(async () => new Response(Uint8Array.from([137, 80, 78, 71]), {
      status: 200,
      headers: { 'content-type': 'image/png', 'cache-control': 'private, no-store' },
    })) as unknown as jest.MockedFunction<typeof fetch>;
    const uri = await fetchProtectedEvidenceDataUri?.(
      '/v1/media/60000001-0000-4000-8000-000000000001',
      { token: 'server-issued-token' },
      fetcher,
      'http://karaa.test',
    );

    expect(uri).toBe('data:image/png;base64,iVBORw==');
    expect(fetcher).toHaveBeenCalledWith(
      'http://karaa.test/v1/media/60000001-0000-4000-8000-000000000001',
      expect.objectContaining({
        cache: 'no-store',
        headers: { authorization: 'Bearer server-issued-token' },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('fetches the caller-authorized showcase detail with a bearer credential', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      if (String(input).endsWith('/v1/projects')) {
        return new Response(JSON.stringify({
          projects: [projectDetail.project],
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify(projectDetail), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const result = await fetchCustomerProject({
      token: 'server-issued-token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: '30000001-0000-4000-8000-000000000001', role: 'customer' },
    }, fetcher, 'http://karaa.test');

    expect(result).toEqual(projectDetail);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
      url: 'http://karaa.test/v1/projects',
      init: { headers: { authorization: 'Bearer server-issued-token' } },
    });
    expect(requests[1].url).toBe('http://karaa.test/v1/projects/20000001-0000-4000-8000-000000000001');
  });

  it('loads only the typed customer support conversation and saves a reply through its persisted API route', async () => {
    const support = {
      id: '90000002-0000-4000-8000-000000000002',
      projectId: projectDetail.project.id,
      kind: 'support' as const,
      createdAt: '2026-08-11T08:30:00.000Z',
      messages: [],
    };
    const direct = { ...support, id: '90000001-0000-4000-8000-000000000001', kind: 'direct' as const };
    const fetcher: jest.MockedFunction<typeof fetch> = jest.fn(async (input) => {
      if (String(input).endsWith('/conversations')) {
        return new Response(JSON.stringify({ conversations: [direct, support] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        message: {
          id: '91000002-0000-4000-8000-000000000002',
          conversationId: support.id,
          senderId: '30000001-0000-4000-8000-000000000001',
          body: 'Please confirm the next document review.',
          createdAt: '2026-08-11T08:31:00.000Z',
        },
      }), { status: 201, headers: { 'content-type': 'application/json' } });
    }) as jest.MockedFunction<typeof fetch>;
    const session = {
      token: 'server-issued-token',
      expiresAt: '2033-05-18T03:33:20.000Z',
      user: { id: '30000001-0000-4000-8000-000000000001', role: 'customer' as const },
    };

    await expect(fetchCustomerSupportConversation(session, projectDetail.project.id, fetcher, 'http://karaa.test')).resolves.toEqual(support);
    await expect(sendCustomerSupportMessage(session, support.id, 'Please confirm the next document review.', fetcher, 'http://karaa.test')).resolves.toMatchObject({ conversationId: support.id });
    expect(fetcher).toHaveBeenLastCalledWith(
      `http://karaa.test/v1/conversations/${support.id}/messages`,
      expect.objectContaining({
        method: 'POST',
        headers: { authorization: 'Bearer server-issued-token', 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'Please confirm the next document review.' }),
      }),
    );
  });

  it('bounds a stalled customer-project request and reports the connection state', async () => {
    jest.useFakeTimers();
    try {
      const fetcher: jest.MockedFunction<typeof fetch> = jest.fn((_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('request aborted')));
      })) as jest.MockedFunction<typeof fetch>;

      const pending = fetchCustomerProject({
        token: 'server-issued-token',
        expiresAt: '2033-05-18T03:33:20.000Z',
        user: { id: '30000001-0000-4000-8000-000000000001', role: 'customer' },
      }, fetcher, 'http://karaa.test');

      expect(fetcher).toHaveBeenCalledWith('http://karaa.test/v1/projects', expect.objectContaining({
        headers: { authorization: 'Bearer server-issued-token' },
        signal: expect.any(AbortSignal),
      }));

      const rejection = expect(pending).rejects.toMatchObject({
        code: 'OFFLINE',
        message: 'Connection unavailable — try again.',
      });
      await jest.advanceTimersByTimeAsync(10_000);
      await rejection;
    } finally {
      jest.useRealTimers();
    }
  });

  it('renders persisted project evidence and provenance from the provided canonical detail', async () => {
    const rendered = render(
      <CustomerProjectScreen
        loadProject={async () => projectDetail}
        loadMediaToken={async () => 'server-issued-token'}
        loadEvidence={async () => 'data:image/png;base64,iVBORw=='}
        mediaBaseUrl="http://karaa.test"
      />,
    );

    expect(await rendered.findByText('Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByText('65% delivery recorded')).toBeTruthy();
    expect(rendered.getByText('Solar array installation')).toBeTruthy();
    expect(rendered.getByText('65% weighted delivery')).toBeTruthy();
    expect(rendered.queryByText('Schedule date unavailable')).toBeNull();
    expect(rendered.getByText('Installed and aligned the first solar inverter row.')).toBeTruthy();
    expect(rendered.getByText('Next accountable step')).toBeTruthy();
    expect(rendered.getByText('Inspect the completed electrical connections before commissioning.')).toBeTruthy();
    expect(rendered.getByText('Presentation simulator — not a real location')).toBeTruthy();
    expect(rendered.queryByText('Coordinates recorded')).toBeNull();
    expect(rendered.getByText('16.5062°, 80.6480°')).toBeTruthy();
    expect(rendered.queryByText('Demo visual')).toBeNull();
    expect(rendered.getByTestId('customer-evidence-image').props.source).toEqual({
      uri: 'data:image/png;base64,iVBORw==',
    });
    const heroFrameStyle = StyleSheet.flatten(rendered.getByTestId('customer-hero-frame').props.style);
    const heroImageStyle = StyleSheet.flatten(rendered.getByTestId('customer-hero-image').props.style);
    expect(heroFrameStyle).toMatchObject({ aspectRatio: 16 / 9, width: '100%' });
    expect(heroImageStyle).toMatchObject({ height: '100%', width: '100%' });
    expect(rendered.getByText('New progress update for project Amaravati Solar Commons')).toBeTruthy();
    expect(rendered.getByText('CUSTOMER DOCUMENTS')).toBeTruthy();
    expect(rendered.getByText('Commissioning readiness note')).toBeTruthy();
    expect(rendered.getByText(/KAR-AA\/AMR\/CRN-01/)).toBeTruthy();
    expect(rendered.getAllByText('Demo data — verify with issuing authority')).toHaveLength(2);
    expect(rendered.getByText('PAYMENT RECORDS')).toBeTruthy();
    expect(rendered.getByText('Fictional mobilisation milestone record')).toBeTruthy();
    expect(rendered.getByText('₹1,25,000.00')).toBeTruthy();
    expect(rendered.queryByText('FIELD LOCATIONS')).toBeNull();
    expect(rendered.queryByText('ACCOUNTABLE INTERVENTIONS')).toBeNull();
    expect(rendered.queryByText('DIRECT FIELD THREAD')).toBeNull();
    expect(rendered.getByTestId('customer-safe-area').props.edges).toMatchObject({
      top: 'additive',
      left: 'additive',
      right: 'additive',
      bottom: 'off',
    });
  });

  it('renders and sends only a persisted customer support conversation', async () => {
    const support = {
      id: '90000002-0000-4000-8000-000000000002',
      projectId: projectDetail.project.id,
      kind: 'support' as const,
      createdAt: '2026-08-11T08:30:00.000Z',
      messages: [],
    };
    const loadSupportConversation = jest.fn(async () => support);
    const sendSupportMessage = jest.fn(async () => undefined);
    const rendered = render(
      <CustomerProjectScreen
        loadProject={async () => projectDetail}
        loadSupportConversation={loadSupportConversation}
        sendSupportMessage={sendSupportMessage}
      />,
    );

    expect(await rendered.findByText('PROJECT SUPPORT')).toBeTruthy();
    fireEvent.changeText(rendered.getByLabelText('Project reply'), 'Please confirm the next document review.');
    fireEvent.press(rendered.getByRole('button', { name: 'Send project reply' }));
    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledWith(support.id, 'Please confirm the next document review.'));
    expect(rendered.getByText('Reply saved to Karaa')).toBeTruthy();
    expect(rendered.queryByText('Open direct thread with Dev Employee')).toBeNull();
  });

  it('refetches canonical customer detail after an authorized project notification without rendering its payload', async () => {
    let notify: ((eventName: string, payload: unknown) => void) | undefined;
    const refreshedDetail = { ...projectDetail, project: { ...projectDetail.project, progress: 71 } };
    const loadProject = jest.fn()
      .mockResolvedValueOnce(projectDetail)
      .mockResolvedValueOnce(refreshedDetail);
    const rendered = render(
      <CustomerProjectScreen
        loadProject={loadProject}
        loadRealtimeSession={async () => ({ token: 'server-issued-token', user: { role: 'customer' } })}
        subscribeRealtime={({ onEvent }) => {
          notify = onEvent;
          return () => undefined;
        }}
      />,
    );

    expect(await rendered.findByText('65% delivery recorded')).toBeTruthy();
    await waitFor(() => expect(notify).toBeDefined());
    await act(async () => {
      notify?.('project.progress_changed', { progress: 999, projectId: 'untrusted' });
    });

    expect(await rendered.findByText('71% delivery recorded')).toBeTruthy();
    expect(loadProject).toHaveBeenCalledTimes(2);
    expect(rendered.queryByText('999% delivery recorded')).toBeNull();
  });

  it('shows the truthful connection state and retries the project loader', async () => {
    const loadProject = jest.fn()
      .mockRejectedValueOnce(new ApiError('OFFLINE', 'Connection unavailable — try again.'))
      .mockResolvedValueOnce(projectDetail);
    const rendered = render(<CustomerProjectScreen loadProject={loadProject} />);

    expect(await rendered.findByText('Connection unavailable — try again.')).toBeTruthy();
    fireEvent.press(rendered.getByRole('button', { name: 'Retry project evidence' }));

    expect(await rendered.findByText('Amaravati Solar Commons')).toBeTruthy();
    expect(loadProject).toHaveBeenCalledTimes(2);
  });
});
