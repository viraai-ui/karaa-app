import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoChatExperience } from './DemoChatExperience';
import { DemoStatusPill } from './OfflineDemoPrimitives';
import {
  type DemoSupportPriority,
  type DemoSupportTicket,
  type OfflineDemoAction,
  type OfflineDemoState,
} from './offline-demo';

type Props = {
  readonly state: OfflineDemoState;
  readonly onAction: (action: OfflineDemoAction) => void;
};

type ValidationErrors = {
  readonly projectOrCategory: boolean;
  readonly subject: boolean;
  readonly description: boolean;
};

const noErrors: ValidationErrors = {
  projectOrCategory: false,
  subject: false,
  description: false,
};

export function LegacySupportExperience({ onAction, state, initialFormOpen = false }: Props & { initialFormOpen?: boolean }) {
  const [formOpen, setFormOpen] = useState(initialFormOpen);
  const [projectOrCategory, setProjectOrCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<DemoSupportPriority>('normal');
  const [errors, setErrors] = useState<ValidationErrors>(noErrors);
  const [supportingNoteOpen, setSupportingNoteOpen] = useState(false);

  if (state.surface === 'chat-thread' && state.selectedChatThreadId) {
    return <DemoChatExperience onAction={onAction} state={state} />;
  }

  const submit = () => {
    const nextErrors: ValidationErrors = {
      projectOrCategory: !projectOrCategory.trim(),
      subject: !subject.trim(),
      description: !description.trim(),
    };
    setErrors(nextErrors);
    if (nextErrors.projectOrCategory || nextErrors.subject || nextErrors.description) return;

    setFormOpen(false);
    setSupportingNoteOpen(false);
    onAction({
      type: 'create-support-ticket',
      projectOrCategory,
      subject,
      description,
      priority,
    });
  };

  if (formOpen) {
    return (
      <View style={styles.page}>
        <Pressable accessibilityLabel="Back to Support history" accessibilityRole="button" onPress={() => setFormOpen(false)} style={styles.backAction}>
          <Text style={styles.backText}>‹ Support</Text>
        </Pressable>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>CUSTOMER SUPPORT</Text>
          <Text style={styles.title}>Create support ticket</Text>
          <Text style={styles.context}>Add the project context and question for a shared customer and management conversation.</Text>
        </View>

        <View style={styles.form}>
          <Field label="Support project or category" error={errors.projectOrCategory ? 'Choose a support project or category.' : null}>
            <TextInput
              accessibilityLabel="Support project or category"
              onChangeText={setProjectOrCategory}
              placeholder="Amaravati Solar Commons"
              placeholderTextColor={colors.muted}
              style={[styles.input, errors.projectOrCategory && styles.inputError]}
              value={projectOrCategory}
            />
          </Field>
          <Field label="Support subject" error={errors.subject ? 'Enter a support subject.' : null}>
            <TextInput
              accessibilityLabel="Support subject"
              onChangeText={setSubject}
              placeholder="What needs clarification?"
              placeholderTextColor={colors.muted}
              style={[styles.input, errors.subject && styles.inputError]}
              value={subject}
            />
          </Field>
          <Field label="Support description" error={errors.description ? 'Enter a support description.' : null}>
            <TextInput
              accessibilityLabel="Support description"
              multiline
              onChangeText={setDescription}
              placeholder="Add the relevant project details"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.descriptionInput, errors.description && styles.inputError]}
              textAlignVertical="top"
              value={description}
            />
          </Field>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['normal', 'urgent'] as const).map((value) => {
                const selected = priority === value;
                const label = value === 'normal' ? 'Normal' : 'Urgent';
                return (
                  <Pressable
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={value}
                    onPress={() => setPriority(value)}
                    style={[styles.priority, selected && styles.prioritySelected]}
                  >
                    <Text style={[styles.priorityText, selected && styles.priorityTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.noteBlock}>
            <Pressable accessibilityLabel="Show supporting note option" accessibilityRole="button" onPress={() => setSupportingNoteOpen(true)} style={styles.noteAction}>
              <Text style={styles.noteGlyph}>＋</Text>
              <Text style={styles.noteActionText}>Supporting note</Text>
            </Pressable>
            {supportingNoteOpen ? <Text style={styles.noteText}>Add supporting note</Text> : null}
          </View>

          <Pressable accessibilityLabel="Add support ticket" accessibilityRole="button" onPress={submit} style={styles.submit}>
            <Text style={styles.submitText}>Add support ticket</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.headingBlock}>
        <Text style={styles.eyebrow}>CUSTOMER SUPPORT</Text>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.context}>Ticket history and shared conversations for project questions.</Text>
      </View>
      <Pressable accessibilityLabel="Create support ticket" accessibilityRole="button" onPress={() => { setErrors(noErrors); setFormOpen(true); }} style={styles.createAction}>
        <Text style={styles.createActionText}>Create support ticket</Text>
      </Pressable>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>TICKET HISTORY</Text>
        <Text style={styles.historyCount}>{String(state.supportTickets.length).padStart(2, '0')}</Text>
      </View>
      <View style={styles.history}>
        {state.supportTickets.map((ticket) => (
          <TicketRow key={ticket.id} onOpen={() => onAction({ type: 'open-support-ticket', ticketId: ticket.id })} ticket={ticket} />
        ))}
      </View>
    </View>
  );
}

function Field({ children, error, label }: { readonly children: React.ReactNode; readonly error: string | null; readonly label: string }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function TicketRow({ onOpen, ticket }: { readonly onOpen: () => void; readonly ticket: DemoSupportTicket }) {
  const statusLabel = ticket.status === 'in-review' ? 'IN REVIEW' : 'RESOLVED';
  return (
    <Pressable accessibilityLabel={`Open ${ticket.id} support ticket`} accessibilityRole="button" onPress={onOpen} style={styles.ticketRow}>
      <View style={styles.ticketCopy}>
        <View style={styles.ticketTopLine}>
          <Text style={styles.ticketId}>{ticket.id}</Text>
          <DemoStatusPill label={statusLabel} tone={ticket.status === 'resolved' ? 'positive' : 'attention'} />
        </View>
        <Text numberOfLines={2} style={styles.ticketSubject}>{ticket.subject}</Text>
        <Text numberOfLines={1} style={styles.ticketProject}>{ticket.projectOrCategory}</Text>
        <View style={styles.ticketMetaLine}>
          <Text style={[styles.priorityLabel, ticket.priority === 'urgent' && styles.priorityUrgent]}>{ticket.priority.toUpperCase()}</Text>
          <Text style={styles.ticketDate}>{ticket.createdLabel}</Text>
          <Text style={styles.ticketDate}>{ticket.updatedLabel}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.sm, paddingBottom: spacing.xl },
  headingBlock: { gap: 4 },
  eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', lineHeight: 36 },
  context: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  createAction: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  createActionText: { color: colors.paper, fontSize: 13, fontWeight: '900' },
  historyHeader: { alignItems: 'baseline', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 6, paddingTop: 4 },
  historyTitle: { color: colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  historyCount: { color: colors.brass, fontSize: 11, fontWeight: '900' },
  history: { gap: 0 },
  ticketRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 116, paddingVertical: spacing.sm },
  ticketCopy: { flex: 1, gap: 3 },
  ticketTopLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  ticketId: { color: colors.brass, fontSize: 11, fontWeight: '900', letterSpacing: .4 },
  ticketSubject: { color: colors.ink, fontSize: 15, fontWeight: '900', lineHeight: 19 },
  ticketProject: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  ticketMetaLine: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingTop: 3 },
  priorityLabel: { color: colors.moss, fontSize: 9, fontWeight: '900', letterSpacing: .45 },
  priorityUrgent: { color: colors.danger },
  ticketDate: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  chevron: { color: colors.brass, fontSize: 27, fontWeight: '300' },
  backAction: { alignItems: 'flex-start', justifyContent: 'center', minHeight: 44 },
  backText: { color: colors.brass, fontSize: 13, fontWeight: '900' },
  form: { gap: spacing.sm },
  fieldBlock: { gap: 6 },
  label: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  descriptionInput: { minHeight: 96 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priority: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44 },
  prioritySelected: { backgroundColor: colors.brass, borderColor: colors.brass },
  priorityText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  priorityTextSelected: { color: colors.paper },
  noteBlock: { gap: 4 },
  noteAction: { alignItems: 'center', alignSelf: 'flex-start', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: spacing.sm },
  noteGlyph: { color: colors.brass, fontSize: 18, fontWeight: '900' },
  noteActionText: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  noteText: { color: colors.muted, fontSize: 11, paddingLeft: 4 },
  submit: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  submitText: { color: colors.paper, fontSize: 13, fontWeight: '900' },
});
