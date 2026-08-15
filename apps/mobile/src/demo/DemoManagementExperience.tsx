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
  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>MANAGEMENT INTELLIGENCE</Text>
      <Text style={styles.title}>Command Centre</Text>
      <Text style={styles.subtitle}>Portfolio health, operational attention and accountable next actions.</Text>
      <View accessibilityRole="tablist" style={styles.panelTabs}>
        <PanelTab
          label="Show portfolio intelligence"
          onPress={() => onAction({ type: 'set-management-panel', panel: 'portfolio' })}
          selected={state.selectedManagementPanel === 'portfolio'}
          title="Portfolio"
        />
        <PanelTab
          label="Show operational intelligence"
          onPress={() => onAction({ type: 'set-management-panel', panel: 'operations' })}
          selected={state.selectedManagementPanel === 'operations'}
          title="Operations"
        />
      </View>
      {state.selectedManagementPanel === 'portfolio'
        ? <PortfolioPanel onAction={onAction} state={state} />
        : <OperationsPanel state={state} />}
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
