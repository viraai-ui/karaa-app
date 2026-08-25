import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { demoProjects } from './demo-catalog';
import type { DemoSupportPriority, OfflineDemoAction, OfflineDemoState } from './offline-demo';

type Props = { readonly state: OfflineDemoState; readonly onAction: (action: OfflineDemoAction) => void };
type Errors = { project: boolean; category: boolean; subject: boolean; description: boolean };

const projects = [...new Set(demoProjects.map((item) => item.name))].sort((a, b) => a.localeCompare(b));
const categories = ['Documents', 'Payments & receipts', 'Project updates', 'Account & access'] as const;
const emptyErrors: Errors = { project: false, category: false, subject: false, description: false };
const gold = '#B47A17';

export function DemoSupportExperience({ state, onAction }: Props) {
  const [ticketOpen, setTicketOpen] = useState(false);
  const [project, setProject] = useState('');
  const [category, setCategory] = useState('');
  const [projectOpen, setProjectOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<DemoSupportPriority>('normal');
  const [errors, setErrors] = useState<Errors>(emptyErrors);
  const submitting = useRef(false);

  const close = () => { setTicketOpen(false); setProjectOpen(false); setCategoryOpen(false); setErrors(emptyErrors); submitting.current = false; };
  const openTicketForm = () => { submitting.current = false; setErrors(emptyErrors); setTicketOpen(true); };
  const submit = () => {
    const next = { project: !project, category: !category, subject: !subject.trim(), description: !description.trim() };
    setErrors(next);
    if (Object.values(next).some(Boolean) || submitting.current) return;
    submitting.current = true;
    onAction({ type: 'create-support-ticket', projectOrCategory: `${project} · ${category}`, subject: subject.trim(), description: description.trim(), priority });
    setTicketOpen(false);
    setProject(''); setCategory(''); setSubject(''); setDescription(''); setPriority('normal'); setErrors(emptyErrors);

  };
  const openLiveChat = () => {
    const supportThread = state.chatThreads.find((thread) => thread.kind === 'support' && thread.status === 'open')
      ?? state.chatThreads.find((thread) => thread.kind === 'support');
    if (supportThread) onAction({ type: 'select-chat-thread', threadId: supportThread.id });
  };

  return <View style={styles.page} testID="customer-support-page">
    <View style={styles.hero}>
      <View style={styles.heroCopy}><Text style={styles.eyebrow}>HELP & ASSISTANCE</Text><Text style={styles.title}>Support</Text><Text style={styles.heroText}>Thoughtful help for your projects, documents and account.</Text></View>
      <Image accessibilityLabel="Karaa support specialist" source={require('../../assets/support/support-specialist-hero.webp')} style={styles.heroImage} />
    </View>

    <View style={styles.content}>
      <View><Text style={styles.sectionTitle}>How can we help?</Text><Text style={styles.sectionIntro}>Choose the fastest way to reach our support team.</Text></View>
      <View style={styles.actionStack}>
        <SupportCard eyebrow="AVAILABLE NOW" icon="●" onPress={openLiveChat} subtitle="Message a Karaa support specialist" title="Live Chat" tone="live" />
        <SupportCard eyebrow="WE’LL FOLLOW UP" icon="＋" onPress={openTicketForm} subtitle="Share an issue with project context" title="Raise a Ticket" tone="ticket" />
      </View>

      <View style={styles.historyHeading}><View><Text style={styles.sectionTitle}>Ticket History</Text><Text style={styles.sectionIntro}>Your current and previous requests.</Text></View><Text style={styles.count}>{String(state.supportTickets.length).padStart(2, '0')}</Text></View>
      <View style={styles.ticketList}>
        {state.supportTickets.map((ticket) => <Pressable accessibilityLabel={`Open ${ticket.subject} ticket thread`} accessibilityRole="button" key={ticket.id} onPress={() => onAction({ type: 'open-support-ticket', ticketId: ticket.id })} style={styles.ticketRow}>
          <View style={styles.ticketMark}><Text style={styles.ticketMarkText}>K</Text></View>
          <View style={styles.ticketCopy}><View style={styles.ticketTop}><Text style={styles.ticketId}>{ticket.id}</Text><Text style={[styles.status, ticket.status === 'resolved' && styles.resolved]}>{ticket.status === 'resolved' ? 'RESOLVED' : 'IN REVIEW'}</Text></View><Text numberOfLines={2} style={styles.ticketSubject}>{ticket.subject}</Text><Text numberOfLines={1} style={styles.ticketContext}>{ticket.projectOrCategory}</Text><Text style={styles.ticketUpdate}>{ticket.updatedLabel}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>)}
      </View>
    </View>

    <Modal animationType="fade" onRequestClose={close} transparent visible={ticketOpen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.scrim}>
        <View accessibilityLabel="Raise a support ticket" accessibilityViewIsModal style={styles.modal} testID="support-ticket-modal">
          <View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>SUPPORT REQUEST</Text><Text style={styles.modalTitle}>Raise a Ticket</Text></View><Pressable accessibilityLabel="Close ticket form" accessibilityRole="button" onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FieldLabel text="SELECT PROJECT" />
            <Dropdown label="project" onSelect={(value) => { setProject(value); setProjectOpen(false); setErrors((current) => ({ ...current, project: false })); }} onToggle={() => { setProjectOpen((open) => !open); setCategoryOpen(false); }} open={projectOpen} options={projects} placeholder="Select a project" value={project} />
            {errors.project && <ErrorText text="Choose a project." />}
            <FieldLabel text="CATEGORY" />
            <Dropdown label="category" onSelect={(value) => { setCategory(value); setCategoryOpen(false); setErrors((current) => ({ ...current, category: false })); }} onToggle={() => { setCategoryOpen((open) => !open); setProjectOpen(false); }} open={categoryOpen} options={categories} placeholder="Select a category" value={category} />
            {errors.category && <ErrorText text="Choose a category." />}
            <FieldLabel text="SUBJECT" /><TextInput accessibilityLabel="Ticket subject" maxLength={100} onChangeText={setSubject} placeholder="Briefly describe the issue" placeholderTextColor="#85827B" style={[styles.input, errors.subject && styles.inputError]} value={subject} />
            {errors.subject && <ErrorText text="Enter a subject." />}
            <FieldLabel text="DESCRIPTION" /><TextInput accessibilityLabel="Ticket description" maxLength={1000} multiline onChangeText={setDescription} placeholder="Tell us what happened and how we can help" placeholderTextColor="#85827B" style={[styles.input, styles.textarea, errors.description && styles.inputError]} textAlignVertical="top" value={description} />
            {errors.description && <ErrorText text="Enter a description." />}
            <FieldLabel text="PRIORITY" /><View accessibilityRole="radiogroup" style={styles.priorityRow}><Option label="Normal" onPress={() => setPriority('normal')} selected={priority === 'normal'} /><Option label="Urgent" onPress={() => setPriority('urgent')} selected={priority === 'urgent'} /></View>
            <View style={styles.modalActions}><Pressable accessibilityLabel="Cancel ticket" accessibilityRole="button" onPress={close} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityLabel="Submit ticket" accessibilityRole="button" onPress={submit} style={styles.submit}><Text style={styles.submitText}>Submit Ticket  →</Text></Pressable></View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

function SupportCard({ eyebrow, icon, onPress, subtitle, title, tone }: { eyebrow: string; icon: string; onPress: () => void; subtitle: string; title: string; tone: 'live' | 'ticket' }) {
  const live = tone === 'live';
  return <Pressable accessibilityLabel={title} accessibilityRole="button" onPress={onPress} style={styles.supportCard}><View style={[styles.cardIcon, live ? styles.liveIcon : styles.ticketIcon]}><Text style={[styles.cardIconText, live ? styles.liveIconText : styles.ticketIconText]}>{icon}</Text></View><View style={styles.cardCopy}><Text style={[styles.cardEyebrow, live ? styles.liveEyebrow : styles.ticketEyebrow]}>{eyebrow}</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.cardSubtitle}>{subtitle}</Text></View><Text style={styles.cardArrow}>→</Text></Pressable>;
}
function FieldLabel({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function ErrorText({ text }: { text: string }) { return <Text accessibilityLiveRegion="polite" style={styles.error}>{text}</Text>; }
function Dropdown({ label, onSelect, onToggle, open, options, placeholder, value }: { label: string; onSelect: (value: string) => void; onToggle: () => void; open: boolean; options: readonly string[]; placeholder: string; value: string }) {
  return <View style={styles.dropdown}>
    <Pressable accessibilityLabel={`${value ? 'Change' : 'Select'} ${label}`} accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={[styles.dropdownTrigger, open && styles.dropdownTriggerOpen]}><Text numberOfLines={1} style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}>{value || placeholder}</Text><Text style={styles.dropdownChevron}>{open ? '⌃' : '⌄'}</Text></Pressable>
    {open ? <ScrollView nestedScrollEnabled showsVerticalScrollIndicator style={styles.dropdownMenu} testID={`${label}-dropdown-options`}>{options.map((item) => <Pressable accessibilityLabel={item} accessibilityRole="button" key={item} onPress={() => onSelect(item)} style={[styles.dropdownOption, value === item && styles.dropdownOptionSelected]}><Text style={[styles.dropdownOptionText, value === item && styles.dropdownOptionTextSelected]}>{item}</Text>{value === item ? <Text style={styles.dropdownCheck}>✓</Text> : null}</Pressable>)}</ScrollView> : null}
  </View>;
}
function Option({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) { return <Pressable accessibilityLabel={label === 'Normal' || label === 'Urgent' ? `${label} priority` : label} accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, selected && styles.optionSelected]}><View style={[styles.radio, selected && styles.radioSelected]} /><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', marginHorizontal: -16, marginTop: -16 },
  hero: { backgroundColor: '#F7F5F0', height: 218, overflow: 'hidden' }, heroCopy: { maxWidth: '67%', paddingLeft: 24, paddingTop: 38, zIndex: 2 }, heroImage: { bottom: 0, height: 218, opacity: .83, position: 'absolute', right: -38, width: '62%' },
  eyebrow: { color: gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { color: '#141512', fontFamily: 'serif', fontSize: 42, lineHeight: 48, marginTop: 6 }, heroText: { color: '#555750', fontSize: 13, lineHeight: 19, marginTop: 7 },
  content: { gap: 18, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 24 }, sectionTitle: { color: '#171815', fontFamily: 'serif', fontSize: 24, lineHeight: 30 }, sectionIntro: { color: '#6B6A64', fontSize: 12, lineHeight: 18, marginTop: 3 }, actionStack: { gap: 12 },
  supportCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E3E1DC', borderRadius: 12, borderWidth: 1, flexDirection: 'row', minHeight: 112, paddingHorizontal: 18, paddingVertical: 16 }, cardIcon: { alignItems: 'center', borderRadius: 25, height: 50, justifyContent: 'center', width: 50 }, liveIcon: { backgroundColor: '#E7F5EC' }, ticketIcon: { backgroundColor: '#FCEBE8' }, cardIconText: { fontSize: 21, fontWeight: '900', lineHeight: 22, textAlign: 'center' }, liveIconText: { color: '#2F8A52' }, ticketIconText: { color: '#C4493D', fontSize: 25 }, cardCopy: { flex: 1, marginHorizontal: 14 }, cardEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: .8 }, liveEyebrow: { color: '#2F8A52' }, ticketEyebrow: { color: '#C4493D' }, cardTitle: { color: '#171815', fontFamily: 'serif', fontSize: 20, marginTop: 3 }, cardSubtitle: { color: '#6B6A64', fontSize: 11, lineHeight: 16, marginTop: 2 }, cardArrow: { color: gold, fontSize: 22 },
  historyHeading: { alignItems: 'flex-end', borderTopColor: '#E3E1DC', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20 }, count: { color: gold, fontFamily: 'serif', fontSize: 24 }, ticketList: { gap: 10 }, ticketRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E3E1DC', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 112, paddingHorizontal: 14, paddingVertical: 13 }, ticketMark: { alignItems: 'center', backgroundColor: '#191A17', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, ticketMarkText: { color: '#D9A64B', fontFamily: 'serif', fontSize: 17 }, ticketCopy: { flex: 1, gap: 2, marginLeft: 12 }, ticketTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, ticketId: { color: gold, fontSize: 10, fontWeight: '900', letterSpacing: .5 }, status: { color: '#8A5D12', fontSize: 10, fontWeight: '900' }, resolved: { color: '#397445' }, ticketSubject: { color: '#1D1E1B', fontSize: 14, fontWeight: '800', lineHeight: 18 }, ticketContext: { color: '#666760', fontSize: 10 }, ticketUpdate: { color: '#929089', fontSize: 10, marginTop: 3 }, chevron: { color: gold, fontSize: 25, marginLeft: 8 },
  scrim: { alignItems: 'center', backgroundColor: 'rgba(15,15,13,.66)', flex: 1, justifyContent: 'center', padding: 16 }, modal: { backgroundColor: '#FFFFFF', borderRadius: 16, maxHeight: '92%', maxWidth: 480, overflow: 'hidden', width: '100%' }, modalHeader: { alignItems: 'center', borderBottomColor: '#E5E0D7', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 }, modalEyebrow: { color: gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, modalTitle: { color: '#171815', fontFamily: 'serif', fontSize: 25 }, close: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 }, closeText: { color: '#171815', fontSize: 29, fontWeight: '300' }, form: { padding: 20, paddingBottom: 28 }, label: { color: '#54554F', fontSize: 10, fontWeight: '900', letterSpacing: .8, marginBottom: 7, marginTop: 14 }, dropdown: { position: 'relative' }, dropdownTrigger: { alignItems: 'center', backgroundColor: '#F7F5F0', borderColor: '#E3E1DC', borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14 }, dropdownTriggerOpen: { borderColor: gold }, dropdownValue: { color: '#171815', flex: 1, fontSize: 13, fontWeight: '700', paddingRight: 10 }, dropdownPlaceholder: { color: '#85827B', fontWeight: '500' }, dropdownChevron: { color: gold, fontSize: 18, fontWeight: '900' }, dropdownMenu: { backgroundColor: '#FFFFFF', borderColor: '#E3E1DC', borderRadius: 10, borderWidth: 1, maxHeight: 220, marginTop: 6 }, dropdownOption: { alignItems: 'center', borderBottomColor: '#EEEAE3', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: 14, paddingVertical: 10 }, dropdownOptionSelected: { backgroundColor: '#F7F5F0' }, dropdownOptionText: { color: '#4F504A', flex: 1, fontSize: 12, lineHeight: 17 }, dropdownOptionTextSelected: { color: '#171815', fontWeight: '800' }, dropdownCheck: { color: gold, fontSize: 14, fontWeight: '900', marginLeft: 8 }, options: { gap: 7 }, priorityRow: { flexDirection: 'row', gap: 8 }, option: { alignItems: 'center', backgroundColor: '#F7F5F0', borderColor: '#E3E1DC', borderRadius: 8, borderWidth: 1, flexDirection: 'row', flexGrow: 1, minHeight: 44, paddingHorizontal: 12 }, optionSelected: { backgroundColor: '#FFF8E9', borderColor: gold }, radio: { borderColor: '#A3A098', borderRadius: 6, borderWidth: 1, height: 12, marginRight: 8, width: 12 }, radioSelected: { backgroundColor: gold, borderColor: gold }, optionText: { color: '#575851', fontSize: 11 }, optionTextSelected: { color: '#171815', fontWeight: '800' }, input: { backgroundColor: '#F7F5F0', borderColor: '#E3E1DC', borderRadius: 8, borderWidth: 1, color: '#171815', fontSize: 13, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10 }, textarea: { minHeight: 96 }, inputError: { borderColor: '#A33B32' }, error: { color: '#A33B32', fontSize: 10, fontWeight: '700', marginTop: 4 }, modalActions: { flexDirection: 'row', gap: 9, marginTop: 22 }, cancel: { alignItems: 'center', borderColor: '#CFC9BE', borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48 }, cancelText: { color: '#1B1C19', fontSize: 12, fontWeight: '900' }, submit: { alignItems: 'center', backgroundColor: '#171815', borderRadius: 8, flex: 1.5, justifyContent: 'center', minHeight: 48 }, submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
