import { useMemo, useState } from 'react';
import type React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoProjectDetail } from './DemoProjectDetail';
import { DemoFilterChip, DemoImageFrame, DemoProgressRail, DemoSearchField, DemoStatusPill, DemoSurfaceBackButton } from './OfflineDemoPrimitives';
import { demoProjects, demoSubverticals, demoVerticals, projectForId, subverticalForId, verticalForId, type DemoProject } from './demo-catalog';
import { demoVisualAssets } from './demo-visual-assets';
import type { OfflineDemoAction, OfflineDemoState } from './offline-demo';
import { VerticalDetailPage } from './VerticalDetailPage';

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
  const pictures = [
    require('../../assets/demo/amaravati-hero.webp'),
    require('../../assets/demo/amaravati-structure.webp'),
    demoVisualAssets.hero.source,
    require('../../assets/demo/amaravati-pour.webp'),
    require('../../assets/demo/amaravati-finish.webp'),
    demoVisualAssets.progress.source,
    require('../../assets/demo/amaravati-inverter-evidence.webp'),
    demoVisualAssets.inspection.source,
    require('../../assets/demo/amaravati-structure.webp'),
  ];

  return <View style={styles.dashboard} testID="karaa-home-dashboard">
    <View style={styles.welcome}><Text style={styles.goodMorning}>Good morning</Text><Text style={styles.welcomeTitle}>Welcome back, Aaryan.</Text><Text style={styles.customerNumber}>CUSTOMER #102984</Text></View>
    <View style={styles.headingBlock}><Text style={styles.eyebrow}>EXPLORE KARAA</Text><Text style={styles.powerTitle}>The Power of 9</Text><Text style={styles.powerSubtitle}>Nine connected worlds. One way of progress.</Text></View>
    <View style={styles.dashboardSearch}><Text style={styles.searchGlyph}>⌕</Text><TextInput accessibilityLabel="Search Power of 9" onChangeText={setQuery} placeholder="Search projects, places or sectors" placeholderTextColor="#85817A" style={styles.searchInput} value={query} /></View>
    <View style={styles.rootGrid}>{visibleVerticals.map((vertical) => <Pressable accessibilityLabel={`Open ${vertical.title} vertical`} accessibilityRole="button" key={vertical.id} onPress={() => onAction({ type: 'select-vertical', verticalId: vertical.id })} style={styles.verticalCard}>
      <Image accessibilityLabel={`Demo visual: ${vertical.title}`} resizeMode="cover" source={pictures[Number(vertical.number) - 1]} style={styles.verticalPhoto} /><View style={styles.photoShade} /><Text style={styles.verticalNumber}>{vertical.number}</Text><Text numberOfLines={2} style={styles.verticalTitle}>{vertical.title}</Text><Text style={styles.cardArrow}>›</Text>
    </Pressable>)}</View>
    {visibleVerticals.length === 0 ? <Text style={styles.empty}>No verticals match this search.</Text> : null}
    <View style={styles.pager}><View style={styles.pagerActive} /><View style={styles.pagerDot} /><View style={styles.pagerDot} /></View>
    <SectionHeading title="Projects to watch" action="View all  ›" />
    <View style={styles.watchRow}><WatchCard image={demoVisualAssets.progress.source} name="Amaravati Smart Mobility Corridor" category="Infrastructure & Urban Development" progress={68} onPress={() => onAction({ type: 'select-project', projectId: 'amaravati-smart-mobility-corridor' })} /><WatchCard image={demoVisualAssets.hero.source} name="Karaa Solar Energy Park" category="Energy & Utilities" progress={42} onPress={() => onAction({ type: 'select-project', projectId: 'amaravati-solar-commons' })} /></View>
    <Text style={styles.sectionTitle}>My portfolio</Text>
    <View style={styles.portfolioCard}><View style={styles.portfolioMetric}><Text style={styles.goldValue}>2</Text><Text style={styles.darkLabel}>Investments</Text></View><View style={styles.portfolioMetric}><Text style={styles.goldValue}>₹2.4 Cr</Text><Text style={styles.darkLabel}>Portfolio value</Text></View><View style={styles.portfolioMetric}><Text style={styles.goldValue}>18 Sep</Text><Text style={styles.darkLabel}>Next due date</Text></View><Text style={styles.portfolioArrow}>›</Text></View>
    <Pressable accessibilityRole="button" style={styles.paymentRow}><Text style={styles.paymentIcon}>♜</Text><View style={styles.flex}><Text style={styles.paymentTitle}>Riverfront Residences · Tower B</Text><Text style={styles.paymentDetail}>Payment schedule</Text></View><Text style={styles.goldArrow}>›</Text></Pressable>
    <Text style={styles.sectionTitle}>Latest progress</Text>
    <Pressable accessibilityRole="button" style={styles.latestCard}><Image resizeMode="cover" source={demoVisualAssets.progress.source} style={styles.latestImage} /><View style={styles.latestCopy}><Text style={styles.latestEyebrow}>WEEK 17 UPDATE</Text><Text style={styles.latestTitle}>Structural framework reaches the next milestone</Text><Text style={styles.latestDetail}>Riverfront Residences · Tower B</Text><View style={styles.latestMeta}><Text style={styles.latestDate}>◷  12 Aug</Text><Text style={styles.viewUpdate}>View update  →</Text></View></View></Pressable>
    <Pressable accessibilityRole="button" style={styles.notice}><Text style={styles.noticeBell}>♧</Text><View style={styles.flex}><Text style={styles.noticeTitle}>Important notice</Text><Text style={styles.noticeText}>A new project update and document are available.</Text></View><Text style={styles.goldArrow}>›</Text></Pressable>
    <Text style={styles.sectionTitle}>Quick access</Text>
    <View style={styles.quickRow}>{[['▥','Track Progress'],['▤','My Investments'],['▣','Media Gallery'],['♧','Notices']].map(([icon,label]) => <Pressable accessibilityRole="button" key={label} style={styles.quickItem}><Text style={styles.quickIcon}>{icon}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>)}</View>
  </View>;
}

function SectionHeading({ title, action }: { title: string; action: string }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>; }
function WatchCard({ image, name, category, progress, onPress }: { image: number; name: string; category: string; progress: number; onPress: () => void }) { return <Pressable accessibilityLabel={`Open ${name} project`} accessibilityRole="button" onPress={onPress} style={styles.watchCard}><Image resizeMode="cover" source={image} style={styles.watchImage} /><View style={styles.watchBody}><Text numberOfLines={2} style={styles.watchName}>{name}</Text><Text numberOfLines={1} style={styles.watchCategory}>{category}</Text><View style={styles.progressLine}><Text style={styles.progressValue}>{progress}%</Text><Text style={styles.onTrack}>On track</Text></View><View style={styles.rail}><View style={[styles.railFill,{width:`${progress}%`}]} /></View><Text style={styles.watchMeta}>◉ Phase 04 · Systems integration</Text></View></Pressable>; }

function VerticalExplorer({ onAction, verticalId }: { onAction: (action: OfflineDemoAction) => void; verticalId: string }) {
  return <VerticalDetailPage onAction={onAction} verticalId={verticalId} />;
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
  dashboard: { gap: 8, paddingBottom: 10 },
  welcome: { gap: 1 }, goodMorning: { color: colors.muted, fontSize: 10 }, welcomeTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 21, lineHeight: 25 }, customerNumber: { color: colors.brass, fontSize: 7, fontWeight: '800', letterSpacing: .7 },
  headingBlock: { gap: 2 },
  eyebrow: { color: colors.brass, fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  powerTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 26, lineHeight: 29 }, powerSubtitle: { color: colors.muted, fontSize: 10 },
  dashboardSearch: { alignItems: 'center', backgroundColor: '#fff', borderColor: colors.line, borderRadius: 5, borderWidth: 1, flexDirection: 'row', height: 34, paddingHorizontal: 10 }, searchGlyph: { color: '#716D66', fontSize: 17 }, searchInput: { color: colors.ink, flex: 1, fontSize: 10, height: 34, paddingHorizontal: 7 },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, verticalCard: { borderRadius: 5, height: 112, overflow: 'hidden', position: 'relative', width: '32.2%' }, verticalPhoto: { height: '100%', width: '100%' }, photoShade: { backgroundColor: 'rgba(0,0,0,.34)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, verticalNumber: { color: '#D0A64A', fontSize: 10, fontWeight: '800', left: 7, position: 'absolute', top: 6 }, verticalTitle: { bottom: 8, color: '#fff', fontSize: 9, fontWeight: '800', left: 7, lineHeight: 11, paddingRight: 11, position: 'absolute' }, cardArrow: { bottom: 6, color: '#E6BD63', fontSize: 14, position: 'absolute', right: 5 },
  pager: { alignItems: 'center', flexDirection: 'row', gap: 3, height: 10, justifyContent: 'center' }, pagerActive: { backgroundColor: colors.brass, height: 2, width: 17 }, pagerDot: { backgroundColor: '#D8D3CA', borderRadius: 2, height: 3, width: 3 }, sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 15, marginTop: 2 }, sectionAction: { color: colors.brass, fontSize: 8, fontWeight: '700' },
  watchRow: { flexDirection: 'row', gap: 7 }, watchCard: { backgroundColor: '#fff', borderColor: colors.line, borderRadius: 5, borderWidth: 1, overflow: 'hidden', width: '49%' }, watchImage: { height: 85, width: '100%' }, watchBody: { gap: 2, padding: 7 }, watchName: { color: colors.ink, fontSize: 10, fontWeight: '800', lineHeight: 12 }, watchCategory: { color: colors.muted, fontSize: 7 }, progressLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }, progressValue: { color: colors.ink, fontSize: 11, fontWeight: '800' }, onTrack: { color: colors.brass, fontSize: 7 }, rail: { backgroundColor: '#DFDBD2', height: 2 }, railFill: { backgroundColor: colors.brass, height: 2 }, watchMeta: { color: colors.muted, fontSize: 6 },
  portfolioCard: { alignItems: 'center', backgroundColor: '#111210', borderRadius: 5, flexDirection: 'row', minHeight: 58, paddingHorizontal: 10 }, portfolioMetric: { flex: 1, gap: 2 }, goldValue: { color: '#D1A84C', fontFamily: 'serif', fontSize: 15 }, darkLabel: { color: '#F2EEE3', fontSize: 7 }, portfolioArrow: { color: colors.brass, fontSize: 18 }, paymentRow: { alignItems: 'center', backgroundColor: '#fff', borderColor: colors.line, borderRadius: 4, borderWidth: 1, flexDirection: 'row', minHeight: 44, paddingHorizontal: 10 }, paymentIcon: { color: colors.brass, fontSize: 17, marginRight: 9 }, flex: { flex: 1 }, paymentTitle: { color: colors.ink, fontSize: 9, fontWeight: '700' }, paymentDetail: { color: colors.muted, fontSize: 7 }, goldArrow: { color: colors.brass, fontSize: 18 },
  latestCard: { backgroundColor: '#fff', borderColor: colors.line, borderRadius: 5, borderWidth: 1, flexDirection: 'row', height: 112, overflow: 'hidden' }, latestImage: { height: 112, width: '44%' }, latestCopy: { flex: 1, gap: 3, padding: 9 }, latestEyebrow: { color: colors.brass, fontSize: 7, fontWeight: '900', letterSpacing: .5 }, latestTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 13, lineHeight: 16 }, latestDetail: { color: colors.muted, fontSize: 7 }, latestMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }, latestDate: { color: colors.muted, fontSize: 7 }, viewUpdate: { color: colors.brass, fontSize: 7, fontWeight: '700' }, notice: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: colors.line, borderRadius: 5, borderWidth: 1, flexDirection: 'row', minHeight: 50, paddingHorizontal: 10 }, noticeBell: { color: colors.brass, fontSize: 18, marginRight: 9 }, noticeTitle: { color: colors.ink, fontSize: 9, fontWeight: '800' }, noticeText: { color: colors.muted, fontSize: 7 }, quickRow: { flexDirection: 'row', justifyContent: 'space-between' }, quickItem: { alignItems: 'center', justifyContent: 'center', minHeight: 48, width: '24%' }, quickIcon: { color: colors.ink, fontSize: 17 }, quickLabel: { color: colors.ink, fontSize: 7, marginTop: 3, textAlign: 'center' },
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
