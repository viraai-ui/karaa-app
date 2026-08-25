import { useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoImageFrame } from './OfflineDemoPrimitives';
import { KaraaBrand } from '../components/KaraaBrand';
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
  const [localTenderId, setLocalTenderId] = useState<string | null>(null);
  if (state.surface === 'tender-detail' && state.selectedTenderId) {
    return <TenderDetail onAction={onAction} role={role} state={state} />;
  }
  return <View style={{width:'100%'}}><View style={localTenderId ? {display:'none'} : undefined}><TenderBoard customer={role === 'customer'} onAction={onAction} onOpen={setLocalTenderId} state={state} /></View>{localTenderId ? <TenderShowcase customer={role === 'customer'} id={localTenderId} onBack={() => setLocalTenderId(null)} /> : null}</View>;
}

function TenderBoard({ onAction, onOpen, state, customer }: Pick<Props, 'onAction' | 'state'> & {onOpen:(id:string)=>void;customer:boolean}) {
  const searchRef = useRef<TextInput>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TenderStatus>('All');
  const [secondary, setSecondary] = useState<TenderStatus>('Ongoing');
  const [sortAscending, setSortAscending] = useState(false);
  const [comfortable, setComfortable] = useState(false);
  const [category, setCategory] = useState('All categories');
  const [panel, setPanel] = useState<'analytics' | 'calendar' | 'filters' | 'latest' | 'list' | null>(null);

  const filtered = useMemo(() => tenderRows.filter(item => {
    const text = `${item.title} ${item.ref} ${item.category}`.toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (filter === 'All' || item.status === filter) && (secondary === 'All' || item.status === secondary) && (category === 'All categories' || item.category.includes(category));
  }).sort((a,b) => sortAscending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)), [category, filter, search, secondary, sortAscending]);

  return (
    <View style={styles.tendersPage} testID="tenders-page">
      <View style={styles.tenderHero}><View style={styles.heroCopy}><Text style={styles.tenderEyebrow}>OPPORTUNITIES &amp; PROCUREMENT</Text><Text style={styles.tenderTitle}>Tenders</Text></View></View>
      <View style={styles.overviewCard} testID="tender-overview-card"><View style={styles.overviewHead}><Text style={styles.overviewTitle}>Tender overview</Text></View><View style={styles.metricGrid}>{overviewMetrics.map((metric,index) => <View key={metric.label} style={[styles.metric,index===3&&styles.metricLast]}><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View><View style={styles.totalLine}><View style={styles.totalGroup}><View><Text style={styles.totalValue}>46</Text><Text style={styles.totalLabel}>Total tenders</Text></View></View><Pressable accessibilityRole="button" accessibilityLabel="View analytics" onPress={() => setPanel('analytics')} style={({pressed})=>[styles.linkTarget,pressed&&styles.pressed]}><Text style={styles.cardLink}>View analytics</Text><LineIcon name="arrow" light/></Pressable></View></View>
      <View style={styles.searchTools}><View style={styles.tenderSearch}><LineIcon name="search"/><TextInput ref={searchRef} accessibilityLabel="Search tenders" onChangeText={setSearch} placeholder="Search tenders" placeholderTextColor="#85817A" style={styles.tenderSearchInput} value={search} /></View><SquareButton light label="Filter tenders" icon="filter" onPress={() => setPanel('filters')} /><SquareButton light label={`Sort tenders ${sortAscending ? 'descending' : 'ascending'}`} icon="sort" onPress={() => setSortAscending(value => !value)} /></View>
      <View accessibilityRole="tablist" style={styles.chipRail}>{statusFilters.map(item => <Pressable accessibilityLabel={`Filter ${item}`} accessibilityRole="tab" accessibilityState={{selected: filter === item}} hitSlop={10} key={item} onPress={() => { setFilter(item); if (item === 'Ongoing' || item === 'In Progress' || item === 'Applied') setSecondary(item); }} style={[styles.chip, filter === item && styles.chipActive, customer && filter === item && styles.customerChipActive]}><Text style={[styles.chipLabel, filter === item && styles.chipLabelActive, customer && filter === item && styles.customerChipLabelActive]}>{item}</Text></Pressable>)}</View>
      <View style={styles.headingBlock}><View style={styles.headingCopy}><Text style={styles.serifSection}>Latest Applied</Text></View><Pressable accessibilityLabel="View all latest applied tenders" accessibilityRole="button" onPress={() => {setFilter('Applied');setSecondary('Applied');}} style={styles.linkTarget}><Text style={styles.sectionLink}>View all</Text><LineIcon name="arrow"/></Pressable></View>
      <View style={styles.appliedCard}>{latestApplied.map((item,index) => <Pressable accessibilityLabel={`View latest applied ${item.name}`} accessibilityRole="button" key={item.id} onPress={() => onOpen(item.id)} style={({pressed})=>[styles.progressRow,index===3&&styles.lastRow,pressed&&styles.pressed]}><View style={styles.appliedIcon}><LineIcon name={item.icon}/></View><View style={styles.progressCopy}><View style={styles.progressHeading}><Text numberOfLines={2} style={styles.progressName}>{item.name}</Text><Text style={styles.progressPercent}>{item.progress}%</Text></View><Text numberOfLines={1} style={styles.progressOwner}>{item.owner}</Text><View style={styles.progressBottom}><Text numberOfLines={1} style={styles.progressStage}>{item.stage}</Text><View style={styles.slimRail}><View style={[styles.slimFill,{width: `${item.progress}%`}]} /></View></View></View></Pressable>)}</View>
      <View style={styles.headingBlock}><View><Text style={styles.serifSection}>All Tenders</Text></View><Pressable accessibilityLabel="Change tender list view" accessibilityHint={comfortable?'Switch to compact density':'Switch to comfortable density'} accessibilityRole="button" onPress={() => setComfortable(v=>!v)} style={styles.listControl}><LineIcon name="list"/></Pressable></View>
      <View accessibilityRole="tablist" style={styles.secondaryTabs}>{(['Ongoing','In Progress','Applied'] as const).map(item => <Pressable accessibilityLabel={`Show ${item} tenders`} accessibilityRole="tab" accessibilityState={{selected: secondary === item}} hitSlop={{top:8,bottom:8,left:4,right:4}} key={item} onPress={() => { setSecondary(item); setFilter(item); }} style={[styles.secondaryTab, secondary === item && styles.secondaryActive]}><Text style={[styles.secondaryLabel, secondary === item && styles.secondaryLabelActive]}>{item}</Text></Pressable>)}</View>
      <View style={styles.tenderList}>{filtered.map(item => <Pressable accessibilityLabel={`Open ${item.title} tender details`} accessibilityRole="button" key={item.id} onPress={() => onOpen(item.id)} style={({pressed})=>[styles.compactRow,comfortable&&styles.comfortableRow,pressed&&styles.pressed]}><View style={styles.sectorIcon}><LineIcon name={item.icon}/></View><View style={styles.compactCopy}><Text numberOfLines={2} style={styles.compactTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.compactMeta}>{item.ref} · {item.category}</Text><View style={styles.compactFacts}><Text numberOfLines={1} style={styles.factSmall}>Est. Value  <Text style={styles.factStrong}>{item.value}</Text></Text><Text numberOfLines={1} style={styles.factSmall}>Closing  <Text style={styles.factStrong}>{item.closing}</Text></Text></View></View><View style={styles.rowSide}><Text style={styles.statusBadge}>{item.status}</Text><View style={styles.goldArrowButton}><LineIcon name="arrow" light/></View></View></Pressable>)}{filtered.length === 0 ? <Text style={styles.emptyResults}>No tenders match your search and filters.</Text> : null}</View>
      <View style={styles.deadlineStrip}><View style={styles.calendarIcon}><LineIcon name="calendar"/></View><View style={styles.deadlineCopy}><Text style={styles.deadlineEyebrow}>UPCOMING DEADLINE</Text><Text numberOfLines={1} style={styles.deadlineTitle}>400kV Substation at Bhopal</Text><Text style={styles.deadlineMeta}>Closes 18 Aug 2026 · 5:00 PM</Text></View><Pressable accessibilityLabel="View calendar" accessibilityRole="button" onPress={() => setPanel('calendar')} style={styles.calendarTarget}><Text style={styles.deadlineLink}>View calendar</Text><LineIcon name="arrow"/></Pressable></View>
      <InfoModal key={`${panel}-${filter}-${category}`} category={category} filter={filter} mode={panel} onApply={(nextStatus,nextCategory)=>{setFilter(nextStatus);setCategory(nextCategory);if(nextStatus==='Ongoing'||nextStatus==='In Progress'||nextStatus==='Applied')setSecondary(nextStatus);setPanel(null);}} onClear={()=>{setFilter('All');setCategory('All categories');setSecondary('Ongoing');}} onClose={() => setPanel(null)} />

    </View>
  );
}

type TenderStatus = 'All' | 'Ongoing' | 'In Progress' | 'Applied' | 'Completed';
const statusFilters: readonly TenderStatus[] = ['All','Ongoing','In Progress','Applied','Completed'];
const overviewMetrics = [{value:'12',label:'Ongoing',icon:'clock'},{value:'07',label:'In Progress',icon:'hourglass'},{value:'18',label:'Applied',icon:'document'},{value:'09',label:'Completed',icon:'check'}] as const;
const latestApplied = [
  {id:'bhopal',name:'400kV Substation at Bhopal',owner:'MP Power Transmission Co.',stage:'Stage 4: Final review',icon:'energy',progress:76},
  {id:'solar-50',name:'Solar Power Plant - 50 MW',owner:'NTPC Renewable Energy Ltd.',stage:'Stage 3: Commercial review',icon:'solar',progress:60},
  {id:'smart-city-applied',name:'Smart City Infrastructure Works',owner:'Lucknow Smart City Ltd.',stage:'Stage 2: Technical review',icon:'building',progress:48},
  {id:'equipment-applied',name:'Supply of Electrical Equipment',owner:'MP Power Management Co.',stage:'Stage 1: Documentation',icon:'gear',progress:30},
] as const;
const tenderRows = [
  {id:'solar', icon:'solar', title:'Construction of Solar Power Plant 100 MW', ref:'KRG/RJ/2026/038', category:'Solar & Utilities', value:'₹4,850 Cr', status:'Ongoing', closing:'12 Aug 2026'},
  {id:'transmission', icon:'energy', title:'400kV Transmission Line Package-II', ref:'KRG/MP/2026/041', category:'Power & Energy', value:'₹2,786 Cr', status:'Ongoing', closing:'18 Aug 2026'},
  {id:'substation', icon:'gear', title:'Electric Substation (220/132kV) EPC Project', ref:'KRG/GJ/2026/029', category:'Electrical EPC', value:'₹2,320 Cr', status:'Ongoing', closing:'21 Aug 2026'},
  {id:'wind-solar', icon:'energy', title:'Wind-Solar Hybrid Project 500 MW', ref:'KRG/RJ/2026/022', category:'Renewable Energy', value:'₹1,830 Cr', status:'Ongoing', closing:'24 Aug 2026'},
  {id:'equipment-ongoing', icon:'solar', title:'Supply of HT Electrical Equipment', ref:'KRG/DL/2026/017', category:'Manufacturing & Material', value:'₹1,220 Cr', status:'Ongoing', closing:'28 Aug 2026'},
  {id:'smart-city', icon:'building', title:'Smart City Infrastructure Works', ref:'KRG/GJ/2026/029', category:'Infrastructure', value:'₹198 Cr', status:'In Progress', closing:'28 Aug 2026'},
  {id:'equipment', icon:'energy', title:'Supply of Electrical Equipment', ref:'KRG/DL/2026/017', category:'Electrical', value:'₹76 Cr', status:'Applied', closing:'04 Sep 2026'},
] as const;
const iconLabels: Record<string,string> = {energy:'EN',solar:'SO',gear:'EL',building:'IN',hourglass:'IP',document:'AP',briefcase:'TT',sort:'AZ'};
function LineIcon({name,light=false}:{name:string;light?:boolean}) {
  if (iconLabels[name]) return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.iconCanvas}><Text style={[styles.iconMonogram,light&&styles.iconMonogramLight]}>{iconLabels[name]}</Text></View>;
  const line = [styles.primitiveLine,light&&styles.primitiveLineLight];
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.iconCanvas}>
    {name==='search'?<><View style={[styles.searchCircle,light&&styles.primitiveBorderLight]}/><View style={[...line,styles.searchHandle]}/></>:null}
    {name==='filter'?<><View style={[...line,styles.lineTop]}/><View style={[...line,styles.lineMiddleShort]}/><View style={[...line,styles.lineBottomTiny]}/></>:null}
    {name==='sort'?<><View style={[...line,styles.sortStem]}/><View style={[...line,styles.sortHead]}/><View style={[...line,styles.sortFoot]}/></>:null}
    {name==='arrow'?<><View style={[...line,styles.arrowShaft]}/><View style={[styles.arrowHead,light&&styles.primitiveBorderLight]}/></>:null}
    {name==='list'?<><View style={[...line,styles.lineTop]}/><View style={[...line,styles.lineMiddle]}/><View style={[...line,styles.lineBottom]}/></>:null}
    {name==='calendar'?<><View style={[styles.calendarBox,light&&styles.primitiveBorderLight]}/><View style={[...line,styles.calendarRule]}/></>:null}
    {name==='check'?<><View style={[...line,styles.checkShort]}/><View style={[...line,styles.checkLong]}/></>:null}
    {name==='back'?<><View style={[...line,styles.backShaft]}/><View style={[styles.backHead,light&&styles.primitiveBorderLight]}/></>:null}
    {name==='share'?<><View style={[styles.shareBox,light&&styles.primitiveBorderLight]}/><View style={[...line,styles.shareStem]}/><View style={[styles.shareHead,light&&styles.primitiveBorderLight]}/></>:null}
    {name==='bell'?<><View style={[styles.bellShape,light&&styles.primitiveBorderLight]}/><View style={[...line,styles.bellBase]}/></>:null}
  </View>;
}

export const TENDER_BOARD_VISUAL_METRICS = Object.freeze({
  overview: { maxHeight: 184, paddingHorizontal: 16, paddingTop: 16, radius: 12, shadowOpacity: 0.16 },
  icon: { size: 16, stroke: 1.5 },
  spacing: [4, 8, 12, 16, 24] as const,
  type: { title: 32, section: 20, tender: 13, metadata: 10, label: 9 },
  rows: { borderWidth: 1, shadow: 0, minHeight: 64 },
  maxRaisedSurfaces: 1,
  supportedWidths: [320, 390, 480] as const,
});
function SquareButton({icon,label,onPress,light=false}:{icon:string;label:string;onPress:()=>void;light?:boolean}) { return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.squareButton,light && styles.squareButtonLight,pressed&&styles.pressed]}><LineIcon name={icon}/></Pressable>; }
function InfoModal({mode,onClose,onApply,onClear,filter,category}:{mode:'analytics'|'calendar'|'filters'|'latest'|'list'|null;onClose:()=>void;onApply:(s:TenderStatus,c:string)=>void;onClear:()=>void;filter:TenderStatus;category:string}) { const [draftStatus,setDraftStatus]=useState(filter);const [draftCategory,setDraftCategory]=useState(category); if (!mode) return null; const title=mode==='analytics'?'Tender analytics':mode==='calendar'?'Tender calendar':'Search & filters'; return <Modal animationType="fade" onRequestClose={onClose} transparent visible><Pressable onPress={onClose} style={styles.modalShade} testID="tender-modal-backdrop"><Pressable accessibilityViewIsModal onPress={(event)=>event.stopPropagation()} style={styles.modalCard}><Text style={styles.modalEyebrow}>KARAA GLOBAL</Text><Text style={styles.modalTitle}>{title}</Text>{mode==='analytics'?<><Text style={styles.modalCopy}>46 tracked opportunities across the complete tender pipeline.</Text><View style={styles.modalStats}>{overviewMetrics.map(x=><View key={x.label}><Text style={styles.modalStatValue}>{x.value}</Text><Text style={styles.modalStatLabel}>{x.label}</Text></View>)}</View></>:null}{mode==='calendar'?<View>{['18 Aug 2026 · 400kV Substation at Bhopal','24 Aug 2026 · Solar Power Plant - 50 MW','28 Aug 2026 · Supply of HT Electrical Equipment'].map(x=><View key={x} style={styles.calendarRow}><LineIcon name="calendar"/><Text style={styles.modalCopy}>{x}</Text></View>)}</View>:null}{mode==='filters'?<><Text style={styles.fieldLabel}>STATUS</Text><View style={styles.modalOptions}>{statusFilters.map(x=><Pressable accessibilityRole="radio" accessibilityState={{checked:draftStatus===x}} key={x} onPress={()=>setDraftStatus(x)} style={[styles.modalOption,draftStatus===x&&styles.modalOptionOn]}><Text style={styles.optionText}>{x}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>CATEGORY</Text><View style={styles.modalOptions}>{['All categories','Electrical','Energy','Solar'].map(x=><Pressable accessibilityRole="radio" accessibilityState={{checked:draftCategory===x}} key={x} onPress={()=>setDraftCategory(x)} style={[styles.modalOption,draftCategory===x&&styles.modalOptionOn]}><Text style={styles.optionText}>{x}</Text></Pressable>)}</View><View style={styles.modalActions}><Pressable accessibilityLabel="Clear tender filters" accessibilityRole="button" onPress={()=>{setDraftStatus('All');setDraftCategory('All categories');onClear();}} style={styles.modalSecondary}><Text style={styles.optionText}>Clear</Text></Pressable><Pressable accessibilityLabel="Apply tender filters" accessibilityRole="button" onPress={()=>onApply(draftStatus,draftCategory)} style={styles.modalClose}><Text style={styles.modalCloseText}>Apply filters</Text></Pressable></View></>:null}<Pressable accessibilityLabel={`Close ${title}`} accessibilityRole="button" onPress={onClose} style={styles.closeTarget}><Text style={styles.closeText}>Close</Text></Pressable></Pressable></Pressable></Modal>; }
function TenderModal({item,onClose}:{item:(typeof tenderRows)[number]|null;onClose:()=>void}) { if (!item) return null; return <Modal animationType="slide" transparent visible><View style={styles.modalShade}><View accessibilityViewIsModal style={styles.modalCard}><Text style={styles.modalEyebrow}>{item.category.toUpperCase()}</Text><Text style={styles.modalTitle}>{item.title}</Text><Text style={styles.modalCopy}>Tender reference · {item.ref}\nEstimated value · {item.value}\nStatus · {item.status}\nClosing date · {item.closing}</Text><Pressable accessibilityLabel="Close tender details" accessibilityRole="button" onPress={onClose} style={styles.modalClose}><Text style={styles.modalCloseText}>Close details</Text></Pressable></View></View></Modal>; }

type ShowcaseTab = 'overview'|'documents'|'companies';
const bhopalDetail = {id:'bhopal',title:'400kV Substation at Bhopal',issuer:'MP Power Transmission Company',category:'Energy & Utilities',value:'₹28.75 Cr',status:'In Progress',opened:'18 Aug 2026',target:'Mar 2027',ref:'MPTC/400KV/2026/014',emd:'₹45 Lakh',submitted:'02 Aug 2026',validity:'120 Days',progress:75,next:'Financial review expected · Sep 2026'} as const;
export const displayedTenderDetailIds = [...new Set(['bhopal',...latestApplied.map(x=>x.id),...tenderRows.map(x=>x.id)])];
function detailFor(id:string) {
  if(id==='bhopal') return bhopalDetail;
  const row=tenderRows.find(x=>x.id===id); const applied=latestApplied.find(x=>x.id===id);
  const title=row?.title ?? applied?.name ?? 'Tender opportunity';
  const seed=displayedTenderDetailIds.indexOf(id)+21;
  return {id,title,issuer:applied?.owner ?? `${row?.category ?? 'Infrastructure'} Development Authority`,category:row?.category ?? 'Energy & Utilities',value:row?.value ?? `₹${seed*9}.50 Cr`,status:row?.status ?? 'Applied',opened:`${10+seed%16} Aug 2026`,target:`${['Jan','Feb','Apr','Jun'][seed%4]} 2027`,ref:row?.ref ?? `KRG/APP/2026/${String(seed).padStart(3,'0')}`,emd:`₹${seed+12} Lakh`,submitted:`${String(1+seed%9).padStart(2,'0')} Aug 2026`,validity:`${90+(seed%3)*30} Days`,progress:applied?.progress ?? (row?.status==='Applied'?35:58),next:`Evaluation committee update expected · ${['Sep','Oct','Nov'][seed%3]} 2026`};
}
function TenderShowcase({customer,id,onBack}:{customer:boolean;id:string;onBack:()=>void}) {
  const d=detailFor(id); const [tab,setTab]=useState<ShowcaseTab>('overview'); const [panel,setPanel]=useState<'share'|'notice'|'next'|'doc'|'company'|null>(null);
  const docs=[['Technical Bid Package','PDF · 2.4 MB'],['Commercial Schedule','XLSX · 840 KB'],['Submission Receipt','PDF · 316 KB']];
  return <View style={styles.showcase} testID={`tender-detail-${id}`}>
    <View style={[styles.showcaseTop,customer&&styles.customerShowcaseTop]}><Pressable accessibilityLabel="Back to Tenders" accessibilityRole="button" onPress={onBack} style={styles.iconTarget}><LineIcon name="back" light /></Pressable><KaraaBrand height={13} variant="wordmark" /><Pressable accessibilityLabel="Share tender" accessibilityRole="button" onPress={()=>setPanel('share')} style={styles.iconTarget}><LineIcon name="share" light /></Pressable><Pressable accessibilityLabel="Tender notifications" accessibilityRole="button" onPress={()=>setPanel('notice')} style={styles.iconTarget}><LineIcon name="bell" light /></Pressable></View>
    <View style={styles.heroCard}><View style={styles.heroMain}><Image accessibilityLabel={`Substation project visual for ${d.title}`} resizeMode="cover" source={demoVisualAssets.progress.source} style={styles.showcaseImage}/><View style={styles.heroDetail}><Text style={styles.showTitle}>{d.title}</Text><Text numberOfLines={1} style={styles.issuer}>{d.issuer}</Text><Text style={styles.categoryLine}>{d.category}</Text><Text style={styles.statusTag}>{d.status}</Text><View style={styles.progressLine}><View style={styles.progressRail}><View style={[styles.progressGold,{width:`${d.progress}%`}]} /></View><Text style={styles.progressNumber}>{d.progress}%</Text></View></View></View><View style={styles.summaryRow}><Fact label="Applied Value" value={d.value}/><Fact label="Bid Opened" value={d.opened}/><Fact label="Target" value={d.target}/></View></View>
    <View accessibilityRole="tablist" style={styles.showTabs}>{(['overview','documents','companies'] as const).map(t=><Pressable accessibilityRole="tab" accessibilityState={{selected:tab===t}} key={t} onPress={()=>setTab(t)} style={[styles.showTab,tab===t&&styles.showTabActive]}><Text style={[styles.showTabText,tab===t&&styles.showTabTextActive]}>{t[0].toUpperCase()+t.slice(1)}</Text></Pressable>)}</View>
    {tab==='overview'?<View style={styles.detailBody}><View style={styles.sectionCard}><Text style={styles.cardHeading}>▣  Tender Snapshot</Text><View style={styles.snapshot}><Fact label="Reference No." value={d.ref}/><Fact label="EMD" value={d.emd}/></View><View style={styles.snapshot}><Fact label="Submitted On" value={d.submitted}/><Fact label="Bid Validity" value={d.validity}/></View></View><View style={styles.sectionCard}><Text style={styles.cardHeading}>♙  Bidder</Text><View style={styles.bidder}><View style={styles.bidderCopy}><Text style={styles.bidderName}>Karaa Global Energy Infrastructure Pvt. Ltd.</Text><Text style={styles.bidderMeta}>Pre-qualified EPC bidder for transmission and substation works.</Text></View><Text style={styles.prequalified}>Pre-Qualified</Text></View></View><View style={styles.sectionCard}><Text style={styles.cardHeading}>◴  Current Stage</Text><View style={styles.stageRail}>{['Technical Review\nCompleted','Financial Review\nIn Progress','Clarification Round\nPending','Award Decision\nPending'].map((x,i)=><View key={x} style={styles.stage}><View style={[styles.stageConnector,i<2&&styles.stageConnectorOn]}/><View style={[styles.stageDot,i<2&&styles.stageDotOn]}/><Text style={[styles.stageText,i<2&&styles.stageTextOn]}>{x}</Text></View>)}</View></View></View>:null}
    {tab==='documents'?<View style={styles.detailBody}><Text style={styles.cardHeading}>Documents</Text>{docs.map(x=><Pressable accessibilityLabel={`Preview ${x[0]}`} accessibilityRole="button" key={x[0]} onPress={()=>setPanel('doc')} style={styles.record}><Text style={styles.recordTitle}>{x[0]}</Text><Text style={styles.recordMeta}>{x[1]}  ›</Text></Pressable>)}</View>:null}
    {tab==='companies'?<View style={styles.detailBody}><Text style={styles.cardHeading}>Participating Companies</Text>{[['Prime bidder','Karaa Global Energy Infrastructure Pvt. Ltd.'],['Consortium partner','Meridian Grid Systems'],['Equipment vendor','Aster Switchgear Works']].map(x=><Pressable accessibilityLabel={`View ${x[1]}`} accessibilityRole="button" key={x[0]} onPress={()=>setPanel('company')} style={styles.record}><Text style={styles.recordMeta}>{x[0]}</Text><Text style={styles.recordTitle}>{x[1]}</Text></Pressable>)}</View>:null}
    <Pressable accessibilityLabel="Next update details" accessibilityRole="button" onPress={()=>setPanel('next')} style={styles.updateStrip}><Text style={styles.updateLabel}>NEXT UPDATE</Text><Text style={styles.updateText}>{d.next}</Text><Text style={styles.updateArrow}>›</Text></Pressable>
    <LocalPanel mode={panel} title={d.title} onClose={()=>setPanel(null)} onNativeShare={()=>Share.share({title:d.title,message:`${d.title} — local Karaa tender demo`})}/>
  </View>;
}
function LocalPanel({mode,title,onClose,onNativeShare}:{mode:'share'|'notice'|'next'|'doc'|'company'|null;title:string;onClose:()=>void;onNativeShare:()=>void}) {if(!mode)return null; const heading={share:'Share tender',notice:'Notification preferences',next:'Next update',doc:'Document preview',company:'Company preview'}[mode];return <Modal transparent animationType="fade"><View style={styles.modalShade}><View style={styles.modalCard}><Text style={styles.modalTitle}>{heading}</Text><Text style={styles.modalCopy}>{title}</Text>{mode==='share'?<Pressable accessibilityLabel="Open native share" accessibilityRole="button" onPress={onNativeShare} style={styles.modalClose}><Text style={styles.modalCloseText}>Share…</Text></Pressable>:null}<Pressable accessibilityLabel={`Close ${heading}`} accessibilityRole="button" onPress={onClose} style={styles.modalClose}><Text style={styles.modalCloseText}>Close</Text></Pressable></View></View></Modal>}

function TenderDetail({ onAction, role, state }: Props) {
  const tender = tenderForId(state, state.selectedTenderId!);
  const activeIndex = lifecycleSteps.indexOf(tenderLifecycleLabel(tender) as (typeof lifecycleSteps)[number]);
  const latest = tender.updates.at(-1)!;
  const isManagement = role === 'management';

  return (
    <View style={styles.page}>
      <Pressable accessibilityLabel="Back to tender board" accessibilityRole="button" onPress={() => onAction({ type: 'return-to-tender-board' })} style={styles.backAction}>
        <View style={styles.backActionContent}><LineIcon name="back" /><Text style={styles.backActionText}>Tender board</Text></View>
      </Pressable>
      <View style={styles.detailHeader}>
        <DemoImageFrame accessibilityLabel={`Demo visual: ${tender.title} tender`} height={108} source={demoVisualAssets.progress.source} />
      </View>
      <View style={[styles.detailContext,role === 'customer' && styles.customerDetailContext]}>
        <Text numberOfLines={1} style={[styles.detailTitle,role === 'customer' && styles.customerDetailTitle]}>{tender.title}</Text>
        <Text style={[styles.lifecycleText,role === 'customer' && styles.customerLifecycleText]}>{tenderLifecycleLabel(tender)}</Text>
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
  return <View style={styles.overview}><Text style={styles.sectionTitle}>Current lifecycle</Text><Text style={styles.bodyCopy}>{tenderLifecycleLabel(tender)}</Text><Text style={styles.bodyCopy}>Review owner: {tender.reviewOwner ?? 'Not assigned'}</Text></View>;
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
  showcase:{backgroundColor:'#FFFFFF',width:'100%'},
  showcaseTop:{alignItems:'center',backgroundColor:'#080907',flexDirection:'row',height:48,paddingHorizontal:2}, customerShowcaseTop:{backgroundColor:'#FFFFFF',borderBottomColor:'#E3E1DC',borderBottomWidth:1},
  iconTarget:{alignItems:'center',height:44,justifyContent:'center',width:44},topGlyph:{color:'#D4A43F',fontSize:21},brand:{color:'#FFF9ED',flex:1,fontSize:12,fontWeight:'800',letterSpacing:.8,textTransform:'uppercase'},
  heroCard:{backgroundColor:'#FFFFFF',borderColor:'#E3E1DC',borderRadius:10,borderWidth:1,marginHorizontal:16,marginTop:10,overflow:'hidden'},heroMain:{flexDirection:'row',gap:10,padding:8},showcaseImage:{borderRadius:5,height:134,width:122},heroDetail:{flex:1,gap:5,paddingTop:4},showTitle:{color:'#171713',fontSize:18,fontWeight:'800',lineHeight:20},issuer:{color:'#716C63',fontSize: 10},categoryLine:{color:'#80672F',fontSize: 10},statusTag:{alignSelf:'flex-start',backgroundColor:'#E6F0F6',borderColor:'#5A91B7',borderRadius:4,borderWidth:1,color:'#36769D',fontSize: 10,fontWeight:'800',overflow:'hidden',paddingHorizontal:5,paddingVertical:3},progressLine:{alignItems:'center',flexDirection:'row',gap:7,marginTop:1},progressRail:{backgroundColor:'#E5DED1',borderRadius:3,flex:1,height:5,overflow:'hidden'},progressGold:{backgroundColor:'#D18400',height:5},progressNumber:{color:'#383731',fontSize: 10,fontWeight:'800'},summaryRow:{borderTopColor:'#E3E1DC',borderTopWidth:1,flexDirection:'row',paddingHorizontal:8},
  showTabs:{backgroundColor:'#FFFFFF',borderColor:'#E3E1DC',borderRadius:7,borderWidth:1,flexDirection:'row',marginHorizontal:9,marginTop:5},showTab:{alignItems:'center',borderBottomColor:'transparent',borderBottomWidth:2,flex:1,justifyContent:'center',minHeight:44},showTabActive:{borderBottomColor:'#B58A29'},showTabText:{color:'#777167',fontSize: 10,fontWeight:'700'},showTabTextActive:{color:'#80672F'},
  detailBody:{gap:5,paddingHorizontal:9,paddingTop:5},sectionCard:{backgroundColor:'#FFFFFF',borderColor:'#E3E1DC',borderRadius:7,borderWidth:1,padding:9},cardHeading:{color:'#2A2924',fontSize:11,fontWeight:'800',marginBottom:4},snapshot:{flexDirection:'row',paddingHorizontal:20},bidder:{alignItems:'center',flexDirection:'row',minHeight:44},bidderCopy:{flex:1},bidderName:{color:'#292923',fontSize: 10,fontWeight:'800'},bidderMeta:{color:'#817A70',fontSize: 10,marginTop:3},prequalified:{backgroundColor:'#E4F3DD',borderRadius:4,color:'#4B8A3A',fontSize: 10,fontWeight:'800',overflow:'hidden',padding:4},
  stageRail:{flexDirection:'row',paddingTop:3},stage:{alignItems:'center',flex:1,position:'relative'},stageConnector:{backgroundColor:'#CFC7B8',height:2,left:'50%',position:'absolute',right:'-50%',top:6},stageConnectorOn:{backgroundColor:'#4A9B58'},stageDot:{backgroundColor:'#FFF',borderColor:'#CFC7B8',borderRadius:7,borderWidth:2,height:13,width:13,zIndex:1},stageDotOn:{backgroundColor:'#FFF',borderColor:'#3E9560'},stageText:{color:'#69645B',fontSize: 10,lineHeight:8,marginTop:3,textAlign:'center'},stageTextOn:{color:'#367D4B'},
  updateStrip:{alignItems:'center',backgroundColor:'#FFFFFF',borderColor:'#E3E1DC',borderRadius:6,borderWidth:1,flexDirection:'row',marginHorizontal:9,marginTop:5,minHeight:44,paddingHorizontal:10},updateLabel:{color:'#80672F',fontSize: 10,fontWeight:'900',marginRight:7},updateText:{color:'#3A3730',flex:1,fontSize: 10,fontWeight:'700'},updateArrow:{color:'#80672F',fontSize:18},honest:{color:'#7C756A',fontSize: 10,fontStyle:'italic'},record:{backgroundColor:'#FFFFFF',borderBottomColor:'#E1DACE',borderBottomWidth:1,justifyContent:'center',minHeight:52,paddingHorizontal:10},recordTitle:{color:'#292923',fontSize:10,fontWeight:'700'},recordMeta:{color:'#817A70',fontSize: 10,marginTop:2},
  tendersPage: { gap: 8, paddingBottom: 8, position:'relative', width: '100%' },
  tenderHero: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight:72 },
  heroCopy: { flex: 1, gap: 1, minWidth: 0 },
  tenderEyebrow: { color: '#9B7427', fontSize: 10, fontWeight: '800', letterSpacing: .9 },
  tenderTitle: { color: '#171713', fontFamily: 'serif', fontSize: 32, lineHeight: 34 }, tenderSubtitle: { color: '#77736C', fontSize: 10 },
  squareButton: { alignItems: 'center', backgroundColor: '#292A26', borderRadius: 3, height: 44, justifyContent: 'center', width: 44 }, squareButtonLight: { backgroundColor: 'transparent', borderColor: '#D8D3C9', borderWidth: 1 }, pressed:{opacity:.62},
  iconCanvas:{alignItems:'center',height:16,justifyContent:'center',position:'relative',width:16},iconMonogram:{color:'#9B7427',fontSize: 10,fontWeight:'800',letterSpacing:.2},iconMonogramLight:{color:'#F5F0E6'},primitiveLine:{backgroundColor:'#9B7427',height:1.5,position:'absolute'},primitiveLineLight:{backgroundColor:'#F5F0E6'},primitiveBorderLight:{borderColor:'#F5F0E6'},searchCircle:{borderColor:'#9B7427',borderRadius:5,borderWidth:1.5,height:9,left:2,position:'absolute',top:2,width:9},searchHandle:{left:10,top:11,transform:[{rotate:'45deg'}],width:5},lineTop:{left:2,top:3,width:12},lineMiddle:{left:2,top:7,width:12},lineBottom:{left:2,top:11,width:12},lineMiddleShort:{left:4,top:7,width:8},lineBottomTiny:{left:6,top:11,width:4},sortStem:{height:12,left:7,top:2,width:1.5},sortHead:{left:4,top:4,transform:[{rotate:'45deg'}],width:5},sortFoot:{left:7,top:10,transform:[{rotate:'45deg'}],width:5},arrowShaft:{left:2,top:7,width:11},arrowHead:{borderRightColor:'#9B7427',borderRightWidth:1.5,borderTopColor:'#9B7427',borderTopWidth:1.5,height:6,left:8,position:'absolute',top:4,transform:[{rotate:'45deg'}],width:6},calendarBox:{borderColor:'#9B7427',borderRadius:1,borderWidth:1.5,height:12,left:2,position:'absolute',top:2,width:12},calendarRule:{left:3,top:6,width:10},checkShort:{left:2,top:9,transform:[{rotate:'45deg'}],width:5},checkLong:{left:5,top:7,transform:[{rotate:'-45deg'}],width:9},backShaft:{left:3,top:7,width:11},backHead:{borderBottomColor:'#9B7427',borderBottomWidth:1.5,borderLeftColor:'#9B7427',borderLeftWidth:1.5,height:6,left:2,position:'absolute',top:4,transform:[{rotate:'45deg'}],width:6},shareBox:{borderColor:'#9B7427',borderRadius:1,borderWidth:1.5,bottom:1,height:9,left:3,position:'absolute',width:10},shareStem:{height:9,left:7,top:1,width:1.5},shareHead:{borderRightColor:'#9B7427',borderRightWidth:1.5,borderTopColor:'#9B7427',borderTopWidth:1.5,height:5,left:5,position:'absolute',top:1,transform:[{rotate:'-45deg'}],width:5},bellShape:{borderColor:'#9B7427',borderBottomWidth:0,borderTopLeftRadius:7,borderTopRightRadius:7,borderWidth:1.5,height:10,left:3,position:'absolute',top:2,width:10},bellBase:{left:2,top:12,width:12},
  overviewCard: { backgroundColor: '#292A26', borderColor:'#3C3D37', borderRadius: 12, borderWidth:1, elevation:5, justifyContent:'space-between', maxHeight:184, minHeight:166, paddingHorizontal: 16, paddingTop: 16, shadowColor:'#1A1710', shadowOffset:{width:0,height:7}, shadowOpacity:.16, shadowRadius:14 },
  customerOverviewCard:{backgroundColor:'#FFFFFF',borderColor:'#D9CBAF',borderWidth:1,shadowColor:'#5A4725'}, customerDarkText:{color:'#171713'}, customerMutedText:{color:'#77736C'}, customerMetric:{borderRightColor:'#DDD5C6'}, customerTotalLine:{borderTopColor:'#DDD5C6'}, overviewHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, overviewTitle: { color: '#F4EFE5', fontFamily: 'serif', fontSize: 16 }, dotsIcon:{flexDirection:'row',gap:3},
  metricGrid: { flexDirection: 'row', marginTop: 12 }, metric: { alignItems:'center',borderRightColor: '#494A45', borderRightWidth: 1, flex: 1, gap: 2, minWidth:0 },metricLast:{borderRightWidth:0}, metricValue: { color: '#F5F0E6', fontFamily: 'serif', fontSize: 20 }, metricLabel: { color: '#BDBAB2', fontSize: 10 }, totalLine: { alignItems: 'center', borderTopColor: '#494A45', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, minHeight:48 },totalGroup:{alignItems:'center',flexDirection:'row'}, totalValue: { color: '#F5F0E6', fontFamily: 'serif', fontSize: 16 }, totalLabel: { color: '#A9A69F', fontSize: 10 }, cardLink: { color: '#A87920', fontSize: 10, fontWeight: '700' },linkTarget:{alignItems:'center',flexDirection:'row',justifyContent:'center',minHeight:44},
  searchTools: { flexDirection: 'row', gap: 6 }, tenderSearch: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D8D3C9', borderRadius: 4, borderWidth: 1, flex: 1, flexDirection: 'row', height: 44, paddingHorizontal: 10 }, tenderSearchInput: { color: '#11120F', flex: 1, fontSize: 12, height: 42, paddingHorizontal: 7, paddingVertical: 0 },
  chipRail: { flexDirection: 'row', gap: 4 }, chip: { alignItems: 'center', borderColor: '#D5D0C6', borderRadius: 16, borderWidth: 1, flex: 1, height: 28, justifyContent: 'center' }, chipActive: { backgroundColor: '#111210', borderColor: '#111210' }, customerChipActive:{backgroundColor:'#F4E8C9',borderColor:'#B58A29'}, chipLabel: { color: '#69665F', fontSize: 10, fontWeight: '700' }, chipLabelActive: { color: '#F7F2E8' }, customerChipLabelActive:{color:'#7C5B18'},
  headingBlock: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, headingCopy:{flex:1,minWidth:0,paddingRight:4}, serifSection: { color: '#161713', fontFamily: 'serif', fontSize: 20 },sectionSubtitle:{color:'#817C73',fontSize:10,marginTop:2}, sectionLink: { color: '#80672F', fontSize: 11, fontWeight: '700' },
  appliedCard: { backgroundColor: 'transparent', borderTopColor: '#E3E1DC', borderTopWidth: 1 }, progressRow: { alignItems:'center', borderBottomColor:'#E2DDD3', borderBottomWidth:1, flexDirection:'row', minHeight:54,paddingVertical:4 },lastRow:{borderBottomWidth:1}, appliedIcon:{alignItems:'center',height:32,justifyContent:'center',marginRight:8,width:32}, progressCopy:{flex:1,gap:1,minWidth:0}, progressHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, progressName: { color: '#2B2B27', flex: 1, fontSize: 12, fontWeight: '700' }, progressOwner:{color:'#858078',fontSize:10}, progressPercent: { color: '#3A3934', fontSize: 10, fontWeight: '800',marginLeft:4 }, progressBottom:{alignItems:'center',flexDirection:'row',gap:7}, progressStage:{color:'#8E6B29',fontSize: 10,maxWidth:150}, slimRail: { backgroundColor: '#E6E1D7', flex:1, height: 2, overflow: 'hidden' }, slimFill: { backgroundColor: '#B58A36', height: 2 },
  listControl: { alignItems: 'center', borderColor: '#D5D0C6', borderRadius: 3, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 }, secondaryTabs: { borderBottomColor: '#D8D3C9', borderBottomWidth: 1, flexDirection: 'row' }, secondaryTab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex:1,height: 44, justifyContent: 'center' }, secondaryActive: { borderBottomColor: '#B6882E' }, secondaryLabel: { color: '#77736C', fontSize: 11, fontWeight: '700' }, secondaryLabelActive: { color: '#171814' },
  tenderList: {}, compactRow: { alignItems: 'center', borderBottomColor: '#E3E1DC', borderBottomWidth: 1, flexDirection: 'row', minHeight: 64, paddingVertical: 6 },comfortableRow:{minHeight:80,paddingVertical:10}, sectorIcon: { alignItems: 'center', height: 32, justifyContent: 'center', marginRight: 8, width: 32 }, compactCopy: { flex: 1, gap: 1,minWidth:0 }, compactTitle: { color: '#1A1B17', fontFamily: 'serif', fontSize: 13,lineHeight:15 }, compactMeta: { color: '#827E76', fontSize: 10 }, compactFacts: { flexDirection: 'row', gap: 8, marginTop: 2 }, factSmall: { color: '#8A867E', fontSize: 10,flexShrink:1 }, factStrong: { color: '#2F302B', fontWeight: '700' }, rowSide: { alignItems: 'flex-end', gap: 3, marginLeft: 4 }, statusBadge: { color: '#856626', fontSize: 10, fontWeight: '700' }, goldArrowButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, emptyResults: { color: '#77736C', fontSize: 11, paddingVertical: 20, textAlign: 'center' },
  deadlineStrip: { alignItems: 'center', backgroundColor: '#F1EBDF', borderLeftColor: '#B98C31', borderLeftWidth: 2, borderRadius: 3, flexDirection: 'row', minHeight: 56, paddingHorizontal: 8 }, calendarIcon: { alignItems: 'center', height: 32, justifyContent: 'center', marginRight: 6, width: 32 }, deadlineCopy: { flex: 1, gap: 1,minWidth:0 }, deadlineEyebrow: { color: '#987126', fontSize: 10, fontWeight: '800', letterSpacing: .5 }, deadlineTitle: { color: '#20211D', fontSize: 11, fontWeight: '700' }, deadlineMeta: { color: '#716D65', fontSize: 10 }, deadlineLink: { color: '#8C661D', fontSize: 10, fontWeight: '700' },calendarTarget:{alignItems:'center',flexDirection:'row',minHeight:44},
  modalShade: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,.55)', bottom: 0, justifyContent: 'center', left: 0, padding: 16, position: 'absolute', right: 0, top: 0 }, modalCard: { backgroundColor: '#FFFFFF', borderRadius: 8, gap: 8, maxWidth: 350, padding: 16, width: '100%' }, modalEyebrow: { color: '#80672F', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, modalTitle: { color: '#141511', fontFamily: 'serif', fontSize: 23 }, modalCopy: { color: '#625F58', flexShrink:1,fontSize: 12, lineHeight: 20 }, prototypeNote: { color: '#8C661D', fontSize: 10, fontStyle: 'italic', lineHeight: 15 }, modalClose: { alignItems: 'center', backgroundColor: '#121310', borderRadius: 4, flex:1,justifyContent: 'center', minHeight: 44, marginTop: 5 }, modalCloseText: { color: '#F8F3E8', fontSize: 11, fontWeight: '800' },modalStats:{flexDirection:'row',justifyContent:'space-between',paddingVertical:12},modalStatValue:{color:'#80672F',fontFamily:'serif',fontSize:22},modalStatLabel:{color:'#625F58',fontSize:10},calendarRow:{alignItems:'center',borderBottomColor:'#DED7CA',borderBottomWidth:1,flexDirection:'row',gap:8,minHeight:50},fieldLabel:{color:'#80672F',fontSize:10,fontWeight:'900',letterSpacing:.8,marginTop:4},modalOptions:{flexDirection:'row',flexWrap:'wrap',gap:6},modalOption:{alignItems:'center',borderColor:'#D1C9BB',borderRadius:22,borderWidth:1,justifyContent:'center',minHeight:44,paddingHorizontal:11},modalOptionOn:{backgroundColor:'#EDE0C6',borderColor:'#80672F'},optionText:{color:'#292A26',fontSize:11,fontWeight:'700'},modalActions:{flexDirection:'row',gap:8},modalSecondary:{alignItems:'center',borderColor:'#CFC6B6',borderRadius:4,borderWidth:1,flex:1,justifyContent:'center',minHeight:44,marginTop:5},closeTarget:{alignItems:'center',justifyContent:'center',minHeight:44},closeText:{color:'#6D685F',fontSize:11,fontWeight:'700',textDecorationLine:'underline'},
  page: { gap: spacing.sm },
  summaryBand: { backgroundColor: colors.ink, gap: 4, padding: spacing.md },
  summaryEyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
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
  backActionContent: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  backActionText: { color: colors.brass, fontSize: 13, fontWeight: '900' },
  detailHeader: { overflow: 'hidden' },
  detailContext: { backgroundColor: colors.ink, gap: 3, padding: spacing.md }, customerDetailContext:{backgroundColor:'#FFFFFF',borderBottomColor:'#E3E1DC',borderBottomWidth:1},
  detailTitle: { color: colors.paper, fontSize: 19, fontWeight: '800' }, customerDetailTitle:{color:'#171713'},
  lifecycleText: { color: '#D6D3CD', fontSize: 12, fontWeight: '700', marginTop: 3 }, customerLifecycleText:{color:'#77736C'},
  lifecycleRail: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, flexDirection: 'row', padding: 8 },
  lifecycleStep: { alignItems: 'center', flex: 1, gap: 4 },
  lifecycleDot: { backgroundColor: colors.line, borderRadius: 5, height: 8, width: 8 },
  lifecycleDotActive: { backgroundColor: colors.moss },
  lifecycleStepText: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  lifecycleStepTextActive: { color: colors.ink, fontWeight: '800' },
  factRail: { borderBottomColor: colors.line, borderBottomWidth: 1, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row' },
  fact: { flex: 1, gap: 3, paddingVertical: 8 },
  factLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  factValue: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  tabRail: { borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row' },
  tab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 44 },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  tabTextSelected: { color: colors.brass, fontWeight: '900' },
  nextStrip: { backgroundColor: colors.statusAttentionSurface, borderLeftColor: colors.brass, borderLeftWidth: 3, gap: 3, padding: spacing.sm },
  nextStripLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 },
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
