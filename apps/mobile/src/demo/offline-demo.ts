import { projectForId, subverticalForId, verticalForId } from './demo-catalog';
import { portfolioForProjectId, subverticalPortfolioForId } from './subvertical-projects';

export type OfflineDemoRole = 'customer' | 'employee' | 'management';

export type OfflineDemoTabKey = 'power' | 'tenders' | 'portfolio' | 'support' | 'attendance' | 'projects' | 'tasks' | 'chat' | 'command' | 'map';
export type OfflineDemoIcon = 'dashboard' | 'file' | 'briefcase' | 'chat' | 'tool' | 'gauge' | 'pin';

export interface OfflineDemoTab {
  readonly key: OfflineDemoTabKey;
  readonly label: string;
  readonly icon: OfflineDemoIcon;
}

export interface OfflineDemoAccount {
  readonly role: OfflineDemoRole;
  readonly email: string;
  readonly displayName: string;
  readonly roleLabel: string;
  readonly initials: string;
}

export const demoAccounts: readonly OfflineDemoAccount[] = [
  { role: 'customer', email: 'anika.customer@karaa.demo', displayName: 'Anika Customer', roleLabel: 'CUSTOMER / INVESTOR', initials: 'AC' },
  { role: 'employee', email: 'dev.employee@karaa.demo', displayName: 'Dev Employee', roleLabel: 'FIELD EMPLOYEE', initials: 'DE' },
  { role: 'management', email: 'mira.management@karaa.demo', displayName: 'Mira Management', roleLabel: 'SENIOR MANAGEMENT', initials: 'MM' },
] as const;

export const offlineRoleTabs: Readonly<Record<OfflineDemoRole, readonly OfflineDemoTab[]>> = {
  customer: [
    { key: 'power', label: 'Dashboard', icon: 'dashboard' },
    { key: 'tenders', label: 'Tenders', icon: 'file' },
    { key: 'portfolio', label: 'My Portfolio', icon: 'briefcase' },
    { key: 'support', label: 'Support', icon: 'chat' },
  ],
  employee: [
    { key: 'attendance', label: 'Attendance', icon: 'gauge' },
    { key: 'projects', label: 'My Projects', icon: 'briefcase' },
    { key: 'tasks', label: 'My Tasks', icon: 'tool' },
    { key: 'chat', label: 'Chat', icon: 'chat' },
  ],
  management: [
    { key: 'power', label: 'Dashboard', icon: 'dashboard' },
    { key: 'tenders', label: 'Tenders', icon: 'file' },
    { key: 'command', label: 'Command Centre', icon: 'gauge' },
    { key: 'map', label: 'Geo Location', icon: 'pin' },
    { key: 'chat', label: 'Chat', icon: 'chat' },
  ],
};

const amaravatiSolarCommons = projectForId('amaravati-solar-commons');
const energyUtilities = verticalForId(amaravatiSolarCommons.verticalId);

export const offlineProject = {
  name: amaravatiSolarCommons.name,
  vertical: energyUtilities.title,
  category: 'Renewable infrastructure',
  milestone: amaravatiSolarCommons.milestone,
  nextMilestone: amaravatiSolarCommons.nextMilestone,
  progress: amaravatiSolarCommons.progress,
  reviewedProgress: 68,
  latestUpdate: 'Inverter-row alignment and cabinet checks are ready for review.',
  reviewUpdate: 'Inverter row alignment has been added to the project activity.',
  workPackage: 'Inverter cabinet alignment & connection checks',
  tender: 'Solar balance-of-plant package',
  tenderDeadline: '18 Aug · 4 days remaining',
  location: amaravatiSolarCommons.location,
  assignedEmployee: 'Dev Employee',
  manager: 'Mira Management',
  customer: 'Anika Customer',
} as const;

export type DemoTenderFilter = 'all' | 'technical-review' | 'clarification' | 'attention';
export type DemoTenderStage = 'technical-review' | 'financial-review' | 'clarification' | 'award-decision';
export type DemoTenderUpdateKind = 'notice' | 'document-revision' | 'deadline-change' | 'clarification' | 'evaluation' | 'decision' | 'termination';
export type DemoTenderDetailTab = 'overview' | 'updates' | 'activity' | 'docs';

export interface DemoTenderDeadline {
  readonly previousLabel: string;
  readonly revisedLabel: string;
  readonly timezone: 'IST';
}

export interface DemoTenderRevisionDocument {
  readonly title: string;
  readonly version: string;
  readonly dateLabel: string;
}

export interface DemoTenderUpdate {
  readonly id: string;
  readonly kind: DemoTenderUpdateKind;
  readonly headline: string;
  readonly effect: string;
  readonly origin: string | null;
  readonly timestamp: string;
  readonly owner: string;
  readonly affectedRecords: string;
  readonly impact: string;
  readonly nextAction: string;
  readonly deadline?: DemoTenderDeadline;
  readonly document?: DemoTenderRevisionDocument;
  readonly acknowledgedByRoles: readonly OfflineDemoRole[];
}

export interface DemoTender {
  readonly id: string;
  readonly title: string;
  readonly authority: string;
  readonly verticalId: string;
  readonly projectId: string;
  readonly valueLabel: string;
  readonly bidOpenDate: string;
  readonly targetDate: string;
  readonly nextAction: string;
  readonly updates: readonly DemoTenderUpdate[];
  readonly reviewOwner: string | null;
}

export interface DemoTenderBoardRow {
  readonly tenderId: string;
  readonly title: string;
  readonly authority: string;
  readonly updateCount: number;
  readonly lifecycleLabel: string;
  readonly attention: boolean;
  readonly nextAction: string;
}

const amaravatiTenderUpdates: readonly DemoTenderUpdate[] = [
  {
    id: 'CHG-014', kind: 'notice', headline: 'Technical schedule issued', effect: 'Notice', origin: null,
    timestamp: '12 Aug · 09:10 IST', owner: 'Asha Rao · Tender desk', affectedRecords: 'Technical schedule v1',
    impact: 'The technical schedule establishes the review sequence for this fictional package.', nextAction: 'Review technical schedule.', acknowledgedByRoles: [],
  },
  {
    id: 'CHG-021', kind: 'document-revision', headline: 'Cable-routing schedule Rev 02', effect: 'Supersedes', origin: 'CHG-014',
    timestamp: '13 Aug · 14:20 IST', owner: 'Rohan Iyer · Design coordination', affectedRecords: 'Cable-routing schedule Rev 01',
    impact: 'Rev 02 replaces the prior cable-routing reference for planning review.', nextAction: 'Compare routing impacts.',
    document: { title: 'Cable-routing schedule', version: 'Rev 02', dateLabel: '13 Aug' }, acknowledgedByRoles: [],
  },
  {
    id: 'CHG-024', kind: 'deadline-change', headline: 'Submission horizon revised', effect: 'Supersedes', origin: 'CHG-021',
    timestamp: '14 Aug · 11:35 IST', owner: 'Meera Nair · Tender coordination', affectedRecords: 'Submission schedule',
    impact: 'The planning horizon is revised for the fictional tender review sequence.', nextAction: 'Review submission plan',
    deadline: { previousLabel: '18 Aug · 17:00 IST', revisedLabel: '22 Aug · 17:00 IST', timezone: 'IST' }, acknowledgedByRoles: [],
  },
  {
    id: 'CHG-027', kind: 'clarification', headline: 'Inverter interface clarification', effect: 'Clarifies', origin: 'CHG-024',
    timestamp: '15 Aug · 16:05 IST', owner: 'Dev Employee · Site interface', affectedRecords: 'Inverter interface note',
    impact: 'The clarification changes neither the schedule nor the document version.', nextAction: 'Confirm interface assumptions.', acknowledgedByRoles: [],
  },
  {
    id: 'CHG-031', kind: 'evaluation', headline: 'Technical review advanced', effect: 'Advances review', origin: 'CHG-027',
    timestamp: '16 Aug · 10:15 IST', owner: 'Mira Management · Review lead', affectedRecords: 'Technical review ledger',
    impact: 'The fictional technical review can proceed with the clarified interface context.', nextAction: 'Prepare technical review notes.', acknowledgedByRoles: [],
  },
] as const;

const gridInterfaceUpdates: readonly DemoTenderUpdate[] = [
  {
    id: 'GRD-006', kind: 'notice', headline: 'Grid interface review opened', effect: 'Notice', origin: null,
    timestamp: '11 Aug · 10:00 IST', owner: 'Asha Rao · Tender desk', affectedRecords: 'Grid interface review note',
    impact: 'The fictional grid interface package is available for technical context review.', nextAction: 'Review interface scope.', acknowledgedByRoles: [],
  },
  {
    id: 'GRD-011', kind: 'clarification', headline: 'Metering boundary clarification', effect: 'Clarifies', origin: 'GRD-006',
    timestamp: '15 Aug · 13:40 IST', owner: 'Rohan Iyer · Design coordination', affectedRecords: 'Metering boundary note',
    impact: 'The fictional clarification records a planning assumption for the interface review.', nextAction: 'Confirm metering assumptions.', acknowledgedByRoles: [],
  },
] as const;

const initialTenders: readonly DemoTender[] = [
  {
    id: 'solar-bop', title: 'Solar balance-of-plant package', authority: 'Amaravati Solar Commons', verticalId: 'energy-utilities', projectId: 'amaravati-solar-commons',
    valueLabel: '₹42.6 crore', bidOpenDate: '22 Aug · 17:00 IST', targetDate: '28 Aug',
    nextAction: 'Prepare technical review notes.', updates: amaravatiTenderUpdates, reviewOwner: null,
  },
  {
    id: 'solar-grid-interface', title: 'Solar grid interface package', authority: 'Amaravati Solar Commons', verticalId: 'energy-utilities', projectId: 'amaravati-solar-commons',
    valueLabel: '₹18.4 crore', bidOpenDate: '29 Aug · 17:00 IST', targetDate: '04 Sep',
    nextAction: 'Confirm metering assumptions.', updates: gridInterfaceUpdates, reviewOwner: null,
  },
] as const;

export function tenderForId(state: Readonly<OfflineDemoState>, tenderId: string): DemoTender {
  const tender = state.tenders.find((candidate) => candidate.id === tenderId);
  if (!tender) throw new Error(`Unknown demo tender: ${tenderId}`);
  return tender;
}

function requireTenderManagementRole(role: OfflineDemoRole): void {
  if (role !== 'management') throw new Error('Tender action requires Senior Management');
}

export function tenderUpdatesFor(state: Readonly<OfflineDemoState>, tenderId: string): readonly DemoTenderUpdate[] {
  return tenderForId(state, tenderId).updates;
}

export function tenderLifecycleLabel(tender: Readonly<DemoTender>): string {
  const hasEvaluation = tender.updates.some((update) => update.kind === 'evaluation');
  const hasClarification = tender.updates.some((update) => update.kind === 'clarification');
  if (hasEvaluation) return 'Technical review';
  if (hasClarification) return 'Clarification';
  return 'Technical review';
}

export function tenderBoardRows(state: Readonly<OfflineDemoState>, filter: DemoTenderFilter = 'all'): readonly DemoTenderBoardRow[] {
  return state.tenders
    .map((tender) => {
      const latest = tender.updates.at(-1);
      const lifecycleLabel = tenderLifecycleLabel(tender);
      const attention = tender.updates.some((update) => update.kind === 'deadline-change' && update.acknowledgedByRoles.length === 0);
      return {
        tenderId: tender.id,
        title: tender.title,
        authority: tender.authority,
        updateCount: tender.updates.length,
        lifecycleLabel,
        attention,
        nextAction: latest?.nextAction ?? tender.nextAction,
      };
    })
    .filter((row) => filter === 'all' || (filter === 'attention' ? row.attention : row.lifecycleLabel.toLowerCase().replace(' ', '-') === filter));
}

export type OfflineDemoSurface = 'root' | 'vertical' | 'subvertical' | 'project' | 'tender-detail' | 'chat-thread' | 'support-ticket' | 'map-detail';
export type DemoChatThreadKind = 'direct' | 'project' | 'tender' | 'support';
export type DemoChatThreadStatus = 'open' | 'resolved';
export type DemoManagementQueryChannel = 'project' | 'tender';

export type DemoSupportPriority = 'normal' | 'urgent';
export type DemoSupportTicketStatus = 'in-review' | 'resolved';

export interface DemoSupportTicket {
  readonly id: string;
  readonly projectOrCategory: string;
  readonly subject: string;
  readonly description: string;
  readonly priority: DemoSupportPriority;
  readonly status: DemoSupportTicketStatus;
  readonly createdLabel: string;
  readonly updatedLabel: string;
  readonly threadId: string;
}

export interface DemoChatMessage {
  readonly id: string;
  readonly authorRole: OfflineDemoRole;
  readonly authorName: string;
  readonly body: string;
  readonly timestamp: string;
}

export interface DemoChatThread {
  readonly id: string;
  readonly kind: DemoChatThreadKind;
  readonly status: DemoChatThreadStatus;
  readonly title: string;
  readonly initials: string;
  readonly identityLabel: string;
  readonly contextLabel: string;
  readonly projectOrTender: string;
  readonly vertical: string;
  readonly participantRoles: readonly OfflineDemoRole[];
  readonly unreadByRole: Readonly<Record<OfflineDemoRole, number>>;
  readonly messages: readonly DemoChatMessage[];
}

const initialChatThreads: readonly DemoChatThread[] = [
  {
    id: 'dev-direct', kind: 'direct', status: 'open', title: 'Mira Management', initials: 'MM', identityLabel: 'Senior Management',
    contextLabel: 'Direct field thread', projectOrTender: 'Amaravati Solar Commons', vertical: 'Energy & Utilities', participantRoles: ['employee', 'management'],
    unreadByRole: { customer: 0, employee: 2, management: 1 },
    messages: [
      { id: 'dev-direct-1', authorRole: 'management', authorName: 'Mira Management', body: 'Please include inverter-row alignment before the commissioning review.', timestamp: '10:42 AM' },
      { id: 'dev-direct-2', authorRole: 'employee', authorName: 'Dev Employee', body: 'Cabinet checks are ready for the review note.', timestamp: '10:48 AM' },
    ],
  },
  {
    id: 'amaravati-project', kind: 'project', status: 'open', title: 'Amaravati Solar Commons', initials: 'AS', identityLabel: 'Project channel',
    contextLabel: 'Customer, field and management', projectOrTender: 'Amaravati Solar Commons', vertical: 'Energy & Utilities', participantRoles: ['customer', 'employee', 'management'],
    unreadByRole: { customer: 2, employee: 1, management: 0 },
    messages: [
      { id: 'amaravati-project-1', authorRole: 'management', authorName: 'Mira Management', body: 'Commissioning readiness evidence is being reviewed in this project channel.', timestamp: '09:30 AM' },
      { id: 'amaravati-project-2', authorRole: 'customer', authorName: 'Anika Customer', body: 'Please include the milestone note with the next project update.', timestamp: '10:18 AM' },
    ],
  },
  {
    id: 'solar-bop-tender', kind: 'tender', status: 'resolved', title: 'Solar balance-of-plant package', initials: 'TB', identityLabel: 'Tender coordination',
    contextLabel: 'Tender context', projectOrTender: 'Solar balance-of-plant package', vertical: 'Energy & Utilities', participantRoles: ['employee', 'management'],
    unreadByRole: { customer: 0, employee: 0, management: 0 },
    messages: [
      { id: 'solar-bop-tender-1', authorRole: 'management', authorName: 'Mira Management', body: 'The inverter interface clarification is recorded with the technical review context.', timestamp: 'Yesterday' },
    ],
  },
  {
    id: 'sup-001-support', kind: 'support', status: 'open', title: 'Commissioning checklist context', initials: 'S1', identityLabel: 'Support ticket SUP-001',
    contextLabel: 'Customer and management', projectOrTender: 'Amaravati Solar Commons', vertical: 'Energy & Utilities', participantRoles: ['customer', 'management'],
    unreadByRole: { customer: 1, employee: 0, management: 0 },
    messages: [
      { id: 'sup-001-support-1', authorRole: 'customer', authorName: 'Anika Customer', body: 'Please confirm which commissioning checklist belongs with the investment note.', timestamp: '10:42 AM' },
      { id: 'sup-001-support-2', authorRole: 'management', authorName: 'Mira Management', body: 'The revised checklist reference is recorded with the Amaravati project context.', timestamp: '11:05 AM' },
    ],
  },
] as const;

const initialSupportTickets: readonly DemoSupportTicket[] = [
  {
    id: 'SUP-001',
    projectOrCategory: 'Amaravati Solar Commons',
    subject: 'Commissioning checklist context',
    description: 'Please confirm which commissioning checklist belongs with the investment note.',
    priority: 'normal',
    status: 'in-review',
    createdLabel: 'Created 14 Aug · 10:42 AM',
    updatedLabel: 'Updated 14 Aug · 11:05 AM',
    threadId: 'sup-001-support',
  },
] as const;

export type DemoManagementPanel = 'portfolio' | 'operations';

export interface DemoManagementBlocker {
  readonly id: 'commissioning-readiness';
  readonly title: string;
  readonly assignee: 'Mira Management' | null;
}

const initialManagementBlockers: readonly DemoManagementBlocker[] = [{
  id: 'commissioning-readiness',
  title: 'Commissioning readiness evidence',
  assignee: null,
}] as const;

export interface OfflineDemoState {
  readonly activeRole: OfflineDemoRole;
  readonly selectedTab: OfflineDemoTabKey;
  readonly surface: OfflineDemoSurface;
  readonly selectedVerticalId: string | null;
  readonly selectedSubverticalId: string | null;
  readonly selectedProjectId: string | null;
  readonly projectReturnTarget: 'subvertical' | 'portfolio' | 'dashboard';
  readonly selectedProjectDetailTab: 'timeline' | 'overview' | 'documents' | 'media';
  readonly tenders: readonly DemoTender[];
  readonly selectedTenderId: string | null;
  readonly selectedTenderDetailTab: DemoTenderDetailTab;
  readonly chatThreads: readonly DemoChatThread[];
  readonly selectedChatThreadId: string | null;
  readonly supportTickets: readonly DemoSupportTicket[];
  readonly selectedManagementPanel: DemoManagementPanel;
  readonly blockers: readonly DemoManagementBlocker[];
  readonly selectedMapProjectId: string | null;
  readonly selectedEmployeeId: string | null;
  readonly currentProgress: number;
  readonly fieldUpdateReviewed: boolean;
  readonly fieldReviewOpen: boolean;
  readonly fieldThreadOpen: boolean;
  readonly interventionRaised: boolean;
}

export type OfflineDemoAction =
  | { readonly type: 'set-active-role'; readonly role: OfflineDemoRole }
  | { readonly type: 'select-tab'; readonly tab: OfflineDemoTabKey }
  | { readonly type: 'select-vertical'; readonly verticalId: string }
  | { readonly type: 'select-subvertical'; readonly subverticalId: string }
  | { readonly type: 'select-project'; readonly projectId: string }
  | { readonly type: 'open-portfolio-project'; readonly projectId: string }
  | { readonly type: 'open-dashboard-project'; readonly projectId: string; readonly tab?: OfflineDemoState['selectedProjectDetailTab'] }
  | { readonly type: 'select-project-detail-tab'; readonly tab: OfflineDemoState['selectedProjectDetailTab'] }
  | { readonly type: 'return-to-subvertical' }
  | { readonly type: 'select-tender'; readonly tenderId: string }
  | { readonly type: 'select-tender-detail-tab'; readonly tab: DemoTenderDetailTab }
  | { readonly type: 'return-to-tender-board' }
  | { readonly type: 'append-tender-deadline-change'; readonly tenderId: string }
  | { readonly type: 'acknowledge-tender-update'; readonly tenderId: string; readonly updateId: string }
  | { readonly type: 'assign-tender-review'; readonly tenderId: string; readonly assignee: string }
  | { readonly type: 'select-chat-thread'; readonly threadId: string }
  | { readonly type: 'mark-chat-thread-read'; readonly threadId: string }
  | { readonly type: 'send-chat-message'; readonly threadId: string; readonly body: string }
  | { readonly type: 'create-management-query'; readonly channelType: DemoManagementQueryChannel; readonly relatedRecordId: string; readonly subject: string; readonly message: string }
  | { readonly type: 'return-to-chat-inbox' }
  | { readonly type: 'open-support-ticket'; readonly ticketId: string }
  | { readonly type: 'create-support-ticket'; readonly projectOrCategory: string; readonly subject: string; readonly description: string; readonly priority: DemoSupportPriority }
  | { readonly type: 'set-management-panel'; readonly panel: DemoManagementPanel }
  | { readonly type: 'assign-blocker'; readonly blockerId: 'commissioning-readiness'; readonly assignee: 'Mira Management' }
  | { readonly type: 'select-map-project'; readonly projectId: 'amaravati-solar-commons' }
  | { readonly type: 'select-map-employee'; readonly employeeId: 'dev-employee' }
  | { readonly type: 'message-map-employee'; readonly employeeId: 'dev-employee' }
  | { readonly type: 'back-to-root' }
  | { readonly type: 'open-field-review' }
  | { readonly type: 'review-field-update' }
  | { readonly type: 'open-field-thread' }
  | { readonly type: 'raise-intervention' };

export function offlineDemoModeEnabled(environment: Record<string, string | undefined>): boolean {
  return environment.EXPO_PUBLIC_KARAA_DEMO_MODE === 'true';
}

export function createOfflineDemoState(role: OfflineDemoRole = 'employee'): OfflineDemoState {
  return {
    activeRole: role,
    selectedTab: offlineRoleTabs[role][0].key,
    surface: 'root',
    selectedVerticalId: null,
    selectedSubverticalId: null,
    selectedProjectId: null,
    projectReturnTarget: 'subvertical',
    selectedProjectDetailTab: 'timeline',
    tenders: initialTenders,
    selectedTenderId: null,
    selectedTenderDetailTab: 'updates',
    chatThreads: initialChatThreads,
    selectedChatThreadId: null,
    supportTickets: initialSupportTickets,
    selectedManagementPanel: 'portfolio',
    blockers: initialManagementBlockers,
    selectedMapProjectId: null,
    selectedEmployeeId: null,
    currentProgress: offlineProject.progress,
    fieldUpdateReviewed: false,
    fieldReviewOpen: false,
    fieldThreadOpen: false,
    interventionRaised: false,
  };
}

export function currentDelivery(state: Readonly<OfflineDemoState>): string {
  return `${state.currentProgress}% delivery recorded`;
}

export function chatThreadForId(state: Readonly<OfflineDemoState>, threadId: string): DemoChatThread {
  const thread = state.chatThreads.find((candidate) => candidate.id === threadId);
  if (!thread) throw new Error(`Unknown demo chat thread: ${threadId}`);
  return thread;
}

export function supportTicketForId(state: Readonly<OfflineDemoState>, ticketId: string): DemoSupportTicket {
  const ticket = state.supportTickets.find((candidate) => candidate.id === ticketId);
  if (!ticket) throw new Error(`Unknown demo support ticket: ${ticketId}`);
  return ticket;
}

function requireChatParticipant(state: Readonly<OfflineDemoState>, threadId: string): DemoChatThread {
  const thread = chatThreadForId(state, threadId);
  if (!thread.participantRoles.includes(state.activeRole)) throw new Error('Chat thread is not available in this workspace');
  return thread;
}

function markChatThreadRead(state: Readonly<OfflineDemoState>, threadId: string): OfflineDemoState {
  requireChatParticipant(state, threadId);
  return {
    ...state,
    chatThreads: state.chatThreads.map((thread) => thread.id !== threadId ? thread : {
      ...thread,
      unreadByRole: { ...thread.unreadByRole, [state.activeRole]: 0 },
    }),
  };
}

function selectChatThread(state: Readonly<OfflineDemoState>, threadId: string): OfflineDemoState {
  requireChatParticipant(state, threadId);
  return { ...state, selectedTab: state.activeRole === 'customer' ? 'support' : 'chat', surface: 'chat-thread', selectedChatThreadId: threadId };
}

function appendChatMessage(state: Readonly<OfflineDemoState>, threadId: string, body: string): OfflineDemoState {
  const thread = requireChatParticipant(state, threadId);
  const text = body.trim();
  if (!text) return state;
  const author = demoAccounts.find((account) => account.role === state.activeRole)!;
  const message: DemoChatMessage = {
    id: `${thread.id}-message-${thread.messages.length + 1}`,
    authorRole: state.activeRole,
    authorName: author.displayName,
    body: text,
    timestamp: '11:08 AM',
  };
  return {
    ...state,
    chatThreads: state.chatThreads.map((candidate) => candidate.id !== threadId ? candidate : {
      ...candidate,
      messages: [...candidate.messages, message],
      unreadByRole: Object.fromEntries((['customer', 'employee', 'management'] as const).map((role) => [role, role === state.activeRole ? 0 : candidate.participantRoles.includes(role) ? candidate.unreadByRole[role] + 1 : 0])) as Record<OfflineDemoRole, number>,
    }),
    supportTickets: thread.kind === 'support'
      ? state.supportTickets.map((ticket) => ticket.threadId === thread.id ? { ...ticket, updatedLabel: 'Updated 16 Aug · 11:08 AM' } : ticket)
      : state.supportTickets,
  };
}

function createSupportTicket(
  state: Readonly<OfflineDemoState>,
  action: Extract<OfflineDemoAction, { readonly type: 'create-support-ticket' }>,
): OfflineDemoState {
  if (state.activeRole !== 'customer') throw new Error('Support ticket creation requires Customer');
  const projectOrCategory = action.projectOrCategory.trim();
  const subject = action.subject.trim();
  const description = action.description.trim();
  if (!projectOrCategory || !subject || !description) throw new Error('Support ticket fields are required');
  if (action.priority !== 'normal' && action.priority !== 'urgent') throw new Error('Unknown support priority');

  const ticketId = `SUP-${String(state.supportTickets.length + 1).padStart(3, '0')}`;
  const threadId = `${ticketId.toLowerCase()}-support`;
  const author = demoAccounts.find((account) => account.role === state.activeRole)!;
  const ticket: DemoSupportTicket = {
    id: ticketId,
    projectOrCategory,
    subject,
    description,
    priority: action.priority,
    status: 'in-review',
    createdLabel: 'Created 16 Aug · 11:08 AM',
    updatedLabel: 'Updated 16 Aug · 11:08 AM',
    threadId,
  };
  const thread: DemoChatThread = {
    id: threadId,
    kind: 'support',
    status: 'open',
    title: subject,
    initials: ticketId.slice(-2),
    identityLabel: `Support ticket ${ticketId}`,
    contextLabel: 'Customer and management',
    projectOrTender: projectOrCategory,
    vertical: projectOrCategory === offlineProject.name ? offlineProject.vertical : 'Customer Support',
    participantRoles: ['customer', 'management'],
    unreadByRole: { customer: 0, employee: 0, management: 1 },
    messages: [{
      id: `${threadId}-1`,
      authorRole: state.activeRole,
      authorName: author.displayName,
      body: description,
      timestamp: '11:08 AM',
    }],
  };

  return {
    ...state,
    supportTickets: [...state.supportTickets, ticket],
    chatThreads: [...state.chatThreads, thread],
    selectedTab: 'support',
    surface: 'root',
    selectedChatThreadId: null,
  };
}

function appendReviewFieldMessage(state: Readonly<OfflineDemoState>): OfflineDemoState {
  const thread = chatThreadForId(state, 'amaravati-project');
  if (thread.messages.some((message) => message.id === 'amaravati-review-recorded')) return state;
  const message: DemoChatMessage = {
    id: 'amaravati-review-recorded',
    authorRole: 'employee',
    authorName: 'Dev Employee',
    body: 'Field update reviewed: 68% delivery recorded for inverter-row alignment and cabinet checks.',
    timestamp: '11:02 AM',
  };
  return {
    ...state,
    chatThreads: state.chatThreads.map((candidate) => candidate.id !== thread.id ? candidate : {
      ...candidate,
      messages: [...candidate.messages, message],
      unreadByRole: Object.fromEntries((['customer', 'employee', 'management'] as const).map((role) => [role, role === 'employee' ? 0 : candidate.participantRoles.includes(role) ? candidate.unreadByRole[role] + 1 : 0])) as Record<OfflineDemoRole, number>,
    }),
  };
}

function appendTenderDeadlineChange(tender: DemoTender): DemoTender {
  const previous = tender.updates.at(-1);
  const previousRecord = previous?.id.match(/^([A-Z]+)-(\d+)$/);
  const prefix = previousRecord?.[1] ?? 'CHG';
  const nextNumber = (previousRecord ? Number(previousRecord[2]) : 0) + 1;
  const record: DemoTenderUpdate = {
    id: `${prefix}-${String(nextNumber).padStart(3, '0')}`, kind: 'deadline-change', headline: 'Review horizon revised', effect: 'Supersedes', origin: previous?.id ?? null,
    timestamp: '16 Aug · 15:40 IST', owner: 'Mira Management · Review lead', affectedRecords: 'Technical review schedule',
    impact: 'The fictional review horizon is revised without changing prior tender records.', nextAction: 'Review revised submission plan.',
    deadline: { previousLabel: '22 Aug · 17:00 IST', revisedLabel: '26 Aug · 17:00 IST', timezone: 'IST' }, acknowledgedByRoles: [],
  };
  return { ...tender, updates: [...tender.updates, record], nextAction: record.nextAction };
}

function requireManagementRole(state: Readonly<OfflineDemoState>): void {
  if (state.activeRole !== 'management') throw new Error('Management action requires Senior Management');
}

function createManagementQuery(
  state: Readonly<OfflineDemoState>,
  action: Extract<OfflineDemoAction, { readonly type: 'create-management-query' }>,
): OfflineDemoState {
  requireManagementRole(state);
  if (action.channelType !== 'project' && action.channelType !== 'tender') throw new Error('Unknown Management query channel');

  const subject = action.subject.trim();
  const messageBody = action.message.trim();
  if (!subject || !messageBody) throw new Error('Query subject and message are required');

  let projectOrTender: string;
  let vertical: string;
  let participantRoles: readonly OfflineDemoRole[];
  if (action.channelType === 'project') {
    if (action.relatedRecordId !== amaravatiSolarCommons.id) throw new Error('Related record does not match project channel');
    const project = projectForId(action.relatedRecordId);
    projectOrTender = project.name;
    vertical = verticalForId(project.verticalId).title;
    participantRoles = ['customer', 'employee', 'management'];
  } else {
    if (action.relatedRecordId !== 'solar-bop') throw new Error('Related record does not match tender channel');
    const tender = tenderForId(state, action.relatedRecordId);
    projectOrTender = tender.title;
    vertical = verticalForId(tender.verticalId).title;
    participantRoles = ['employee', 'management'];
  }

  let sequence = 1;
  let threadId = `management-query-${String(sequence).padStart(3, '0')}`;
  while (state.chatThreads.some((thread) => thread.id === threadId)) {
    sequence += 1;
    threadId = `management-query-${String(sequence).padStart(3, '0')}`;
  }

  const author = demoAccounts.find((account) => account.role === 'management')!;
  const initials = subject
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const thread: DemoChatThread = {
    id: threadId,
    kind: action.channelType,
    status: 'open',
    title: subject,
    initials,
    identityLabel: action.channelType === 'project' ? 'Project query' : 'Tender query',
    contextLabel: 'Management query',
    projectOrTender,
    vertical,
    participantRoles,
    unreadByRole: {
      customer: participantRoles.includes('customer') ? 1 : 0,
      employee: participantRoles.includes('employee') ? 1 : 0,
      management: 0,
    },
    messages: [{
      id: `${threadId}-message-1`,
      authorRole: 'management',
      authorName: author.displayName,
      body: messageBody,
      timestamp: '11:12 AM',
    }],
  };

  return {
    ...state,
    chatThreads: [...state.chatThreads, thread],
    selectedTab: 'chat',
    surface: 'chat-thread',
    selectedChatThreadId: threadId,
  };
}

function requireManagementEmployee(employeeId: string): void {
  if (employeeId !== 'dev-employee') throw new Error(`Unknown management employee: ${employeeId}`);
}

export function offlineDemoReducer(state: Readonly<OfflineDemoState>, action: OfflineDemoAction): OfflineDemoState {
  switch (action.type) {
    case 'set-active-role':
      return {
        ...state,
        activeRole: action.role,
        selectedTab: offlineRoleTabs[action.role][0].key,
        surface: 'root',
        selectedChatThreadId: null,
        selectedMapProjectId: null,
        selectedEmployeeId: null,
        selectedVerticalId: null,
        selectedSubverticalId: null,
        selectedProjectId: null,
        selectedProjectDetailTab: 'timeline',
        projectReturnTarget: 'subvertical',
        selectedTenderId: null,
        selectedTenderDetailTab: 'updates',
        fieldReviewOpen: false,
      };
    case 'select-tab':
      if (!offlineRoleTabs[state.activeRole].some((tab) => tab.key === action.tab)) {
        throw new Error(`Tab ${action.tab} is not available to ${state.activeRole}`);
      }
      return {
        ...state,
        selectedTab: action.tab,
        surface: 'root',
        selectedVerticalId: null,
        selectedSubverticalId: null,
        selectedProjectId: null,
        selectedTenderId: null,
        selectedChatThreadId: null,
        selectedMapProjectId: null,
        selectedEmployeeId: null,
        selectedProjectDetailTab: 'timeline',
        projectReturnTarget: 'subvertical',
        selectedTenderDetailTab: 'updates',
        fieldReviewOpen: action.tab === 'tasks' ? state.fieldReviewOpen : false,
      };
    case 'select-vertical':
      verticalForId(action.verticalId);
      return { ...state, surface: 'vertical', selectedVerticalId: action.verticalId, selectedSubverticalId: null, selectedProjectId: null };
    case 'select-subvertical': {
      if (!state.selectedVerticalId) throw new Error('No demo vertical selected');
      verticalForId(state.selectedVerticalId);
      let subvertical: { verticalId:string };
      try { subvertical = subverticalPortfolioForId(action.subverticalId); }
      catch { subvertical = subverticalForId(action.subverticalId); }
      if (subvertical.verticalId !== state.selectedVerticalId) throw new Error(`Subvertical does not belong to selected vertical: ${action.subverticalId}`);
      return { ...state, surface: 'subvertical', selectedSubverticalId: action.subverticalId, selectedProjectId: null };
    }
    case 'select-project': {
      let project: { verticalId: string; subverticalId: string };
      try { project = projectForId(action.projectId); }
      catch (catalogError) {
        try { const page = portfolioForProjectId(action.projectId); project = { verticalId: page.verticalId, subverticalId: page.id }; }
        catch { throw catalogError; }
      }
      if (!state.selectedVerticalId) throw new Error('No demo vertical selected');
      if (!state.selectedSubverticalId) throw new Error('No demo subvertical selected');
      verticalForId(state.selectedVerticalId);
      let subvertical: { verticalId: string };
      try { subvertical = subverticalForId(state.selectedSubverticalId); }
      catch { subvertical = subverticalPortfolioForId(state.selectedSubverticalId); }
      if (subvertical.verticalId !== state.selectedVerticalId || project.verticalId !== state.selectedVerticalId || project.subverticalId !== state.selectedSubverticalId) {
        throw new Error(`Project does not belong to selected hierarchy: ${action.projectId}`);
      }
      return { ...state, surface: 'project', selectedProjectId: action.projectId, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'subvertical' };
    }
    case 'open-portfolio-project': {
      if (state.activeRole !== 'customer') throw new Error('Portfolio projects require Customer');
      const page = portfolioForProjectId(action.projectId);
      return { ...state, selectedTab: 'portfolio', surface: 'project', selectedVerticalId: page.verticalId, selectedSubverticalId: page.id, selectedProjectId: action.projectId, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'portfolio' };
    }
    case 'open-dashboard-project': {
      if (state.activeRole !== 'customer' || state.selectedTab !== 'power' || state.surface !== 'root') throw new Error('Dashboard projects require the Customer Dashboard root');
      let project: { id: string; verticalId: string; subverticalId: string };
      try { project = projectForId(action.projectId); }
      catch (catalogError) {
        try { const page = portfolioForProjectId(action.projectId); project = { id: action.projectId, verticalId: page.verticalId, subverticalId: page.id }; }
        catch { throw catalogError; }
      }
      return { ...state, surface: 'project', selectedVerticalId: project.verticalId, selectedSubverticalId: project.subverticalId, selectedProjectId: project.id, selectedProjectDetailTab: action.tab ?? 'timeline', projectReturnTarget: 'dashboard' };
    }
    case 'return-to-subvertical':
      if (!state.selectedSubverticalId) throw new Error('No demo subvertical selected');
      return state.projectReturnTarget === 'portfolio'
        ? { ...state, selectedTab: 'portfolio', surface: 'root', selectedVerticalId: null, selectedSubverticalId: null, selectedProjectId: null, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'subvertical' }
        : state.projectReturnTarget === 'dashboard'
          ? { ...state, selectedTab: 'power', surface: 'root', selectedVerticalId: null, selectedSubverticalId: null, selectedProjectId: null, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'subvertical' }
          : { ...state, surface: 'subvertical', selectedProjectId: null, selectedProjectDetailTab: 'timeline', projectReturnTarget: 'subvertical' };
    case 'select-project-detail-tab':
      return { ...state, selectedProjectDetailTab: action.tab };
    case 'select-tender':
      tenderForId(state, action.tenderId);
      return { ...state, selectedTab: 'tenders', surface: 'tender-detail', selectedTenderId: action.tenderId, selectedTenderDetailTab: 'updates' };
    case 'select-tender-detail-tab':
      return { ...state, selectedTenderDetailTab: action.tab };
    case 'return-to-tender-board':
      return { ...state, selectedTab: 'tenders', surface: 'root', selectedTenderId: null, selectedTenderDetailTab: 'updates' };
    case 'append-tender-deadline-change':
      requireTenderManagementRole(state.activeRole);
      tenderForId(state, action.tenderId);
      return { ...state, tenders: state.tenders.map((tender) => tender.id === action.tenderId ? appendTenderDeadlineChange(tender) : tender) };
    case 'acknowledge-tender-update':
      requireTenderManagementRole(state.activeRole);
      tenderForId(state, action.tenderId);
      return {
        ...state,
        tenders: state.tenders.map((tender) => tender.id !== action.tenderId ? tender : {
          ...tender,
          updates: tender.updates.map((update) => update.id !== action.updateId ? update : {
            ...update,
            acknowledgedByRoles: update.acknowledgedByRoles.includes(state.activeRole) ? update.acknowledgedByRoles : [...update.acknowledgedByRoles, state.activeRole],
          }),
        }),
      };
    case 'assign-tender-review':
      requireTenderManagementRole(state.activeRole);
      tenderForId(state, action.tenderId);
      return { ...state, tenders: state.tenders.map((tender) => tender.id === action.tenderId ? { ...tender, reviewOwner: action.assignee } : tender) };
    case 'select-chat-thread':
      return selectChatThread(state, action.threadId);
    case 'mark-chat-thread-read':
      return markChatThreadRead(state, action.threadId);
    case 'send-chat-message':
      return appendChatMessage(state, action.threadId, action.body);
    case 'create-management-query':
      return createManagementQuery(state, action);
    case 'return-to-chat-inbox':
      return { ...state, selectedTab: state.activeRole === 'customer' ? 'support' : 'chat', surface: 'root', selectedChatThreadId: null };
    case 'open-support-ticket': {
      const ticket = supportTicketForId(state, action.ticketId);
      return markChatThreadRead(selectChatThread(state, ticket.threadId), ticket.threadId);
    }
    case 'create-support-ticket':
      return createSupportTicket(state, action);
    case 'set-management-panel':
      requireManagementRole(state);
      if (action.panel !== 'portfolio' && action.panel !== 'operations') throw new Error(`Unknown management panel: ${action.panel}`);
      return { ...state, selectedManagementPanel: action.panel };
    case 'assign-blocker': {
      requireManagementRole(state);
      const blockerId = (action as { readonly blockerId: string }).blockerId;
      const assignee = (action as { readonly assignee: string }).assignee;
      if (blockerId !== 'commissioning-readiness' || !state.blockers.some((blocker) => blocker.id === blockerId)) {
        throw new Error(`Unknown management blocker: ${blockerId}`);
      }
      if (assignee !== 'Mira Management') throw new Error(`Unknown management assignee: ${assignee}`);
      return {
        ...state,
        blockers: state.blockers.map((blocker) => blocker.id === blockerId ? { ...blocker, assignee } : blocker),
      };
    }
    case 'select-map-project': {
      requireManagementRole(state);
      const project = projectForId(action.projectId);
      if (project.id !== 'amaravati-solar-commons') throw new Error(`Unknown management map project: ${action.projectId}`);
      return { ...state, selectedTab: 'map', surface: 'map-detail', selectedMapProjectId: project.id, selectedEmployeeId: null };
    }
    case 'select-map-employee':
      requireManagementRole(state);
      requireManagementEmployee(action.employeeId);
      if (state.selectedMapProjectId !== 'amaravati-solar-commons') throw new Error('Select Amaravati Solar Commons before selecting personnel');
      return { ...state, selectedTab: 'map', surface: 'map-detail', selectedEmployeeId: action.employeeId };
    case 'message-map-employee': {
      requireManagementRole(state);
      requireManagementEmployee(action.employeeId);
      if (state.selectedEmployeeId !== action.employeeId) throw new Error('Select Dev Employee before opening the direct conversation');
      const selected = selectChatThread(state, 'dev-direct');
      return markChatThreadRead(selected, 'dev-direct');
    }
    case 'back-to-root':
      return { ...state, surface: 'root', selectedVerticalId: null, selectedSubverticalId: null, selectedProjectId: null, selectedTenderId: null };
    case 'open-field-review':
      return { ...state, selectedTab: 'tasks', fieldReviewOpen: true };
    case 'review-field-update': {
      const reviewed: OfflineDemoState = { ...state, currentProgress: offlineProject.reviewedProgress, fieldReviewOpen: false, fieldUpdateReviewed: true, selectedTab: 'tasks' };
      return appendReviewFieldMessage(reviewed);
    }
    case 'open-field-thread':
      return markChatThreadRead(selectChatThread({ ...state, fieldThreadOpen: true }, 'dev-direct'), 'dev-direct');
    case 'raise-intervention':
      return { ...state, interventionRaised: true };
  }
  throw new Error(`Unknown offline demo action: ${(action as { type: string }).type}`);
}

type OfflineDemoListener = () => void;
let sharedOfflineDemoState = createOfflineDemoState();
const offlineDemoListeners = new Set<OfflineDemoListener>();

function notifyOfflineDemoListeners(): void {
  offlineDemoListeners.forEach((listener) => listener());
}

export const offlineDemoStore = {
  dispatch(action: OfflineDemoAction): void {
    sharedOfflineDemoState = offlineDemoReducer(sharedOfflineDemoState, action);
    notifyOfflineDemoListeners();
  },
  getState(): Readonly<OfflineDemoState> {
    return sharedOfflineDemoState;
  },
  reset(): void {
    sharedOfflineDemoState = createOfflineDemoState();
    notifyOfflineDemoListeners();
  },
  subscribe(listener: OfflineDemoListener): () => void {
    offlineDemoListeners.add(listener);
    return () => offlineDemoListeners.delete(listener);
  },
};
