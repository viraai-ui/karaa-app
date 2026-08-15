import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoStatusPill } from './OfflineDemoPrimitives';
import {
  chatThreadForId,
  type DemoChatThread,
  type DemoManagementQueryChannel,
  type OfflineDemoAction,
  type OfflineDemoState,
} from './offline-demo';

type Props = {
  readonly state: OfflineDemoState;
  readonly onAction: (action: OfflineDemoAction) => void;
};

type ChatFilter = 'all' | 'tenders' | 'projects' | 'open' | 'resolved';

const filters: readonly { readonly key: ChatFilter; readonly label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'tenders', label: 'Tenders' },
  { key: 'projects', label: 'Projects' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const managementQueryRecords: Readonly<Record<DemoManagementQueryChannel, { readonly id: string; readonly label: string }>> = {
  project: { id: 'amaravati-solar-commons', label: 'Amaravati Solar Commons' },
  tender: { id: 'solar-bop', label: 'Solar balance-of-plant package' },
};

function threadPresentationForRole(thread: DemoChatThread, role: OfflineDemoState['activeRole']): DemoChatThread {
  if (thread.id === 'dev-direct' && role === 'management') {
    return { ...thread, identityLabel: 'Field Employee', initials: 'DE', title: 'Dev Employee' };
  }
  return thread;
}

export function DemoChatExperience({ onAction, state }: Props) {
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState('');
  const [supportNoteOpen, setSupportNoteOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [queryChannel, setQueryChannel] = useState<DemoManagementQueryChannel>('project');
  const [queryRelatedRecordId, setQueryRelatedRecordId] = useState(managementQueryRecords.project.id);
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [queryErrors, setQueryErrors] = useState({ subject: false, message: false });
  const selectedThreadRecord = state.surface === 'chat-thread' && state.selectedChatThreadId
    ? chatThreadForId(state, state.selectedChatThreadId)
    : null;
  const selectedThread = selectedThreadRecord ? threadPresentationForRole(selectedThreadRecord, state.activeRole) : null;
  const rows = useMemo(() => state.chatThreads.filter((thread) => {
    if (!thread.participantRoles.includes(state.activeRole)) return false;
    if (filter === 'all') return true;
    if (filter === 'tenders') return thread.kind === 'tender';
    if (filter === 'projects') return thread.kind === 'project';
    return thread.status === filter;
  }), [filter, state.activeRole, state.chatThreads]);

  const resetManagementQuery = () => {
    setQueryOpen(false);
    setQueryChannel('project');
    setQueryRelatedRecordId(managementQueryRecords.project.id);
    setQuerySubject('');
    setQueryMessage('');
    setQueryErrors({ subject: false, message: false });
  };
  const openManagementQuery = () => {
    resetManagementQuery();
    setQueryOpen(true);
  };
  const selectQueryChannel = (channel: DemoManagementQueryChannel) => {
    setQueryChannel(channel);
    setQueryRelatedRecordId(managementQueryRecords[channel].id);
    setQueryErrors({ subject: false, message: false });
  };
  const submitManagementQuery = () => {
    const subject = querySubject.trim();
    const message = queryMessage.trim();
    const errors = { subject: !subject, message: !message };
    setQueryErrors(errors);
    if (errors.subject || errors.message) return;

    onAction({
      type: 'create-management-query',
      channelType: queryChannel,
      relatedRecordId: queryRelatedRecordId,
      subject,
      message,
    });
    resetManagementQuery();
  };

  const openChatThread = (threadId: string) => {
    resetManagementQuery();
    onAction({ type: 'select-chat-thread', threadId });
    onAction({ type: 'mark-chat-thread-read', threadId });
  };

  if (selectedThread) {
    const draft = drafts[selectedThread.id] ?? '';
    const send = () => {
      if (!draft.trim()) return;
      onAction({ type: 'send-chat-message', threadId: selectedThread.id, body: draft });
      setDrafts((current) => ({ ...current, [selectedThread.id]: '' }));
      setAnnouncement('Added to this conversation');
    };

    return (
      <View style={styles.threadPage} testID="chat-thread-page">
        <Pressable accessibilityLabel={state.activeRole === 'customer' ? 'Back to Support history' : 'Back to Chat inbox'} accessibilityRole="button" onPress={() => onAction({ type: 'return-to-chat-inbox' })} style={styles.backAction}>
          <Text style={styles.backText}>‹ {state.activeRole === 'customer' ? 'Support' : 'Chat'}</Text>
        </Pressable>
        <View style={styles.contextHeader}>
          <View style={styles.contextAvatar}><Text style={styles.contextAvatarText}>{selectedThread.initials}</Text></View>
          <View style={styles.contextCopy}><Text numberOfLines={1} style={styles.contextTitle}>{selectedThread.title}</Text><Text numberOfLines={1} style={styles.contextMeta}>{selectedThread.contextLabel} · {selectedThread.vertical}</Text></View>
          <DemoStatusPill label={selectedThread.status === 'resolved' ? 'RESOLVED' : 'OPEN'} tone={selectedThread.status === 'resolved' ? 'positive' : 'neutral'} />
        </View>
        <ScrollView
          contentContainerStyle={styles.messageListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.messageList}
          testID="chat-thread-messages"
        >
          {selectedThread.messages.map((message) => {
            const outgoing = message.authorRole === state.activeRole;
            return <View key={message.id} style={[styles.messageWrap, outgoing ? styles.messageOutgoingWrap : styles.messageIncomingWrap]}><View style={[styles.messageBubble, outgoing ? styles.messageOutgoing : styles.messageIncoming]}><Text style={[styles.messageBody, outgoing && styles.messageOutgoingBody]}>{message.body}</Text><Text style={[styles.messageMeta, outgoing && styles.messageOutgoingMeta]}>{message.timestamp} · {outgoing ? 'Added in this conversation' : `From ${message.authorName}`}</Text></View></View>;
          })}
        </ScrollView>
        <View style={styles.composer} testID="chat-composer">
          <View style={styles.composerControls}>
            <TextInput accessibilityLabel={`Message ${selectedThread.title}`} multiline onChangeText={(value) => setDrafts((current) => ({ ...current, [selectedThread.id]: value }))} placeholder="Write a project note" placeholderTextColor={colors.muted} style={styles.input} value={draft} />
            <Pressable accessibilityLabel={`Show supporting note option for ${selectedThread.title}`} accessibilityRole="button" onPress={() => setSupportNoteOpen(true)} style={styles.attach}><Text style={styles.attachText}>＋</Text></Pressable>
            <Pressable accessibilityLabel={`Send message to ${selectedThread.title}`} accessibilityRole="button" onPress={send} style={styles.send}><Text style={styles.sendText}>Send</Text></Pressable>
          </View>
          {supportNoteOpen ? <Text accessibilityLiveRegion="polite" style={styles.supportNote}>Add supporting note</Text> : null}
          <Text accessibilityLiveRegion="polite" style={styles.announcement}>{announcement}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>PROJECT COMMUNICATIONS</Text>
      <Text style={styles.title}>Chat</Text>
      <Text style={styles.purpose}>Conversations for project, tender, and field coordination.</Text>
      <View accessibilityRole="tablist" style={styles.filterList} testID="chat-filter-rail">
        {filters.map((item) => <Pressable accessibilityLabel={`Filter ${item.label}`} accessibilityRole="tab" accessibilityState={{ selected: filter === item.key }} key={item.key} onPress={() => setFilter(item.key)} style={[styles.filter, filter === item.key && styles.filterSelected]}><Text style={[styles.filterText, filter === item.key && styles.filterTextSelected]}>{item.label}</Text></Pressable>)}
      </View>
      <View style={styles.inbox}>
        {rows.map((thread) => <ChatRow key={thread.id} onOpen={() => openChatThread(thread.id)} state={state} thread={thread} />)}
      </View>
      {state.activeRole === 'management' && state.selectedTab === 'chat' && state.surface === 'root' ? (
        queryOpen ? (
          <Modal animationType="slide" onRequestClose={resetManagementQuery} presentationStyle="fullScreen" visible>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.queryModal}>
              <ScrollView
                contentContainerStyle={styles.queryScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.queryScroll}
                testID="management-query-scroll"
              >
                <View style={styles.queryForm} testID="management-query-form">
            <View style={styles.queryHeading}>
              <Text style={styles.queryEyebrow}>NEW MANAGEMENT QUERY</Text>
              <Text style={styles.queryTitle}>Start a conversation</Text>
              <Text style={styles.queryPurpose}>Add a project or tender query to this demo workspace.</Text>
            </View>
            <View accessibilityRole="tablist" style={styles.queryChannelList}>
              {(['project', 'tender'] as const).map((channel) => {
                const selected = queryChannel === channel;
                const label = channel === 'project' ? 'Project' : 'Tender';
                return <Pressable accessibilityLabel={label} accessibilityRole="tab" accessibilityState={{ selected }} key={channel} onPress={() => selectQueryChannel(channel)} style={[styles.queryChannel, selected && styles.queryChannelSelected]}><Text style={[styles.queryChannelText, selected && styles.queryChannelTextSelected]}>{label}</Text></Pressable>;
              })}
            </View>
            <View style={styles.queryField}>
              <Text style={styles.queryLabel}>RELATED RECORD</Text>
              <View accessibilityRole="radiogroup">
                <Pressable
                  accessibilityLabel={managementQueryRecords[queryChannel].label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: queryRelatedRecordId === managementQueryRecords[queryChannel].id }}
                  onPress={() => setQueryRelatedRecordId(managementQueryRecords[queryChannel].id)}
                  style={styles.queryRecord}
                >
                  <View style={styles.queryRecordDot} />
                  <Text style={styles.queryRecordText}>{managementQueryRecords[queryChannel].label}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.queryField}>
              <Text style={styles.queryLabel}>SUBJECT</Text>
              <TextInput
                accessibilityLabel="Query subject"
                onChangeText={(value) => { setQuerySubject(value); if (queryErrors.subject && value.trim()) setQueryErrors((current) => ({ ...current, subject: false })); }}
                placeholder="Name the question"
                placeholderTextColor={colors.muted}
                style={styles.queryInput}
                value={querySubject}
              />
              {queryErrors.subject ? <Text accessibilityLiveRegion="polite" style={styles.queryError}>Enter a query subject.</Text> : null}
            </View>
            <View style={styles.queryField}>
              <Text style={styles.queryLabel}>MESSAGE</Text>
              <TextInput
                accessibilityLabel="Query message"
                multiline
                onChangeText={(value) => { setQueryMessage(value); if (queryErrors.message && value.trim()) setQueryErrors((current) => ({ ...current, message: false })); }}
                placeholder="Add the project or tender context"
                placeholderTextColor={colors.muted}
                style={[styles.queryInput, styles.queryMessageInput]}
                textAlignVertical="top"
                value={queryMessage}
              />
              {queryErrors.message ? <Text accessibilityLiveRegion="polite" style={styles.queryError}>Enter a query message.</Text> : null}
            </View>
            <View style={styles.queryActions}>
              <Pressable accessibilityLabel="Cancel query" accessibilityRole="button" onPress={resetManagementQuery} style={styles.queryCancel}><Text style={styles.queryCancelText}>Cancel query</Text></Pressable>
              <Pressable accessibilityLabel="Create query" accessibilityRole="button" onPress={submitManagementQuery} style={styles.queryCreate}><Text style={styles.queryCreateText}>Create query</Text></Pressable>
            </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        ) : (
          <Pressable accessibilityLabel="New query" accessibilityRole="button" onPress={openManagementQuery} style={styles.newQuery}><Text style={styles.newQueryText}>＋ New query</Text></Pressable>
        )
      ) : null}
    </View>
  );
}

function ChatRow({ onOpen, state, thread }: { readonly onOpen: () => void; readonly state: OfflineDemoState; readonly thread: DemoChatThread }) {
  const presentation = threadPresentationForRole(thread, state.activeRole);
  const preview = thread.messages.at(-1)!;
  const unread = thread.unreadByRole[state.activeRole];
  return <Pressable accessibilityLabel={`Open ${presentation.title} conversation`} accessibilityRole="button" onPress={onOpen} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{presentation.initials}</Text><View style={styles.presence} /></View><View style={styles.rowCopy}><View style={styles.rowTitleLine}><Text numberOfLines={1} style={styles.rowTitle}>{presentation.title}</Text><Text style={styles.timestamp}>{preview.timestamp}</Text></View><Text numberOfLines={1} style={styles.rowIdentity}>{presentation.identityLabel} · {thread.contextLabel}</Text><Text numberOfLines={1} style={styles.rowContext}>{thread.projectOrTender} · {thread.vertical}</Text><Text numberOfLines={1} style={styles.preview}>{preview.body}</Text><View style={styles.rowFooter}><DemoStatusPill label={thread.status === 'resolved' ? 'RESOLVED' : 'OPEN'} tone={thread.status === 'resolved' ? 'positive' : 'neutral'} />{unread ? <Text style={styles.unread}>{unread} new</Text> : null}</View></View><Text style={styles.chevron}>›</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.sm },
  eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', lineHeight: 36 },
  purpose: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  filterList: { flexDirection: 'row', gap: 4 },
  filter: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 2 },
  filterSelected: { backgroundColor: colors.brass, borderColor: colors.brass },
  filterText: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  filterTextSelected: { color: colors.paper },
  inbox: { borderTopColor: colors.line, borderTopWidth: 1 },
  newQuery: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  newQueryText: { color: colors.paper, fontSize: 14, fontWeight: '900' },
  queryModal: { backgroundColor: colors.canvas, flex: 1 },
  queryScroll: { flex: 1 },
  queryScrollContent: { padding: spacing.md, paddingBottom: spacing.lg },
  queryForm: { backgroundColor: colors.paper, borderColor: colors.brass, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  queryHeading: { gap: 3 },
  queryEyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  queryTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  queryPurpose: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  queryChannelList: { flexDirection: 'row', gap: spacing.xs },
  queryChannel: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44 },
  queryChannelSelected: { backgroundColor: colors.brass, borderColor: colors.brass },
  queryChannelText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  queryChannelTextSelected: { color: colors.paper },
  queryField: { gap: 5 },
  queryLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .7 },
  queryRecord: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.sm },
  queryRecordDot: { backgroundColor: colors.brass, borderRadius: radii.pill, height: 10, width: 10 },
  queryRecordText: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '800' },
  queryInput: { backgroundColor: colors.canvas, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.sm, paddingVertical: 9 },
  queryMessageInput: { minHeight: 76 },
  queryError: { color: colors.danger, fontSize: 11, fontWeight: '800' },
  queryActions: { flexDirection: 'row', gap: spacing.xs },
  queryCancel: { alignItems: 'center', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  queryCancelText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  queryCreate: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  queryCreateText: { color: colors.paper, fontSize: 12, fontWeight: '900' },
  row: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 100, paddingVertical: spacing.xs },
  avatar: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.ink, borderRadius: radii.pill, height: 42, justifyContent: 'center', position: 'relative', width: 42 },
  avatarText: { color: colors.paper, fontSize: 11, fontWeight: '900' },
  presence: { backgroundColor: colors.moss, borderColor: colors.paper, borderRadius: radii.pill, borderWidth: 2, bottom: -1, height: 12, position: 'absolute', right: -1, width: 12 },
  rowCopy: { flex: 1, gap: 2 },
  rowTitleLine: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  rowTitle: { color: colors.ink, flex: 1, fontSize: 15, fontWeight: '900' },
  timestamp: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  rowIdentity: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .2 },
  rowContext: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  preview: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  rowFooter: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 3 },
  unread: { color: colors.brass, fontSize: 10, fontWeight: '900' },
  chevron: { color: colors.brass, fontSize: 27, fontWeight: '300' },
  threadPage: { flex: 1, gap: spacing.sm },
  backAction: { alignItems: 'flex-start', justifyContent: 'center', minHeight: 44 },
  backText: { color: colors.brass, fontSize: 13, fontWeight: '900' },
  contextHeader: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  contextAvatar: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36 },
  contextAvatarText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  contextCopy: { flex: 1 },
  contextTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  contextMeta: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 2 },
  messageList: { flex: 1 },
  messageListContent: { flexGrow: 1, gap: 8, justifyContent: 'flex-end', paddingBottom: spacing.sm },
  messageWrap: { flexDirection: 'row' },
  messageIncomingWrap: { justifyContent: 'flex-start', paddingRight: spacing.lg },
  messageOutgoingWrap: { justifyContent: 'flex-end', paddingLeft: spacing.lg },
  messageBubble: { borderRadius: radii.md, gap: 5, padding: spacing.sm },
  messageIncoming: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1 },
  messageOutgoing: { backgroundColor: colors.brass },
  messageBody: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  messageOutgoingBody: { color: colors.paper },
  messageMeta: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  messageOutgoingMeta: { color: colors.paper },
  composer: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexShrink: 0, gap: 6, padding: 6 },
  composerControls: { alignItems: 'flex-end', flexDirection: 'row', gap: 6 },
  input: { color: colors.ink, flex: 1, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  attach: { alignItems: 'center', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  attachText: { color: colors.brass, fontSize: 21, fontWeight: '800' },
  send: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, height: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  sendText: { color: colors.paper, fontSize: 12, fontWeight: '900' },
  supportNote: { color: colors.muted, fontSize: 11, paddingHorizontal: spacing.sm },
  announcement: { color: colors.moss, fontSize: 11, fontWeight: '800', minHeight: 15, paddingHorizontal: spacing.sm },
});
