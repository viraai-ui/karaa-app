import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Conversation } from '@karaa/contracts/events';

import { EmptyState } from '../../components/EmptyState';
import { StatusPill } from '../../components/StatusPill';
import { ApiError, apiBaseUrl } from '../../lib/api';
import { type RealtimeSession, type RealtimeSubscriber, useRealtimeRefresh } from '../../lib/realtime';
import { loadSession } from '../../lib/session';
import { colors, layout, radii, spacing } from '../../theme/tokens';
import { ProjectConversation } from '../conversations/ProjectConversation';
import { fetchCustomerProject, fetchCustomerSupportConversation, fetchProtectedEvidenceDataUri, sendCustomerSupportMessage, type CustomerProjectDetail } from './customer-api';

type CustomerProjectScreenProps = {
  loadProject?: () => Promise<CustomerProjectDetail>;
  loadMediaToken?: () => Promise<string | undefined>;
  loadEvidence?: (mediaPath: string, token: string) => Promise<string>;
  loadSupportConversation?: (projectId: string) => Promise<Conversation | undefined>;
  sendSupportMessage?: (conversationId: string, body: string) => Promise<void>;
  loadRealtimeSession?: () => Promise<RealtimeSession | undefined>;
  mediaBaseUrl?: string;
  subscribeRealtime?: RealtimeSubscriber;
};

type ScreenState =
  | { status: 'loading' }
  | { status: 'ready'; detail: CustomerProjectDetail; evidenceUri?: string; evidenceUnavailable: boolean }
  | { status: 'error'; message: string };

function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
}

function formatDate(value: string | null): string {
  if (!value) return 'Schedule date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule date unavailable';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amountMinor: number, currency: 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

function locationLabel(locationState: CustomerProjectDetail['updates'][number]['locationState']): string {
  if (locationState === 'simulated') return 'Presentation simulator — not a real location';
  if (locationState === 'denied') return 'Location permission denied';
  if (locationState === 'unavailable') return 'Location unavailable';
  return 'Coordinates recorded';
}

async function loadCurrentCustomerProject(): Promise<CustomerProjectDetail> {
  try {
    const session = await loadSession();
    if (!session) {
      throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
    }
    return await fetchCustomerProject(session);
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  }
}

async function loadCustomerMediaToken(): Promise<string | undefined> {
  return (await loadSession())?.token;
}

async function loadCustomerSupportConversation(projectId: string): Promise<Conversation | undefined> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  return fetchCustomerSupportConversation(session, projectId);
}

async function sendCustomerSupportReply(conversationId: string, body: string): Promise<void> {
  const session = await loadSession();
  if (!session) throw new ApiError('AUTHENTICATION_REJECTED', 'Your Karaa session has expired. Sign in again.');
  await sendCustomerSupportMessage(session, conversationId, body);
}

function ProjectSkeleton() {
  return (
    <View accessibilityLabel="Loading project evidence" style={styles.skeleton}>
      <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
      <View style={[styles.skeletonBlock, styles.skeletonHero]} />
      <View style={[styles.skeletonBlock, styles.skeletonRow]} />
      <View style={[styles.skeletonBlock, styles.skeletonRow]} />
    </View>
  );
}

function CustomerEvidence({
  detail,
  evidenceUri,
  evidenceUnavailable,
  currentUserId,
  loadSupportConversation,
  sendSupportMessage,
  loadRealtimeSession,
  subscribeRealtime,
}: {
  detail: CustomerProjectDetail;
  evidenceUri?: string;
  evidenceUnavailable: boolean;
  currentUserId: string;
  loadSupportConversation: (projectId: string) => Promise<Conversation | undefined>;
  sendSupportMessage: (conversationId: string, body: string) => Promise<void>;
  loadRealtimeSession: () => Promise<RealtimeSession | undefined>;
  subscribeRealtime?: RealtimeSubscriber;
}) {
  const latestUpdate = detail.updates[0];
  const evidence = latestUpdate?.media[0];
  const evidenceSource = evidenceUri ? { uri: evidenceUri } : undefined;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="customer-safe-area">
      <ScrollView contentContainerStyle={styles.content} style={styles.page}>
        <View style={styles.column}>
        <View style={styles.header}>
          <Text style={styles.brand}>KARAA</Text>
          <StatusPill label="Customer record" tone="structural" />
        </View>

        <View style={styles.projectIntro}>
          <Text style={styles.eyebrow}>POWER OF 9</Text>
          <Text style={styles.title}>{detail.project.name}</Text>
          <Text style={styles.vertical}>{detail.project.verticalName}</Text>
          <StatusPill label={`${detail.project.progress}% delivery recorded`} tone="assured" />
        </View>

        <View style={styles.visualFrame}>
          <View style={styles.heroMedia} testID="customer-hero-frame">
            <Image
              accessibilityLabel="Demo visual: Amaravati Solar Commons"
              accessibilityRole="image"
              resizeMode="cover"
              source={require('../../../assets/demo/amaravati-hero.png')}
              style={styles.heroImage}
              testID="customer-hero-image"
            />
          </View>
          <Text style={styles.caption}>Demo visual</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROGRESS FROM SAVED WORK</Text>
          <Text style={styles.sectionTitle}>Evidence → Progress → Decision</Text>
          <View style={styles.timeline}>
            {detail.milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.timelineRow}>
                <View style={styles.rail}>
                  <View style={styles.marker}><Text style={styles.markerText}>{index + 1}</Text></View>
                  {index < detail.milestones.length - 1 ? <View style={styles.rule} /> : null}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{milestone.name}</Text>
                  <Text style={styles.timelineCopy}>
                    {milestone.progress}% weighted delivery{milestone.dueAt ? ` · ${formatDate(milestone.dueAt)}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LATEST FIELD RECORD</Text>
          {latestUpdate ? (
            <View style={styles.evidenceRecord}>
              <Text style={styles.recordMeta}>FIELD UPDATE · RECORDED {formatDate(latestUpdate.serverTimestamp)}</Text>
              <Text style={styles.recordBody}>{latestUpdate.workDescription}</Text>
              <Text style={styles.coordinateLabel}>{locationLabel(latestUpdate.locationState)}</Text>
              {latestUpdate.latitude !== null && latestUpdate.longitude !== null ? (
                <Text style={styles.coordinate}>{formatCoordinates(latestUpdate.latitude, latestUpdate.longitude)}</Text>
              ) : null}
              <View style={styles.nextAction}>
                <Text style={styles.nextActionLabel}>Next accountable step</Text>
                <Text style={styles.nextActionCopy}>{latestUpdate.nextAction}</Text>
              </View>
              {evidenceSource ? (
                <View style={styles.evidenceMediaFrame}>
                  <Image
                    accessibilityLabel="Persisted field evidence"
                    accessibilityRole="image"
                    resizeMode="cover"
                    source={evidenceSource}
                    style={styles.evidenceImage}
                    testID="customer-evidence-image"
                  />
                  {evidence.isDemoVisual ? <Text style={styles.caption}>Demo visual</Text> : null}
                </View>
              ) : evidenceUnavailable ? (
                <Text style={styles.mediaUnavailable}>Evidence preview unavailable</Text>
              ) : null}
              <Text style={styles.mediaNote}>{latestUpdate.media.length} image record{latestUpdate.media.length === 1 ? '' : 's'} attached</Text>
            </View>
          ) : (
            <EmptyState
              eyebrow="NO FIELD RECORDS"
              title="No saved evidence yet"
              copy="Karaa will show a field record here after an authorized project update is saved."
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CUSTOMER DOCUMENTS</Text>
          {detail.documents.length ? (
            <View style={styles.recordList}>
              {detail.documents.map((document) => (
                <View key={document.id} style={styles.assuranceRecord}>
                  <Text style={styles.assuranceTitle}>{document.title}</Text>
                  <Text style={styles.assuranceCopy}>{document.issuingAuthority}</Text>
                  <Text style={styles.assuranceMeta}>{document.reference} · {formatDate(document.issuedAt)}</Text>
                  <Text style={styles.demoDisclaimer}>{document.disclaimer}</Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              eyebrow="NO DOCUMENTS"
              title="No customer documents saved"
              copy="Authorized project documents will appear here when Karaa records them."
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT RECORDS</Text>
          {detail.paymentDemoRecords.length ? (
            <View style={styles.recordList}>
              {detail.paymentDemoRecords.map((record) => (
                <View key={record.id} style={styles.assuranceRecord}>
                  <Text style={styles.assuranceTitle}>{record.description}</Text>
                  <Text style={styles.paymentAmount}>{formatCurrency(record.amountMinor, record.currency)}</Text>
                  <Text style={styles.assuranceMeta}>{record.reference} · Recorded {formatDate(record.recordedAt)}</Text>
                  <Text style={styles.demoDisclaimer}>{record.disclaimer}</Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              eyebrow="NO PAYMENT RECORDS"
              title="No payment records saved"
              copy="Authorized payment records will appear here when Karaa records them."
            />
          )}
        </View>

        <View style={styles.section}>
          <ProjectConversation
            currentUserId={currentUserId}
            loadConversation={() => loadSupportConversation(detail.project.id)}
            loadRealtimeSession={loadRealtimeSession}
            sendMessage={sendSupportMessage}
            subscribeRealtime={subscribeRealtime}
            title="PROJECT SUPPORT"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRIVATE NOTICES</Text>
          {detail.notifications.length ? (
            <View style={styles.noticeList}>
              {detail.notifications.map((notification) => (
                <View key={notification.id} style={styles.notice}>
                  <Text style={styles.noticeBody}>{notification.body}</Text>
                  <Text style={styles.noticeMeta}>{notification.readAt ? 'Read' : 'Unread'} · {formatDate(notification.createdAt)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              eyebrow="NO NOTICES"
              title="Nothing needs your attention"
              copy="Project-specific notices will appear here when Karaa records one for your account."
            />
          )}
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function CustomerProjectScreen({
  loadProject = loadCurrentCustomerProject,
  loadMediaToken = loadCustomerMediaToken,
  loadEvidence,
  loadSupportConversation = loadCustomerSupportConversation,
  sendSupportMessage = sendCustomerSupportReply,
  loadRealtimeSession = loadSession,
  mediaBaseUrl = apiBaseUrl,
  subscribeRealtime,
}: CustomerProjectScreenProps) {
  const [state, setState] = useState<ScreenState>({ status: 'loading' });
  const [currentUserId, setCurrentUserId] = useState('');
  const loadEvidencePreview = useCallback(async (mediaPath: string, token: string) => {
    if (loadEvidence) return loadEvidence(mediaPath, token);
    return fetchProtectedEvidenceDataUri(mediaPath, { token }, fetch, mediaBaseUrl);
  }, [loadEvidence, mediaBaseUrl]);

  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const detail = await loadProject();
      let evidenceUri: string | undefined;
      const evidence = detail.updates[0]?.media[0];
      let evidenceUnavailable = false;
      if (evidence) {
        try {
          const mediaToken = await loadMediaToken();
          if (!mediaToken) {
            evidenceUnavailable = true;
          } else {
            evidenceUri = await loadEvidencePreview(evidence.mediaPath, mediaToken);
          }
        } catch {
          evidenceUnavailable = true;
        }
      }
      setState({ status: 'ready', detail, evidenceUri, evidenceUnavailable });
    } catch (cause) {
      setState({
        status: 'error',
        message: cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.',
      });
    }
  }, [loadEvidencePreview, loadMediaToken, loadProject]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void loadSession().then((session) => setCurrentUserId(session?.user.role === 'customer' ? session.user.id : ''));
  }, []);

  useRealtimeRefresh({
    loadSession: loadRealtimeSession,
    onEvent: () => { void refresh(); },
    projectIds: state.status === 'ready' ? [state.detail.project.id] : [],
    subscribe: subscribeRealtime,
  });

  if (state.status === 'loading') {
    return (
      <View style={styles.statePage}>
        <ProjectSkeleton />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.statePage}>
        <EmptyState
          eyebrow="PROJECT EVIDENCE"
          title="Project evidence unavailable"
          copy={state.message}
        >
          <Pressable
            accessibilityLabel="Retry project evidence"
            accessibilityRole="button"
            onPress={() => void refresh()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry project evidence</Text>
          </Pressable>
        </EmptyState>
      </View>
    );
  }

  return (
    <CustomerEvidence
      detail={state.detail}
      currentUserId={currentUserId}
      evidenceUnavailable={state.evidenceUnavailable}
      evidenceUri={state.evidenceUri}
      loadRealtimeSession={loadRealtimeSession}
      loadSupportConversation={loadSupportConversation}
      sendSupportMessage={sendSupportMessage}
      subscribeRealtime={subscribeRealtime}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  page: { backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { alignSelf: 'center', gap: spacing.xl, maxWidth: layout.contentMaxWidth, width: '100%' },
  statePage: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  brand: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 2, paddingTop: spacing.xs },
  projectIntro: { gap: spacing.sm },
  eyebrow: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.7, lineHeight: 38 },
  vertical: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  visualFrame: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  heroMedia: { aspectRatio: 16 / 9, width: '100%' },
  heroImage: { height: '100%', width: '100%' },
  caption: { color: colors.muted, fontSize: 12, fontWeight: '700', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  section: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg },
  sectionLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', lineHeight: 31 },
  timeline: { gap: spacing.xs },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 28 },
  marker: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.pill, height: 28, justifyContent: 'center', width: 28 },
  markerText: { color: colors.paper, fontSize: 12, fontWeight: '800' },
  rule: { backgroundColor: colors.line, flex: 1, marginVertical: spacing.xs, width: 1 },
  timelineContent: { flex: 1, gap: spacing.xs, paddingBottom: spacing.lg },
  timelineTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 23 },
  timelineCopy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  evidenceRecord: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  recordMeta: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, lineHeight: 18 },
  recordBody: { color: colors.ink, fontSize: 20, fontWeight: '800', lineHeight: 27 },
  coordinateLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: spacing.xs },
  coordinate: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  nextAction: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.xs, marginTop: spacing.sm, paddingTop: spacing.md },
  nextActionLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  nextActionCopy: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  evidenceMediaFrame: { borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, overflow: 'hidden' },
  evidenceImage: { aspectRatio: 4 / 3, width: '100%' },
  mediaUnavailable: { color: colors.muted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  mediaNote: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  recordList: { borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  assuranceRecord: { backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, gap: spacing.xs, padding: spacing.md },
  assuranceTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 24 },
  assuranceCopy: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  assuranceMeta: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  paymentAmount: { color: colors.moss, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  demoDisclaimer: { color: colors.brass, fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: spacing.xs },
  noticeList: { borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  notice: { backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, gap: spacing.xs, padding: spacing.md },
  noticeBody: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  noticeMeta: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  retryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.md, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.lg },
  retryButtonText: { color: colors.paper, fontSize: 16, fontWeight: '800' },
  skeleton: { alignSelf: 'center', gap: spacing.md, maxWidth: layout.contentMaxWidth, width: '100%' },
  skeletonBlock: { backgroundColor: colors.statusStructuralSurface, borderRadius: radii.md },
  skeletonTitle: { height: 38, width: '62%' },
  skeletonHero: { aspectRatio: 16 / 9, width: '100%' },
  skeletonRow: { height: 88, width: '100%' },
});
