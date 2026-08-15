import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Conversation, CurrentLocation, ManagementProject } from '@karaa/contracts';

import { AppShell } from '../../components/AppShell';
import type { BrowserSession } from '../../lib/session';
import {
  createManagementIssue,
  errorMessage,
  fetchManagementDirectConversation,
  fetchManagementProjectLocations,
  fetchManagementSummary,
  openManagementDirectConversation,
  resolveManagementIssue,
  sendManagementDirectMessage,
  type CreateIssueBody,
  type ManagementSummary,
} from './management-api';

type WorkspaceApi = {
  loadSummary: () => Promise<ManagementSummary>;
  loadLocations: (projectId: string) => Promise<CurrentLocation[]>;
  createIssue: (projectId: string, input: CreateIssueBody) => Promise<unknown>;
  resolveIssue: (issueId: string) => Promise<unknown>;
  openDirectConversation: (projectId: string, employeeId: string) => Promise<Conversation>;
  loadConversation: (projectId: string, conversationId: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
};

type ManagementWorkspaceProps = {
  session: BrowserSession;
  onSignOut: () => void;
  api?: Partial<WorkspaceApi>;
};

type SummaryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; summary: ManagementSummary };

function defaultApi(session: BrowserSession): WorkspaceApi {
  return {
    loadSummary: () => fetchManagementSummary(session),
    loadLocations: (projectId) => fetchManagementProjectLocations(session, projectId),
    createIssue: (projectId, input) => createManagementIssue(session, projectId, input),
    resolveIssue: (issueId) => resolveManagementIssue(session, issueId),
    openDirectConversation: (projectId, employeeId) => openManagementDirectConversation(session, projectId, employeeId),
    loadConversation: (projectId, conversationId) => fetchManagementDirectConversation(session, projectId, conversationId),
    sendMessage: (conversationId, body) => sendManagementDirectMessage(session, conversationId, body),
  };
}

function FieldLocations({ projectId, loadLocations }: Pick<WorkspaceApi, 'loadLocations'> & { projectId: string }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; locations: CurrentLocation[] }>({ status: 'loading' });
  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', locations: await loadLocations(projectId) });
    } catch (cause) {
      setState({ status: 'error', message: errorMessage(cause) });
    }
  }, [loadLocations, projectId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <section aria-label="Authorized field locations">
    <h2>Authorized field locations</h2>
    <p>Locations are server-recorded field locations, not browser-estimated positions.</p>
    {state.status === 'loading' ? <p>Loading authorized field locations…</p> : null}
    {state.status === 'error' ? <>
      <p role="alert">{state.message}</p>
      <button className="button button-quiet" type="button" onClick={() => void refresh()}>Retry field locations</button>
    </> : null}
    {state.status === 'ready' && state.locations.length === 0 ? <p>No authorized employee has shared a current field location.</p> : null}
    {state.status === 'ready' ? <ul>
      {state.locations.map((location) => <li key={location.userId}>
        <strong>{location.displayName}</strong>
        <p>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
        <p>{location.state === 'simulated' ? 'Presentation simulator — not a real location' : 'Foreground device location — shared by the employee and server-recorded.'}</p>
      </li>)}
    </ul> : null}
  </section>;
}

function IssueComposer({ project, createIssue, refresh }: { project: ManagementProject; createIssue: WorkspaceApi['createIssue']; refresh: () => Promise<void> }) {
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [dueAt, setDueAt] = useState('2026-08-13T12:00:00.000Z');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const assignee = project.assignees[0];

  if (!assignee) return <p>No assigned field employee is available for a new intervention on this project.</p>;

  async function submit() {
    if (!description.trim() || !rootCause.trim() || Number.isNaN(Date.parse(dueAt))) {
      setError('Describe the intervention, root cause, and an ISO due time.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await createIssue(project.id, { description: description.trim(), assigneeId: assignee.id, dueAt, rootCause: rootCause.trim() });
      await refresh();
      setDescription('');
      setRootCause('');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return <section aria-label="Open accountable intervention" role="region">
    <h2>Open accountable intervention</h2>
    <p>Assigned to {assignee.displayName}. It appears in the record only after Karaa persists it.</p>
    <label>Intervention description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <label>Root cause<textarea value={rootCause} onChange={(event) => setRootCause(event.target.value)} /></label>
    <label>Intervention due time<input value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
    {error ? <p role="alert">{error}</p> : null}
    <button className="button button-primary" type="button" disabled={saving} onClick={() => void submit()}>{saving ? 'Saving intervention…' : 'Save intervention'}</button>
  </section>;
}

function DirectThread({ project, openDirectConversation, loadConversation, sendMessage }: Pick<WorkspaceApi, 'openDirectConversation' | 'loadConversation' | 'sendMessage'> & { project: ManagementProject }) {
  const [employeeId, setEmployeeId] = useState(project.assignees[0]?.id ?? '');
  const [conversation, setConversation] = useState<Conversation>();
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const selectedEmployee = project.assignees.find((employee) => employee.id === employeeId);

  async function refreshConversation(id: string) {
    setConversation(await loadConversation(project.id, id));
  }

  async function open() {
    if (!selectedEmployee) return;
    setBusy(true);
    setError(undefined);
    try {
      const opened = await openDirectConversation(project.id, selectedEmployee.id);
      await refreshConversation(opened.id);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!conversation || !reply.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      await sendMessage(conversation.id, reply.trim());
      await refreshConversation(conversation.id);
      setReply('');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label="Direct field thread">
    <h2>Direct field thread</h2>
    <p>Management can create or reopen a persisted direct employee thread for this authorized project.</p>
    {!selectedEmployee ? <p>No assigned field employee is available for a direct project reply.</p> : null}
    {project.assignees.length > 1 ? <label>Employee<select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>{project.assignees.map((employee) => <option key={employee.id} value={employee.id}>{employee.displayName}</option>)}</select></label> : null}
    {!conversation && selectedEmployee ? <button className="button button-primary" type="button" disabled={busy} onClick={() => void open()}>{busy ? 'Opening direct thread…' : `Open direct thread with ${selectedEmployee.displayName}`}</button> : null}
    {conversation ? <>
      <ul aria-label="Persisted direct replies">{conversation.messages.map((message) => <li key={message.id}>{message.body}</li>)}</ul>
      <label>Direct reply<textarea value={reply} onChange={(event) => setReply(event.target.value)} /></label>
      <button className="button button-primary" type="button" disabled={busy} onClick={() => void send()}>{busy ? 'Sending direct reply…' : 'Send direct reply'}</button>
    </> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}

function ReadyWorkspace({ summary, api, refresh }: { summary: ManagementSummary; api: WorkspaceApi; refresh: () => Promise<void> }) {
  const audienceFirst = useMemo(() => [...summary.projects].sort((left, right) => {
    const score = (project: ManagementProject) =>
      (project.assignees.length > 0 ? 2 : 0) + (project.priority === 'attention' ? 1 : 0);
    return score(right) - score(left) || left.name.localeCompare(right.name);
  }), [summary.projects]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => audienceFirst[0]?.id ?? '');
  const selectedProject = summary.projects.find((project) => project.id === selectedProjectId) ?? audienceFirst[0];
  const [resolveError, setResolveError] = useState<string>();
  const [resolvingId, setResolvingId] = useState<string>();

  useEffect(() => {
    if (!summary.projects.some((project) => project.id === selectedProjectId)) setSelectedProjectId(audienceFirst[0]?.id ?? '');
  }, [audienceFirst, selectedProjectId, summary.projects]);

  if (!selectedProject) return <section aria-label="Management empty state"><h2>No authorized projects</h2><p>No project portfolio is available for this Management session.</p></section>;

  async function resolve(issueId: string) {
    setResolvingId(issueId);
    setResolveError(undefined);
    try {
      await api.resolveIssue(issueId);
      await refresh();
    } catch (cause) {
      setResolveError(errorMessage(cause));
    } finally {
      setResolvingId(undefined);
    }
  }

  const openIssues = selectedProject.issues.filter((issue) => issue.status === 'open');
  return <>
    <section aria-label="Management project selector">
      <label>Selected project<select value={selectedProject.id} onChange={(event) => setSelectedProjectId(event.target.value)}>{audienceFirst.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    </section>
    <section aria-label="Canonical project summary">
      <h2>{selectedProject.name}</h2>
      <p>{selectedProject.verticalName}</p>
      <p>{selectedProject.progress}% delivery recorded</p>
      <p>{selectedProject.openIssueCount} open interventions in the canonical management summary.</p>
    </section>
    <FieldLocations projectId={selectedProject.id} loadLocations={api.loadLocations} />
    <section aria-label="Accountable interventions">
      <h2>Accountable interventions</h2>
      {openIssues.length === 0 ? <p>No open interventions.</p> : <ul>{openIssues.map((issue) => <li key={issue.id}>
        <strong>{issue.description}</strong><p>Owner: {issue.assigneeName}</p><p>Root cause: {issue.rootCause}</p>
        <button type="button" disabled={resolvingId === issue.id} onClick={() => void resolve(issue.id)}>{resolvingId === issue.id ? 'Resolving…' : 'Resolve intervention'}</button>
      </li>)}</ul>}
      {resolveError ? <p role="alert">{resolveError}</p> : null}
    </section>
    <IssueComposer project={selectedProject} createIssue={api.createIssue} refresh={refresh} />
    <DirectThread project={selectedProject} openDirectConversation={api.openDirectConversation} loadConversation={api.loadConversation} sendMessage={api.sendMessage} />
  </>;
}

export function ManagementWorkspace({ session, onSignOut, api: providedApi }: ManagementWorkspaceProps) {
  const api = useMemo(() => ({ ...defaultApi(session), ...providedApi }), [providedApi, session]);
  const [state, setState] = useState<SummaryState>({ status: 'loading' });
  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', summary: await api.loadSummary() });
    } catch (cause) {
      setState({ status: 'error', message: errorMessage(cause) });
    }
  }, [api]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <AppShell session={session} onSignOut={onSignOut} eyebrow="Authorized management record" title="Command Centre">
    {state.status === 'loading' ? <section aria-label="Management loading state"><p>Loading authorized management record…</p></section> : null}
    {state.status === 'error' ? <section aria-label="Management error state"><p role="alert">{state.message}</p><button type="button" onClick={() => void refresh()}>Retry command centre</button></section> : null}
    {state.status === 'ready' ? <ReadyWorkspace summary={state.summary} api={api} refresh={refresh} /> : null}
  </AppShell>;
}
