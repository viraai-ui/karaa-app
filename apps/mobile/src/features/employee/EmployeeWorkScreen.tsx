import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { randomUUID } from 'expo-crypto';

import type { ProgressUpdateCreatedEvent } from '@karaa/contracts/events';

import { EmptyState } from '../../components/EmptyState';
import { StatusPill } from '../../components/StatusPill';
import { KaraaBrand } from '../../components/KaraaBrand';
import { ProjectConversation } from '../conversations/ProjectConversation';
import { ApiError } from '../../lib/api';
import { type RealtimeSession, type RealtimeSubscriber, useRealtimeRefresh } from '../../lib/realtime';
import { loadSession } from '../../lib/session';
import { colors, layout, radii, spacing } from '../../theme/tokens';

export type EmployeePhoto = {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type EmployeeLocation =
  | { state: 'active'; latitude: number; longitude: number }
  | { state: 'simulated'; latitude: number; longitude: number }
  | { state: 'denied' }
  | { state: 'unavailable' };

export type EmployeeAssignedWork = {
  project: { id: string; name: string; verticalName: string };
  milestones: Array<{ id: string; name: string; progress: number }>;
  updates: ProgressUpdateCreatedEvent[];
};

export type EmployeeFieldRecord = {
  eventId: string;
  occurredAt: string;
  projectId: string;
  milestoneId: string;
  workDescription: string;
  claimedProgress: number;
  crewCount: number;
  crewHours: number;
  quantityValue: number | null;
  quantityUnit: string | null;
  siteConditions: string;
  blocker: string | null;
  nextAction: string;
  photo: EmployeePhoto;
  location: EmployeeLocation;
};

type EmployeeFieldRecordDraft = Omit<EmployeeFieldRecord, 'eventId' | 'occurredAt'>;

type EmployeeWorkScreenProps = {
  loadWork: () => Promise<EmployeeAssignedWork>;
  currentUserId?: string;
  loadConversation?: (projectId: string) => Promise<import('@karaa/contracts/events').Conversation | undefined>;
  loadRealtimeSession?: () => Promise<RealtimeSession | undefined>;
  sendMessage?: (conversationId: string, body: string) => Promise<void>;
  subscribeRealtime?: RealtimeSubscriber;
  choosePhoto: () => Promise<EmployeePhoto | undefined>;
  resolveLocation: () => Promise<EmployeeLocation>;
  resolveActiveLocation?: () => Promise<EmployeeLocation>;
  saveCurrentLocation?: (location: Extract<EmployeeLocation, { latitude: number; longitude: number }>) => Promise<unknown>;
  createEventId?: () => string;
  submit: (record: EmployeeFieldRecord) => Promise<{ replayed: boolean }>;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; work: EmployeeAssignedWork }
  | { status: 'error'; message: string };

type FormState = {
  workDescription: string;
  claimedProgress: string;
  crewCount: string;
  crewHours: string;
  quantityValue: string;
  quantityUnit: string;
  siteConditions: string;
  blocker: string;
  nextAction: string;
};

const emptyForm: FormState = {
  workDescription: '',
  claimedProgress: '',
  crewCount: '',
  crewHours: '',
  quantityValue: '',
  quantityUnit: '',
  siteConditions: '',
  blocker: '',
  nextAction: '',
};

function locationLabel(location: EmployeeLocation | undefined): string {
  if (!location) return 'Location not set';
  if (location.state === 'active') return 'Location sharing active';
  if (location.state === 'simulated') return 'Presentation simulator — not a real location';
  if (location.state === 'denied') return 'Location permission denied';
  return 'Location unavailable';
}

function formatSavedRecordTime(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Server time unavailable';
  return timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseRecord(
  form: FormState,
  work: EmployeeAssignedWork,
  photo: EmployeePhoto | undefined,
  location: EmployeeLocation | undefined,
): { record?: EmployeeFieldRecordDraft; error?: string } {
  const milestone = work.milestones[0];
  const claimedProgress = Number(form.claimedProgress);
  const crewCount = Number(form.crewCount);
  const crewHours = Number(form.crewHours);
  const quantityValue = form.quantityValue.trim() === '' ? null : Number(form.quantityValue);
  const quantityUnit = form.quantityUnit.trim() || null;

  if (!milestone) return { error: 'No milestone is assigned to this project.' };
  if (!photo) return { error: 'Add an evidence photo.' };
  if (!location) return { error: 'Set a location state before publishing.' };
  if (!form.workDescription.trim() || !form.siteConditions.trim() || !form.nextAction.trim()) return { error: 'Complete work, site conditions, and next action.' };
  if (!Number.isFinite(claimedProgress) || claimedProgress < 0 || claimedProgress > 100) return { error: 'Enter claimed progress from 0 to 100.' };
  if (!Number.isInteger(crewCount) || crewCount < 0 || !Number.isFinite(crewHours) || crewHours < 0) return { error: 'Enter crew count and hours.' };
  if ((quantityValue === null) !== (quantityUnit === null) || (quantityValue !== null && (!Number.isFinite(quantityValue) || quantityValue < 0))) {
    return { error: 'Quantity and unit must be provided together.' };
  }

  return {
    record: {
      projectId: work.project.id,
      milestoneId: milestone.id,
      workDescription: form.workDescription.trim(),
      claimedProgress,
      crewCount,
      crewHours,
      quantityValue,
      quantityUnit,
      siteConditions: form.siteConditions.trim(),
      blocker: form.blocker.trim() || null,
      nextAction: form.nextAction.trim(),
      photo,
      location,
    },
  };
}

export function EmployeeWorkScreen({
  currentUserId,
  loadWork,
  loadConversation,
  loadRealtimeSession = loadSession,
  sendMessage,
  subscribeRealtime,
  choosePhoto,
  resolveLocation,
  resolveActiveLocation,
  saveCurrentLocation,
  createEventId = randomUUID,
  submit,
}: EmployeeWorkScreenProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photo, setPhoto] = useState<EmployeePhoto>();
  const [location, setLocation] = useState<EmployeeLocation>();
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempt, setAttempt] = useState<Pick<EmployeeFieldRecord, 'eventId' | 'occurredAt'>>();
  const [currentFieldLocation, setCurrentFieldLocation] = useState<EmployeeLocation>();
  const [currentLocationSaving, setCurrentLocationSaving] = useState(false);
  const [currentLocationSaved, setCurrentLocationSaved] = useState(false);
  const [currentLocationMessage, setCurrentLocationMessage] = useState<string>();

  function resetAttempt() {
    setAttempt(undefined);
    setSaved(false);
  }

  function updateForm(field: keyof FormState, value: string) {
    if (form[field] === value) return;
    setForm((current) => ({ ...current, [field]: value }));
    resetAttempt();
  }

  const refresh = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      setLoadState({ status: 'ready', work: await loadWork() });
    } catch {
      setLoadState({ status: 'error', message: 'Connection unavailable — try again.' });
    }
  }, [loadWork]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtimeRefresh({
    loadSession: loadRealtimeSession,
    onEvent: () => { void refresh(); },
    projectIds: [],
    subscribe: subscribeRealtime,
  });

  const selectedMilestone = useMemo(() => loadState.status === 'ready' ? loadState.work.milestones[0] : undefined, [loadState]);
  const loadProjectConversation = useCallback(async () => {
    if (loadState.status !== 'ready' || !loadConversation) return undefined;
    return loadConversation(loadState.work.project.id);
  }, [loadConversation, loadState]);
  const canPublish = useMemo(
    () => loadState.status === 'ready' && Boolean(parseRecord(form, loadState.work, photo, location).record),
    [form, loadState, location, photo],
  );

  async function addPhoto() {
    setMessage(undefined);
    try {
      const selected = await choosePhoto();
      if (selected) {
        if (photo?.uri === selected.uri && photo.fileName === selected.fileName && photo.mimeType === selected.mimeType) return;
        setPhoto(selected);
        resetAttempt();
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Karaa could not select this evidence image.');
    }
  }

  async function setPresentationLocation() {
    setMessage(undefined);
    try {
      const resolved = await resolveLocation();
      if (JSON.stringify(location) !== JSON.stringify(resolved)) {
        setLocation(resolved);
        resetAttempt();
      }
    } catch {
      if (location?.state !== 'unavailable') {
        setLocation({ state: 'unavailable' });
        resetAttempt();
      }
    }
  }

  async function setActiveLocation() {
    if (!resolveActiveLocation) return;
    setMessage(undefined);
    try {
      const resolved = await resolveActiveLocation();
      if (JSON.stringify(location) !== JSON.stringify(resolved)) {
        setLocation(resolved);
        resetAttempt();
      }
    } catch {
      if (location?.state !== 'unavailable') {
        setLocation({ state: 'unavailable' });
        resetAttempt();
      }
    }
  }

  async function shareCurrentFieldLocation(resolve: () => Promise<EmployeeLocation>) {
    if (!saveCurrentLocation) return;
    setCurrentLocationMessage(undefined);
    setCurrentLocationSaved(false);
    try {
      const resolved = await resolve();
      setCurrentFieldLocation(resolved);
      if (!('latitude' in resolved)) return;
      setCurrentLocationSaving(true);
      await saveCurrentLocation(resolved);
      setCurrentLocationSaved(true);
    } catch (cause) {
      setCurrentLocationMessage(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setCurrentLocationSaving(false);
    }
  }

  async function publish() {
    if (loadState.status !== 'ready') return;
    const parsed = parseRecord(form, loadState.work, photo, location);
    if (!parsed.record) {
      setSaved(false);
      setMessage(parsed.error);
      return;
    }

    setSaving(true);
    setSaved(false);
    setMessage(undefined);
    const submissionAttempt = attempt ?? { eventId: createEventId(), occurredAt: new Date().toISOString() };
    if (!attempt) setAttempt(submissionAttempt);
    try {
      await submit({ ...parsed.record, ...submissionAttempt });
      await refresh();
      setForm(emptyForm);
      setPhoto(undefined);
      setLocation(undefined);
      setAttempt(undefined);
      setSaved(true);
    } catch (cause) {
      setMessage(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loadState.status === 'loading') {
    return (
      <View style={styles.statePage}>
        <ActivityIndicator color={colors.brass} />
        <Text style={styles.stateCopy}>Loading assigned work…</Text>
      </View>
    );
  }

  if (loadState.status === 'error') {
    return (
      <View style={styles.statePage}>
        <EmptyState eyebrow="MY WORK" title="Assigned work unavailable" copy={loadState.message}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry assigned work" onPress={() => void refresh()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Retry assigned work</Text>
          </Pressable>
        </EmptyState>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} style={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <View style={styles.header}>
            <KaraaBrand height={18} variant="wordmark" />
            <StatusPill label="Field record" tone="structural" />
          </View>

          <View style={styles.intro}>
            <Text style={styles.eyebrow}>MY WORK</Text>
            <Text style={styles.title}>{loadState.work.project.name}</Text>
            <Text style={styles.vertical}>{loadState.work.project.verticalName}</Text>
            <View style={styles.assignment}>
              <Text style={styles.assignmentLabel}>ASSIGNED MILESTONE</Text>
              <Text style={styles.assignmentValue}>{selectedMilestone?.name ?? 'No milestone assigned'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EVIDENCE</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Add evidence photo" onPress={() => void addPhoto()} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>{photo ? 'Replace evidence photo' : 'Add evidence photo'}</Text>
            </Pressable>
            {photo ? <Text style={styles.selectionText}>{photo.fileName}</Text> : <Text style={styles.helperText}>One JPEG, PNG, or WebP image is required. It is sent only when Karaa accepts this record.</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LOCATION STATE</Text>
            {resolveActiveLocation ? <Pressable accessibilityRole="button" accessibilityLabel="Use device location" onPress={() => void setActiveLocation()} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Use device location</Text>
            </Pressable> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Use presentation location simulator" onPress={() => void setPresentationLocation()} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Use presentation location simulator</Text>
            </Pressable>
            <Text style={styles.helperText}>{locationLabel(location)}</Text>
          </View>

          {saveCurrentLocation ? <View style={styles.section}>
            <Text style={styles.sectionLabel}>CURRENT FIELD LOCATION</Text>
            <Text style={styles.helperText}>This is a separate, server-recorded field location for authorized Management only.</Text>
            {resolveActiveLocation ? <Pressable accessibilityRole="button" accessibilityLabel="Share device field location" disabled={currentLocationSaving} onPress={() => void shareCurrentFieldLocation(resolveActiveLocation)} style={[styles.outlineButton, currentLocationSaving && styles.disabledButton]}>
              <Text style={styles.outlineButtonText}>Share device field location</Text>
            </Pressable> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Share presentation field location" disabled={currentLocationSaving} onPress={() => void shareCurrentFieldLocation(resolveLocation)} style={[styles.outlineButton, currentLocationSaving && styles.disabledButton]}>
              <Text style={styles.outlineButtonText}>Share presentation field location</Text>
            </Pressable>
            <Text style={styles.helperText}>{currentFieldLocation ? locationLabel(currentFieldLocation) : 'No current field location shared'}</Text>
            {currentLocationSaving ? <Text accessibilityLiveRegion="polite" style={styles.status}>Saving field location…</Text> : null}
            {currentLocationSaved ? <Text accessibilityLiveRegion="polite" style={styles.saved}>Field location saved to Karaa</Text> : null}
            {currentLocationMessage ? <Text accessibilityRole="alert" style={styles.error}>{currentLocationMessage}</Text> : null}
          </View> : null}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FIELD RECORD</Text>
            <Field label="Completed work" multiline onChangeText={(workDescription) => updateForm('workDescription', workDescription)} value={form.workDescription} />
            <View style={styles.twoColumns}>
              <Field label="Claimed progress" keyboardType="decimal-pad" onChangeText={(claimedProgress) => updateForm('claimedProgress', claimedProgress)} value={form.claimedProgress} />
              <Field label="Crew count" keyboardType="number-pad" onChangeText={(crewCount) => updateForm('crewCount', crewCount)} value={form.crewCount} />
            </View>
            <Field label="Crew hours" keyboardType="decimal-pad" onChangeText={(crewHours) => updateForm('crewHours', crewHours)} value={form.crewHours} />
            <View style={styles.twoColumns}>
              <Field label="Quantity" keyboardType="decimal-pad" onChangeText={(quantityValue) => updateForm('quantityValue', quantityValue)} value={form.quantityValue} />
              <Field label="Quantity unit" onChangeText={(quantityUnit) => updateForm('quantityUnit', quantityUnit)} value={form.quantityUnit} />
            </View>
            <Field label="Site conditions" multiline onChangeText={(siteConditions) => updateForm('siteConditions', siteConditions)} value={form.siteConditions} />
            <Field label="Blocker or risk" multiline onChangeText={(blocker) => updateForm('blocker', blocker)} value={form.blocker} />
            <Field label="Next accountable action" multiline onChangeText={(nextAction) => updateForm('nextAction', nextAction)} value={form.nextAction} />
          </View>

          {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
          {saving ? <Text accessibilityLiveRegion="polite" style={styles.status}>Saving update…</Text> : null}
          {saved ? <Text accessibilityLiveRegion="polite" style={styles.saved}>Saved to Karaa</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publish progress update"
            accessibilityState={{ disabled: saving || !canPublish }}
            disabled={saving || !canPublish}
            onPress={() => void publish()}
            style={[styles.primaryButton, (saving || !canPublish) && styles.disabledButton]}
          >
            <Text style={styles.primaryButtonText}>Publish progress update</Text>
          </Pressable>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUBMITTED FIELD RECORDS</Text>
            <Text style={styles.helperText}>Saved field records appear here only after Karaa returns the canonical project record.</Text>
            {loadState.work.updates.length === 0 ? <Text style={styles.helperText}>No field records have been returned for this assignment.</Text> : loadState.work.updates.map((update) => <View key={update.id} style={styles.historyCard}>
              <Text style={styles.assignmentLabel}>SAVED {formatSavedRecordTime(update.serverTimestamp)}</Text>
              <Text style={styles.historyTitle}>{update.workDescription}</Text>
              <Text style={styles.historyMeta}>{update.claimedProgress}% claimed progress · {update.media.length} evidence image{update.media.length === 1 ? '' : 's'}</Text>
              <Text style={styles.helperText}>Next step: {update.nextAction}</Text>
            </View>)}
          </View>
          {loadConversation && sendMessage ? <ProjectConversation
            currentUserId={currentUserId ?? ''}
            loadConversation={loadProjectConversation}
            realtimeEnabled={false}
            sendMessage={sendMessage}
            title="PROJECT REPLIES"
          /> : null}
          <Text style={styles.footer}>Project data and actions require a secure connection to Karaa.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, multiline = false, keyboardType, onChangeText, value }: {
  label: string;
  multiline?: boolean;
  keyboardType?: 'decimal-pad' | 'number-pad';
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  page: { backgroundColor: colors.canvas },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  column: { alignSelf: 'center', gap: spacing.lg, maxWidth: layout.contentMaxWidth, width: '100%' },
  statePage: { alignItems: 'center', backgroundColor: colors.canvas, flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  stateCopy: { color: colors.muted, fontSize: 16 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  brand: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 2, paddingTop: spacing.xs },
  intro: { gap: spacing.sm },
  eyebrow: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', letterSpacing: -0.7, lineHeight: 38 },
  vertical: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  assignment: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, marginTop: spacing.xs, padding: spacing.md },
  assignmentLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  assignmentValue: { color: colors.ink, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  section: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, paddingTop: spacing.lg },
  sectionLabel: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  outlineButton: { alignItems: 'center', borderColor: colors.ink, borderRadius: radii.md, borderWidth: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  outlineButtonText: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  selectionText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  helperText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  twoColumns: { flexDirection: 'row', gap: spacing.md },
  field: { flex: 1, gap: spacing.xs },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, color: colors.ink, fontSize: 16, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.md, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.lg },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: colors.paper, fontSize: 16, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  status: { color: colors.muted, fontSize: 15, fontWeight: '700' },
  saved: { color: colors.moss, fontSize: 15, fontWeight: '800' },
  historyCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  historyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 23 },
  historyMeta: { color: colors.muted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  footer: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
