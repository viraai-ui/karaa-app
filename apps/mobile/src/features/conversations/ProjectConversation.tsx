import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Conversation } from '@karaa/contracts/events';

import { ApiError } from '../../lib/api';
import { type RealtimeSession, type RealtimeSubscriber, useRealtimeRefresh } from '../../lib/realtime';
import { loadSession } from '../../lib/session';
import { colors, radii, spacing } from '../../theme/tokens';

type ConversationState =
  | { status: 'loading' }
  | { status: 'ready'; conversation: Conversation | undefined }
  | { status: 'error'; message: string };

type ProjectConversationProps = {
  title: string;
  currentUserId: string;
  loadConversation: () => Promise<Conversation | undefined>;
  loadRealtimeSession?: () => Promise<RealtimeSession | undefined>;
  realtimeEnabled?: boolean;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  subscribeRealtime?: RealtimeSubscriber;
};

function safeMessage(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.';
}

export function ProjectConversation({
  currentUserId,
  loadConversation,
  loadRealtimeSession = loadSession,
  realtimeEnabled = true,
  sendMessage,
  subscribeRealtime,
  title,
}: ProjectConversationProps) {
  const [state, setState] = useState<ConversationState>({ status: 'loading' });
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', conversation: await loadConversation() });
    } catch (cause) {
      setState({ status: 'error', message: safeMessage(cause) });
    }
  }, [loadConversation]);

  useEffect(() => { void refresh(); }, [refresh]);

  useRealtimeRefresh({
    enabled: realtimeEnabled,
    loadSession: loadRealtimeSession,
    onEvent: () => { void refresh(); },
    projectIds: [],
    subscribe: subscribeRealtime,
  });

  const submit = async () => {
    if (state.status !== 'ready' || !state.conversation || !body.trim()) return;
    setSaving(true);
    setMessage(undefined);
    setSaved(false);
    try {
      await sendMessage(state.conversation.id, body.trim());
      setBody('');
      setSaved(true);
      await refresh();
    } catch (cause) {
      setMessage(safeMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <View style={styles.loading}><ActivityIndicator color={colors.brass} /><Text style={styles.loadingText}>Loading saved replies…</Text></View>;
  if (state.status === 'error') return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text><Text style={styles.error}>{state.message}</Text><Pressable accessibilityLabel="Retry project replies" accessibilityRole="button" onPress={() => void refresh()} style={styles.outlineButton}><Text style={styles.outlineButtonText}>Retry project replies</Text></Pressable></View>;
  if (!state.conversation) return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text><Text style={styles.empty}>No saved project reply yet. A secure connection is required before Karaa can create one.</Text></View>;

  return <View style={styles.panel}>
    <Text style={styles.panelTitle}>{title}</Text>
    <Text style={styles.helper}>Project-linked messages are saved to Karaa before they appear here.</Text>
    <View style={styles.thread}>{state.conversation.messages.map((item) => <View key={item.id} style={[styles.message, item.senderId === currentUserId ? styles.ownMessage : styles.otherMessage]}><Text style={[styles.messageBody, item.senderId === currentUserId ? styles.ownMessageBody : styles.otherMessageBody]}>{item.body}</Text></View>)}</View>
    <TextInput accessibilityLabel="Project reply" multiline onChangeText={(value) => { setBody(value); setSaved(false); }} placeholder="Write a project reply" placeholderTextColor={colors.muted} style={styles.input} value={body} />
    {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
    {saving ? <Text accessibilityLiveRegion="polite" style={styles.status}>Saving reply…</Text> : null}
    {saved ? <Text accessibilityLiveRegion="polite" style={styles.saved}>Reply saved to Karaa</Text> : null}
    <Pressable accessibilityLabel="Send project reply" accessibilityRole="button" disabled={saving || !body.trim()} onPress={() => void submit()} style={[styles.primaryButton, (saving || !body.trim()) && styles.disabled]}><Text style={styles.primaryButtonText}>Send project reply</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  panel: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg },
  panelTitle: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  helper: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  loadingText: { color: colors.muted, fontSize: 14 },
  empty: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  thread: { gap: spacing.sm },
  message: { borderRadius: radii.md, padding: spacing.md },
  ownMessage: { alignSelf: 'flex-end', backgroundColor: colors.ink, maxWidth: '90%' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, maxWidth: '90%' },
  messageBody: { fontSize: 15, lineHeight: 21 },
  ownMessageBody: { color: colors.paper },
  otherMessageBody: { color: colors.ink },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 84, padding: spacing.md, textAlignVertical: 'top' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.md, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg },
  primaryButtonText: { color: colors.paper, fontSize: 16, fontWeight: '800' },
  outlineButton: { alignItems: 'center', borderColor: colors.ink, borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  outlineButtonText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  status: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  saved: { color: colors.moss, fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});
