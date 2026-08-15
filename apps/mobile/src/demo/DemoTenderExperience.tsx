import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoImageFrame } from './OfflineDemoPrimitives';
import { demoVisualAssets } from './demo-visual-assets';
import {
  tenderBoardRows,
  tenderForId,
  tenderLifecycleLabel,
  type DemoTenderBoardRow,
  type DemoTenderDetailTab,
  type DemoTenderFilter,
  type DemoTenderUpdate,
  type OfflineDemoAction,
  type OfflineDemoRole,
  type OfflineDemoState,
} from './offline-demo';

type Props = {
  readonly role: OfflineDemoRole;
  readonly state: OfflineDemoState;
  readonly onAction: (action: OfflineDemoAction) => void;
};

const provenance = 'Demo data — verify with issuing authority';
const lifecycleSteps = ['Technical review', 'Financial review', 'Clarification', 'Award decision'] as const;
const tabs: readonly { readonly key: DemoTenderDetailTab; readonly label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'updates', label: 'Updates' },
  { key: 'activity', label: 'Activity' },
  { key: 'docs', label: 'Docs' },
] as const;

export function DemoTenderExperience({ onAction, role, state }: Props) {
  if (state.surface === 'tender-detail' && state.selectedTenderId) {
    return <TenderDetail onAction={onAction} role={role} state={state} />;
  }
  return <TenderBoard onAction={onAction} state={state} />;
}

function TenderBoard({ onAction, state }: Pick<Props, 'onAction' | 'state'>) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DemoTenderFilter>('all');
  const rows = useMemo(() => tenderBoardRows(state, filter).filter((row) => row.title.toLowerCase().includes(search.toLowerCase())), [filter, search, state]);
  const attention = rows.filter((row) => row.attention);

  return (
    <View style={styles.page}>
      <View style={styles.summaryBand}>
        <Text style={styles.summaryEyebrow}>TENDER OPERATIONS</Text>
        <Text style={styles.summaryTitle}>Tender board</Text>
        <Text style={styles.summaryCopy}>Lifecycle evidence and accountable next actions.</Text>
      </View>
      <Text style={styles.provenance}>{provenance}</Text>
      <TextInput accessibilityLabel="Search tenders" onChangeText={setSearch} placeholder="Search tender records" placeholderTextColor={colors.muted} style={styles.search} value={search} />
      <View accessibilityRole="tablist" style={styles.filterRail}>
        {([
          ['all', 'All'],
          ['technical-review', 'Technical review'],
          ['attention', 'Attention'],
        ] as const).map(([key, label]) => (
          <Pressable accessibilityLabel={`Filter ${label}`} accessibilityRole="tab" accessibilityState={{ selected: filter === key }} key={key} onPress={() => setFilter(key)} style={[styles.filter, filter === key && styles.filterSelected]}>
            <Text style={[styles.filterText, filter === key && styles.filterTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Changes needing attention</Text>
      {attention.length ? attention.map((row) => <TenderRow key={row.tenderId} onAction={onAction} row={row} />) : <Text style={styles.empty}>No tender changes need attention.</Text>}
      <Text style={styles.sectionTitle}>Tender records</Text>
      {rows.filter((row) => !row.attention).map((row) => <TenderRow key={row.tenderId} onAction={onAction} row={row} />)}
      {rows.length === 0 ? <Text style={styles.empty}>No tender records match this filter.</Text> : null}
    </View>
  );
}

function TenderRow({ onAction, row }: { readonly onAction: (action: OfflineDemoAction) => void; readonly row: DemoTenderBoardRow }) {
  return (
    <Pressable accessibilityLabel={`Open ${row.title} tender`} accessibilityRole="button" onPress={() => onAction({ type: 'select-tender', tenderId: row.tenderId })} style={styles.tenderRow}>
      <View style={styles.rowTitleLine}><Text style={styles.rowTitle}>{row.title}</Text><Text style={styles.rowCount}>{row.updateCount} updates</Text></View>
      <Text style={styles.rowMeta}>{row.authority} · {row.lifecycleLabel}</Text>
      <View style={styles.rowActionLine}><Text style={styles.attentionText}>{row.attention ? 'Attention' : 'Tracked'}</Text><Text numberOfLines={1} style={styles.nextAction}>{row.nextAction}</Text></View>
    </Pressable>
  );
}

function TenderDetail({ onAction, role, state }: Props) {
  const tender = tenderForId(state, state.selectedTenderId!);
  const activeIndex = lifecycleSteps.indexOf(tenderLifecycleLabel(tender) as (typeof lifecycleSteps)[number]);
  const latest = tender.updates.at(-1)!;
  const isManagement = role === 'management';

  return (
    <View style={styles.page}>
      <Pressable accessibilityLabel="Back to tender board" accessibilityRole="button" onPress={() => onAction({ type: 'return-to-tender-board' })} style={styles.backAction}>
        <Text style={styles.backActionText}>‹ Tender board</Text>
      </Pressable>
      <View style={styles.detailHeader}>
        <DemoImageFrame accessibilityLabel={`Demo visual: ${tender.title} tender`} height={108} source={demoVisualAssets.progress.source} />
      </View>
      <View style={styles.detailContext}>
        <Text numberOfLines={1} style={styles.detailTitle}>{tender.title}</Text>
        <Text style={styles.lifecycleText}>{tenderLifecycleLabel(tender)}</Text>
      </View>
      <Text style={styles.provenance}>{provenance}</Text>
      <View accessibilityLabel="Tender lifecycle" style={styles.lifecycleRail}>
        {lifecycleSteps.map((step, index) => <View key={step} style={styles.lifecycleStep}><View style={[styles.lifecycleDot, index <= activeIndex && styles.lifecycleDotActive]} /><Text style={[styles.lifecycleStepText, index <= activeIndex && styles.lifecycleStepTextActive]}>{step}</Text></View>)}
      </View>
      <View style={styles.factRail}>
        <Fact label="Applied value" value={tender.valueLabel} />
        <Fact label="Bid opened" value={tender.bidOpenDate} />
        <Fact label="Target review" value={tender.targetDate} />
      </View>
      <View accessibilityRole="tablist" style={styles.tabRail}>
        {tabs.map((tab) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: state.selectedTenderDetailTab === tab.key }} key={tab.key} onPress={() => onAction({ type: 'select-tender-detail-tab', tab: tab.key })} style={styles.tab}><Text style={[styles.tabText, state.selectedTenderDetailTab === tab.key && styles.tabTextSelected]}>{tab.label}</Text></Pressable>)}
      </View>
      <Pressable accessibilityLabel="Next update" accessibilityRole="button" onPress={() => onAction({ type: 'select-tender-detail-tab', tab: 'updates' })} style={styles.nextStrip}>
        <Text style={styles.nextStripLabel}>NEXT UPDATE</Text><Text style={styles.nextStripText}>{latest.owner} · {latest.nextAction}</Text>
      </Pressable>
      {isManagement ? <View style={styles.managementActions}>
        <Pressable accessibilityLabel="Acknowledge update" accessibilityRole="button" onPress={() => onAction({ type: 'acknowledge-tender-update', tenderId: tender.id, updateId: 'CHG-024' })} style={styles.action}><Text style={styles.actionText}>Acknowledge update</Text></Pressable>
        <Pressable accessibilityLabel="Assign review" accessibilityRole="button" onPress={() => onAction({ type: 'assign-tender-review', tenderId: tender.id, assignee: 'Mira Management' })} style={styles.action}><Text style={styles.actionText}>{tender.reviewOwner ? `Review: ${tender.reviewOwner}` : 'Assign review'}</Text></Pressable>
        <Pressable accessibilityLabel="Revise deadline" accessibilityRole="button" onPress={() => onAction({ type: 'append-tender-deadline-change', tenderId: tender.id })} style={[styles.action, styles.actionPrimary]}><Text style={styles.actionPrimaryText}>Revise deadline</Text></Pressable>
      </View> : null}
      {state.selectedTenderDetailTab === 'overview' ? <Overview tenderId={tender.id} state={state} /> : null}
      {state.selectedTenderDetailTab === 'updates' ? <UpdateLedger updates={tender.updates} /> : null}
      {state.selectedTenderDetailTab === 'activity' ? <Activity updates={tender.updates} /> : null}
      {state.selectedTenderDetailTab === 'docs' ? <Documents updates={tender.updates} /> : null}
    </View>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text></View>;
}

function Overview({ state, tenderId }: { readonly state: OfflineDemoState; readonly tenderId: string }) {
  const tender = tenderForId(state, tenderId);
  return <View style={styles.overview}><Text style={styles.sectionTitle}>Current lifecycle</Text><Text style={styles.bodyCopy}>{tenderLifecycleLabel(tender)} remains the visible lifecycle state derived from the tender update ledger.</Text><Text style={styles.bodyCopy}>Review owner: {tender.reviewOwner ?? 'Not assigned'}</Text></View>;
}

function UpdateLedger({ updates }: { readonly updates: readonly DemoTenderUpdate[] }) {
  return <View style={styles.ledger}>{updates.map((update) => <UpdateRow key={update.id} update={update} />)}</View>;
}

function UpdateRow({ update }: { readonly update: DemoTenderUpdate }) {
  return <View style={styles.updateRow}>
    <View style={styles.updateHeading}><Text style={styles.recordId}>{update.id}</Text><Text style={styles.effect}>{update.effect}</Text></View>
    <Text style={styles.updateTitle}>{update.headline}</Text>
    <Text style={styles.updateMeta}>Origin / version · {update.origin ?? 'Initial record'}</Text>
    <Text style={styles.updateMeta}>{update.timestamp} · {update.owner}</Text>
    <Text style={styles.updateMeta}>Affected · {update.affectedRecords}</Text>
    <Text style={styles.bodyCopy}>{update.impact}</Text>
    {update.deadline ? <Text style={styles.deadline}>{update.deadline.previousLabel} → {update.deadline.revisedLabel}</Text> : null}
    {update.document ? <Text style={styles.document}>Revision document · {update.document.title} · {update.document.version} · {update.document.dateLabel}</Text> : null}
    <Text style={styles.nextRecordAction}>Next action · {update.nextAction}</Text>
    <Text style={styles.acknowledgement}>Acknowledged · {update.acknowledgedByRoles.length ? update.acknowledgedByRoles.join(', ') : 'None'}</Text>
  </View>;
}

function Activity({ updates }: { readonly updates: readonly DemoTenderUpdate[] }) {
  return <View style={styles.ledger}><Text style={styles.sectionTitle}>Activity</Text>{updates.slice().reverse().map((update) => <Text key={update.id} style={styles.activityLine}>{update.timestamp} · {update.owner} · {update.headline}</Text>)}</View>;
}

function Documents({ updates }: { readonly updates: readonly DemoTenderUpdate[] }) {
  const documents = updates.filter((update) => update.document);
  return <View style={styles.ledger}><Text style={styles.sectionTitle}>Docs</Text>{documents.map((update) => <Text key={update.id} style={styles.activityLine}>{update.document!.title} · {update.document!.version} · {update.document!.dateLabel}</Text>)}</View>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.sm },
  summaryBand: { backgroundColor: colors.ink, gap: 4, padding: spacing.md },
  summaryEyebrow: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  summaryTitle: { color: colors.paper, fontSize: 27, fontWeight: '800' },
  summaryCopy: { color: '#D6D3CD', fontSize: 13, lineHeight: 18 },
  provenance: { color: colors.muted, fontSize: 11, fontStyle: 'italic', lineHeight: 16 },
  search: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, minHeight: 44, paddingHorizontal: spacing.sm },
  filterRail: { flexDirection: 'row', gap: 6 },
  filter: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 2, justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 },
  filterSelected: { borderBottomColor: colors.brass },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  filterTextSelected: { color: colors.brass },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 4 },
  tenderRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 5, paddingVertical: spacing.sm },
  rowTitleLine: { alignItems: 'baseline', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  rowTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '800' },
  rowCount: { color: colors.brass, fontSize: 11, fontWeight: '800' },
  rowMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  rowActionLine: { flexDirection: 'row', gap: 8 },
  attentionText: { color: colors.amber, fontSize: 11, fontWeight: '900' },
  nextAction: { color: colors.muted, flex: 1, fontSize: 11 },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: spacing.md },
  backAction: { alignItems: 'flex-start', justifyContent: 'center', minHeight: 44 },
  backActionText: { color: colors.brass, fontSize: 13, fontWeight: '900' },
  detailHeader: { overflow: 'hidden' },
  detailContext: { backgroundColor: colors.ink, gap: 3, padding: spacing.md },
  detailTitle: { color: colors.paper, fontSize: 19, fontWeight: '800' },
  lifecycleText: { color: '#D6D3CD', fontSize: 12, fontWeight: '700', marginTop: 3 },
  lifecycleRail: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, flexDirection: 'row', padding: 8 },
  lifecycleStep: { alignItems: 'center', flex: 1, gap: 4 },
  lifecycleDot: { backgroundColor: colors.line, borderRadius: 5, height: 8, width: 8 },
  lifecycleDotActive: { backgroundColor: colors.moss },
  lifecycleStepText: { color: colors.muted, fontSize: 8, textAlign: 'center' },
  lifecycleStepTextActive: { color: colors.ink, fontWeight: '800' },
  factRail: { borderBottomColor: colors.line, borderBottomWidth: 1, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row' },
  fact: { flex: 1, gap: 3, paddingVertical: 8 },
  factLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  factValue: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  tabRail: { borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row' },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 44 },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tabTextSelected: { color: colors.brass, fontWeight: '900' },
  nextStrip: { backgroundColor: colors.statusAttentionSurface, borderLeftColor: colors.brass, borderLeftWidth: 3, gap: 3, padding: spacing.sm },
  nextStripLabel: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  nextStripText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  managementActions: { flexDirection: 'row', gap: 6 },
  action: { alignItems: 'center', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  actionPrimary: { backgroundColor: colors.brass, borderColor: colors.brass },
  actionText: { color: colors.ink, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  actionPrimaryText: { color: colors.paper, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  overview: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 6, paddingVertical: spacing.sm },
  ledger: { gap: 0 },
  updateRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 5, paddingVertical: spacing.sm },
  updateHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  recordId: { color: colors.brass, fontSize: 12, fontWeight: '900' },
  effect: { color: colors.moss, fontSize: 10, fontWeight: '900' },
  updateTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  updateMeta: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  bodyCopy: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  deadline: { color: colors.brass, fontSize: 12, fontWeight: '900' },
  document: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  nextRecordAction: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  acknowledgement: { color: colors.muted, fontSize: 10 },
  activityLine: { borderBottomColor: colors.line, borderBottomWidth: 1, color: colors.muted, fontSize: 12, lineHeight: 18, paddingVertical: spacing.sm },
});
