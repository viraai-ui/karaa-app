import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustomerWorkspace } from '../src/features/customer/CustomerWorkspace';

const session = {
  token: 'server-issued-token',
  user: {
    id: '30000001-0000-4000-8000-000000000001',
    email: 'anika.customer@karaa.demo',
    role: 'customer' as const,
    displayName: 'Anika Customer',
  },
};

const projectOneId = '10000001-0000-4000-8000-000000000001';
const projectTwoId = '10000002-0000-4000-8000-000000000002';
const supportConversationId = '40000001-0000-4000-8000-000000000001';
const directConversationId = '40000002-0000-4000-8000-000000000002';
const updateId = '50000001-0000-4000-8000-000000000001';
const eventId = '60000001-0000-4000-8000-000000000001';
const milestoneId = '70000001-0000-4000-8000-000000000001';
const documentId = '80000001-0000-4000-8000-000000000001';
const paymentId = '90000001-0000-4000-8000-000000000001';
const messageId = 'a0000001-0000-4000-8000-000000000001';
const otherMessageId = 'a0000002-0000-4000-8000-000000000002';
const createdAt = '2026-08-12T09:00:00.000Z';
const disclaimer = 'Demo data — verify with issuing authority';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function projectDetail(projectId = projectOneId) {
  return {
    project: {
      id: projectId,
      name: projectId === projectOneId ? 'Amaravati Solar Commons' : 'Riverfront Works',
      verticalName: 'Infrastructure',
      showcase: projectId === projectOneId,
      progress: projectId === projectOneId ? 68 : 24,
    },
    milestones: [{ id: milestoneId, projectId, name: 'Structural handover', dueAt: createdAt, weight: 1, progress: 68 }],
    updates: [{
      id: updateId,
      eventId,
      projectId,
      milestoneId,
      authorId: '30000002-0000-4000-8000-000000000002',
      occurredAt: createdAt,
      serverTimestamp: createdAt,
      latitude: null,
      longitude: null,
      locationState: 'unavailable',
      claimedProgress: 68,
      workDescription: 'Anchor installation is complete.',
      nextAction: 'Review the material test record.',
      crewCount: 8,
      crewHours: 64,
      quantityValue: 12,
      quantityUnit: 'anchors',
      siteConditions: 'Dry conditions',
      blocker: null,
      media: [{
        id: 'b0000001-0000-4000-8000-000000000001',
        mediaPath: '/v1/media/b0000001-0000-4000-8000-000000000001',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        isDemoVisual: true,
      }],
    }],
    notifications: [],
    documents: [{ id: documentId, projectId, title: 'Completion certificate', issuingAuthority: 'Demo Authority', reference: 'DOC-88', issuedAt: createdAt, disclaimer }],
    paymentDemoRecords: [{ id: paymentId, projectId, reference: 'PAY-11', description: 'Milestone release', amountMinor: 1250000, currency: 'INR', recordedAt: createdAt, disclaimer }],
  };
}

function conversations(messages = [{ id: otherMessageId, conversationId: supportConversationId, senderId: '30000003-0000-4000-8000-000000000003', body: 'Support has your request.', createdAt }]) {
  return {
    conversations: [
      { id: directConversationId, projectId: projectOneId, kind: 'direct', createdAt, messages: [] },
      { id: supportConversationId, projectId: projectOneId, kind: 'support', createdAt, messages },
    ],
  };
}

function installFetch(options: { failProjects?: boolean; conversationBodies?: string[] } = {}) {
  const sentBodies: string[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === '/v1/projects') {
      if (options.failProjects) throw new Error('offline');
      return response({ projects: [
        { id: projectOneId, name: 'Amaravati Solar Commons', verticalName: 'Infrastructure', showcase: true, progress: 68 },
        { id: projectTwoId, name: 'Riverfront Works', verticalName: 'Infrastructure', showcase: false, progress: 24 },
      ] });
    }
    if (url === `/v1/projects/${projectOneId}`) return response(projectDetail());
    if (url === `/v1/projects/${projectTwoId}`) return response(projectDetail(projectTwoId));
    if (url === `/v1/projects/${projectOneId}/conversations`) {
      return response(conversations((options.conversationBodies ?? ['Support has your request.']).map((body, index) => ({
        id: index ? messageId : otherMessageId,
        conversationId: supportConversationId,
        senderId: index ? session.user.id : '30000003-0000-4000-8000-000000000003',
        body,
        createdAt,
      }))));
    }
    if (url === `/v1/projects/${projectTwoId}/conversations`) return response({ conversations: [] });
    if (url === '/v1/media/b0000001-0000-4000-8000-000000000001') {
      return new Response(new Blob(['demo-evidence'], { type: 'image/jpeg' }), { status: 200, headers: { 'content-type': 'image/jpeg' } });
    }
    if (url === `/v1/conversations/${supportConversationId}/messages`) {
      sentBodies.push(String(init?.body));
      return response({ message: { id: messageId, conversationId: supportConversationId, senderId: session.user.id, body: JSON.parse(String(init?.body)).body, createdAt } }, 201);
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetcher);
  return { fetcher, sentBodies };
}

afterEach(() => vi.unstubAllGlobals());

describe('CustomerWorkspace', () => {
  it('loads the canonical authorized project and renders customer-facing evidence, records, and support only', async () => {
    const { fetcher } = installFetch();
    render(<CustomerWorkspace session={session} onSignOut={vi.fn()} />);

    expect(screen.getByLabelText('Loading customer project')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Amaravati Solar Commons' })).toBeInTheDocument();
    expect(fetcher.mock.calls.map(([url]) => String(url))).toEqual(expect.arrayContaining(['/v1/projects', `/v1/projects/${projectOneId}`, `/v1/projects/${projectOneId}/conversations`]));
    expect(screen.getByText('Anchor installation is complete.')).toBeInTheDocument();
    expect(screen.getByText('Review the material test record.')).toBeInTheDocument();
    expect(screen.getByText('Evidence metadata')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Saved field evidence' })).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith('/v1/media/b0000001-0000-4000-8000-000000000001', expect.objectContaining({
      cache: 'no-store',
      headers: expect.objectContaining({ authorization: 'Bearer server-issued-token' }),
    }));
    expect(screen.getByText('Demo visual')).toBeInTheDocument();
    expect(screen.getByText('Completion certificate')).toBeInTheDocument();
    expect(screen.getAllByText(disclaimer)).toHaveLength(2);
    expect(screen.getByText('Milestone release')).toBeInTheDocument();
    expect(screen.getByText(/₹12,500\.00/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project support' })).toBeInTheDocument();
    expect(screen.queryByText(/command centre|assign|publish progress|create direct/i)).not.toBeInTheDocument();
  });

  it('selects only a server-authorized project and reloads its canonical detail', async () => {
    const { fetcher } = installFetch();
    render(<CustomerWorkspace session={session} onSignOut={vi.fn()} />);

    await screen.findByRole('heading', { name: 'Amaravati Solar Commons' });
    fireEvent.change(screen.getByLabelText('Authorized project'), { target: { value: projectTwoId } });

    expect(await screen.findByRole('heading', { name: 'Riverfront Works' })).toBeInTheDocument();
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(`/v1/projects/${projectTwoId}`);
    expect(screen.getByText('No saved support conversation.')).toBeInTheDocument();
  });

  it('sends only to the persisted support conversation and reloads the saved message', async () => {
    const { fetcher, sentBodies } = installFetch({ conversationBodies: ['Support has your request.', 'Please confirm the document review.'] });
    render(<CustomerWorkspace session={session} onSignOut={vi.fn()} />);

    await screen.findByRole('heading', { name: 'Amaravati Solar Commons' });
    fireEvent.change(screen.getByLabelText('Support message'), { target: { value: 'Please confirm the document review.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send support message' }));

    await waitFor(() => expect(sentBodies).toEqual(['{"body":"Please confirm the document review."}']));
    await waitFor(() => expect(fetcher.mock.calls.map(([url]) => String(url)).filter((url) => url === `/v1/projects/${projectOneId}/conversations`).length).toBeGreaterThan(1));
    expect(await screen.findByText('Please confirm the document review.')).toBeInTheDocument();
    expect(screen.queryByText('Direct conversation')).not.toBeInTheDocument();
  });

  it('shows truthful connection failure and retries the canonical project load', async () => {
    const { fetcher } = installFetch({ failProjects: true });
    render(<CustomerWorkspace session={session} onSignOut={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable — try again.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry project load' }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
