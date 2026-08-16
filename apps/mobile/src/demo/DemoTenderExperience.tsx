import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoImageFrame } from './OfflineDemoPrimitives';
import { demoVisualAssets } from './demo-visual-assets';
import {
  tenderForId,
  tenderLifecycleLabel,
  type DemoTenderDetailTab,
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
  const [filter, setFilter] = useState<TenderStatus>('All');
  const [secondary, setSecondary] = useState<TenderStatus>('Ongoing');
  const [sortAscending, setSortAscending] = useState(false);
  const [panel, setPanel] = useState<'analytics' | 'calendar' | 'filters' | 'latest' | 'list' | null>(null);
  const [selected, setSelected] = useState<(typeof tenderRows)[number] | null>(null);
  const filtered = useMemo(() => tenderRows.filter(item => {
    const text = `${item.title} ${item.ref} ${item.category}`.toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (filter === 'All' || item.status === filter) && (secondary === 'All' || item.status === secondary);
  }).sort((a,b) => sortAscending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)), [filter, search, secondary, sortAscending]);

  return (
    <View style={styles.tendersPage} testID="tenders-page">
      <View style={styles.tenderHero}><View style={styles.heroCopy}><Text style={styles.tenderEyebrow}>OPPORTUNITIES &amp; PROCUREMENT</Text><Text style={styles.tenderTitle}>Tenders</Text><Text style={styles.tenderSubtitle}>Discover. Apply. Build the future.</Text></View><View style={styles.heroButtons}><SquareButton label="Global search" glyph="⌕" onPress={() => setPanel('filters')} /><SquareButton label="Open tender filters" glyph="≡" onPress={() => setPanel('filters')} /></View></View>
      <View style={styles.overviewCard}><View style={styles.overviewHead}><Text style={styles.overviewTitle}>Tender overview</Text><Text style={styles.overviewDots}>•••</Text></View><View style={styles.metricGrid}>{overviewMetrics.map(metric => <View key={metric.label} style={styles.metric}><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View><View style={styles.totalLine}><View><Text style={styles.totalValue}>46</Text><Text style={styles.totalLabel}>Total Tenders</Text></View><Pressable accessibilityRole="button" accessibilityLabel="View analytics" onPress={() => setPanel('analytics')}><Text style={styles.cardLink}>View analytics  →</Text></Pressable></View></View>
      <View style={styles.searchTools}><View style={styles.tenderSearch}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Search tenders" onChangeText={setSearch} placeholder="Search tenders" placeholderTextColor="#85817A" style={styles.tenderSearchInput} value={search} /></View><SquareButton light label="Filter tenders" glyph="≡" onPress={() => setPanel('filters')} /><SquareButton light label={`Sort tenders ${sortAscending ? 'descending' : 'ascending'}`} glyph="⇅" onPress={() => setSortAscending(value => !value)} /></View>
      <View accessibilityRole="tablist" style={styles.chipRail}>{statusFilters.map(item => <Pressable accessibilityLabel={`Filter ${item}`} accessibilityRole="tab" accessibilityState={{selected: filter === item}} hitSlop={10} key={item} onPress={() => { setFilter(item); if (item === 'Ongoing' || item === 'In Progress' || item === 'Applied') setSecondary(item); }} style={[styles.chip, filter === item && styles.chipActive]}><Text style={[styles.chipLabel, filter === item && styles.chipLabelActive]}>{item}</Text></Pressable>)}</View>
      <View style={styles.headingRow}><Text style={styles.serifSection}>Latest Applied</Text><Pressable accessibilityLabel="View all latest applied tenders" accessibilityRole="button" onPress={() => setPanel('latest')}><Text style={styles.sectionLink}>View all  →</Text></Pressable></View>
      <View style={styles.appliedCard}>{latestApplied.map(item => <View key={item.name} style={styles.progressRow}><View style={styles.appliedIcon}><Text style={styles.appliedGlyph}>{item.icon}</Text></View><View style={styles.progressCopy}><View style={styles.progressHeading}><Text numberOfLines={1} style={styles.progressName}>{item.name}</Text><Text style={styles.progressPercent}>{item.progress}%</Text></View><Text numberOfLines={1} style={styles.progressOwner}>{item.owner}</Text><View style={styles.progressBottom}><Text style={styles.progressStage}>{item.stage}</Text><View style={styles.slimRail}><View style={[styles.slimFill,{width: `${item.progress}%`}]} /></View></View></View></View>)}</View>
      <View style={styles.headingRow}><Text style={styles.serifSection}>All Tenders</Text><Pressable accessibilityLabel="Change tender list view" accessibilityRole="button" onPress={() => setPanel('list')} style={styles.listControl}><Text style={styles.listControlText}>☷</Text></Pressable></View>
      <View accessibilityRole="tablist" style={styles.secondaryTabs}>{(['Ongoing','In Progress','Applied'] as const).map(item => <Pressable accessibilityLabel={`Show ${item} tenders`} accessibilityRole="tab" accessibilityState={{selected: secondary === item}} hitSlop={{top:8,bottom:8,left:4,right:4}} key={item} onPress={() => { setSecondary(item); setFilter(item); }} style={[styles.secondaryTab, secondary === item && styles.secondaryActive]}><Text style={[styles.secondaryLabel, secondary === item && styles.secondaryLabelActive]}>{item}</Text></Pressable>)}</View>
      <View style={styles.tenderList}>{filtered.map(item => <Pressable accessibilityLabel={`Open ${item.title} tender details`} accessibilityRole="button" key={item.id} onPress={() => setSelected(item)} style={styles.compactRow}><View style={styles.sectorIcon}><Text style={styles.sectorGlyph}>{item.icon}</Text></View><View style={styles.compactCopy}><Text numberOfLines={1} style={styles.compactTitle}>{item.title}</Text><Text style={styles.compactMeta}>{item.ref} · {item.category}</Text><View style={styles.compactFacts}><Text style={styles.factSmall}>Est. Value  <Text style={styles.factStrong}>{item.value}</Text></Text><Text style={styles.factSmall}>Closing  <Text style={styles.factStrong}>{item.closing}</Text></Text></View></View><View style={styles.rowSide}><Text style={styles.statusBadge}>{item.status}</Text><View style={styles.goldArrowButton}><Text style={styles.goldArrowText}>›</Text></View></View></Pressable>)}{filtered.length === 0 ? <Text style={styles.emptyResults}>No tenders match your search and filters.</Text> : null}</View>
      <View style={styles.deadlineStrip}><View style={styles.calendarIcon}><Text style={styles.calendarGlyph}>□</Text></View><View style={styles.deadlineCopy}><Text style={styles.deadlineEyebrow}>UPCOMING DEADLINE</Text><Text style={styles.deadlineTitle}>400kV Substation at Bhopal</Text><Text style={styles.deadlineMeta}>Closes 18 Aug 2026 · 5:00 PM</Text></View><Pressable accessibilityLabel="View calendar" accessibilityRole="button" onPress={() => setPanel('calendar')}><Text style={styles.deadlineLink}>View calendar</Text></Pressable></View>
      <InfoModal mode={panel} onClose={() => setPanel(null)} />
      <TenderModal item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

type TenderStatus = 'All' | 'Ongoing' | 'In Progress' | 'Applied' | 'Completed';
const statusFilters: readonly TenderStatus[] = ['All','Ongoing','In Progress','Applied','Completed'];
const overviewMetrics = [{value:'12',label:'Ongoing'},{value:'07',label:'In Progress'},{value:'18',label:'Applied'},{value:'09',label:'Completed'}] as const;
const latestApplied = [
  {name:'400kV Substation at Bhopal',owner:'MP Power Transmission Co.',stage:'Stage 4: Final review',icon:'☼',progress:76},
  {name:'Solar Power Plant - 50 MW',owner:'NTPC Renewable Energy Ltd.',stage:'Stage 3: Commercial review',icon:'▥',progress:60},
  {name:'Smart City Infrastructure Works',owner:'Lucknow Smart City Ltd.',stage:'Stage 2: Technical review',icon:'▦',progress:48},
  {name:'Supply of Electrical Equipment',owner:'MP Power Management Co.',stage:'Stage 1: Documentation',icon:'⚙',progress:30},
] as const;
const tenderRows = [
  {id:'solar', icon:'☼', title:'Construction of Solar Power Plant 100 MW', ref:'KRG/RJ/2026/038', category:'Solar & Utilities', value:'₹4,850 Cr', status:'Ongoing', closing:'12 Aug 2026'},
  {id:'transmission', icon:'⌁', title:'400kV Transmission Line Package-II', ref:'KRG/MP/2026/041', category:'Power & Energy', value:'₹2,786 Cr', status:'Ongoing', closing:'18 Aug 2026'},
  {id:'substation', icon:'⚙', title:'Electric Substation (220/132kV) EPC Project', ref:'KRG/GJ/2026/029', category:'Electrical EPC', value:'₹2,320 Cr', status:'Ongoing', closing:'21 Aug 2026'},
  {id:'wind-solar', icon:'⌁', title:'Wind-Solar Hybrid Project 500 MW', ref:'KRG/RJ/2026/022', category:'Renewable Energy', value:'₹1,830 Cr', status:'Ongoing', closing:'24 Aug 2026'},
  {id:'equipment-ongoing', icon:'▥', title:'Supply of HT Electrical Equipment', ref:'KRG/DL/2026/017', category:'Manufacturing & Material', value:'₹1,220 Cr', status:'Ongoing', closing:'28 Aug 2026'},
  {id:'smart-city', icon:'▦', title:'Smart City Infrastructure Works', ref:'KRG/GJ/2026/029', category:'Infrastructure', value:'₹198 Cr', status:'In Progress', closing:'28 Aug 2026'},
  {id:'equipment', icon:'⌁', title:'Supply of Electrical Equipment', ref:'KRG/DL/2026/017', category:'Electrical', value:'₹76 Cr', status:'Applied', closing:'04 Sep 2026'},
] as const;
function SquareButton({glyph,label,onPress,light=false}:{glyph:string;label:string;onPress:()=>void;light?:boolean}) { return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={[styles.squareButton,light && styles.squareButtonLight]}><Text style={[styles.squareGlyph,light && styles.squareGlyphLight]}>{glyph}</Text></Pressable>; }
function InfoModal({mode,onClose}:{mode:'analytics'|'calendar'|'filters'|'latest'|'list'|null;onClose:()=>void}) { if (!mode) return null; const copy = {analytics:['Tender analytics','46 tracked opportunities · 18 applied · 09 completed.'],calendar:['Tender calendar','18 Aug 2026 · 400kV Substation at Bhopal\n24 Aug 2026 · Solar Power Plant - 50 MW'],filters:['Search & filters','Use search, status chips, and sort controls to refine this local tender prototype.'],latest:['Latest applied tenders','All 4 recently applied tenders are currently shown.'],list:['List view','Compact list view is active. Additional layouts are not available in this prototype.']}[mode]; return <Modal animationType="fade" transparent visible><View style={styles.modalShade}><View accessibilityViewIsModal style={styles.modalCard}><Text style={styles.modalEyebrow}>KARAA GLOBAL</Text><Text style={styles.modalTitle}>{copy[0]}</Text><Text style={styles.modalCopy}>{copy[1]}</Text><Pressable accessibilityLabel={`Close ${copy[0]}`} accessibilityRole="button" onPress={onClose} style={styles.modalClose}><Text style={styles.modalCloseText}>Close</Text></Pressable></View></View></Modal>; }
function TenderModal({item,onClose}:{item:(typeof tenderRows)[number]|null;onClose:()=>void}) { if (!item) return null; return <Modal animationType="slide" transparent visible><View style={styles.modalShade}><View accessibilityViewIsModal style={styles.modalCard}><Text style={styles.modalEyebrow}>{item.category.toUpperCase()}</Text><Text style={styles.modalTitle}>{item.title}</Text><Text style={styles.modalCopy}>Tender reference · {item.ref}\nEstimated value · {item.value}\nStatus · {item.status}\nClosing date · {item.closing}</Text><Text style={styles.prototypeNote}>Local opportunity preview — verify details with the issuing authority.</Text><Pressable accessibilityLabel="Close tender details" accessibilityRole="button" onPress={onClose} style={styles.modalClose}><Text style={styles.modalCloseText}>Close details</Text></Pressable></View></View></Modal>; }

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
  tendersPage: { gap: 10, paddingBottom: 2, width: '100%' },
  tenderHero: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 1 },
  heroCopy: { flex: 1, gap: 1 }, heroButtons: { flexDirection: 'row', gap: 5 },
  tenderEyebrow: { color: '#A77B22', fontSize: 7, fontWeight: '900', letterSpacing: 1.05 },
  tenderTitle: { color: '#11120F', fontFamily: 'serif', fontSize: 27, lineHeight: 30 }, tenderSubtitle: { color: '#726F68', fontSize: 9 },
  squareButton: { alignItems: 'center', backgroundColor: '#111210', borderColor: '#373830', borderRadius: 4, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 }, squareButtonLight: { backgroundColor: '#FFFEFA', borderColor: '#D8D3C9' }, squareGlyph: { color: '#D1A84C', fontSize: 17 }, squareGlyphLight: { color: '#292A26', fontSize: 16 },
  overviewCard: { backgroundColor: '#10110F', borderRadius: 6, overflow: 'hidden', paddingHorizontal: 13, paddingTop: 11 }, overviewHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, overviewTitle: { color: '#F7F2E8', fontFamily: 'serif', fontSize: 14 }, overviewDots: { color: '#9E9C94', fontSize: 10, letterSpacing: 2 },
  metricGrid: { flexDirection: 'row', marginTop: 10 }, metric: { borderRightColor: '#343530', borderRightWidth: 1, flex: 1, gap: 2, paddingLeft: 8 }, metricValue: { color: '#D6AD50', fontFamily: 'serif', fontSize: 19 }, metricLabel: { color: '#BDBAB2', fontSize: 7 }, totalLine: { alignItems: 'center', borderTopColor: '#343530', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingVertical: 8 }, totalValue: { color: '#F5F0E6', fontFamily: 'serif', fontSize: 16 }, totalLabel: { color: '#A9A69F', fontSize: 7 }, cardLink: { color: '#D1A84C', fontSize: 8, fontWeight: '700' },
  searchTools: { flexDirection: 'row', gap: 5 }, tenderSearch: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#D8D3C9', borderRadius: 4, borderWidth: 1, flex: 1, flexDirection: 'row', height: 34, paddingHorizontal: 9 }, searchIcon: { color: '#77736C', fontSize: 16 }, tenderSearchInput: { color: '#11120F', flex: 1, fontSize: 9, height: 32, paddingHorizontal: 6, paddingVertical: 0 },
  chipRail: { flexDirection: 'row', gap: 4 }, chip: { alignItems: 'center', borderColor: '#D5D0C6', borderRadius: 12, borderWidth: 1, flex: 1, height: 24, justifyContent: 'center' }, chipActive: { backgroundColor: '#111210', borderColor: '#111210' }, chipLabel: { color: '#69665F', fontSize: 7, fontWeight: '700' }, chipLabelActive: { color: '#F7F2E8' },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, serifSection: { color: '#161713', fontFamily: 'serif', fontSize: 16 }, sectionLink: { color: '#A77B22', fontSize: 8, fontWeight: '700' },
  appliedCard: { backgroundColor: '#FFFEFA', borderColor: '#DDD8CE', borderRadius: 5, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 }, progressRow: { alignItems:'center', borderBottomColor:'#E9E4DA', borderBottomWidth:1, flexDirection:'row', paddingVertical:5 }, appliedIcon:{alignItems:'center',backgroundColor:'#F1ECE1',borderRadius:3,height:31,justifyContent:'center',marginRight:7,width:31}, appliedGlyph:{color:'#A77B22',fontSize:14}, progressCopy:{flex:1,gap:1}, progressHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, progressName: { color: '#2B2B27', flex: 1, fontSize: 8, fontWeight: '700' }, progressOwner:{color:'#858078',fontSize:6}, progressPercent: { color: '#3A3934', fontSize: 7, fontWeight: '900' }, progressBottom:{alignItems:'center',flexDirection:'row',gap:7}, progressStage:{color:'#A77B22',fontSize:5.5,width:75}, slimRail: { backgroundColor: '#E6E1D7', borderRadius: 2, flex:1, height: 3, overflow: 'hidden' }, slimFill: { backgroundColor: '#BE9136', height: 3 },
  listControl: { alignItems: 'center', borderColor: '#D5D0C6', borderRadius: 3, borderWidth: 1, height: 25, justifyContent: 'center', width: 30 }, listControlText: { color: '#242520', fontSize: 15 }, secondaryTabs: { borderBottomColor: '#D8D3C9', borderBottomWidth: 1, flexDirection: 'row' }, secondaryTab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, height: 27, justifyContent: 'center', paddingHorizontal: 13 }, secondaryActive: { borderBottomColor: '#B6882E' }, secondaryLabel: { color: '#77736C', fontSize: 8, fontWeight: '700' }, secondaryLabelActive: { color: '#171814' },
  tenderList: { borderTopColor: '#D8D3C9', borderTopWidth: 0 }, compactRow: { alignItems: 'center', borderBottomColor: '#DDD8CE', borderBottomWidth: 1, flexDirection: 'row', minHeight: 66, paddingVertical: 7 }, sectorIcon: { alignItems: 'center', backgroundColor: '#F1ECE1', borderRadius: 4, height: 35, justifyContent: 'center', marginRight: 8, width: 35 }, sectorGlyph: { color: '#A77B22', fontSize: 17 }, compactCopy: { flex: 1, gap: 2 }, compactTitle: { color: '#1A1B17', fontFamily: 'serif', fontSize: 11 }, compactMeta: { color: '#827E76', fontSize: 6.5 }, compactFacts: { flexDirection: 'row', gap: 9, marginTop: 3 }, factSmall: { color: '#8A867E', fontSize: 6.5 }, factStrong: { color: '#2F302B', fontWeight: '800' }, rowSide: { alignItems: 'flex-end', gap: 8, marginLeft: 5 }, statusBadge: { backgroundColor: '#F0E7D4', borderRadius: 7, color: '#8B661E', fontSize: 6, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 5, paddingVertical: 2 }, goldArrowButton: { alignItems: 'center', backgroundColor: '#B98C31', borderRadius: 3, height: 21, justifyContent: 'center', width: 23 }, goldArrowText: { color: '#FFF', fontSize: 17, lineHeight: 18 }, emptyResults: { color: '#77736C', fontSize: 10, paddingVertical: 16, textAlign: 'center' },
  deadlineStrip: { alignItems: 'center', backgroundColor: '#F0E8D8', borderLeftColor: '#B98C31', borderLeftWidth: 3, borderRadius: 3, flexDirection: 'row', minHeight: 52, paddingHorizontal: 8 }, calendarIcon: { alignItems: 'center', backgroundColor: '#111210', borderRadius: 3, height: 30, justifyContent: 'center', marginRight: 8, width: 30 }, calendarGlyph: { color: '#D1A84C', fontSize: 16 }, deadlineCopy: { flex: 1, gap: 1 }, deadlineEyebrow: { color: '#A77B22', fontSize: 6, fontWeight: '900', letterSpacing: .6 }, deadlineTitle: { color: '#20211D', fontSize: 8, fontWeight: '800' }, deadlineMeta: { color: '#716D65', fontSize: 6.5 }, deadlineLink: { color: '#8C661D', fontSize: 7, fontWeight: '800', textDecorationLine: 'underline' },
  modalShade: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,.55)', bottom: 0, justifyContent: 'center', left: 0, padding: 22, position: 'absolute', right: 0, top: 0 }, modalCard: { backgroundColor: '#FBF8F0', borderRadius: 8, gap: 8, maxWidth: 350, padding: 20, width: '100%' }, modalEyebrow: { color: '#A77B22', fontSize: 8, fontWeight: '900', letterSpacing: 1 }, modalTitle: { color: '#141511', fontFamily: 'serif', fontSize: 23 }, modalCopy: { color: '#625F58', fontSize: 12, lineHeight: 20 }, prototypeNote: { color: '#8C661D', fontSize: 10, fontStyle: 'italic', lineHeight: 15 }, modalClose: { alignItems: 'center', backgroundColor: '#121310', borderRadius: 4, justifyContent: 'center', minHeight: 44, marginTop: 5 }, modalCloseText: { color: '#F8F3E8', fontSize: 11, fontWeight: '800' },
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
