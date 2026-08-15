import { useCallback, useEffect, useState } from 'react';

import {
  conversationsResponseSchema,
  messageResponseSchema,
  projectDetailResponseSchema,
  projectsResponseSchema,
  type Conversation,
  type ProgressUpdateMedia,
  type ProjectSummary,
} from '@karaa/contracts';

import { AppShell } from '../../components/AppShell';
import type { BrowserSession } from '../../lib/session';

type WorkspaceState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; projects: ProjectSummary[]; detail: ProjectDetailResponse; support?: Conversation };

type ProjectDetailResponse = ReturnType<typeof projectDetailResponseSchema.parse>;

class CustomerWorkspaceError extends Error {}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_KARAA_API_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

async function request(session: BrowserSession, path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${session.token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new CustomerWorkspaceError('Connection unavailable — try again.');
  }

  if (response.status === 401) throw new CustomerWorkspaceError('Your Karaa session has expired. Sign in again.');
  if (response.status === 403) throw new CustomerWorkspaceError('You do not have access to this project evidence.');
  if (!response.ok) throw new CustomerWorkspaceError('Karaa could not load this project evidence.');

  try {
    return await response.json();
  } catch {
    throw new CustomerWorkspaceError('Karaa returned an invalid project record.');
  }
}

function parseOrThrow<T>(parsed: { success: true; data: T } | { success: false }, message: string): T {
  if (!parsed.success) throw new CustomerWorkspaceError(message);
  return parsed.data;
}

async function loadProjects(session: BrowserSession): Promise<ProjectSummary[]> {
  return parseOrThrow(
    projectsResponseSchema.safeParse(await request(session, '/v1/projects')),
    'Karaa returned an invalid project list.',
  ).projects;
}

async function loadProjectDetail(session: BrowserSession, projectId: string): Promise<ProjectDetailResponse> {
  return parseOrThrow(
    projectDetailResponseSchema.safeParse(await request(session, `/v1/projects/${projectId}`)),
    'Karaa returned an invalid project record.',
  );
}

async function loadSupportConversation(session: BrowserSession, projectId: string): Promise<Conversation | undefined> {
  const conversations = parseOrThrow(
    conversationsResponseSchema.safeParse(await request(session, `/v1/projects/${projectId}/conversations`)),
    'Karaa returned an invalid project support conversation.',
  ).conversations;
  return conversations.find((conversation) => conversation.kind === 'support');
}

async function sendSupportMessage(session: BrowserSession, conversationId: string, body: string): Promise<void> {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new CustomerWorkspaceError('Enter a support message before sending.');
  const payload = await request(session, `/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body: trimmedBody }),
  });
  parseOrThrow(messageResponseSchema.safeParse(payload), 'Karaa returned an invalid saved support message.');
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amountMinor: number, currency: 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amountMinor / 100);
}

function EvidenceImage({ media, session }: { media: ProgressUpdateMedia; session: BrowserSession }) {
  const [state, setState] = useState<{ url?: string; error?: string }>({});

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void (async () => {
      try {
        const response = await fetch(apiUrl(media.mediaPath), {
          cache: 'no-store',
          headers: { authorization: `Bearer ${session.token}` },
        });
        if (!response.ok) throw new Error('Evidence unavailable');
        const bytes = await response.blob();
        objectUrl = URL.createObjectURL(bytes);
        if (active) setState({ url: objectUrl });
      } catch {
        if (active) setState({ error: 'Evidence image unavailable.' });
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [media.mediaPath, session.token]);

  return <figure className="evidence-visual">
    {state.url ? <img src={state.url} alt="Saved field evidence" /> : null}
    {state.error ? <p>{state.error}</p> : null}
    {media.isDemoVisual ? <figcaption>Demo visual</figcaption> : null}
  </figure>;
}

function CustomerSupport({
  conversation,
  currentUserId,
  onSend,
}: {
  conversation?: Conversation;
  currentUserId: string;
  onSend: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function submit() {
    if (!body.trim()) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSend(body);
      setBody('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="support-title">
      <p className="eyebrow">Support-only conversation</p>
      <h2 id="support-title">Project support</h2>
      {!conversation ? <p>No saved support conversation.</p> : <>
        <p>Messages are saved to Karaa before they appear here.</p>
        {conversation.messages.length ? <ol aria-label="Saved support messages">
          {conversation.messages.map((message) => (
            <li key={message.id}>
              <strong>{message.senderId === currentUserId ? 'You' : 'Karaa support'}</strong>
              <p>{message.body}</p>
              <small>{formatDate(message.createdAt)}</small>
            </li>
          ))}
        </ol> : <p>No saved support messages.</p>}
        <label>
          Support message
          <textarea value={body} onChange={(event) => setBody(event.target.value)} disabled={saving} />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button className="button button-primary" type="button" disabled={saving || !body.trim()} onClick={() => void submit()}>
          {saving ? 'Saving support message…' : 'Send support message'}
        </button>
      </>}
    </section>
  );
}

function CustomerProjectDetail({ detail, support, session, onSend }: {
  detail: ProjectDetailResponse;
  support?: Conversation;
  session: BrowserSession;
  onSend: (body: string) => Promise<void>;
}) {
  const latestUpdate = detail.updates[0];
  return <>
    <section aria-labelledby="project-title">
      <p className="eyebrow">Authorized delivery record</p>
      <h2 id="project-title">{detail.project.name}</h2>
      <p>{detail.project.verticalName} · {detail.project.progress}% delivery recorded</p>
    </section>

    <section aria-labelledby="milestones-title">
      <p className="eyebrow">Progress from saved work</p>
      <h2 id="milestones-title">Evidence → Progress → Decision</h2>
      {detail.milestones.length ? <ol>{detail.milestones.map((milestone) => <li key={milestone.id}><strong>{milestone.name}</strong><p>{milestone.progress}% weighted delivery · {milestone.dueAt ? formatDate(milestone.dueAt) : 'Schedule date unavailable'}</p></li>)}</ol> : <p>No milestones saved for this project.</p>}
    </section>

    <section aria-labelledby="update-title">
      <p className="eyebrow">Latest field record</p>
      <h2 id="update-title">Saved update</h2>
      {!latestUpdate ? <p>No saved evidence yet.</p> : <>
        <p>{latestUpdate.workDescription}</p>
        {latestUpdate.media[0] ? <EvidenceImage media={latestUpdate.media[0]} session={session} /> : null}
        <p><strong>Next accountable step:</strong> {latestUpdate.nextAction}</p>
        <h3>Evidence metadata</h3>
        <dl>
          <div><dt>Recorded</dt><dd>{formatDate(latestUpdate.serverTimestamp)}</dd></div>
          <div><dt>Location</dt><dd>{latestUpdate.locationState === 'simulated' ? 'Presentation simulator — not a real location' : latestUpdate.locationState === 'active' ? 'Coordinates recorded' : `Location ${latestUpdate.locationState}`}</dd></div>
          <div><dt>Image record</dt><dd>{latestUpdate.media.length} attached</dd></div>
        </dl>
      </>}
    </section>

    <section aria-labelledby="documents-title">
      <p className="eyebrow">Customer documents</p>
      <h2 id="documents-title">Authorized records</h2>
      {detail.documents.length ? <ul>{detail.documents.map((document) => <li key={document.id}><strong>{document.title}</strong><p>{document.issuingAuthority} · {document.reference} · {formatDate(document.issuedAt)}</p><p>{document.disclaimer}</p></li>)}</ul> : <p>No customer documents saved.</p>}
    </section>

    <section aria-labelledby="payments-title">
      <p className="eyebrow">Payment records</p>
      <h2 id="payments-title">Recorded payments</h2>
      {detail.paymentDemoRecords.length ? <ul>{detail.paymentDemoRecords.map((record) => <li key={record.id}><strong>{record.description}</strong><p><strong>{formatCurrency(record.amountMinor, record.currency)}</strong> · {record.reference} · {formatDate(record.recordedAt)}</p><p>{record.disclaimer}</p></li>)}</ul> : <p>No payment records saved.</p>}
    </section>

    <CustomerSupport conversation={support} currentUserId={session.user.id} onSend={onSend} />
  </>;
}

export function CustomerWorkspace({ session, onSignOut }: { session: BrowserSession; onSignOut: () => void }) {
  const [state, setState] = useState<WorkspaceState>({ status: 'loading' });
  const [selectedProjectId, setSelectedProjectId] = useState<string>();

  const refresh = useCallback(async (requestedProjectId?: string) => {
    setState({ status: 'loading' });
    try {
      const projects = await loadProjects(session);
      if (!projects.length) {
        setSelectedProjectId(undefined);
        setState({ status: 'empty' });
        return;
      }
      const selected = projects.find((project) => project.id === requestedProjectId)
        ?? projects.find((project) => project.showcase)
        ?? projects[0];
      setSelectedProjectId(selected.id);
      const [detail, support] = await Promise.all([
        loadProjectDetail(session, selected.id),
        loadSupportConversation(session, selected.id),
      ]);
      setState({ status: 'ready', projects, detail, support });
    } catch (cause) {
      setState({ status: 'error', message: cause instanceof Error ? cause.message : 'Connection unavailable — try again.' });
    }
  }, [session]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function send(body: string): Promise<void> {
    if (state.status !== 'ready' || !state.support) return;
    await sendSupportMessage(session, state.support.id, body);
    await refresh(state.detail.project.id);
  }

  return (
    <AppShell session={session} onSignOut={onSignOut} eyebrow="Authorized customer record" title="Your customer workspace">
      {state.status === 'loading' ? <section aria-label="Loading customer project"><p>Loading your authorized project record…</p></section> : null}
      {state.status === 'error' ? <section aria-label="Customer project unavailable"><p role="alert">{state.message}</p><button className="button button-primary" type="button" onClick={() => void refresh(selectedProjectId)}>Retry project load</button></section> : null}
      {state.status === 'empty' ? <section aria-label="No authorized projects"><p>No authorized project records are available for this workspace.</p><button className="button button-quiet" type="button" onClick={() => void refresh()}>Retry project load</button></section> : null}
      {state.status === 'ready' ? <>
        <section>
          <label>
            Authorized project
            <select value={selectedProjectId} onChange={(event) => void refresh(event.target.value)}>
              {state.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
        </section>
        <CustomerProjectDetail detail={state.detail} support={state.support} session={session} onSend={send} />
      </> : null}
    </AppShell>
  );
}
