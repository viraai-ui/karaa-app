import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

type PersonnelFilter = 'All personnel' | 'Field teams' | 'Managers' | 'Alerts';

const personnelFilters: readonly PersonnelFilter[] = ['All personnel', 'Field teams', 'Managers', 'Alerts'];

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
      <View style={styles.ccRowIcon}><Text style={styles.ccGold}>▣</Text></View><View style={styles.flex}><Text style={styles.ccRowTitle}>{title}</Text><Text style={styles.ccSmall}>{sub}</Text>{detail === key ? <Text style={styles.ccDisclosure}>Prototype record · locally displayed for review.</Text> : null}</View>{trailing ? <Text style={styles.ccTrailing}>{trailing}</Text> : null}<Text style={styles.ccChevron}>›</Text>
    </Pressable>
  );
  return (
    <View style={styles.ccPage}>
      <Text style={styles.eyebrow}>EXECUTIVE OPERATIONS</Text>
      <Text style={styles.title}>Command Centre</Text>
      <Text style={styles.ccGreeting}>Good morning, Arjun.</Text>
      <Text style={styles.ccSmall}>A live view of projects, people and priorities.</Text>
      <View style={styles.ccFilterLine}><Text style={styles.ccLive}>● Live data</Text><Text style={styles.ccSmall}>Updated 10:42 AM</Text><View style={styles.flex} />
        <Pressable accessibilityRole="button" accessibilityLabel="Filter vertical" onPress={() => setVertical(vertical === 'All Verticals' ? 'Energy & Utilities' : 'All Verticals')} style={styles.ccFilter}><Text style={styles.ccFilterText}>{vertical}⌄</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Filter month" onPress={() => setMonth(month === 'This Month' ? 'August' : 'This Month')} style={styles.ccFilter}><Text style={styles.ccFilterText}>{month}⌄</Text></Pressable>
      </View>

      <Text style={styles.ccSectionTitle}>Company snapshot</Text>
      <View style={styles.ccSnapshot} testID="management-summary-band">
        {[['▥','27','Active Projects'],['◔','61%','Avg. Progress'],['₹','₹1,248 Cr','Active Portfolio'],['▤','14','Open Tenders']].map(([icon,value,label]) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Open ${label}`} onPress={() => toggle(label)} style={styles.ccMetric} testID="management-summary-value"><Text style={styles.ccMetricIcon}>{icon}</Text><View><Text style={styles.ccMetricValue}>{value}</Text><Text style={styles.ccMetricLabel}>{label}</Text></View></Pressable>)}
        <Text style={styles.ccSnapshotNote}>⌁  Portfolio value  +8.2% this month</Text><Text style={styles.ccSnapshotLink}>View report  →</Text>
      </View>

      <Text style={styles.ccSectionTitle}>Project health</Text>
      <View style={styles.ccHealth}><View style={styles.ccDonut}><Text style={styles.ccDonutNum}>27</Text><Text style={styles.ccTiny}>Projects</Text></View><View style={styles.flex}>
        {[['#31924A','19','On Track','70%'],['#E89416','05','At Risk','19%'],['#D34435','03','Delayed','11%']].map(([c,n,l,p]) => <Pressable key={l} accessibilityRole="button" accessibilityLabel={`Open ${l} projects`} onPress={() => toggle(l)} style={styles.ccHealthRow}><Text style={{color:c}}>●</Text><Text style={styles.ccHealthN}>{n}</Text><Text style={styles.ccSmall}>{l}</Text><Text style={styles.ccSmall}>{p}</Text></Pressable>)}</View></View>
      <Text style={styles.ccPositive}>⌁  2 projects returned to On Track this month</Text>

      <View style={styles.ccHeadingRow}><Text style={styles.ccSectionTitle}>Portfolio progress</Text><Text style={styles.ccSmall}>By Vertical⌄</Text></View>
      <View style={styles.ccLines}>{verticals.filter(([name]) => vertical === 'All Verticals' || name === vertical).map(([name,value]) => <View key={name} style={styles.ccProgressRow}><Text style={styles.ccProgressLabel}>{name}</Text><View style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width:`${value}%` as `${number}%`}]} /></View><Text style={styles.ccProgressValue}>{value}%</Text></View>)}</View>

      <Text style={styles.ccSectionTitle}>Upcoming milestones</Text><Text style={styles.ccCount}>14 <Text style={styles.ccSmall}>Next 30 days</Text></Text>
      {interactiveRow('m1','Envelope works','Amaravati Medical City','24 Aug')}{interactiveRow('m2','Landscape package','Aarohan Waterfront','28 Aug')}{interactiveRow('m3','Module installation','Surya Energy Park','04 Sep')}
      <Text style={styles.ccSectionTitle}>Overdue milestones</Text><Text style={[styles.ccCount,{color:'#D34435'}]}>03</Text>
      {interactiveRow('o1','MEP design approval','Skyport Hotel','6 days overdue')}{interactiveRow('o2','Utility corridor handover','Riverfront District','3 days overdue')}{interactiveRow('o3','Transformer procurement','Surya Energy Park','2 days overdue')}

      <Text style={styles.ccSectionTitle}>Critical blockers</Text><Text style={styles.ccSmall}>Issues requiring senior management attention</Text>
      {[['Land title clearance','Amaravati Logistics Hub','HIGH','7 days','Owner: Legal & Permits'],['Transformer delivery risk','Surya Energy Park','HIGH','6 days','Owner: Procurement'],['Specialist contractor shortage','Aarohan Medical City','MEDIUM','4 days','Owner: Project Delivery']].map(([name,sub,severity,age,owner]) => {
        const persisted = name === 'Transformer delivery risk' && Boolean(state.blockers.find(candidate => candidate.id === 'commissioning-readiness')?.assignee);
        const isAssigned = persisted || assigned.includes(name);
        return <View key={name} style={styles.ccBlocker}><View style={styles.flex}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{sub}</Text></View><Text style={styles.ccSeverity}>{severity}</Text><Text style={styles.ccSmall}>{age}</Text><Text style={styles.ccTiny}>{owner}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Assign ${name}`} accessibilityState={{disabled:isAssigned}} disabled={isAssigned} onPress={() => { setAssigned(a => a.includes(name) ? a : [...a,name]); if (name === 'Transformer delivery risk') onAction({ type: 'assign-blocker', blockerId: 'commissioning-readiness', assignee: 'Mira Management' }); }} style={styles.ccAssign}><Text style={styles.ccGold}>{isAssigned?'Assigned':'Assign'}</Text></Pressable></View>;
      })}

      <Text style={styles.ccSectionTitle}>Latest activity</Text><Text style={styles.ccSmall}>Updates across active projects</Text>
      {[['10:42 AM','Milestone completed',state.fieldUpdateReviewed ? offlineProject.reviewUpdate : 'Foundation pile approval at Amaravati Medical City'],['09:18 AM','RFI closed','Fire NOC update — Aarohan Waterfront Retail'],['08:30 AM','Tender awarded','Façade Systems at Skyport'],['Yesterday','Blocker escalated','Transformer delivery risk at Surya Energy Park']].map(([time,title,copy]) => <Pressable key={time} accessibilityRole="button" accessibilityLabel={`Open activity ${title}`} onPress={() => toggle(time)} style={styles.ccTimeline}><Text style={styles.ccTime}>{time}</Text><Text style={styles.ccTimelineDot}>●</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>{title}</Text><Text style={styles.ccSmall}>{copy}</Text>{detail===time?<Text style={styles.ccDisclosure}>Activity detail opened locally.</Text>:null}</View></Pressable>)}

      <Text style={styles.ccSectionTitle}>Tender deadlines</Text>
      {[['Interior Fit-out Works','KMC Tower','₹82 Cr','12 days remaining',62],['Airport Expansion Package','Phase II Construction','₹245 Cr','18 days remaining',48],['Works Package EPC-02','Solar Park Extension','₹128 Cr','21 days remaining',71]].map(([name,sub,value,days,p]) => <Pressable key={name as string} accessibilityRole="button" accessibilityLabel={`Open tender ${name}`} onPress={() => toggle(name as string)} style={styles.ccTender}><View style={styles.flex}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{sub}</Text><Text style={styles.ccSmall}>{value}</Text><View style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width: `${Number(p)}%` as any}]} /></View>{detail===name?<Text style={styles.ccDisclosure}>Tender detail · prototype data.</Text>:null}</View><Text style={styles.ccSmall}>{days}</Text><Text style={styles.ccChevron}>›</Text></Pressable>)}

      <View style={styles.ccWorkforce}><Text style={styles.ccWorkTitle}>Workforce status</Text><View style={styles.ccWorkGrid}>{[['4,860','Total Workforce'],['3,912','Checked In'],['628','Field Teams'],['320','Off-site']].map(([v,l])=><View key={l}><Text style={styles.ccWorkValue}>{v}</Text><Text style={styles.ccMetricLabel}>{l}</Text></View>)}<View style={styles.ccAttendance}><Text style={styles.ccAttendanceValue}>80%</Text><Text style={styles.ccMetricLabel}>Attendance</Text></View></View><View style={styles.ccRoles}>{['Field 628','Engineers 1,240','Supervisors 482','Office 2,510'].map(x=><Pressable accessibilityRole="button" accessibilityLabel={`Open workforce role ${x}`} onPress={()=>toggle(x)} key={x} style={styles.ccRole}><Text style={styles.ccMetricLabel}>{x}</Text></Pressable>)}</View></View>

      <Text style={styles.ccSectionTitle}>Project portfolio</Text><Text style={styles.ccSmall}>Track progress across strategic projects</Text>
      {(Object.keys(projects) as Array<keyof typeof projects>).map(key => {const p=projects[key]; return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Select ${p.title}`} accessibilityState={{selected:project===key}} onPress={()=>setProject(key)} style={[styles.ccProject,project===key&&styles.ccSelected]}><View style={styles.ccProjectImage}><Text style={styles.ccProjectGlyph}>▧</Text></View><View style={styles.flex}><Text style={styles.ccRowTitle}>{p.title}</Text><Text style={styles.ccSmall}>{p.vertical}</Text><View style={styles.ccProgressTrack}><View style={[styles.ccProgressFill,{width:`${p.progress}%`}]} /></View></View><View><Text style={[styles.ccStatus,{color:p.tone}]}>{p.status}</Text><Text style={styles.ccCount}>{p.progress}%</Text><Text style={styles.ccGold}>View project →</Text></View></Pressable>})}

      <Text style={styles.ccSectionTitle}>Project detail</Text><View style={styles.ccHeadingRow}><View><Text style={styles.ccRowTitle}>{selected.title}</Text><Text style={styles.ccSmall}>{selected.vertical}</Text></View><Text style={[styles.ccStatus,{color:selected.tone}]}>{selected.status}</Text></View><Text style={styles.ccCount}>{selected.progress}% <Text style={styles.ccSmall}>Complete</Text></Text>
      <View accessibilityRole="image" accessibilityLabel="Monthly progress chart April to August" style={styles.ccChart}>{[22,27,31,36,selected.progress].map((v,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`${['April','May','June','July','August'][i]} progress ${v}%`} onPress={()=>toggle(`point${i}`)} style={[styles.ccChartPoint,{height:Math.max(18,v)}]}><Text style={styles.ccTiny}>{v}%</Text><Text style={styles.ccTiny}>{['Apr','May','Jun','Jul','Aug'][i]}</Text></Pressable>)}</View>
      {interactiveRow('next','Next milestone','Enabling works · 28 AUG')}{interactiveRow('budget','Budget variance','−2.4%')}{interactiveRow('open','Open blockers','3')}

      <Text style={styles.ccSectionTitle}>Employee activity</Text><View style={styles.ccHeadingRow}><Text style={styles.ccSmall}>Weekly attendance and work updates</Text><Text style={styles.ccSmall}>186 this week</Text></View>
      <View accessibilityRole="image" accessibilityLabel="Employee activity weekly chart" style={styles.ccBarChart}>{[22,31,28,35,25,20,29].map((v,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={`${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]} activity ${v}`} onPress={()=>toggle(`day${i}`)} style={styles.ccBarSlot}><View style={[styles.ccBar,{height:v}]} /><Text style={styles.ccTiny}>{['M','T','W','T','F','S','S'][i]}</Text></Pressable>)}</View>
      {[['AR','Arjun Mehta','Project Director','8 activities today','On Site'],['PS','Priya Shah','Site Engineer','6 activities today','On Site'],['VK','Vikram Kapur','Planning Manager','4 updates today','Remote']].map(([initials,name,role,activity,where])=><Pressable key={name} accessibilityRole="button" accessibilityLabel={`Open employee ${name}`} onPress={()=>toggle(name)} style={styles.ccEmployee}><Text style={styles.ccAvatar}>{initials}</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>{name}</Text><Text style={styles.ccSmall}>{role}</Text>{detail===name?<Text style={styles.ccDisclosure}>Employee activity detail opened.</Text>:null}</View><Text style={styles.ccSmall}>{activity}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Open location for ${name}`} onPress={()=>toggle(`location${name}`)} style={styles.ccLocation}><Text style={styles.ccPositive}>{where}</Text></Pressable></Pressable>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Open attention items" onPress={()=>toggle('attention')} style={styles.ccAttention}><Text style={styles.ccAttentionIcon}>!</Text><View style={styles.flex}><Text style={styles.ccRowTitle}>3 items need your attention</Text><Text style={styles.ccSmall}>{detail==='attention'?'2 overdue milestones · 1 critical blocker':'Review overdue milestones and blockers'}</Text></View><Text style={styles.ccGold}>Review now →</Text></Pressable>
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
  const [filter, setFilter] = useState<PersonnelFilter>('All personnel');
  const [query, setQuery] = useState('');
  const projectMatches = offlineProject.name.toLowerCase().includes(query.trim().toLowerCase());
  const projectSelected = state.selectedMapProjectId === 'amaravati-solar-commons';
  const employeeSelected = state.selectedEmployeeId === 'dev-employee';
  const devEmployeeMatchesFilter = filter === 'All personnel' || filter === 'Field teams';

  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>WORKFORCE COVERAGE</Text>
      <Text style={styles.title}>Geo Location</Text>
      <Text style={styles.subtitle}>Project coverage and personnel assignment context for management review.</Text>

      <View style={styles.geoCounters}>
        <Counter label="Projects" value="09" />
        <Counter label="Personnel" value="15" />
        <Counter label="Attention" value="02" />
      </View>

      <DemoSearchField accessibilityLabel="Search Geo Location" onChangeText={setQuery} placeholder="Search project coverage" value={query} />

      <View accessibilityRole="tablist" style={styles.filterRow} testID="geo-personnel-filters">
        {personnelFilters.map((item) => {
          const selected = filter === item;
          return (
            <Pressable
              accessibilityLabel={item}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text numberOfLines={2} style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.filterResult}>Showing {filter}</Text>

      <SectionHeading eyebrow="STATE COVERAGE" title="Geo overview" />
      <View style={styles.stateChips}>
        <View style={styles.stateChip}><Text style={styles.stateChipText}>Andhra Pradesh · 4</Text></View>
        <View style={styles.stateChip}><Text style={styles.stateChipText}>Madhya Pradesh · 3</Text></View>
        <View style={styles.stateChip}><Text style={styles.stateChipText}>Maharashtra · 1</Text></View>
      </View>

      <View style={styles.alertRow}>
        <Text style={styles.alertMark}>!</Text>
        <View style={styles.flex}><Text style={styles.cardTitle}>2 assignments need attention</Text><Text style={styles.cardCopy}>Review availability before the next project milestone.</Text></View>
      </View>

      <SectionHeading eyebrow="PROJECT COVERAGE" title="Priority coverage" />
      {projectMatches ? (
        <Pressable
          accessibilityLabel="Select Amaravati Solar Commons"
          accessibilityRole="button"
          accessibilityState={{ selected: projectSelected }}
          onPress={() => onAction({ type: 'select-map-project', projectId: 'amaravati-solar-commons' })}
          style={[styles.coverageCard, projectSelected && styles.selectedCard]}
        >
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Amaravati Solar Commons</Text>
            <Text style={styles.cardCopy}>Andhra Pradesh · Energy & Utilities</Text>
          </View>
          <Text style={styles.coverageCount}>4 assigned</Text>
        </Pressable>
      ) : <Text style={styles.emptyText}>No matching project coverage</Text>}

      {projectMatches && projectSelected ? (
        <>
          <View accessible accessibilityLabel="Demo visual" accessibilityRole="image" style={styles.schematic}>
            <View style={styles.routeOne} />
            <View style={styles.routeTwo} />
            <View style={styles.projectMarker}><Text style={styles.projectMarkerText}>AS</Text></View>
            <View style={styles.employeeMarker}><Text style={styles.employeeMarkerText}>DE</Text></View>
            <View style={styles.managerMarker}><Text style={styles.managerMarkerText}>MM</Text></View>
          </View>
          <Text style={styles.demoVisual}>Demo visual</Text>
          <View style={styles.legend}>
            <LegendItem label="Assigned" tone="assigned" />
            <LegendItem label="Manager" tone="manager" />
            <LegendItem label="Attention" tone="attention" />
            <LegendItem label="Unavailable" tone="unavailable" />
          </View>

          <SectionHeading eyebrow="AMARAVATI" title="Project personnel" />
          {devEmployeeMatchesFilter ? (
            <Pressable
              accessibilityLabel="Select Dev Employee"
              accessibilityRole="button"
              accessibilityState={{ selected: employeeSelected }}
              onPress={() => onAction({ type: 'select-map-employee', employeeId: 'dev-employee' })}
              style={[styles.employeeRow, employeeSelected && styles.selectedCard]}
            >
              <View style={styles.initials}><Text style={styles.initialsText}>DE</Text></View>
              <View style={styles.flex}><Text style={styles.cardTitle}>Dev Employee</Text><Text style={styles.cardCopy}>Field Employee · Assigned</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : <Text style={styles.emptyText}>No personnel match {filter}</Text>}
        </>
      ) : null}

      {projectMatches && employeeSelected && devEmployeeMatchesFilter ? (
        <View style={styles.employeeDetail}>
          <View style={styles.employeeIdentity}>
            <View style={styles.initialsLarge}><Text style={styles.initialsText}>DE</Text></View>
            <View style={styles.flex}><Text style={styles.cardTitle}>Dev Employee</Text><Text style={styles.cardCopy}>Field Employee · Amaravati assignment</Text></View>
          </View>
          <DataRow label="Current work package" value={offlineProject.workPackage} />
          <DataRow label="Assignment status" value="Assigned · Field team" />
          <Text style={styles.activityTitle}>Activity sequence</Text>
          <DataRow label="09:30 AM" value="Commissioning briefing reviewed" />
          <DataRow label="10:42 AM" value="Inverter cabinet field check" />
          <DataRow label="11:02 AM" value={state.fieldUpdateReviewed ? '68% field review recorded' : 'Field review ready'} />
          <DemoAction label="Message Dev Employee" onPress={() => onAction({ type: 'message-map-employee', employeeId: 'dev-employee' })} />
        </View>
      ) : null}
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
  ccPage: { gap: 5 },
  ccGreeting: { color: colors.ink, fontFamily: 'serif', fontSize: 14, fontWeight: '700' },
  ccSmall: { color: '#696760', fontSize: 9, lineHeight: 12 },
  ccTiny: { color: '#77746C', fontSize: 7, lineHeight: 9 },
  ccGold: { color: '#B67B08', fontSize: 9, fontWeight: '800' },
  ccFilterLine: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  ccLive: { color: '#329346', fontSize: 8, fontWeight: '800' },
  ccFilter: { alignItems: 'center', borderColor: '#D8D3C8', borderRadius: 3, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  ccFilterText: { color: '#292824', fontSize: 8, fontWeight: '700' },
  ccSectionTitle: { color: '#171713', fontFamily: 'serif', fontSize: 14, fontWeight: '800', marginTop: 7 },
  ccSnapshot: { backgroundColor: '#151716', borderRadius: 4, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', padding: 7 },
  ccMetric: { alignItems: 'center', borderBottomColor: '#393A37', borderBottomWidth: 1, flexDirection: 'row', gap: 9, minHeight: 58, paddingHorizontal: 9, width: '50%' },
  ccMetricIcon: { borderColor: '#71500A', borderRadius: 12, borderWidth: 1, color: '#C28A13', fontSize: 16, height: 28, lineHeight: 26, textAlign: 'center', width: 28 },
  ccMetricValue: { color: '#F5F0E6', fontFamily: 'serif', fontSize: 17, fontWeight: '800' },
  ccMetricLabel: { color: '#D5D0C7', fontSize: 7, lineHeight: 10 },
  ccSnapshotNote: { color: '#65A875', fontSize: 7, padding: 7 }, ccSnapshotLink: { color: '#D09314', flex: 1, fontSize: 8, padding: 7, textAlign: 'right' },
  ccHealth: { alignItems: 'center', flexDirection: 'row', gap: 28, paddingHorizontal: 45, paddingVertical: 8 },
  ccDonut: { alignItems: 'center', borderColor: '#58A83F', borderLeftColor: '#F39A0A', borderRadius: 35, borderWidth: 9, height: 70, justifyContent: 'center', width: 70 },
  ccDonutNum: { color: '#23221E', fontFamily: 'serif', fontSize: 17, fontWeight: '800' },
  ccHealthRow: { alignItems: 'center', flexDirection: 'row', gap: 7, minHeight: 44 }, ccHealthN: { color: '#25241F', fontSize: 10, fontWeight: '900', width: 18 },
  ccPositive: { color: '#429B59', fontSize: 8, fontWeight: '700' },
  ccHeadingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, ccLines: { borderBottomColor: '#DDD8CE', borderBottomWidth: 1, paddingBottom: 4 },
  ccProgressRow: { alignItems: 'center', flexDirection: 'row', minHeight: 21 }, ccProgressLabel: { color: '#403E38', fontSize: 8, width: 112 },
  ccProgressTrack: { backgroundColor: '#E9E4DA', height: 3, flex: 1, overflow: 'hidden' }, ccProgressFill: { backgroundColor: '#DC8300', height: '100%' }, ccProgressValue: { color: '#24231F', fontSize: 8, fontWeight: '700', textAlign: 'right', width: 30 },
  ccCount: { color: '#292721', fontFamily: 'serif', fontSize: 18, fontWeight: '800' },
  ccRow: { alignItems: 'center', borderBottomColor: '#E5E0D6', borderBottomWidth: 1, flexDirection: 'row', gap: 7, minHeight: 44, paddingVertical: 4 }, ccRowIcon: { alignItems: 'center', width: 18 }, ccRowTitle: { color: '#292721', fontSize: 9, fontWeight: '800', lineHeight: 12 }, ccTrailing: { color: '#4A4841', fontSize: 8 }, ccChevron: { color: '#9A958B', fontSize: 16 }, ccDisclosure: { color: '#A66C00', fontSize: 8, marginTop: 3 },
  ccBlocker: { alignItems: 'center', borderBottomColor: '#E5E0D6', borderBottomWidth: 1, borderLeftColor: '#D74334', borderLeftWidth: 2, flexDirection: 'row', gap: 5, minHeight: 48, paddingHorizontal: 5 }, ccSeverity: { backgroundColor: '#FBE5DF', color: '#C33B2E', fontSize: 7, fontWeight: '900', padding: 3 }, ccAssign: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  ccTimeline: { alignItems: 'flex-start', flexDirection: 'row', minHeight: 48, paddingVertical: 5 }, ccTime: { color: '#696760', fontSize: 7, paddingTop: 3, width: 48 }, ccTimelineDot: { color: '#DE8704', fontSize: 11, width: 22 },
  ccTender: { alignItems: 'center', borderBottomColor: '#E5E0D6', borderBottomWidth: 1, flexDirection: 'row', gap: 8, minHeight: 60, paddingVertical: 5 },
  ccWorkforce: { backgroundColor: '#151716', borderRadius: 5, marginTop: 8, padding: 10 }, ccWorkTitle: { color: '#F4EFE6', fontFamily: 'serif', fontSize: 13, fontWeight: '800' }, ccWorkGrid: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 6 }, ccWorkValue: { color: '#D29A22', fontFamily: 'serif', fontSize: 15, fontWeight: '800' }, ccAttendance: { alignItems: 'center', borderColor: '#389647', borderRadius: 28, borderWidth: 5, height: 56, justifyContent: 'center', marginLeft: 'auto', width: 56 }, ccAttendanceValue: { color: '#EDE9E1', fontSize: 14, fontWeight: '900' }, ccRoles: { flexDirection: 'row', marginTop: 8 }, ccRole: { alignItems: 'center', backgroundColor: '#292B29', flex: 1, justifyContent: 'center', minHeight: 44 },
  ccProject: { alignItems: 'center', borderBottomColor: '#DDD8CE', borderBottomWidth: 1, flexDirection: 'row', gap: 8, minHeight: 74, paddingVertical: 5 }, ccSelected: { backgroundColor: '#FFF6E4', borderColor: '#C88B18', borderWidth: 1 }, ccProjectImage: { alignItems: 'center', backgroundColor: '#D8D0BF', height: 62, justifyContent: 'center', width: 86 }, ccProjectGlyph: { color: '#8A7449', fontSize: 30 }, ccStatus: { fontSize: 8, fontWeight: '900', textAlign: 'right' },
  ccChart: { alignItems: 'flex-end', borderBottomColor: '#C8C2B8', borderBottomWidth: 1, flexDirection: 'row', height: 84, justifyContent: 'space-around' }, ccChartPoint: { alignItems: 'center', borderTopColor: '#D57F00', borderTopWidth: 2, justifyContent: 'space-between', minHeight: 44, width: 45 },
  ccBarChart: { alignItems: 'flex-end', flexDirection: 'row', height: 65, justifyContent: 'space-around' }, ccBarSlot: { alignItems: 'center', justifyContent: 'flex-end', minHeight: 44, width: 36 }, ccBar: { backgroundColor: '#D78000', width: 12 },
  ccEmployee: { alignItems: 'center', borderBottomColor: '#E1DCD2', borderBottomWidth: 1, flexDirection: 'row', gap: 7, minHeight: 48 }, ccAvatar: { backgroundColor: '#343531', borderRadius: 16, color: '#F3EEE4', fontSize: 8, height: 30, lineHeight: 30, textAlign: 'center', width: 30 }, ccLocation: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  ccAttention: { alignItems: 'center', backgroundColor: '#FFF1D7', borderLeftColor: '#D78700', borderLeftWidth: 3, flexDirection: 'row', gap: 8, marginTop: 8, minHeight: 52, paddingHorizontal: 8 }, ccAttentionIcon: { borderColor: '#D78700', borderRadius: 10, borderWidth: 1, color: '#D78700', fontWeight: '900', textAlign: 'center', width: 20 },
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
  summaryLabel: { color: colors.paper, fontSize: 9, fontWeight: '800', lineHeight: 12 },
  sectionHeading: { gap: 2, marginTop: spacing.xs },
  sectionEyebrow: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: .9 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', lineHeight: 23 },
  healthDistribution: { flexDirection: 'row', gap: spacing.xs },
  healthItem: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.sm },
  healthValue: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  verticalList: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm },
  verticalRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 5, paddingVertical: 8 },
  verticalHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  verticalNumber: { color: colors.brass, fontSize: 9, fontWeight: '900', width: 18 },
  verticalTitle: { color: colors.ink, flex: 1, fontSize: 10, fontWeight: '800' },
  verticalProgress: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  slimTrack: { backgroundColor: '#E5E1D9', borderRadius: radii.pill, height: 3, marginLeft: 24, overflow: 'hidden' },
  slimFill: { backgroundColor: colors.brass, height: '100%' },
  splitContext: { flexDirection: 'row', gap: spacing.sm },
  contextBlock: { backgroundColor: colors.statusAttentionSurface, borderRadius: radii.sm, flex: 1, gap: 4, padding: spacing.sm },
  contextDanger: { backgroundColor: colors.statusBlockedSurface },
  contextLabel: { color: colors.amber, fontSize: 8, fontWeight: '900', letterSpacing: .55 },
  contextLabelDanger: { color: colors.danger },
  contextText: { color: colors.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  priorityCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.sm },
  rowBetween: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  meta: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: .55 },
  blockerCard: { backgroundColor: colors.paper, borderColor: colors.line, borderLeftColor: colors.amber, borderLeftWidth: 4, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', lineHeight: 18 },
  cardCopy: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  assigned: { color: colors.moss, fontSize: 13, fontWeight: '900', minHeight: 44, paddingVertical: 13 },
  attentionStrip: { backgroundColor: colors.statusAttentionSurface, borderLeftColor: colors.amber, borderLeftWidth: 4, borderRadius: radii.sm, gap: 4, padding: spacing.sm },
  attentionLabel: { color: colors.amber, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  attentionText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  activityCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  progressValue: { color: colors.brass, fontSize: 22, fontWeight: '900' },
  dataRows: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, paddingHorizontal: spacing.sm },
  dataRow: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3, minHeight: 44, paddingVertical: 8 },
  dataLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .55 },
  dataValue: { color: colors.ink, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  geoCounters: { backgroundColor: '#161817', borderRadius: radii.sm, flexDirection: 'row', overflow: 'hidden' },
  counter: { borderRightColor: '#454946', borderRightWidth: 1, flex: 1, gap: 2, padding: spacing.sm },
  counterValue: { color: colors.brass, fontSize: 22, fontWeight: '900' },
  counterLabel: { color: colors.paper, fontSize: 9, fontWeight: '800' },
  filterRow: { flexDirection: 'row', width: '100%' },
  filter: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 2 },
  filterSelected: { borderBottomColor: colors.brass, borderBottomWidth: 3 },
  filterText: { color: colors.muted, fontSize: 9, fontWeight: '900', textAlign: 'center' },
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
  routeOne: { backgroundColor: '#FFFDF8', height: 24, left: -20, position: 'absolute', top: 72, transform: [{ rotate: '-8deg' }], width: 430 },
  routeTwo: { backgroundColor: '#FFFDF8', height: 20, left: 110, position: 'absolute', top: 96, transform: [{ rotate: '76deg' }], width: 250 },
  projectMarker: { alignItems: 'center', backgroundColor: colors.ink, borderColor: colors.brass, borderRadius: 24, borderWidth: 3, height: 48, justifyContent: 'center', left: 48, position: 'absolute', top: 105, width: 48 },
  projectMarkerText: { color: colors.paper, fontSize: 11, fontWeight: '900' },
  employeeMarker: { alignItems: 'center', backgroundColor: colors.moss, borderRadius: 18, height: 36, justifyContent: 'center', position: 'absolute', right: 68, top: 48, width: 36 },
  employeeMarkerText: { color: colors.paper, fontSize: 9, fontWeight: '900' },
  managerMarker: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: 16, bottom: 34, height: 32, justifyContent: 'center', position: 'absolute', right: 28, width: 32 },
  managerMarkerText: { color: colors.paper, fontSize: 8, fontWeight: '900' },
  demoVisual: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .4, marginTop: -10 },
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
