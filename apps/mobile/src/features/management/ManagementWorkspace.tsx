import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Conversation, CurrentLocation } from '@karaa/contracts/events';

import { EmptyState } from '../../components/EmptyState';
import { StatusPill } from '../../components/StatusPill';
import { KaraaBrand } from '../../components/KaraaBrand';
import { ProjectConversation } from '../conversations/ProjectConversation';
import { ApiError } from '../../lib/api';
import { type RealtimeSession, type RealtimeSubscriber, useRealtimeRefresh } from '../../lib/realtime';
import { loadSession } from '../../lib/session';
import { colors, layout, radii, spacing } from '../../theme/tokens';
import {
  createManagementIssue,
  fetchManagementDirectConversation,
  fetchManagementProjectLocations,
  fetchManagementSummary,
  openManagementDirectConversation,
  resolveManagementIssue,
  sendManagementDirectMessage,
  type ManagementSummary,
} from './management-api';

type Project = ManagementSummary['projects'][number];
type CreateInput = { projectId: string; description: string; assigneeId: string; dueAt: string; rootCause: string };
type ScreenState = { status: 'loading' } | { status: 'ready'; summary: ManagementSummary } | { status: 'error'; message: string };

type OpenedManagementConversation = { conversation: Conversation; currentUserId: string };
type OpenDirectConversation = (projectId: string, employeeId: string) => Promise<OpenedManagementConversation>;
type LoadDirectConversation = (projectId: string, conversationId: string) => Promise<Conversation>;
type SendDirectMessage = (conversationId: string, body: string) => Promise<void>;
type LoadProjectLocations = (projectId: string) => Promise<CurrentLocation[]>;

type ManagementWorkspaceProps = {
  loadSummary?: () => Promise<ManagementSummary>;
  loadProjectLocations?: LoadProjectLocations;
  loadRealtimeSession?: () => Promise<RealtimeSession | undefined>;
  createIssue?: (input: CreateInput) => Promise<unknown>;
  resolveIssue?: (issueId: string) => Promise<unknown>;
  openDirectConversation?: OpenDirectConversation;
  loadDirectConversation?: LoadDirectConversation;
  sendDirectMessage?: SendDirectMessage;
  subscribeRealtime?: RealtimeSubscriber;
};

const staleRecordThresholdMs = 24 * 60 * 60 * 1_000;

function formatDate(value: string | null): string {
  if (!value) return 'No saved field record';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFreshness(value: string | null, now = Date.now()): string {
  if (!value) return 'No saved field record';
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Date unavailable';
  const elapsedMs = Math.max(0, now - timestamp);
  if (elapsedMs >= staleRecordThresholdMs) return `Last reported ${formatDate(value)}`;
  return `Updated ${Math.floor(elapsedMs / 1_000)} seconds ago`;
}

function priorityTone(priority: Project['priority']): 'attention' | 'assured' | 'structural' {
  if (priority === 'attention') return 'attention';
  if (priority === 'healthy') return 'assured';
  return 'structural';
}

async function loadCurrentSummary(): Promise<ManagementSummary> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return fetchManagementSummary(session);
}

async function loadCurrentProjectLocations(projectId: string): Promise<CurrentLocation[]> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return fetchManagementProjectLocations(session, projectId);
}

async function submitCurrentIssue(input: CreateInput): Promise<unknown> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return createManagementIssue(session, input.projectId, input);
}

async function resolveCurrentIssue(issueId: string): Promise<unknown> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return resolveManagementIssue(session, issueId);
}

async function openCurrentManagementDirectConversation(projectId: string, employeeId: string): Promise<OpenedManagementConversation> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  const conversation = await openManagementDirectConversation(session, projectId, employeeId);
  return { conversation, currentUserId: session.user.id };
}

async function loadCurrentManagementDirectConversation(projectId: string, conversationId: string): Promise<Conversation> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return fetchManagementDirectConversation(session, projectId, conversationId);
}

async function sendCurrentManagementDirectMessage(conversationId: string, body: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return sendManagementDirectMessage(session, conversationId, body);
}

function Skeleton() {
  return <View accessibilityLabel="Loading command centre" style={styles.skeleton}><View style={[styles.skeletonBlock, styles.skeletonTitle]} /><View style={[styles.skeletonBlock, styles.skeletonHero]} /><View style={[styles.skeletonBlock, styles.skeletonRow]} /></View>;
}

function IssueComposer({ project, createIssue, onComplete }: { project: Project; createIssue: (input: CreateInput) => Promise<unknown>; onComplete: () => Promise<void> }) {
  const assignee = project.assignees[0];
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [dueAt, setDueAt] = useState('2026-08-13T12:00:00.000Z');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!assignee) return <Text style={styles.noAssignee}>No assigned field employee is available for a new intervention on this project.</Text>;

  const submit = async () => {
    if (!description.trim() || !rootCause.trim() || Number.isNaN(Date.parse(dueAt))) {
      setMessage('Describe the intervention, root cause, and an ISO due time.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createIssue({ projectId: project.id, description: description.trim(), assigneeId: assignee.id, dueAt, rootCause: rootCause.trim() });
      setDescription('');
      setRootCause('');
      await onComplete();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setSaving(false);
    }
  };

  return <View style={styles.composer}>
    <Text style={styles.cardLabel}>OPEN ACCOUNTABLE INTERVENTION</Text>
    <Text style={styles.composerCopy}>Assigned to {assignee.displayName}</Text>
    <Text style={styles.inputLabel}>Intervention</Text>
    <TextInput accessibilityLabel="Intervention description" multiline onChangeText={setDescription} placeholder="What must be corrected?" placeholderTextColor={colors.muted} style={styles.input} value={description} />
    <Text style={styles.inputLabel}>Root cause</Text>
    <TextInput accessibilityLabel="Root cause" multiline onChangeText={setRootCause} placeholder="What caused the exception?" placeholderTextColor={colors.muted} style={styles.input} value={rootCause} />
    <Text style={styles.inputLabel}>Due time (ISO)</Text>
    <TextInput accessibilityLabel="Intervention due time" autoCapitalize="none" onChangeText={setDueAt} style={styles.input} value={dueAt} />
    {message ? <Text style={styles.formMessage}>{message}</Text> : null}
    <Pressable accessibilityLabel="Save intervention" accessibilityRole="button" disabled={saving} onPress={() => void submit()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
      <Text style={styles.primaryButtonText}>{saving ? 'Saving intervention…' : 'Save intervention'}</Text>
    </Pressable>
  </View>;
}

function DirectConversationPanel({ project, openDirectConversation, loadDirectConversation, sendDirectMessage }: {
  project: Project;
  openDirectConversation: OpenDirectConversation;
  loadDirectConversation: LoadDirectConversation;
  sendDirectMessage: SendDirectMessage;
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(project.assignees[0]?.id);
  const [opened, setOpened] = useState<OpenedManagementConversation>();
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState<string>();
  const selectedEmployee = project.assignees.find((employee) => employee.id === selectedEmployeeId) ?? project.assignees[0];

  const open = async () => {
    if (!selectedEmployee) return;
    setOpening(true);
    setMessage(undefined);
    try {
      setOpened(await openDirectConversation(project.id, selectedEmployee.id));
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setOpening(false);
    }
  };

  if (!selectedEmployee) return <View style={styles.section}><Text style={styles.sectionLabel}>DIRECT FIELD THREAD</Text><Text style={styles.noAssignee}>No assigned field employee is available for a direct project reply.</Text></View>;
  if (opened) {
    const conversationId = opened.conversation.id;
    return <ProjectConversation
      currentUserId={opened.currentUserId}
      loadConversation={() => loadDirectConversation(project.id, conversationId)}
      sendMessage={(requestedConversationId, body) => {
        if (requestedConversationId !== conversationId) {
          return Promise.reject(new ApiError('REQUEST_FAILED', 'Karaa can only send inside the authorized direct conversation.'));
        }
        return sendDirectMessage(conversationId, body);
      }}
      title={`Direct reply · ${selectedEmployee.displayName}`}
    />;
  }

  return <View style={styles.section}>
    <Text style={styles.sectionLabel}>DIRECT FIELD THREAD</Text>

    <View style={styles.employeeChoices}>{project.assignees.map((employee) => <Pressable key={employee.id} accessibilityLabel={`Select ${employee.displayName}`} accessibilityRole="button" onPress={() => setSelectedEmployeeId(employee.id)} style={[styles.employeeChoice, selectedEmployee.id === employee.id && styles.employeeChoiceSelected]}><Text style={[styles.employeeChoiceText, selectedEmployee.id === employee.id && styles.employeeChoiceTextSelected]}>{employee.displayName}</Text></Pressable>)}</View>
    {message ? <Text accessibilityRole="alert" style={styles.formMessage}>{message}</Text> : null}
    <Pressable accessibilityLabel={`Open direct thread with ${selectedEmployee.displayName}`} accessibilityRole="button" disabled={opening} onPress={() => void open()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, opening && styles.disabled]}><Text style={styles.secondaryButtonText}>{opening ? 'Opening direct thread…' : `Open direct thread with ${selectedEmployee.displayName}`}</Text></Pressable>
  </View>;
}

function FieldLocations({ projectId, loadProjectLocations }: { projectId: string; loadProjectLocations: LoadProjectLocations }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'ready'; locations: CurrentLocation[] } | { status: 'error'; message: string }>({ status: 'loading' });
  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', locations: await loadProjectLocations(projectId) });
    } catch (cause) {
      setState({ status: 'error', message: cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.' });
    }
  }, [loadProjectLocations, projectId]);
  useEffect(() => { void refresh(); }, [refresh]);

  return <View style={styles.section}>
    <Text style={styles.sectionLabel}>FIELD LOCATIONS</Text>
    {state.status === 'loading' ? <Text style={styles.directCopy}>Loading authorized field locations…</Text> : null}
    {state.status === 'error' ? <><Text accessibilityRole="alert" style={styles.formMessage}>{state.message}</Text><Pressable accessibilityLabel="Retry field locations" accessibilityRole="button" onPress={() => void refresh()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Retry field locations</Text></Pressable></> : null}
    {state.status === 'ready' && state.locations.length === 0 ? <Text style={styles.directCopy}>No authorized employee has shared a current field location.</Text> : null}
    {state.status === 'ready' ? state.locations.map((location) => <View key={location.userId} style={styles.issue}>
      <Text style={styles.cardLabel}>{location.displayName}</Text>
      <Text style={styles.issueTitle}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
      <Text testID={`field-location-freshness-${location.userId}`} style={styles.issueMeta}>{formatFreshness(location.recordedAt)}</Text>
      <Text style={styles.directCopy}>{location.state === 'simulated' ? 'Presentation simulator — not a real location' : 'Foreground device location'}</Text>
    </View>) : null}
  </View>;
}

function ReadyWorkspace({ summary, createIssue, resolveIssue, refresh, loadProjectLocations, openDirectConversation, loadDirectConversation, sendDirectMessage }: {
  summary: ManagementSummary;
  createIssue: (input: CreateInput) => Promise<unknown>;
  resolveIssue: (issueId: string) => Promise<unknown>;
  refresh: () => Promise<void>;
  loadProjectLocations: LoadProjectLocations;
  openDirectConversation: OpenDirectConversation;
  loadDirectConversation: LoadDirectConversation;
  sendDirectMessage: SendDirectMessage;
}) {
  const primary = useMemo(() => {
    const actionableProjects = summary.projects.filter((project) => project.assignees.length > 0);
    return actionableProjects.find((project) => project.priority === 'attention')
      ?? actionableProjects.find((project) => project.showcase)
      ?? actionableProjects[0]
      ?? summary.projects.find((project) => project.priority === 'attention')
      ?? summary.projects.find((project) => project.showcase)
      ?? summary.projects[0];
  }, [summary.projects]);
  const [message, setMessage] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  if (!primary) return <View style={styles.statePage}><EmptyState eyebrow="COMMAND CENTRE" title="No authorized projects" copy="No project portfolio is available for this Management session." /></View>;

  const resolve = async (issueId: string) => {
    setResolving(issueId);
    setMessage(null);
    try {
      await resolveIssue(issueId);
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setResolving(null);
    }
  };

  const attentionCount = summary.projects.reduce((total, project) => total + project.openIssueCount, 0);
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="management-safe-area"><ScrollView contentContainerStyle={styles.content} style={styles.page}><View style={styles.column}>
    <View style={styles.header}><KaraaBrand height={18} variant="wordmark" /><StatusPill label="Management record" tone="structural" /></View>
    <View style={styles.intro}><Text style={styles.eyebrow}>PROJECT INTELLIGENCE</Text><Text style={styles.title}>Command Centre</Text><Text style={styles.copy}>Prioritize recorded evidence, accountable exceptions, and the next field decision.</Text></View>
    <View style={styles.portfolioStrip}><View><Text style={styles.metric}>{summary.projects.length}</Text><Text style={styles.metricLabel}>authorized projects</Text></View><View style={styles.metricRule} /><View><Text style={styles.metric}>{attentionCount}</Text><Text style={styles.metricLabel}>{attentionCount === 1 ? 'open intervention' : 'open interventions'}</Text></View></View>
    <View style={styles.section}><Text style={styles.sectionLabel}>PRIORITY PROJECT</Text><View style={styles.projectHeader}><View style={styles.projectTitleGroup}><Text style={styles.projectTitle}>{primary.name}</Text><Text style={styles.vertical}>{primary.verticalName}</Text></View><StatusPill label={primary.priority === 'attention' ? 'Attention' : primary.priority === 'healthy' ? 'Current' : 'Needs field record'} tone={priorityTone(primary.priority)} /></View><View style={styles.progressLine}><View style={[styles.progressFill, { width: `${primary.progress}%` }]} /></View><Text testID="priority-project-freshness" style={styles.progressCopy}>{primary.progress}% delivery recorded · {formatFreshness(primary.latestUpdateAt)}</Text></View>
    <FieldLocations projectId={primary.id} loadProjectLocations={loadProjectLocations} />
    <View style={styles.section}><Text style={styles.sectionLabel}>ACCOUNTABLE INTERVENTIONS</Text>{primary.issues.length ? primary.issues.filter((issue) => issue.status === 'open').map((issue) => <View key={issue.id} style={styles.issue}><Text style={styles.cardLabel}>OPEN · DUE {formatDate(issue.dueAt)}</Text><Text style={styles.issueTitle}>{issue.description}</Text><Text style={styles.issueMeta}>Owner: {issue.assigneeName}</Text><Text style={styles.issueCause}>Root cause: {issue.rootCause}</Text><Pressable accessibilityLabel="Resolve intervention" accessibilityRole="button" disabled={resolving === issue.id} onPress={() => void resolve(issue.id)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, resolving === issue.id && styles.disabled]}><Text style={styles.secondaryButtonText}>{resolving === issue.id ? 'Resolving…' : 'Resolve intervention'}</Text></Pressable></View>) : <EmptyState eyebrow="CLEAR RECORD" title="No open interventions" />}{message ? <Text style={styles.formMessage}>{message}</Text> : null}</View>
    <IssueComposer project={primary} createIssue={createIssue} onComplete={refresh} />
    <DirectConversationPanel project={primary} loadDirectConversation={loadDirectConversation} openDirectConversation={openDirectConversation} sendDirectMessage={sendDirectMessage} />
    <View style={styles.section}><Text style={styles.sectionLabel}>PORTFOLIO ORDER</Text>{summary.projects.map((project) => <View key={project.id} style={styles.portfolioRow}><View style={styles.portfolioText}><Text style={styles.portfolioName}>{project.name}</Text><Text style={styles.portfolioMeta}>{project.verticalName} · {project.progress}% recorded</Text></View><StatusPill label={project.priority === 'attention' ? `${project.openIssueCount} open` : project.priority === 'healthy' ? 'Current' : 'Stale'} tone={priorityTone(project.priority)} /></View>)}</View>
  </View></ScrollView></SafeAreaView>;
}

export function ManagementWorkspace({
  loadSummary = loadCurrentSummary,
  loadProjectLocations = loadCurrentProjectLocations,
  loadRealtimeSession = loadSession,
  createIssue = submitCurrentIssue,
  resolveIssue = resolveCurrentIssue,
  openDirectConversation = openCurrentManagementDirectConversation,
  loadDirectConversation = loadCurrentManagementDirectConversation,
  sendDirectMessage = sendCurrentManagementDirectMessage,
  subscribeRealtime,
}: ManagementWorkspaceProps) {
  const [state, setState] = useState<ScreenState>({ status: 'loading' });
  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try { setState({ status: 'ready', summary: await loadSummary() }); }
    catch (cause) { setState({ status: 'error', message: cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.' }); }
  }, [loadSummary]);
  useEffect(() => { void refresh(); }, [refresh]);
  useRealtimeRefresh({
    loadSession: loadRealtimeSession,
    onEvent: () => { void refresh(); },
    projectIds: state.status === 'ready' ? state.summary.projects.map((project) => project.id) : [],
    subscribe: subscribeRealtime,
  });
  if (state.status === 'loading') return <View style={styles.statePage}><Skeleton /></View>;
  if (state.status === 'error') return <View style={styles.statePage}><EmptyState eyebrow="COMMAND CENTRE" title="Management record unavailable" copy={state.message}><Pressable accessibilityLabel="Retry command centre" accessibilityRole="button" onPress={() => void refresh()} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Retry command centre</Text></Pressable></EmptyState></View>;
  return <ReadyWorkspace
    summary={state.summary}
    createIssue={createIssue}
    resolveIssue={resolveIssue}
    refresh={refresh}
    loadProjectLocations={loadProjectLocations}
    openDirectConversation={openDirectConversation}
    loadDirectConversation={loadDirectConversation}
    sendDirectMessage={sendDirectMessage}
  />;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 }, page: { backgroundColor: colors.canvas }, content: { padding: spacing.lg, paddingBottom: spacing.xxl }, column: { alignSelf: 'center', gap: spacing.xl, maxWidth: layout.contentMaxWidth, width: '100%' }, statePage: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, justifyContent: 'center', padding: spacing.lg }, header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' }, brand: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 2, paddingTop: spacing.xs }, intro: { gap: spacing.sm }, eyebrow: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.7, lineHeight: 38 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 23 }, portfolioStrip: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.lg, flexDirection: 'row', gap: spacing.lg, padding: spacing.lg }, metric: { color: colors.paper, fontSize: 30, fontWeight: '800', lineHeight: 34 }, metricLabel: { color: colors.statusStructuralSurface, fontSize: 12, fontWeight: '700', lineHeight: 18 }, metricRule: { backgroundColor: colors.muted, height: 44, width: 1 }, section: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg }, sectionLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, directCopy: { color: colors.muted, fontSize: 15, lineHeight: 22 }, employeeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, employeeChoice: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, employeeChoiceSelected: { backgroundColor: colors.ink, borderColor: colors.ink }, employeeChoiceText: { color: colors.ink, fontSize: 14, fontWeight: '800' }, employeeChoiceTextSelected: { color: colors.paper }, projectHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }, projectTitleGroup: { flex: 1, gap: spacing.xs }, projectTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', lineHeight: 32 }, vertical: { color: colors.muted, fontSize: 15, lineHeight: 22 }, progressLine: { backgroundColor: colors.statusStructuralSurface, borderRadius: radii.pill, height: 10, overflow: 'hidden', width: '100%' }, progressFill: { backgroundColor: colors.moss, height: '100%' }, progressCopy: { color: colors.muted, fontSize: 14, lineHeight: 21 }, issue: { backgroundColor: colors.statusAttentionSurface, borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg }, cardLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 0.9 }, issueTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', lineHeight: 26 }, issueMeta: { color: colors.ink, fontSize: 15, fontWeight: '700' }, issueCause: { color: colors.muted, fontSize: 14, lineHeight: 21 }, primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.md, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg }, primaryButtonText: { color: colors.paper, fontSize: 16, fontWeight: '800' }, secondaryButton: { alignItems: 'center', borderColor: colors.ink, borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md }, secondaryButtonText: { color: colors.ink, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.55 }, composer: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg }, composerCopy: { color: colors.muted, fontSize: 14, lineHeight: 21 }, inputLabel: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing.xs }, input: { backgroundColor: colors.canvas, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 48, padding: spacing.sm, textAlignVertical: 'top' }, formMessage: { color: colors.danger, fontSize: 14, fontWeight: '700', lineHeight: 21 }, noAssignee: { color: colors.muted, fontSize: 14, lineHeight: 21 }, portfolioRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.md }, portfolioText: { flex: 1, gap: spacing.xs }, portfolioName: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 22 }, portfolioMeta: { color: colors.muted, fontSize: 13, lineHeight: 19 }, skeleton: { alignSelf: 'center', gap: spacing.md, maxWidth: layout.contentMaxWidth, width: '100%' }, skeletonBlock: { backgroundColor: colors.statusStructuralSurface, borderRadius: radii.md }, skeletonTitle: { height: 38, width: '62%' }, skeletonHero: { height: 120, width: '100%' }, skeletonRow: { height: 88, width: '100%' },
});
