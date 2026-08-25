import { useMemo, useState } from 'react';
import { Image, type ImageSourcePropType, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
  { key: 'projects', label: 'Projects' },
  { key: 'tenders', label: 'Tenders' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const managementQueryRecords: Readonly<Record<DemoManagementQueryChannel, { readonly id: string; readonly label: string }>> = {
  project: { id: 'amaravati-solar-commons', label: 'Amaravati Solar Commons' },
  tender: { id: 'solar-bop', label: 'Solar balance-of-plant package' },
};

const chatAvatarByThread: Readonly<Record<string, ImageSourcePropType>> = {
  'dev-direct': require('../../assets/chat/dev-employee.webp'),
  'amaravati-project': require('../../assets/chat/amaravati-team.webp'),
  'solar-bop-tender': require('../../assets/chat/tender-coordinator.webp'),
  'sup-001-support': require('../../assets/chat/support-lead.webp'),
  'equipment-delivery': require('../../assets/chat/logistics-lead.webp'),
  'design-coordination': require('../../assets/chat/design-lead.webp'),
};

function threadPresentationForRole(thread: DemoChatThread, role: OfflineDemoState['activeRole']): DemoChatThread {
  if (thread.id === 'dev-direct' && role === 'management') {
    return { ...thread, identityLabel: 'Field Employee', initials: 'DE', title: 'Dev Employee' };
  }
  return thread;
}

export function DemoChatExperience({ onAction, state }: Props) {
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [search, setSearch] = useState('');
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
    const presentedThread = threadPresentationForRole(thread, state.activeRole);
    const matchesFilter = filter === 'all' || (filter === 'tenders' ? thread.kind === 'tender' : filter === 'projects' ? thread.kind === 'project' : thread.status === filter);
    const needle = search.trim().toLocaleLowerCase();
    return matchesFilter && (!needle || `${presentedThread.title} ${presentedThread.identityLabel} ${presentedThread.contextLabel} ${presentedThread.projectOrTender} ${presentedThread.vertical} ${presentedThread.messages.at(-1)?.body ?? ''}`.toLocaleLowerCase().includes(needle));
  }), [filter, search, state.activeRole, state.chatThreads]);

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
      <View style={[styles.threadPage, state.activeRole === 'customer' && styles.supportThreadPage]} testID="chat-thread-page">
        <Pressable accessibilityLabel={state.activeRole === 'customer' ? 'Back to Support history' : 'Back to Chat inbox'} accessibilityRole="button" onPress={() => onAction({ type: 'return-to-chat-inbox' })} style={styles.backAction}>
          <Text style={styles.backText}>‹ {state.activeRole === 'customer' ? 'Support' : 'Chat'}</Text>
        </Pressable>
        <View style={[styles.contextHeader, state.activeRole === 'customer' && styles.supportContextHeader]}>
          <View style={styles.contextAvatar}><Text style={styles.contextAvatarText}>{selectedThread.initials}</Text></View>
          <View style={styles.contextCopy}><Text numberOfLines={1} style={styles.contextTitle}>{state.activeRole === 'customer' ? 'Karaa Support' : selectedThread.title}</Text><View style={styles.onlineLine}>{state.activeRole === 'customer' ? <View style={styles.onlineDot} /> : null}<Text numberOfLines={1} style={styles.contextMeta}>{state.activeRole === 'customer' ? `Online · ${selectedThread.contextLabel}` : `${selectedThread.contextLabel} · ${selectedThread.vertical}`}</Text></View></View>
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
            <TextInput accessibilityLabel={`Message ${selectedThread.title}`} multiline onChangeText={(value) => setDrafts((current) => ({ ...current, [selectedThread.id]: value }))} onSubmitEditing={send} placeholder={state.activeRole === 'customer' ? 'Type your message…' : 'Write a project note'} placeholderTextColor={colors.muted} style={styles.input} value={draft} />
            <Pressable accessibilityLabel={`Show supporting note option for ${selectedThread.title}`} accessibilityRole="button" onPress={() => setSupportNoteOpen(true)} style={styles.attach}><Text style={styles.attachText}>＋</Text></Pressable>
            <Pressable accessibilityLabel={`Send message to ${selectedThread.title}`} accessibilityRole="button" onPress={send} style={styles.send}><Text style={styles.sendText}>Send</Text></Pressable>
          </View>
          {supportNoteOpen ? <Text accessibilityLiveRegion="polite" style={styles.supportNote}>Supporting note</Text> : null}
          <Text accessibilityLiveRegion="polite" style={styles.announcement}>{announcement}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.searchShell} testID="chat-search-shell">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.searchIcon}>⌕</Text>
        <TextInput accessibilityLabel="Search chats" onChangeText={setSearch} placeholder="Search chats" placeholderTextColor="#888680" style={styles.searchInput} value={search} />
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.tuneIcon}>☷</Text>
      </View>
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
          <Pressable accessibilityLabel="New query" accessibilityRole="button" onPress={openManagementQuery} style={styles.newQuery}><Text style={styles.newQueryText}>＋</Text></Pressable>
        )
      ) : null}
    </View>
  );
}

function ChatRow({ onOpen, state, thread }: { readonly onOpen: () => void; readonly state: OfflineDemoState; readonly thread: DemoChatThread }) {
  const presentation = threadPresentationForRole(thread, state.activeRole);
  const preview = thread.messages.at(-1)!;
  const unread = thread.unreadByRole[state.activeRole];
  const meta = thread.kind === 'direct' ? `${presentation.identityLabel} · ${thread.contextLabel}` : thread.kind === 'project' ? `Project channel · ${thread.vertical}` : thread.kind === 'tender' ? 'Tender coordination' : `${presentation.identityLabel} · Customer & mgmt.`;
  const displayTitle = thread.kind === 'support' ? presentation.title.replace(/ context$/u, '') : presentation.title;
  return <Pressable accessibilityLabel={`Open ${presentation.title} conversation`} accessibilityRole="button" onPress={onOpen} style={styles.row}>
    <View style={styles.avatarSlot} testID={`chat-avatar-slot-${thread.id}`}><View style={[styles.avatar, { backgroundColor: avatarColor(thread.id) }]}>{chatAvatarByThread[thread.id] ? <Image accessibilityIgnoresInvertColors source={chatAvatarByThread[thread.id]} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{presentation.initials}</Text>}{thread.kind === 'direct' ? <View style={styles.presence} /> : null}</View></View>
    <View style={styles.rowCopy}><Text numberOfLines={1} style={styles.rowTitle}>{displayTitle}</Text><Text numberOfLines={1} style={styles.rowIdentity}>{meta}</Text><Text numberOfLines={1} style={styles.preview}>{preview.body}</Text></View>
    <View style={styles.rowAside}><Text style={styles.timestamp}>{preview.timestamp}</Text>{unread ? <View style={styles.unread}><Text style={styles.unreadText}>{unread}</Text></View> : thread.status === 'resolved' ? <Text style={styles.resolved}>RESOLVED</Text> : thread.kind === 'support' ? <Text style={styles.open}>OPEN</Text> : <View style={styles.readDot} />}</View>
  </Pressable>;
}

function avatarColor(id: string) {
  const palette = ['#355C52', '#78614D', '#3D5362', '#826052', '#5F6357', '#403D39'];
  return palette[[...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palette.length];
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFEFB', marginHorizontal: -16, paddingHorizontal: 20, paddingTop: 8 },
  searchShell: { alignItems: 'center', borderColor: '#D8D5CE', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', height: 44, marginBottom: 10, paddingHorizontal: 12 },
  searchIcon: { color: '#8B8984', fontSize: 23, lineHeight: 25, marginRight: 7, transform: [{ rotate: '-15deg' }] },
  searchInput: { color: colors.ink, flex: 1, fontSize: 13, height: 44, paddingVertical: 0 },
  tuneIcon: { color: '#8B8984', fontSize: 18, transform: [{ rotate: '90deg' }] },
  filterList: { flexDirection: 'row', gap: 8, marginBottom: 19 },
  filter: { alignItems: 'center', backgroundColor: '#FFFEFB', borderColor: '#DEDCD6', borderRadius: radii.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 2 },
  filterSelected: { backgroundColor: colors.brass, borderColor: colors.brass },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: colors.paper },
  inbox: { borderTopColor: colors.line, borderTopWidth: 1 },
  newQuery: { alignItems: 'center', backgroundColor: '#C39725', borderColor: '#FFFFFF', borderRadius: 36, borderWidth: 5, bottom: 8, elevation: 6, height: 72, justifyContent: 'center', minHeight: 72, position: 'absolute', right: 2, shadowColor: '#000', shadowOffset: { height: 3, width: 0 }, shadowOpacity: .16, shadowRadius: 7, width: 72 },
  newQueryText: { color: colors.paper, fontSize: 37, fontWeight: '300', lineHeight: 40 },
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
  queryLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .7 },
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
  row: { alignItems: 'center', borderBottomColor: '#E8E5DF', borderBottomWidth: 1, flexDirection: 'row', gap: 14, minHeight: 112, paddingVertical: 13 },
  avatarSlot: { alignItems: 'center', alignSelf: 'center', flexShrink: 0, height: 60, justifyContent: 'center', width: 60 },
  avatar: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 30, flexShrink: 0, height: 60, justifyContent: 'center', position: 'relative', width: 60 },
  avatarImage: { borderRadius: 30, height: 60, width: 60 },
  avatarText: { color: colors.paper, fontFamily: 'serif', fontSize: 16, fontWeight: '700' },
  presence: { backgroundColor: colors.moss, borderColor: colors.paper, borderRadius: radii.pill, borderWidth: 2, bottom: -1, height: 12, position: 'absolute', right: -1, width: 12 },
  rowCopy: { flex: 1, gap: 5, minWidth: 0 },
  rowTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 15, fontWeight: '700', lineHeight: 18 },
  timestamp: { color: colors.muted, fontFamily: 'serif', fontSize: 11, lineHeight: 15 },
  rowIdentity: { color: colors.brass, fontSize: 10.5, fontWeight: '700', lineHeight: 14 },
  preview: { color: colors.muted, fontSize: 11.5, lineHeight: 16 },
  rowAside: { alignItems: 'flex-end', alignSelf: 'stretch', justifyContent: 'space-between', paddingVertical: 4, width: 60 },
  unread: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: 10, height: 19, justifyContent: 'center', width: 19 },
  unreadText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  resolved: { backgroundColor: '#E4EFE8', borderRadius: 9, color: '#49735A', fontSize: 9, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4 },
  open: { backgroundColor: '#F4F1EA', borderRadius: 9, color: colors.ink, fontSize: 9, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  readDot: { backgroundColor: '#A8A7A4', borderRadius: 5, height: 9, width: 9 },
  threadPage: { flex: 1, gap: spacing.sm },
  supportThreadPage: { backgroundColor: '#FFFFFF', marginHorizontal: -16, marginTop: -16, paddingHorizontal: 16, paddingTop: 12 },
  supportContextHeader: { backgroundColor: '#FFFFFF', borderColor: '#D9D3C8', borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.sm },
  onlineLine: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  onlineDot: { backgroundColor: '#3B9850', borderRadius: 4, height: 8, width: 8 },
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
  messageBubble: { borderRadius: radii.md, flexShrink: 1, gap: 5, maxWidth: '88%', padding: spacing.sm },
  messageIncoming: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1 },
  messageOutgoing: { backgroundColor: colors.brass },
  messageBody: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  messageOutgoingBody: { color: colors.paper },
  messageMeta: { color: colors.muted, fontSize: 10, fontWeight: '700' },
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
