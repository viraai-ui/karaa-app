import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoProjectDetail } from './DemoProjectDetail';
import { DemoFilterChip, DemoImageFrame, DemoProgressRail, DemoSearchField, DemoStatusPill, DemoSurfaceBackButton } from './OfflineDemoPrimitives';
import { demoProjects, demoSubverticals, demoVerticals, projectForId, subverticalForId, verticalForId, type DemoProject } from './demo-catalog';
import { demoVisualAssets } from './demo-visual-assets';
import type { OfflineDemoAction, OfflineDemoState } from './offline-demo';
import { VerticalDetailPage } from './VerticalDetailPage';
import { SubverticalProjectPage } from './SubverticalProjectPage';
import { subverticalPortfolios, portfolioProjectForId, portfolioForProjectId } from './subvertical-projects';
import { PortfolioProjectDetail } from './PortfolioProjectDetail';
import { dashboardAssets } from './dashboard-assets';

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
    return subverticalPortfolios.some(item => item.id === state.selectedSubverticalId)
      ? <SubverticalProjectPage onAction={onAction} subverticalId={state.selectedSubverticalId} />
      : <SubverticalExplorer onAction={onAction} subverticalId={state.selectedSubverticalId} verticalId={state.selectedVerticalId} />;
  }

  if (state.surface === 'project' && state.selectedProjectId) {
    if (subverticalPortfolios.some(page => page.projects.some(project => project.id === state.selectedProjectId))) {
      return <PortfolioProjectDetail backLabel={state.projectReturnTarget === 'portfolio' ? 'My Portfolio' : undefined} onAction={onAction} project={portfolioProjectForId(state.selectedProjectId)} portfolio={portfolioForProjectId(state.selectedProjectId)} selectedTab={state.selectedProjectDetailTab} />;
    }
    return <DemoProjectDetail onAction={onAction} project={projectForId(state.selectedProjectId)} state={state} />;
  }

  return <RootExplorer onAction={onAction} />;
}

function RootExplorer({ onAction }: { onAction: (action: OfflineDemoAction) => void }) {
  const [query, setQuery] = useState('');
  const visibleVerticals = useMemo(() => {
    const normalizeSearch = (value: string) => value.toLocaleLowerCase().replace(/&/g, ' and ').replace(/\band\b/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return demoVerticals;
    return demoVerticals.filter((vertical) => {
      const subverticals = demoSubverticals.filter((item) => item.verticalId === vertical.id);
      const projects = demoProjects.filter((item) => item.verticalId === vertical.id);
      const searchable = [
        vertical.title,
        vertical.description,
        projectForId(vertical.featuredProjectId).name,
        ...subverticals.flatMap((item) => [item.title, item.description]),
        ...projects.flatMap((item) => [item.name, item.location, item.milestone, item.nextMilestone]),
      ].join(' ');
      return normalizeSearch(searchable).includes(normalizedQuery);
    });
  }, [query]);

  return <View style={styles.dashboard} testID="karaa-home-dashboard">
    <DashboardReveal index={0}><View style={styles.welcome}><Text style={styles.contextDate}>WEDNESDAY · 19 AUGUST</Text><Text style={styles.goodMorning}>Good morning</Text><Text style={styles.welcomeTitle}>Welcome back, Aaryan.</Text><Text style={styles.customerNumber}>CUSTOMER 102984</Text></View></DashboardReveal>
    <DashboardReveal index={1}><View style={styles.headingBlock}><Text style={styles.eyebrow}>EXPLORE KARAA</Text><Text style={styles.powerTitle}>The Power of 9</Text><Text style={styles.powerSubtitle}>Nine connected worlds. One way of progress.</Text></View></DashboardReveal>
    <DashboardReveal index={2}><View style={styles.dashboardSearch}><LineIcon name="search" /><TextInput accessibilityLabel="Search Power of 9" clearButtonMode="while-editing" onChangeText={setQuery} placeholder="Search projects, places or sectors" placeholderTextColor="#77736B" returnKeyType="search" style={styles.searchInput} value={query} />{query ? <Pressable accessibilityLabel="Clear Power of 9 search" accessibilityRole="button" hitSlop={4} onPress={() => setQuery('')} style={styles.searchClear}><Text accessibilityElementsHidden style={styles.searchClearGlyph}>×</Text></Pressable> : null}</View></DashboardReveal>
    <DashboardReveal index={3}><View style={styles.rootGrid}>{visibleVerticals.map((vertical) => <Pressable accessibilityHint={`Power of 9 number ${vertical.number}`} accessibilityLabel={`Open ${vertical.title} vertical`} accessibilityRole="button" key={vertical.id} onPress={() => onAction({ type: 'select-vertical', verticalId: vertical.id })} style={({pressed}) => [styles.verticalCard, pressed && styles.pressed]}>
      <Image accessibilityLabel={`Demo visual: ${vertical.title}`} resizeMode="cover" source={dashboardAssets[vertical.id]} style={styles.verticalPhoto} /><View style={styles.photoShade} /><Text style={styles.verticalNumber}>{vertical.number}</Text><View style={styles.verticalFooter}><Text numberOfLines={2} style={styles.verticalTitle}>{vertical.title}</Text><LineIcon light name="arrow" /></View>
    </Pressable>)}</View></DashboardReveal>
    {visibleVerticals.length === 0 ? <Text accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.empty}>No verticals match this search.</Text> : null}
  </View>;
}

function DashboardReveal({ children, index }: { children: React.ReactNode; index: number }) { const value = useRef(new Animated.Value(0)).current; useEffect(() => { let live = true; AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (!live) return; if (reduced) value.setValue(1); else Animated.timing(value, { delay: Math.min(index * 45, 270), duration: 320, toValue: 1, useNativeDriver: true }).start(); }); return () => { live = false; value.stopAnimation(); }; }, [index, value]); return <Animated.View style={{ opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>{children}</Animated.View>; }
function LineIcon({ name, light = false }: { name: string; light?: boolean }) { return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.iconBox, light && styles.iconBoxLight]}><View style={[styles.iconLine, name === 'close' && styles.iconCross, light && styles.iconLineLight]} />{name !== 'arrow' && name !== 'close' ? <View style={[styles.iconLineSecond, light && styles.iconLineLight]} /> : null}</View>; }
function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.quickItem, pressed && styles.pressed]}><LineIcon name={icon} /><Text numberOfLines={2} style={styles.quickLabel}>{label}</Text></Pressable>; }
function SectionHeading({ title, action, onPress }: { title: string; action: string; onPress: () => void }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable accessibilityLabel={`${action} ${title}`} accessibilityRole="button" hitSlop={8} onPress={onPress} style={({pressed}) => [styles.sectionActionHit, pressed && styles.pressed]}><Text style={styles.sectionAction}>{action}</Text><LineIcon name="arrow" /></Pressable></View>; }
function WatchCard({ image, name, category, progress, onPress }: { image: number; name: string; category: string; progress: number; onPress: () => void }) { return <Pressable accessibilityLabel={`Open ${name} project`} accessibilityRole="button" onPress={onPress} style={({pressed}) => [styles.watchCard, pressed && styles.pressed]}><Image accessibilityLabel={`${name} project view`} resizeMode="cover" source={image} style={styles.watchImage} /><View style={styles.watchBody}><View style={styles.watchCopy}><Text numberOfLines={2} style={styles.watchName}>{name}</Text><Text numberOfLines={1} style={styles.watchCategory}>{category}</Text></View><View style={styles.watchProgress}><View style={styles.progressLine}><Text style={styles.progressValue}>{progress}%</Text><Text style={styles.onTrack}>ON TRACK</Text></View><View style={styles.rail}><View style={[styles.railFill,{width:`${progress}%`}]} /></View><Text numberOfLines={1} style={styles.watchMeta}>Phase 04 · Systems integration</Text></View><LineIcon name="arrow" /></View></Pressable>; }

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
  dashboard: { gap: 16, paddingBottom: 2 },
  welcome: { borderBottomColor: '#DDD7CB', borderBottomWidth: 1, gap: 3, paddingBottom: 16 },
  contextDate: { color: '#706D67', fontSize: 11, fontWeight: '700', letterSpacing: .85 },
  goodMorning: { color: '#625F58', fontSize: 13, lineHeight: 18 },
  welcomeTitle: { color: '#292825', fontFamily: 'serif', fontSize: 28, lineHeight: 33 },
  customerNumber: { color: '#907334', fontSize: 11, fontWeight: '800', letterSpacing: .8, marginTop: 2 },
  headingBlock: { gap: 4 },
  eyebrow: { color: '#907334', fontSize: 11, fontWeight: '900', letterSpacing: 1.15 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  powerTitle: { color: '#292825', fontFamily: 'serif', fontSize: 29, lineHeight: 33 }, powerSubtitle: { color: '#625F58', fontSize: 13, lineHeight: 18 },
  dashboardSearch: { alignItems: 'center', backgroundColor: '#FAF8F2', borderBottomColor: '#BEB7AA', borderBottomWidth: 1, flexDirection: 'row', minHeight: 45, paddingLeft: 4 }, searchInput: { color: '#292A27', flex: 1, fontSize: 13, height: 45, paddingHorizontal: 8 }, searchClear: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, searchClearGlyph: { color: '#77736B', fontSize: 22, lineHeight: 24 },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, verticalCard: { aspectRatio: .85, borderRadius: 5, overflow: 'hidden', position: 'relative', width: '31%' }, verticalPhoto: { height: '100%', width: '100%' }, photoShade: { backgroundColor: 'rgba(27,24,19,.28)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, verticalNumber: { color: '#D8B562', fontSize: 11, fontWeight: '900', left: 9, letterSpacing: .8, position: 'absolute', top: 8 }, verticalFooter: { alignItems: 'flex-end', bottom: 8, flexDirection: 'row', gap: 3, left: 9, position: 'absolute', right: 6 }, verticalTitle: { color: '#FFFCF5', flex: 1, fontSize: 11, fontWeight: '800', lineHeight: 14, textShadowColor: 'rgba(0,0,0,.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 20, lineHeight: 24 }, sectionActionHit: { alignItems: 'center', flexDirection: 'row', minHeight: 44 }, sectionAction: { color: '#80672F', fontSize: 12, fontWeight: '800' },
  watchList: { borderTopColor: '#D7D1C5', borderTopWidth: 1 }, watchCard: { alignItems: 'center', borderBottomColor: '#D7D1C5', borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 104, paddingVertical: 12 }, watchImage: { borderRadius: 3, height: 76, width: 92 }, watchBody: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 }, watchCopy: { flex: 1, gap: 3 }, watchProgress: { gap: 4, width: 82 }, watchName: { color: '#292A27', fontSize: 13, fontWeight: '800', lineHeight: 17 }, watchCategory: { color: '#6B675F', fontSize: 11 }, progressLine: { flexDirection: 'row', justifyContent: 'space-between' }, progressValue: { color: '#292A27', fontSize: 13, fontWeight: '900' }, onTrack: { color: '#80672F', fontSize: 9, fontWeight: '800' }, rail: { backgroundColor: '#DCD6CA', height: 2 }, railFill: { backgroundColor: '#9B7B37', height: 2 }, watchMeta: { color: '#6B675F', fontSize: 10 },
  portfolioCard: { alignItems: 'center', borderBottomColor: '#CFC8BA', borderBottomWidth: 1, borderTopColor: '#CFC8BA', borderTopWidth: 1, flexDirection: 'row', minHeight: 72, paddingVertical: 12 }, portfolioMetric: { flex: 1, gap: 4 }, metricLabel: { color: '#6B675F', fontSize: 10, fontWeight: '800', letterSpacing: .4 }, goldValue: { color: '#725C2A', fontFamily: 'serif', fontSize: 17 }, paymentRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 56, paddingVertical: 8 }, flex: { flex: 1 }, paymentTitle: { color: '#292A27', fontSize: 13, fontWeight: '800' }, paymentDetail: { color: '#6B675F', fontSize: 11, marginTop: 2 },
  latestCard: { backgroundColor: '#F4F0E7', borderRadius: 4, flexDirection: 'row', height: 136, overflow: 'hidden', marginTop: 8 }, latestImage: { height: 136, width: '42%' }, latestCopy: { flex: 1, gap: 5, justifyContent: 'center', padding: 12 }, latestEyebrow: { color: '#80672F', fontSize: 10, fontWeight: '900', letterSpacing: .6 }, latestTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 16, lineHeight: 20 }, latestDetail: { color: '#625F58', fontSize: 11 }, latestMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }, latestDate: { color: '#625F58', fontSize: 11 }, notice: { alignItems: 'center', borderBottomColor: '#CFC8BA', borderBottomWidth: 1, borderTopColor: '#CFC8BA', borderTopWidth: 1, flexDirection: 'row', gap: 10, minHeight: 64, paddingVertical: 10 }, noticeTitle: { color: '#292A27', fontSize: 13, fontWeight: '800' }, noticeText: { color: '#625F58', fontSize: 11, lineHeight: 15, marginTop: 2 }, quickRow: { borderTopColor: '#D7D1C5', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, quickItem: { alignItems: 'center', justifyContent: 'center', minHeight: 72, paddingHorizontal: 3, width: '24%' }, quickLabel: { color: '#292A27', fontSize: 11, lineHeight: 14, marginTop: 5, textAlign: 'center' },
  iconBox: { alignItems: 'center', height: 18, justifyContent: 'center', width: 18 }, iconBoxLight: { height: 14, width: 14 }, iconLine: { borderColor: '#80672F', borderRightWidth: 1.5, borderTopWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }], width: 7 }, iconCross: { borderBottomWidth: 0, borderRightWidth: 1.5, height: 12, transform: [{ rotate: '45deg' }], width: 1 }, iconLineSecond: { borderColor: '#80672F', borderRadius: 8, borderWidth: 1.5, height: 12, position: 'absolute', transform: [{ rotate: '-12deg' }], width: 12 }, iconLineLight: { borderColor: '#F9F3E6' }, pressed: { opacity: .72, transform: [{ scale: .985 }] },
  localPanel: { alignItems: 'flex-start', backgroundColor: '#F4F0E7', borderLeftColor: '#9B7B37', borderLeftWidth: 2, flexDirection: 'row', gap: 12, padding: 12 }, panelEyebrow: { color: '#80672F', fontSize: 10, fontWeight: '900', letterSpacing: .7 }, panelTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 17, marginTop: 2 }, panelText: { color: '#625F58', fontSize: 12, lineHeight: 17, marginTop: 3 }, closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
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
