import { useMemo, useState } from 'react';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoProjectDetail } from './DemoProjectDetail';
import { DemoFilterChip, DemoImageFrame, DemoProgressRail, DemoSearchField, DemoStatusPill, DemoSurfaceBackButton } from './OfflineDemoPrimitives';
import { demoProjects, demoSubverticals, demoVerticals, projectForId, subverticalForId, verticalForId, type DemoProject } from './demo-catalog';
import { demoVisualAssets } from './demo-visual-assets';
import type { OfflineDemoAction, OfflineDemoState } from './offline-demo';

const projectFilters = ['All', 'On track', 'In progress', 'Attention'] as const;
type ProjectFilter = typeof projectFilters[number];

function visualForProject(project: DemoProject) {
  return project.visual === 'hero' ? demoVisualAssets.hero : project.visual === 'inspection' ? demoVisualAssets.inspection : demoVisualAssets.progress;
}

export function DemoExplorer({ state, onAction }: {
  state: OfflineDemoState;
  onAction: (action: OfflineDemoAction) => void;
}): React.ReactElement {
  if (state.surface === 'vertical' && state.selectedVerticalId) {
    return <VerticalExplorer onAction={onAction} verticalId={state.selectedVerticalId} />;
  }

  if (state.surface === 'subvertical' && state.selectedVerticalId && state.selectedSubverticalId) {
    return <SubverticalExplorer onAction={onAction} subverticalId={state.selectedSubverticalId} verticalId={state.selectedVerticalId} />;
  }

  if (state.surface === 'project' && state.selectedProjectId) {
    return <DemoProjectDetail onAction={onAction} project={projectForId(state.selectedProjectId)} state={state} />;
  }

  return <RootExplorer onAction={onAction} />;
}

function RootExplorer({ onAction }: { onAction: (action: OfflineDemoAction) => void }) {
  const [query, setQuery] = useState('');
  const visibleVerticals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return demoVerticals;
    return demoVerticals.filter((vertical) => `${vertical.title} ${vertical.description} ${projectForId(vertical.featuredProjectId).name}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  return <View style={styles.page}>
    <View style={styles.headingBlock}>
      <Text style={styles.eyebrow}>DISCOVER</Text>
      <Text style={styles.title}>Power of 9</Text>
      <Text style={styles.subtitle}>Nine connected verticals, arranged for a quick view of project delivery.</Text>
    </View>
    <DemoSearchField accessibilityLabel="Search Power of 9" onChangeText={setQuery} placeholder="Search verticals" value={query} />
    <View style={styles.rootGrid}>
      {visibleVerticals.map((vertical) => {
        const visual = visualForProject(projectForId(vertical.featuredProjectId));
        return <Pressable accessibilityLabel={`Open ${vertical.title} vertical`} accessibilityRole="button" key={vertical.id} onPress={() => onAction({ type: 'select-vertical', verticalId: vertical.id })} style={styles.verticalCard}>
          <Text style={styles.verticalNumber}>{vertical.number}</Text>
          <DemoImageFrame accessibilityLabel={visual.accessibilityLabel} height={32} source={visual.source} />
          <Text numberOfLines={3} style={styles.verticalTitle}>{vertical.title}</Text>
          <Text style={styles.cardArrow}>→</Text>
        </Pressable>;
      })}
    </View>
    {visibleVerticals.length === 0 ? <Text style={styles.empty}>No verticals match this search.</Text> : null}
  </View>;
}

function VerticalExplorer({ onAction, verticalId }: { onAction: (action: OfflineDemoAction) => void; verticalId: string }) {
  const vertical = verticalForId(verticalId);
  const subverticals = demoSubverticals.filter((subvertical) => subvertical.verticalId === vertical.id);

  return <View style={styles.page}>
    <DemoSurfaceBackButton onPress={() => onAction({ type: 'back-to-root' })} />
    <View style={styles.headingBlock}>
      <Text style={styles.eyebrow}>VERTICAL {vertical.number}</Text>
      <Text style={styles.title}>{vertical.title}</Text>
      <Text style={styles.subtitle}>{vertical.description}</Text>
    </View>
    <View style={styles.recordList}>
      {subverticals.map((subvertical) => {
        const visual = visualForProject(demoProjects.find((project) => project.subverticalId === subvertical.id) ?? projectForId(vertical.featuredProjectId));
        return <Pressable accessibilityLabel={`Open ${subvertical.title} sub-vertical`} accessibilityRole="button" key={subvertical.id} onPress={() => onAction({ type: 'select-subvertical', subverticalId: subvertical.id })} style={styles.subverticalRow}>
          <DemoImageFrame accessibilityLabel={visual.accessibilityLabel} height={66} source={visual.source} width={88} />
          <View style={styles.rowCopy}><Text style={styles.rowTitle}>{subvertical.title}</Text><Text style={styles.rowDescription}>{subvertical.description}</Text></View>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>;
      })}
    </View>
  </View>;
}

function SubverticalExplorer({ onAction, subverticalId, verticalId }: { onAction: (action: OfflineDemoAction) => void; subverticalId: string; verticalId: string }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ProjectFilter>('All');
  const vertical = verticalForId(verticalId);
  const subvertical = subverticalForId(subverticalId);
  const projects = demoProjects.filter((project) => project.verticalId === vertical.id && project.subverticalId === subvertical.id);
  const visibleProjects = projects.filter((project) => {
    const matchesFilter = filter === 'All' || project.status === filter;
    const matchesQuery = `${project.name} ${project.location} ${project.milestone}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  });
  const averageProgress = projects.length ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length) : 0;
  const horizon = projects[0]?.nextMilestone ?? 'No upcoming milestone';

  return <View style={styles.page}>
    <DemoSurfaceBackButton onPress={() => onAction({ type: 'back-to-root' })} />
    <View style={styles.headingBlock}>
      <Text style={styles.eyebrow}>{vertical.title.toUpperCase()}</Text>
      <Text style={styles.title}>{subvertical.title}</Text>
      <Text style={styles.subtitle}>{subvertical.description}</Text>
    </View>
    <View style={styles.aggregateStrip}>
      <AggregateFact label="PROJECTS" value={`${projects.length}`} />
      <AggregateFact label="PROGRESS" value={`${averageProgress}%`} />
      <AggregateFact label="HORIZON" value={horizon} wide />
    </View>
    <DemoSearchField accessibilityLabel="Search projects in sub-vertical" onChangeText={setQuery} placeholder="Search projects" value={query} />
    <View style={styles.filterRow}>
      {projectFilters.map((filterOption) => <DemoFilterChip key={filterOption} label={filterOption} onPress={() => setFilter(filterOption)} selected={filter === filterOption} />)}
    </View>
    <View style={styles.recordList}>
      {visibleProjects.map((project) => <ProjectCard key={project.id} onPress={() => onAction({ type: 'select-project', projectId: project.id })} project={project} />)}
    </View>
    {visibleProjects.length === 0 ? <Text style={styles.empty}>No projects match these filters.</Text> : null}
  </View>;
}

function ProjectCard({ onPress, project }: { onPress: () => void; project: DemoProject }) {
  const visual = visualForProject(project);
  const tone = project.status === 'On track' ? 'positive' : project.status === 'Attention' ? 'danger' : 'attention';

  return <Pressable accessibilityLabel={`Open ${project.name} project`} accessibilityRole="button" onPress={onPress} style={styles.projectCard}>
    <DemoImageFrame accessibilityLabel={visual.accessibilityLabel} height={116} source={visual.source} />
    <View style={styles.projectHeader}><View style={styles.projectNameBlock}><Text style={styles.projectName}>{project.name}</Text><Text style={styles.projectLocation}>⌖ {project.location}</Text></View><DemoStatusPill label={project.status.toUpperCase()} tone={tone} /></View>
    <DemoProgressRail detail={project.milestone} label="CURRENT DELIVERY" progress={project.progress} />
    <Text style={styles.nextMilestone}>NEXT · {project.nextMilestone}</Text>
    <Text style={styles.projectArrow}>Open record →</Text>
  </Pressable>;
}

function AggregateFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <View style={[styles.aggregateFact, wide && styles.aggregateFactWide]}><Text style={styles.aggregateLabel}>{label}</Text><Text numberOfLines={wide ? 2 : 1} style={styles.aggregateValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.md },
  headingBlock: { gap: 5 },
  eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  verticalCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: 4, minHeight: 130, overflow: 'hidden', padding: 6, position: 'relative', width: '31.7%' },
  verticalNumber: { color: colors.brass, fontSize: 11, fontWeight: '900', letterSpacing: .7 },
  verticalTitle: { color: colors.ink, fontSize: 10, fontWeight: '900', lineHeight: 12, paddingRight: 12 },
  cardArrow: { bottom: 5, color: colors.brass, fontSize: 17, fontWeight: '900', position: 'absolute', right: 7 },
  recordList: { borderTopColor: colors.line, borderTopWidth: 1 },
  subverticalRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 94, paddingVertical: spacing.sm },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  rowDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  rowChevron: { color: colors.brass, fontSize: 28, fontWeight: '300' },
  aggregateStrip: { backgroundColor: colors.ink, flexDirection: 'row', flexWrap: 'wrap' },
  aggregateFact: { borderBottomColor: '#565753', borderBottomWidth: 1, borderRightColor: '#565753', borderRightWidth: 1, gap: 3, minHeight: 62, padding: spacing.sm, width: '50%' },
  aggregateFactWide: { borderRightWidth: 0, width: '100%' },
  aggregateLabel: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  aggregateValue: { color: colors.paper, fontSize: 13, fontWeight: '800', lineHeight: 17 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  projectCard: { backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, gap: spacing.sm, paddingBottom: spacing.md, paddingTop: spacing.md },
  projectHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  projectNameBlock: { flex: 1, gap: 3 },
  projectName: { color: colors.ink, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  projectLocation: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  nextMilestone: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: .3 },
  projectArrow: { color: colors.brass, fontSize: 12, fontWeight: '900' },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: spacing.sm },
});
