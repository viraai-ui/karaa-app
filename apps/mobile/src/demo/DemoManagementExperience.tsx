import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveWorkforceMap } from './LiveWorkforceMap';

import { colors, radii, spacing } from '../theme/tokens';
import { demoProjects, demoVerticals } from './demo-catalog';
import { DemoAction, DemoProgressRail, DemoSearchField, DemoStatusPill } from './OfflineDemoPrimitives';
import {
  offlineProject,
  tenderBoardRows,
  type DemoManagementPanel,
  type OfflineDemoAction,
  type OfflineDemoState,
} from './offline-demo';

type Props = {
  view: 'command' | 'map';
  state: OfflineDemoState;
  onAction: (action: OfflineDemoAction) => void;
};

type GeoFilter = 'All Projects' | 'On Track' | 'Attention' | 'Location Alerts';
type GeoProject = { category:string; name:string; place:string; checked:string; teams:string; ago:string; status:string; live:string; detail:string; tone:string; image:number };

const geoFilters: readonly GeoFilter[] = ['All Projects', 'On Track', 'Attention', 'Location Alerts'];

export function DemoManagementExperience({ view, state, onAction }: Props) {
  return view === 'command'
    ? <CommandCentre onAction={onAction} state={state} />
    : <GeoLocation onAction={onAction} state={state} />;
}

function CommandCentre({ state, onAction }: Omit<Props, 'view'>) {
  const [vertical, setVertical] = useState('All Verticals');
  const [month, setMonth] = useState('This Month');
  const [detail, setDetail] = useState<string | null>(null);
  const [project, setProject] = useState<'Amaravati' | 'Aarohan' | 'Surya'>('Aarohan');
  const [assigned, setAssigned] = useState<string[]>([]);
  const toggle = (key: string) => setDetail((value) => value === key ? null : key);
  const verticals = [
    ['Infrastructure & Urban', 68], ['Ports & Logistics', 57], ['Energy & Utilities', 54],
    ['Healthcare & Life Sciences', 42], ['Hospitality & Tourism', 73], ['Manufacturing', 49],
  ] as const;
  const projects = {
    Amaravati: { title: 'Amaravati Capital City', vertical: 'Infrastructure & Urban', progress: 64, status: 'On Track', tone: '#31924A' },
    Aarohan: { title: 'Project Aarohan', vertical: 'Energy & Utilities', progress: 42, status: 'At Risk', tone: '#E89416' },
    Surya: { title: 'Surya Energy Park', vertical: 'Energy & Utilities', progress: 31, status: 'Delayed', tone: '#D34435' },
  } as const;
  const selected = projects[project];
  const interactiveRow = (key: string, title: string, sub: string, trailing?: string) => (
    <Pressable accessibilityLabel={`Open ${title}`} accessibilityRole="button" onPress={() => toggle(key)} style={styles.ccRow}>
      <View style={styles.ccRowIcon}><Text style={styles.ccGold}>▣</Text></View><View style={styles.flex}><Text style={styles.ccRowTitle}>{title}</Text><Text style={styles.ccSmall}>{sub}</Text></View>{trailing ? <Text style={styles.ccTrailing}>{trailing}</Text> : null}<Text style={styles.ccChevron}>›</Text>
    </Pressable>
  );
  return (
    <View style={styles.ccPage}>
      <Text style={styles.eyebrow}>EXECUTIVE OPERATIONS</Text>
      <Text accessibilityRole="header" style={styles.title}>Overview</Text>
      <Text style={styles.ccGreeting}>Good morning, Arjun.</Text>
      <View style={styles.ccDataRow}><Text style={styles.ccLive}>● Live data</Text><Text style={styles.ccSmall}>Updated 10:42 AM</Text></View>
      <View style={styles.ccFilterLine}>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter vertical" accessibilityHint={`Current selection: ${vertical}`} onPress={() => setVertical(vertical === 'All Verticals' ? 'Energy & Utilities' : 'All Verticals')} style={styles.ccFilter}><Text numberOfLines={1} style={styles.ccFilterText}>{vertical}</Text><Text style={styles.ccFilterChevron}>⌄</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter month" accessibilityHint={`Current selection: ${month}`} onPress={() => setMonth(month === 'This Month' ? 'August' : 'This Month')} style={styles.ccFilter}><Text numberOfLines={1} style={styles.ccFilterText}>{month}</Text><Text style={styles.ccFilterChevron}>⌄</Text></Pressable>
      </View>

      <Text style={styles.ccSectionTitle}>Company snapshot</Text>
      <View style={styles.ccSnapshot} testID="management-summary-band">
        {[['▥','27','Active Projects'],['◔','61%','Avg. Progress'],['₹','₹1,248 Cr','Active Portfolio'],['▤','14','Open Tenders']].map(([icon,value,label]) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Open ${label}`} onPress={() => toggle(label)} style={styles.ccMetric} testID="management-summary-value"><Text style={styles.ccMetricIcon}>{icon}</Text><View style={styles.ccMetricCopy}><Text style={styles.ccMetricValue}>{value}</Text><Text style={styles.ccMetricLabel}>{label}</Text></View></Pressable>)}
        <View style={styles.ccSnapshotFooter}><Text style={styles.ccSnapshotNote}>↑ 8.2% portfolio value this month</Text><Pressable accessibilityRole="button" accessibilityLabel="View portfolio report" onPress={() => toggle('report')} style={styles.ccReportButton}><Text style={styles.ccSnapshotLink}>View report →</Text></Pressable></View>
      </View>

      <Text style={styles.ccSectionTitle}>Project health</Text>
      <View style={styles.ccHealth}><View style={styles.ccHealthTotal}><Text style={styles.ccDonutNum}>27</Text><Text style={styles.ccSmall}>Total projects</Text></View>
        {[['#31924A','19','On Track','70%'],['#E89416','05','At Risk','19%'],['#D34435','03','Delayed','11%']].map(([c,n,l,p]) => <Pressable key={l} accessibilityRole="button" accessibilityLabel={`Open ${l} projects, ${n}, ${p}`} onPress={() => toggle(l)} style={styles.ccHealthRow}><View style={[styles.ccStatusDot,{backgroundColor:c}]} /><Text style={styles.ccHealthLabel}>{l}</Text><Text style={styles.ccHealthN}>{n}</Text><Text style={styles.ccHealthPercent}>{p}</Text></Pressable>)}
      </View>
      <Text style={styles.ccPositive}>⌁  2 projects returned to On Track this month</Text>

      <View style={styles.ccHeadingRow}><Text style={styles.ccSectionTitle}>Portfolio progress</Text><Text style={styles.ccSmall}>By Vertical⌄</Text></View>
      <View style={styles.ccLines}>{verticals.filter(([name]) => vertical === 'All Verticals' || name === vertical).map(([name,value]) => <View key={name} style={styles.ccProgressRow}><View style={styles.ccProgressHeader}><Text style={styles.ccProgressLabel}>{name}</Text><Text style={styles.ccProgressValue}>{value}%</Text></View><View accessibilityRole="progressbar" accessibilityLabel={`${name} progress`} accessibilityValue={{min:0,max:100,now:value}} style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width:`${value}%` as `${number}%`}]} /></View></View>)}</View>

      <Text style={styles.ccSectionTitle}>Upcoming milestones</Text><Text style={styles.ccCount}>14 <Text style={styles.ccSmall}>Next 30 days</Text></Text>
      {interactiveRow('m1','Envelope works','Amaravati Medical City','24 Aug')}{interactiveRow('m2','Landscape package','Aarohan Waterfront','28 Aug')}{interactiveRow('m3','Module installation','Surya Energy Park','04 Sep')}
      <Text style={styles.ccSectionTitle}>Overdue milestones</Text><Text style={[styles.ccCount,{color:'#D34435'}]}>03</Text>
      {interactiveRow('o1','MEP design approval','Skyport Hotel','6 days overdue')}{interactiveRow('o2','Utility corridor handover','Riverfront District','3 days overdue')}{interactiveRow('o3','Transformer procurement','Surya Energy Park','2 days overdue')}

      <Text style={styles.ccSectionTitle}>Critical blockers</Text><Text style={styles.ccSmall}>Issues requiring senior management attention</Text>
      {[['Land title clearance','Amaravati Logistics Hub','HIGH','7 days','Owner: Legal & Permits'],['Transformer delivery risk','Surya Energy Park','HIGH','6 days','Owner: Procurement'],['Specialist contractor shortage','Aarohan Medical City','MEDIUM','4 days','Owner: Project Delivery']].map(([name,sub,severity,age,owner]) => {
        const persisted = name === 'Transformer delivery risk' && Boolean(state.blockers.find(candidate => candidate.id === 'commissioning-readiness')?.assignee);
        const isAssigned = persisted || assigned.includes(name);
        return <View key={name} style={styles.ccBlocker} testID="management-blocker-card"><View style={styles.ccBlockerMain}><View style={styles.ccBlockerCopy}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{sub}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Assign ${name}`} accessibilityState={{disabled:isAssigned}} disabled={isAssigned} onPress={() => { setAssigned(a => a.includes(name) ? a : [...a,name]); if (name === 'Transformer delivery risk') onAction({ type: 'assign-blocker', blockerId: 'commissioning-readiness', assignee: 'Mira Management' }); }} style={styles.ccAssign}><Text style={styles.ccGold}>{isAssigned?'Assigned':'Assign'}</Text></Pressable></View><View style={styles.ccBlockerMeta}><Text style={styles.ccSeverity}>{severity}</Text><Text style={styles.ccSmall}>{age}</Text><Text style={styles.ccTiny}>{owner}</Text></View></View>;
      })}

      <Text style={styles.ccSectionTitle}>Latest activity</Text>
      {[['10:42 AM','Milestone completed',state.fieldUpdateReviewed ? offlineProject.reviewUpdate : 'Foundation pile approval at Amaravati Medical City'],['09:18 AM','RFI closed','Fire NOC update — Aarohan Waterfront Retail'],['08:30 AM','Tender awarded','Façade Systems at Skyport'],['Yesterday','Blocker escalated','Transformer delivery risk at Surya Energy Park']].map(([time,title,copy]) => <Pressable key={time} accessibilityRole="button" accessibilityLabel={`Open activity ${title}`} onPress={() => toggle(time)} style={styles.ccTimeline}><Text style={styles.ccTime}>{time}</Text><Text style={styles.ccTimelineDot}>●</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>{title}</Text><Text style={styles.ccSmall}>{copy}</Text></View></Pressable>)}

      <Text style={styles.ccSectionTitle}>Tender deadlines</Text>
      {[['Interior Fit-out Works','KMC Tower','₹82 Cr','12 days remaining',62],['Airport Expansion Package','Phase II Construction','₹245 Cr','18 days remaining',48],['Works Package EPC-02','Solar Park Extension','₹128 Cr','21 days remaining',71]].map(([name,sub,value,days,p]) => <Pressable key={name as string} accessibilityRole="button" accessibilityLabel={`Open tender ${name}`} onPress={() => toggle(name as string)} style={styles.ccTender}><View style={styles.flex}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{sub}</Text><Text style={styles.ccSmall}>{value}</Text><View style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width: `${Number(p)}%` as any}]} /></View></View><Text style={styles.ccSmall}>{days}</Text><Text style={styles.ccChevron}>›</Text></Pressable>)}

      <View style={styles.ccWorkforce}><Text style={styles.ccWorkTitle}>Workforce status</Text><View style={styles.ccWorkGrid}>{[['4,860','Total Workforce'],['3,912','Checked In'],['628','Field Teams'],['320','Off-site']].map(([v,l])=><View key={l}><Text style={styles.ccWorkValue}>{v}</Text><Text style={styles.ccMetricLabel}>{l}</Text></View>)}<View style={styles.ccAttendance}><Text style={styles.ccAttendanceValue}>80%</Text><Text style={styles.ccMetricLabel}>Attendance</Text></View></View><View style={styles.ccRoles}>{['Field 628','Engineers 1,240','Supervisors 482','Office 2,510'].map(x=><Pressable accessibilityRole="button" accessibilityLabel={`Open workforce role ${x}`} onPress={()=>toggle(x)} key={x} style={styles.ccRole}><Text style={styles.ccMetricLabel}>{x}</Text></Pressable>)}</View></View>

      <Text style={styles.ccSectionTitle}>Project portfolio</Text>
      {(Object.keys(projects) as Array<keyof typeof projects>).map(key => {const p=projects[key]; return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Select ${p.title}`} accessibilityState={{selected:project===key}} onPress={()=>setProject(key)} style={[styles.ccProject,project===key&&styles.ccSelected]}><View style={styles.ccProjectImage}><Text style={styles.ccProjectGlyph}>▧</Text></View><View style={styles.flex}><Text style={styles.ccRowTitle}>{p.title}</Text><Text style={styles.ccSmall}>{p.vertical}</Text><View style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width:`${p.progress}%`}]} /></View></View><View><Text style={[styles.ccStatus,{color:p.tone}]}>{p.status}</Text><Text style={styles.ccCount}>{p.progress}%</Text><Text style={styles.ccGold}>View project →</Text></View></Pressable>})}

      <Text style={styles.ccSectionTitle}>Project detail</Text><View style={styles.ccHeadingRow}><View><Text style={styles.ccRowTitle}>{selected.title}</Text><Text style={styles.ccSmall}>{selected.vertical}</Text></View><Text style={[styles.ccStatus,{color:selected.tone}]}>{selected.status}</Text></View><Text style={styles.ccCount}>{selected.progress}% <Text style={styles.ccSmall}>Complete</Text></Text>
      <View accessibilityRole="image" accessibilityLabel="Monthly progress chart April to August" style={styles.ccChart}>{[22,27,31,36,selected.progress].map((v,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`${['April','May','June','July','August'][i]} progress ${v}%`} onPress={()=>toggle(`point${i}`)} style={[styles.ccChartPoint,{height:Math.max(18,v)}]}><Text style={styles.ccTiny}>{v}%</Text><Text style={styles.ccTiny}>{['Apr','May','Jun','Jul','Aug'][i]}</Text></Pressable>)}</View>
      {interactiveRow('next','Next milestone','Enabling works · 28 AUG')}{interactiveRow('budget','Budget variance','−2.4%')}{interactiveRow('open','Open blockers','3')}

      <Text style={styles.ccSectionTitle}>Employee activity</Text><View style={styles.ccHeadingRow}><Text style={styles.ccSmall}>186 this week</Text></View>
      <View accessibilityRole="image" accessibilityLabel="Employee activity weekly chart" style={styles.ccBarChart}>{[22,31,28,35,25,20,29].map((v,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]} activity ${v}`} onPress={()=>toggle(`day${i}`)} style={styles.ccBarSlot}><View style={[styles.ccBar,{height:v}]} /><Text style={styles.ccTiny}>{['M','T','W','T','F','S','S'][i]}</Text></Pressable>)}</View>
      {[['AR','Arjun Mehta','Project Director','8 activities today','On Site'],['PS','Priya Shah','Site Engineer','6 activities today','On Site'],['VK','Vikram Kapur','Planning Manager','4 updates today','Remote']].map(([initials,name,role,activity,where])=><View key={name} style={styles.ccEmployee}><Pressable accessibilityRole="button" accessibilityLabel={`Open employee ${name}`} onPress={()=>toggle(name)} style={styles.ccEmployeeMain}><Text style={styles.ccAvatar}>{initials}</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{role}</Text><Text style={styles.ccSmall}>{activity}</Text></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Open location for ${name}`} onPress={()=>toggle(`location${name}`)} style={styles.ccLocation}><Text style={styles.ccPositive}>{where}</Text></Pressable></View>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Open attention items" onPress={()=>toggle('attention')} style={styles.ccAttention}><Text style={styles.ccAttentionIcon}>!</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>3 items need your attention</Text>{detail==='attention'?<Text style={styles.ccSmall}>2 overdue milestones · 1 critical blocker</Text>:null}</View><Text style={styles.ccGold}>Review now →</Text></Pressable>
    </View>
  );
}

function PanelTab({ label, onPress, selected, title }: { label: string; onPress: () => void; selected: boolean; title: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.panelTab, selected && styles.panelTabSelected]}
    >
      <Text style={[styles.panelTabText, selected && styles.panelTabTextSelected]}>{title}</Text>
    </Pressable>
  );
}

function PortfolioPanel({ state, onAction }: Omit<Props, 'view'>) {
  const blocker = state.blockers.find((candidate) => candidate.id === 'commissioning-readiness')!;
  const currentProjects = demoProjects.map((project) => project.id === 'amaravati-solar-commons'
    ? { ...project, progress: state.currentProgress }
    : project);
  const averageProgress = Math.round(currentProjects.reduce((total, project) => total + project.progress, 0) / currentProjects.length);
  return (
    <View style={styles.panel}>
      <View style={styles.summaryBand} testID="management-summary-band">
        <SummaryMetric label="Active projects" value="09" />
        <SummaryMetric label="Average progress" value={`${averageProgress}%`} />
        <SummaryMetric label="Open tenders" value={`${state.tenders.length}`.padStart(2, '0')} />
        <SummaryMetric label="Needs attention" value="03" />
      </View>

      <SectionHeading eyebrow="PORTFOLIO HEALTH" title="Project health distribution" />
      <View style={styles.healthDistribution}>
        <HealthItem label="On track" tone="positive" value="04" />
        <HealthItem label="In progress" tone="attention" value="04" />
        <HealthItem label="Attention" tone="danger" value="01" />
      </View>

      <SectionHeading eyebrow="POWER OF 9" title="Progress by vertical" />
      <View style={styles.verticalList}>
        {demoVerticals.map((vertical) => {
          const project = currentProjects.find((candidate) => candidate.id === vertical.featuredProjectId)!;
          return (
            <View key={vertical.id} style={styles.verticalRow}>
              <View style={styles.verticalHeading}>
                <Text style={styles.verticalNumber}>{vertical.number}</Text>
                <Text style={styles.verticalTitle}>{vertical.title}</Text>
                <Text style={styles.verticalProgress}>{project.progress}%</Text>
              </View>
              <View style={styles.slimTrack}><View style={[styles.slimFill, { width: `${project.progress}%` }]} /></View>
            </View>
          );
        })}
      </View>

      <SectionHeading eyebrow="MILESTONES" title="Upcoming and overdue" />
      <View style={styles.splitContext}>
        <ContextBlock label="UPCOMING · 22 AUG" text="Commissioning readiness review" tone="attention" />
        <ContextBlock label="OVERDUE · 2 DAYS" text="Waterfront access decision" tone="danger" />
      </View>

      <SectionHeading eyebrow="PRIORITY PROJECT" title="Amaravati Solar Commons" />
      <View style={styles.priorityCard}>
        <View style={styles.rowBetween}><DemoStatusPill label="On track" tone="positive" /><Text style={styles.meta}>ENERGY & UTILITIES</Text></View>
        <DemoProgressRail detail={offlineProject.nextMilestone} progress={state.currentProgress} />
      </View>

      <SectionHeading eyebrow="BLOCKERS" title="Commissioning readiness" />
      <View style={styles.blockerCard}>
        <Text style={styles.cardTitle}>{blocker.title}</Text>
        <Text style={styles.cardCopy}>Evidence review must be owned before the commissioning milestone.</Text>
        {blocker.assignee
          ? <Text style={styles.assigned}>Assigned to {blocker.assignee}</Text>
          : <DemoAction
              label="Assign commissioning readiness blocker"
              onPress={() => onAction({ type: 'assign-blocker', blockerId: 'commissioning-readiness', assignee: 'Mira Management' })}
            />}
      </View>
    </View>
  );
}

function OperationsPanel({ state }: Pick<Props, 'state'>) {
  const attentionRows = tenderBoardRows(state, 'attention');
  const activity = state.fieldUpdateReviewed ? offlineProject.reviewUpdate : offlineProject.latestUpdate;
  return (
    <View style={styles.panel}>
      <View style={styles.attentionStrip}>
        <Text style={styles.attentionLabel}>OPERATIONAL ATTENTION</Text>
        <Text style={styles.attentionText}>{attentionRows.length} tender record needs deadline acknowledgement.</Text>
      </View>

      <SectionHeading eyebrow="FIELD DELIVERY" title="Current activity" />
      <View style={styles.activityCard}>
        <View style={styles.rowBetween}><Text style={styles.cardTitle}>Inverter row commissioning</Text><Text style={styles.progressValue}>{state.currentProgress}%</Text></View>
        <Text style={styles.cardCopy}>{activity}</Text>
        <Text style={styles.meta}>{state.fieldUpdateReviewed ? 'FIELD REVIEW RECORDED' : 'FIELD REVIEW PENDING'}</Text>
      </View>

      <SectionHeading eyebrow="TENDER DESK" title="Deadline and attention" />
      <View style={styles.dataRows}>
        <DataRow label="Solar balance-of-plant" value={state.tenders[0].bidOpenDate} />
        <DataRow label="Attention records" value={`${attentionRows.length}`} />
        <DataRow label="Next action" value={attentionRows[0]?.nextAction ?? state.tenders[0].nextAction} />
      </View>

      <SectionHeading eyebrow="WORKFORCE" title="Workforce status" />
      <View style={styles.healthDistribution}>
        <HealthItem label="Assigned" tone="positive" value="12" />
        <HealthItem label="Attention" tone="attention" value="02" />
        <HealthItem label="Unavailable" tone="danger" value="01" />
      </View>

      <SectionHeading eyebrow="PRIORITIES" title="Priority projects" />
      <View style={styles.dataRows}>
        <DataRow label="Amaravati Solar Commons" value={`${state.currentProgress}% · Commissioning`} />
        <DataRow label="Karaa Lakeside Resort" value="39% · Access decision" />
      </View>

      <SectionHeading eyebrow="EMPLOYEE ACTIVITY" title="Dev Employee" />
      <View style={styles.activityCard}>
        <Text style={styles.cardCopy}>{state.fieldUpdateReviewed ? 'Field review completed at 11:02 AM.' : 'Cabinet checks are ready for management review.'}</Text>
        <Text style={styles.meta}>AMARAVATI · INVERTER CABINETS</Text>
      </View>
    </View>
  );
}

function GeoLocation({ state, onAction }: Omit<Props, 'view'>) {
  const [filter, setFilter] = useState<GeoFilter>('All Projects');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [ascending, setAscending] = useState(false);
  const [openProject, setOpenProject] = useState<GeoProject | null>(null);
  const projects: GeoProject[] = [
    {category:'HEALTHCARE & LIFE SCIENCES',name:'Aarohan Medical City',place:'Pune, Maharashtra',checked:'426',teams:'38',ago:'1 min ago',status:'ON TRACK',live:'LIVE',detail:'All personnel within site',tone:'good',image:require('../../assets/verticals/conceptual-healthcare-campus.webp')},
    {category:'INFRASTRUCTURE & URBAN',name:'Amaravati Riverfront District',place:'Amaravati, Andhra Pradesh',checked:'782',teams:'64',ago:'now',status:'ON TRACK',live:'LIVE',detail:'2 personnel near boundary',tone:'warn',image:require('../../assets/verticals/conceptual-urban-district.webp')},
    {category:'ENERGY & UTILITIES',name:'Surya Integrated Energy Park',place:'Kurnool, Andhra Pradesh',checked:'518',teams:'46',ago:'2 min ago',status:'ATTENTION',live:'3 ALERTS',detail:'3 personnel outside geofence',tone:'danger',image:require('../../assets/verticals/conceptual-clean-energy.webp')},
    {category:'PORTS & LOGISTICS',name:'Amaravati Integrated Logistics Hub',place:'Vijayawada, Andhra Pradesh',checked:'694',teams:'57',ago:'1 min ago',status:'ON TRACK',live:'LIVE',detail:'All personnel within site',tone:'good',image:require('../../assets/verticals/conceptual-logistics-port.webp')},
    {category:'HEALTHCARE & LIFE SCIENCES',name:'Sanjeevani Advanced Care Hospital',place:'Hyderabad, Telangana',checked:'356',teams:'31',ago:'3 min ago',status:'AT RISK',live:'1 ALERT',detail:'1 device offline',tone:'warn',image:require('../../assets/verticals/multi-specialty-hospitals-user-supplied.webp')},
    {category:'HOSPITALITY & TOURISM',name:'Karaa Lakeside Resort',place:'Udaipur, Rajasthan',checked:'214',teams:'18',ago:'now',status:'ON TRACK',live:'LIVE',detail:'All personnel within site',tone:'good',image:require('../../assets/verticals/conceptual-hospitality-resort.webp')},
  ];
  if (openProject) return <LiveWorkforceMap project={openProject} onBack={() => setOpenProject(null)} />;
  let visible = projects.filter(p => `${p.name} ${p.place}`.toLowerCase().includes(query.trim().toLowerCase()));
  if (filter === 'On Track') visible = visible.filter(p => p.status === 'ON TRACK');
  if (filter === 'Attention') visible = visible.filter(p => p.status === 'ATTENTION' || p.status === 'AT RISK');
  if (filter === 'Location Alerts') visible = visible.filter(p => p.live.includes('ALERT') || p.tone === 'warn');
  if (ascending) visible = [...visible].sort((a,b)=>a.name.localeCompare(b.name));
  const act = (message:string) => setNotice(message);

  return (
    <View style={styles.geoPage} testID="geo-location-page">
      <Text style={styles.geoEyebrow}>FIELD OPERATIONS</Text><Text style={styles.geoTitle}>Geo Location</Text>

      <View style={styles.geoService}><Text style={styles.geoGood}>●  Location services active</Text><Text style={styles.geoUpdated}>Updated 10:42 AM</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh location status" onPress={()=>act('Updated 10:42 AM')} style={styles.geoIconButton}><Text>↻</Text></Pressable></View>
      {notice ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss prototype notice" onPress={()=>setNotice('')} style={styles.geoNotice}><Text style={styles.geoNoticeText}>{notice}</Text></Pressable> : null}
      <View style={styles.geoOverview}><Text style={styles.geoOverviewTitle}>Live site overview</Text><View style={styles.geoMetrics}>{[['08','Active Sites'],['3,912','Checked In'],['628','Field Teams'],['12','Location Alerts']].map(([v,l])=><View key={l} style={styles.geoMetric}><Text style={styles.geoMetricValue}>{v}</Text><Text style={styles.geoMetricLabel}>{l}</Text></View>)}</View><View style={styles.geoTracking}><Text style={styles.geoGood}>◉  Tracking <Text style={styles.geoTrackingCount}>4,860</Text> authorised personnel</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh data" onPress={()=>act('Updated 10:42 AM')} style={styles.geoTextButton}><Text style={styles.geoGold}>Refresh data  ↻</Text></Pressable></View></View>
      <DemoSearchField accessibilityLabel="Search Geo Location" onChangeText={setQuery} placeholder="Search projects or locations" value={query} />
      <View style={styles.geoTools}><Pressable accessibilityRole="button" accessibilityLabel="Filter projects" onPress={()=>setFilter(filter==='All Projects'?'Location Alerts':'All Projects')} style={styles.geoTool}><Text style={styles.geoToolText}>⌁  Filter</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sort projects" onPress={()=>setAscending(!ascending)} style={styles.geoTool}><Text style={styles.geoToolText}>⇅  Sort</Text></Pressable></View>
      <View accessibilityRole="tablist" style={styles.geoChips}>{geoFilters.map(item=><Pressable key={item} accessibilityRole="tab" accessibilityLabel={item} accessibilityState={{selected:filter===item}} onPress={()=>setFilter(item)} style={[styles.geoChip,filter===item&&styles.geoChipActive]}><Text style={[styles.geoChipText,filter===item&&styles.geoChipTextActive]}>{item}</Text></Pressable>)}</View>
      <View style={styles.geoSectionHead}><View><Text style={styles.geoSectionTitle}>Ongoing Projects</Text><Text style={styles.geoSectionMeta}>08 projects</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Change project view" onPress={()=>act('Compact list view selected.')} style={styles.geoIconButton}><Text>☷</Text></Pressable></View>
      <View>{visible.map(p=><Pressable key={p.name} accessibilityRole="button" accessibilityLabel={`Open ${p.name}`} onPress={()=>setOpenProject(p)} style={styles.geoProject}><Image accessibilityLabel={`${p.name} project image`} source={p.image} style={styles.geoProjectImage}/><View style={styles.geoProjectBody}><View style={styles.geoProjectTop}><View style={styles.flex}><Text style={styles.geoCategory}>{p.category}</Text><Text style={styles.geoProjectName}>{p.name}</Text><Text style={styles.geoPlace}>●  {p.place}</Text></View><View><Text style={[styles.geoBadge,p.tone==='danger'?styles.geoBadgeDanger:p.tone==='warn'?styles.geoBadgeWarn:styles.geoBadgeGood]}>{p.status}</Text><Text style={p.live==='LIVE'?styles.geoLive:styles.geoAlertBadge}>●  {p.live}</Text></View></View><View style={styles.geoProjectMeta}><View><Text style={styles.geoStat}>{p.checked}</Text><Text style={styles.geoStatLabel}>Checked in</Text></View><View><Text style={styles.geoStat}>{p.teams}</Text><Text style={styles.geoStatLabel}>Field teams</Text></View><View><Text style={styles.geoStat}>{p.ago}</Text><Text style={styles.geoStatLabel}>Last sync</Text></View></View><View style={styles.geoProjectBottom}><Text style={[styles.geoDetail,p.tone==='danger'&&styles.geoDanger]}>◉  {p.detail}</Text><Text style={styles.geoGold}>Open live map  ➤</Text></View></View></Pressable>)}</View>
      {!visible.length?<Text style={styles.emptyText}>No matching projects</Text>:null}
      <View style={styles.geoSectionHead}><View><Text style={styles.geoSectionTitle}>Location alerts</Text></View></View>
      {[['3 personnel outside geofence','Surya Integrated Energy Park','8 min ago'],['1 tracking device offline','Sanjeevani Advanced Care Hospital','14 min ago'],['2 personnel near site boundary','Amaravati Riverfront District','22 min ago']].map(([title,project,time])=><Pressable key={title} accessibilityRole="button" accessibilityLabel={`Open alert ${title}`} onPress={()=>act(title)} style={styles.geoAlertRow}><Text style={styles.geoAlertIcon}>!</Text><View style={styles.flex}><Text style={styles.geoAlertTitle}>{title}</Text><Text style={styles.geoPlace}>{project}</Text></View><Text style={styles.geoAgo}>{time}</Text><Text style={styles.geoChevron}>›</Text></Pressable>)}
      <Pressable accessibilityRole="button" accessibilityLabel="View all 12 alerts" onPress={()=>{setFilter('Location Alerts');act('Showing projects with location alerts.');}} style={styles.geoViewAll}><Text style={styles.geoGold}>View all 12 alerts  →</Text></Pressable>
      <View style={styles.geoPrivacy}><Text style={styles.geoPrivacyIcon}>⌖</Text><View style={styles.flex}><Text style={styles.geoPrivacyTitle}>Authorised tracking only</Text><Text style={styles.geoPrivacyCopy}>Live location is visible only during assigned work hours.</Text></View><Pressable accessibilityRole="link" accessibilityLabel="Tracking policy" onPress={()=>act('Authorised tracking only')} style={styles.geoTextButton}><Text style={styles.geoGold}>Tracking policy</Text></Pressable></View>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryMetric} testID="management-summary-value"><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function Counter({ label, value }: { label: string; value: string }) {
  return <View style={styles.counter}><Text style={styles.counterValue}>{value}</Text><Text style={styles.counterLabel}>{label}</Text></View>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>;
}

function HealthItem({ label, tone, value }: { label: string; tone: 'positive' | 'attention' | 'danger'; value: string }) {
  return <View style={styles.healthItem}><DemoStatusPill label={label} tone={tone} /><Text style={styles.healthValue}>{value}</Text></View>;
}

function ContextBlock({ label, text, tone }: { label: string; text: string; tone: 'attention' | 'danger' }) {
  return <View style={[styles.contextBlock, tone === 'danger' && styles.contextDanger]}><Text style={[styles.contextLabel, tone === 'danger' && styles.contextLabelDanger]}>{label}</Text><Text style={styles.contextText}>{text}</Text></View>;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.dataRow}><Text style={styles.dataLabel}>{label}</Text><Text style={styles.dataValue}>{value}</Text></View>;
}

function LegendItem({ label, tone }: { label: string; tone: 'assigned' | 'manager' | 'attention' | 'unavailable' }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, styles[`legend_${tone}`]]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  geoPage: { backgroundColor:'#FFFFFF', gap:7, paddingBottom:10 },
  geoEyebrow: { color:'#A56D08', fontSize: 10, fontWeight:'900', letterSpacing:1.15 },
  geoTitle: { color:'#171713', fontFamily:'serif', fontSize:29, fontWeight:'800', lineHeight:32 },
  geoSubtitle: { color:'#68655E', fontSize:10, lineHeight:14, maxWidth:310 },
  geoService: { alignItems:'center', borderBottomColor:'#DDD7CB', borderBottomWidth:1, flexDirection:'row', minHeight:44 },
  geoGood: { color:'#48A360', fontSize: 10, fontWeight:'800' },
  geoTrackingCount: { color:'#5FCB72', fontWeight:'900' },
  geoUpdated: { color:'#7B776F', flex:1, fontSize: 10, marginLeft:8 },
  geoIconButton: { alignItems:'center', justifyContent:'center', minHeight:44, minWidth:44 },
  geoTextButton: { justifyContent:'center', minHeight:44 },
  geoNotice: { backgroundColor:'#FFF1D2', borderLeftColor:'#B37B0B', borderLeftWidth:3, justifyContent:'center', minHeight:44, paddingHorizontal:8 },
  geoNoticeText: { color:'#5C4517', fontSize: 10, lineHeight:13 },
  geoOverview: { backgroundColor:'#171918', borderRadius:5, padding:10 },
  geoOverviewTitle: { color:'#F7F2E8', fontFamily:'serif', fontSize:14, fontWeight:'800' },
  geoMetrics: { flexDirection:'row', marginTop:8 },
  geoMetric: { borderRightColor:'#3B3D3B', borderRightWidth:1, flex:1, paddingHorizontal:5 },
  geoMetricValue: { color:'#D39A21', fontFamily:'serif', fontSize:17, fontWeight:'900' },
  geoMetricLabel: { color:'#C9C5BC', fontSize: 10, lineHeight:10 },
  geoTracking: { alignItems:'center', borderTopColor:'#3B3D3B', borderTopWidth:1, flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  geoGold: { color:'#B77D0C', fontSize: 10, fontWeight:'900' },
  geoTools: { flexDirection:'row', gap:6 },
  geoTool: { alignItems:'center', borderColor:'#D7D1C5', borderRadius:3, borderWidth:1, justifyContent:'center', minHeight:44, paddingHorizontal:14 },
  geoToolText: { color:'#34322D', fontSize: 10, fontWeight:'800' },
  geoChips: { flexDirection:'row', gap:5 },
  geoChip: { alignItems:'center', borderColor:'#D9D3C7', borderRadius:16, borderWidth:1, flex:1, justifyContent:'center', minHeight:44, paddingHorizontal:3 },
  geoChipActive: { backgroundColor:'#1A1B19', borderColor:'#1A1B19' },
  geoChipText: { color:'#625F58', fontSize: 10, fontWeight:'800', textAlign:'center' },
  geoChipTextActive: { color:'#F7F2E8' },
  geoSectionHead: { alignItems:'center', borderBottomColor:'#DCD6CA', borderBottomWidth:1, flexDirection:'row', justifyContent:'space-between', marginTop:5, minHeight:58 },
  geoSectionTitle: { color:'#1E1D19', fontFamily:'serif', fontSize:16, fontWeight:'800' },
  geoSectionCopy: { color:'#4D4A44', fontSize: 10, marginTop:2 },
  geoSectionMeta: { color:'#7A766D', fontSize: 10, marginTop:2 },
  geoProject: { backgroundColor:'#FEFCF7', borderBottomColor:'#DED8CD', borderBottomWidth:1, flexDirection:'row', minHeight:124, paddingVertical:7 },
  geoProjectImage: { alignSelf:'stretch', backgroundColor:'#DDD5C7', borderRadius:3, resizeMode:'cover', width:116 },
  geoProjectBody: { flex:1, paddingLeft:9 },
  geoProjectTop: { flexDirection:'row' },
  geoCategory: { color:'#77736B', fontSize: 10, fontWeight:'900', letterSpacing:.3 },
  geoProjectName: { color:'#22211D', fontFamily:'serif', fontSize:12, fontWeight:'800', lineHeight:15 },
  geoPlace: { color:'#77736B', fontSize: 10, lineHeight:11 },
  geoProgress: { color:'#B47807', fontFamily:'serif', fontSize:15, fontWeight:'900' },
  geoProjectMeta: { alignItems:'center', flexDirection:'row', justifyContent:'space-between', marginTop:7, paddingHorizontal:5 },
  geoStat: { color:'#25231F', fontFamily:'serif', fontSize:12, fontWeight:'900', textAlign:'center' },
  geoStatLabel: { color:'#77736B', fontSize: 10, textAlign:'center' },
  geoPeople: { color:'#4E4B45', fontSize: 10, fontWeight:'700' },
  geoAgo: { color:'#858077', fontSize: 10 },
  geoProjectBottom: { alignItems:'center', flexDirection:'row', gap:4, marginTop:7, minHeight:30 },
  geoBadge: { borderRadius:2, fontSize: 10, fontWeight:'900', overflow:'hidden', paddingHorizontal:4, paddingVertical:3 },
  geoBadgeGood: { backgroundColor:'#E4F1E5', color:'#2E8943' },
  geoBadgeWarn: { backgroundColor:'#FFF0D2', color:'#A76900' },
  geoBadgeDanger: { backgroundColor:'#F9E2DD', color:'#C43D2D' },
  geoLive: { color:'#35924A', fontSize: 10, fontWeight:'900' },
  geoAlertBadge: { color:'#C43D2D', fontSize: 10, fontWeight:'900' },
  geoDetail: { color:'#56745B', flex:1, fontSize: 10, lineHeight:10 },
  geoDanger: { color:'#C43D2D' },
  geoChevron: { color:'#9D988E', fontSize:17 },
  geoAlertRow: { alignItems:'center', borderBottomColor:'#DED8CD', borderBottomWidth:1, flexDirection:'row', gap:8, minHeight:57 },
  geoAlertIcon: { backgroundColor:'#F8E3DE', borderRadius:14, color:'#C94232', fontSize:12, fontWeight:'900', height:28, lineHeight:28, textAlign:'center', width:28 },
  geoAlertTitle: { color:'#292722', fontSize: 10, fontWeight:'900' },
  geoViewAll: { alignItems:'center', justifyContent:'center', minHeight:44 },
  geoPrivacy: { backgroundColor:'#F6EBCF', borderColor:'#E3D3A9', borderRadius:4, borderWidth:1, flexDirection:'row', gap:9, padding:10 },
  geoPrivacyIcon: { color:'#A87309', fontSize:20 },
  geoPrivacyTitle: { color:'#302C23', fontSize:10, fontWeight:'900' },
  geoPrivacyCopy: { color:'#706857', fontSize: 10, marginTop:3 },
  ccPage: { gap: 0, paddingBottom: spacing.lg },
  ccGreeting: { color: colors.ink, fontFamily: 'serif', fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: spacing.xs },
  ccSmall: { color: '#696760', fontSize: 12, lineHeight: 17 },
  ccTiny: { color: '#77746C', fontSize: 11, lineHeight: 14 },
  ccGold: { color: colors.brassDark, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  ccDataRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  ccFilterLine: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ccLive: { color: colors.moss, fontSize: 12, fontWeight: '800', lineHeight: 17 },
  ccFilter: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between', minHeight: 48, minWidth: 0, paddingHorizontal: spacing.sm },
  ccFilterText: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' }, ccFilterChevron: { color: colors.brassDark, fontSize: 14 },
  ccSectionTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 20, fontWeight: '800', lineHeight: 26, marginTop: spacing.lg },
  ccSnapshot: { backgroundColor: '#151716', borderRadius: radii.md, flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, overflow: 'hidden' },
  ccMetric: { alignItems: 'center', borderBottomColor: '#393A37', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 94, padding: spacing.md, width: '50%' }, ccMetricCopy: { flex: 1, minWidth: 0 },
  ccMetricIcon: { borderColor: '#71500A', borderRadius: 14, borderWidth: 1, color: '#C28A13', fontSize: 15, height: 30, lineHeight: 28, textAlign: 'center', width: 30 },
  ccMetricValue: { color: '#F5F0E6', fontFamily: 'serif', fontSize: 22, fontWeight: '800', lineHeight: 27 },
  ccMetricLabel: { color: '#D5D0C7', fontSize: 11, lineHeight: 15 },
  ccSnapshotFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', minHeight: 52, paddingHorizontal: spacing.md, width: '100%' }, ccSnapshotNote: { color: '#78B987', flex: 1, fontSize: 11, lineHeight: 15, minWidth: 180 }, ccReportButton: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 44, paddingLeft: spacing.sm }, ccSnapshotLink: { color: '#D8A02A', fontSize: 11, fontWeight: '800' },
  ccHealth: { backgroundColor: colors.secondarySurface, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, marginTop: spacing.sm, overflow: 'hidden', paddingHorizontal: spacing.md },
  ccHealthTotal: { alignItems: 'baseline', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.sm },
  ccDonutNum: { color: colors.ink, fontFamily: 'serif', fontSize: 26, fontWeight: '800', lineHeight: 31 },
  ccHealthRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 48 }, ccStatusDot: { borderRadius: 4, height: 8, width: 8 }, ccHealthLabel: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700' }, ccHealthN: { color: colors.ink, fontSize: 13, fontWeight: '900', textAlign: 'right', width: 28 }, ccHealthPercent: { color: colors.muted, fontSize: 12, textAlign: 'right', width: 38 },
  ccPositive: { color: colors.moss, fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: spacing.xs },
  ccHeadingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }, ccLines: { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing.sm },
  ccProgressRow: { gap: spacing.xs, paddingVertical: spacing.sm }, ccProgressHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' }, ccProgressLabel: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  ccProgressTrack: { backgroundColor: '#E9E4DA', borderRadius: radii.pill, height: 6, overflow: 'hidden', width: '100%' }, ccProgressFill: { backgroundColor: colors.brass, borderRadius: radii.pill, height: '100%' }, ccProgressValue: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 18, textAlign: 'right' },
  ccCount: { color: '#292721', fontFamily: 'serif', fontSize: 18, fontWeight: '800' },
  ccRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 56, paddingVertical: spacing.sm }, ccRowIcon: { alignItems: 'center', width: 20 }, ccRowTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 18 }, ccTrailing: { color: '#4A4841', fontSize: 11, lineHeight: 15 }, ccChevron: { color: '#9A958B', fontSize: 16 }, ccDisclosure: { color: colors.brassDark, fontSize: 11, lineHeight: 15, marginTop: 3 },
  ccBlocker: { backgroundColor: colors.paper, borderColor: colors.line, borderLeftColor: colors.danger, borderLeftWidth: 3, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, marginTop: spacing.xs, minHeight: 96, padding: spacing.sm }, ccBlockerMain: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm }, ccBlockerCopy: { flex: 1, minWidth: 0 }, ccBlockerMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, minWidth: 0 }, ccSeverity: { backgroundColor: colors.statusBlockedSurface, borderRadius: radii.pill, color: colors.danger, fontSize: 10, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 4 }, ccAssign: { alignItems: 'center', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexShrink: 0, justifyContent: 'center', minHeight: 44, minWidth: 72, paddingHorizontal: spacing.sm },
  ccTimeline: { alignItems: 'flex-start', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 62, paddingVertical: spacing.sm }, ccTime: { color: '#696760', fontSize: 11, lineHeight: 15, paddingTop: 3, width: 56 }, ccTimelineDot: { color: colors.brass, fontSize: 11, width: 22 },
  ccTender: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 80, paddingVertical: spacing.sm },
  ccWorkforce: { backgroundColor: '#151716', borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.md }, ccWorkTitle: { color: '#F4EFE6', fontFamily: 'serif', fontSize: 18, fontWeight: '800', lineHeight: 23 }, ccWorkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }, ccWorkValue: { color: '#D29A22', fontFamily: 'serif', fontSize: 20, fontWeight: '800', lineHeight: 25 }, ccAttendance: { alignItems: 'center', borderColor: '#389647', borderRadius: 28, borderWidth: 5, height: 56, justifyContent: 'center', width: 56 }, ccAttendanceValue: { color: '#EDE9E1', fontSize: 14, fontWeight: '900' }, ccRoles: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, marginTop: spacing.sm }, ccRole: { alignItems: 'center', backgroundColor: '#292B29', flexGrow: 1, flexBasis: '48%', justifyContent: 'center', minHeight: 44 },
  ccProject: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, minHeight: 96, paddingVertical: spacing.sm }, ccSelected: { backgroundColor: colors.secondarySurface, borderColor: colors.brass, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.xs }, ccProjectImage: { alignItems: 'center', backgroundColor: '#E8E1D3', borderRadius: radii.sm, height: 64, justifyContent: 'center', width: 72 }, ccProjectGlyph: { color: '#8A7449', fontSize: 28 }, ccStatus: { fontSize: 11, fontWeight: '900', lineHeight: 15, textAlign: 'right' },
  ccChart: { alignItems: 'flex-end', borderBottomColor: '#C8C2B8', borderBottomWidth: 1, flexDirection: 'row', height: 84, justifyContent: 'space-around' }, ccChartPoint: { alignItems: 'center', borderTopColor: colors.brass, borderTopWidth: 2, justifyContent: 'space-between', minHeight: 44, width: 45 },
  ccBarChart: { alignItems: 'flex-end', flexDirection: 'row', height: 65, justifyContent: 'space-around' }, ccBarSlot: { alignItems: 'center', justifyContent: 'flex-end', minHeight: 44, width: 36 }, ccBar: { backgroundColor: colors.brass, width: 12 },
  ccEmployee: { alignItems: 'center', borderBottomColor: '#E1DCD2', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, minHeight: 72 }, ccEmployeeMain: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 56, minWidth: 0 }, ccAvatar: { backgroundColor: '#343531', borderRadius: 16, color: '#F3EEE4', fontSize: 10, height: 30, lineHeight: 30, textAlign: 'center', width: 30 }, ccLocation: { alignItems: 'center', flexShrink: 0, justifyContent: 'center', minHeight: 44, minWidth: 64 },
  ccAttention: { alignItems: 'center', backgroundColor: '#FFF1D7', borderLeftColor: colors.amber, borderLeftWidth: 3, flexDirection: 'row', gap: 8, marginTop: 8, minHeight: 52, paddingHorizontal: 8 }, ccAttentionIcon: { borderColor: colors.amber, borderRadius: 10, borderWidth: 1, color: colors.amber, fontWeight: '900', textAlign: 'center', width: 20 },
  page: { gap: spacing.md },
  panel: { gap: spacing.md },
  flex: { flex: 1 },
  eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', lineHeight: 35 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  panelTabs: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  panelTab: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  panelTabSelected: { backgroundColor: colors.brass },
  panelTabText: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  panelTabTextSelected: { color: colors.paper },
  summaryBand: { backgroundColor: '#161817', borderRadius: radii.md, flexDirection: 'row', overflow: 'hidden' },
  summaryMetric: { borderRightColor: '#454946', borderRightWidth: 1, flex: 1, gap: 3, minHeight: 78, padding: spacing.sm },
  summaryValue: { color: colors.brass, fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: colors.paper, fontSize: 10, fontWeight: '800', lineHeight: 12 },
  sectionHeading: { gap: 2, marginTop: spacing.xs },
  sectionEyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .9 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', lineHeight: 23 },
  healthDistribution: { flexDirection: 'row', gap: spacing.xs },
  healthItem: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.sm },
  healthValue: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  verticalList: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm },
  verticalRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 5, paddingVertical: 8 },
  verticalHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  verticalNumber: { color: colors.brass, fontSize: 10, fontWeight: '900', width: 18 },
  verticalTitle: { color: colors.ink, flex: 1, fontSize: 10, fontWeight: '800' },
  verticalProgress: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  slimTrack: { backgroundColor: '#E5E1D9', borderRadius: radii.pill, height: 3, marginLeft: 24, overflow: 'hidden' },
  slimFill: { backgroundColor: colors.brass, height: '100%' },
  splitContext: { flexDirection: 'row', gap: spacing.sm },
  contextBlock: { backgroundColor: colors.statusAttentionSurface, borderRadius: radii.sm, flex: 1, gap: 4, padding: spacing.sm },
  contextDanger: { backgroundColor: colors.statusBlockedSurface },
  contextLabel: { color: colors.amber, fontSize: 10, fontWeight: '900', letterSpacing: .55 },
  contextLabelDanger: { color: colors.danger },
  contextText: { color: colors.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  priorityCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.sm },
  rowBetween: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  meta: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .55 },
  blockerCard: { backgroundColor: colors.paper, borderColor: colors.line, borderLeftColor: colors.amber, borderLeftWidth: 4, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', lineHeight: 18 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  assigned: { color: colors.moss, fontSize: 13, fontWeight: '900', minHeight: 44, paddingVertical: 13 },
  attentionStrip: { backgroundColor: colors.statusAttentionSurface, borderLeftColor: colors.amber, borderLeftWidth: 4, borderRadius: radii.sm, gap: 4, padding: spacing.sm },
  attentionLabel: { color: colors.amber, fontSize: 10, fontWeight: '900', letterSpacing: .8 },
  attentionText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  activityCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  progressValue: { color: colors.brass, fontSize: 22, fontWeight: '900' },
  dataRows: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm },
  dataRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3, minHeight: 44, paddingVertical: 8 },
  dataLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .55 },
  dataValue: { color: colors.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  geoCounters: { backgroundColor: '#161817', borderRadius: radii.sm, flexDirection: 'row', overflow: 'hidden' },
  counter: { borderRightColor: '#454946', borderRightWidth: 1, flex: 1, gap: 2, padding: spacing.sm },
  counterValue: { color: colors.brass, fontSize: 22, fontWeight: '900' },
  counterLabel: { color: colors.paper, fontSize: 10, fontWeight: '800' },
  filterRow: { flexDirection: 'row', width: '100%' },
  filter: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 2 },
  filterSelected: { borderBottomColor: colors.brass, borderBottomWidth: 3 },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  filterTextSelected: { color: colors.brass },
  filterResult: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  stateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  stateChip: { backgroundColor: colors.statusStructuralSurface, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  stateChipText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  alertRow: { alignItems: 'center', backgroundColor: colors.statusAttentionSurface, borderRadius: radii.sm, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  alertMark: { color: colors.amber, fontSize: 22, fontWeight: '900' },
  coverageCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 64, padding: spacing.sm },
  selectedCard: { borderColor: colors.brass, borderWidth: 2 },
  coverageCount: { color: colors.brass, fontSize: 11, fontWeight: '900' },
  emptyText: { color: colors.muted, fontSize: 13, minHeight: 44, paddingVertical: 13 },
  schematic: { backgroundColor: '#EAE4D8', borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, height: 220, overflow: 'hidden', position: 'relative' },
  routeOne: { backgroundColor: '#FFFFFF', height: 24, left: -20, position: 'absolute', top: 72, transform: [{ rotate: '-8deg' }], width: 430 },
  routeTwo: { backgroundColor: '#FFFFFF', height: 20, left: 110, position: 'absolute', top: 96, transform: [{ rotate: '76deg' }], width: 250 },
  projectMarker: { alignItems: 'center', backgroundColor: colors.ink, borderColor: colors.brass, borderRadius: 24, borderWidth: 3, height: 48, justifyContent: 'center', left: 48, position: 'absolute', top: 105, width: 48 },
  projectMarkerText: { color: colors.paper, fontSize: 11, fontWeight: '900' },
  employeeMarker: { alignItems: 'center', backgroundColor: colors.moss, borderRadius: 18, height: 36, justifyContent: 'center', position: 'absolute', right: 68, top: 48, width: 36 },
  employeeMarkerText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  managerMarker: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: 16, bottom: 34, height: 32, justifyContent: 'center', position: 'absolute', right: 28, width: 32 },
  managerMarkerText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  demoVisual: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .4, marginTop: -10 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legend_assigned: { backgroundColor: colors.moss },
  legend_manager: { backgroundColor: colors.brass },
  legend_attention: { backgroundColor: colors.amber },
  legend_unavailable: { backgroundColor: colors.danger },
  legendText: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  employeeRow: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 64, padding: spacing.sm },
  initials: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  initialsLarge: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  initialsText: { color: colors.brass, fontSize: 10, fontWeight: '900' },
  chevron: { color: colors.brass, fontSize: 26, fontWeight: '500' },
  employeeDetail: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  employeeIdentity: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  activityTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: spacing.xs },
});
