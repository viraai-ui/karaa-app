import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

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

const dashboardDisplayTitles: Record<string, string> = {
  'infrastructure-urban-development': 'Infrastructure & Urban Development',
  'ports-airports-logistics': 'Ports, Airports & Logistics',
  'energy-utilities': 'Energy & Utilities',
  'healthcare-life-sciences': 'Healthcare & Life Sciences',
  'hospitality-tourism-leisure': 'Hospitality, Tourism & Leisure',
  'real-estate-asset-development': 'Real Estate & Asset Development',
  'manufacturing-industrial-solutions': 'Manufacturing & Industrial Solutions',
  'spiritual-renaissance-for-bharat': 'Spiritual Renaissance for Bharat',
  'education-technology-innovation': 'Education, Technology & Innovation',
};

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
    return <DemoProjectDetail backLabel={state.projectReturnTarget === 'dashboard' ? 'Back to Dashboard' : undefined} onAction={onAction} project={projectForId(state.selectedProjectId)} state={state} />;
  }

  return <RootExplorer onAction={onAction} showContinuation={state.activeRole === 'customer' && state.selectedTab === 'power'} />;
}

function RootExplorer({ onAction, showContinuation }: { onAction: (action: OfflineDemoAction) => void; showContinuation: boolean }) {
  return <View style={styles.dashboard} testID="karaa-home-dashboard">
    <DashboardReveal index={0}><View style={styles.headingBlock}><Text style={styles.eyebrow}>EXPLORE KARAA</Text><Text style={styles.powerTitle}>The Power of 9</Text><Text style={styles.powerSubtitle}>One ecosystem. Nine worlds. Infinite possibilities.</Text><View style={styles.goldRule} /></View></DashboardReveal>
    <DashboardReveal index={1}><View style={styles.rootGrid}>{demoVerticals.map((vertical) => <Pressable accessibilityHint={`Power of 9 number ${vertical.number}`} accessibilityLabel={`Open ${vertical.title} vertical`} accessibilityRole="button" key={vertical.id} onPress={() => onAction({ type: 'select-vertical', verticalId: vertical.id })} style={({pressed}) => [styles.verticalCard, pressed && styles.pressed]}>
      <View style={styles.photoFrame}><Image accessibilityLabel={`Demo visual: ${vertical.title}`} resizeMode="cover" source={dashboardAssets[vertical.id]} style={styles.verticalPhoto} /><Text style={styles.verticalNumber}>{vertical.number}</Text><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.arrowButton}><View style={styles.cardArrowShaft} /><View style={styles.cardArrowHead} /></View></View><View style={styles.verticalFooter}><Text numberOfLines={2} style={styles.verticalTitle}>{dashboardDisplayTitles[vertical.id] ?? vertical.title}</Text></View>
    </Pressable>)}</View></DashboardReveal>
    {showContinuation ? <DashboardContinuation onAction={onAction} /> : null}
  </View>;
}

const watchProjects = [
  { category: 'Infrastructure & Urban Development', id: 'amaravati-smart-mobility-corridor', image: require('../../assets/dashboard/continuation/amaravati-smart-mobility-corridor.webp'), meta: 'Station access alignment', name: 'Amaravati Smart Mobility Corridor', progress: 54 },
  { category: 'Energy & Utilities', id: 'amaravati-solar-commons', image: require('../../assets/dashboard/continuation/amaravati-solar-commons.webp'), meta: 'Inverter row commissioning', name: 'Amaravati Solar Commons', progress: 65 },
] as const;

function GoldArrow() { return <Text style={styles.goldArrow}>→</Text>; }
function DashboardContinuation({ onAction }: { onAction: (action: OfflineDemoAction) => void }) {
  const openProject = (projectId: string, tab: OfflineDemoState['selectedProjectDetailTab'] = 'timeline') => onAction({ type: 'open-dashboard-project', projectId, tab });
  return <View style={styles.continuation} testID="customer-dashboard-continuation">
    <SectionHeading action="View all" onPress={() => onAction({ type: 'select-vertical', verticalId: 'infrastructure-urban-development' })} title="Projects to watch" />
    <View style={styles.watchGrid}>{watchProjects.map((project) => <Pressable accessibilityLabel={`Open ${project.name} project`} accessibilityRole="button" key={project.id} onPress={() => openProject(project.id)} style={({pressed}) => [styles.watchTile, pressed && styles.pressed]}>
      <Image accessibilityLabel={`${project.name} project view`} source={project.image} style={styles.watchTileImage} />
      <View style={styles.watchTileBody}><Text numberOfLines={2} style={styles.watchTileTitle}>{project.name}</Text><Text numberOfLines={1} style={styles.watchTileCategory}>{project.category}</Text><View style={styles.watchTileBottom}><View style={styles.watchStatusRow}><Text style={styles.watchTilePercent}>{project.progress}%</Text><Text style={styles.statusDot}>●</Text><Text style={styles.watchOnTrack}>On track</Text></View><View accessible accessibilityLabel={`${project.name} progress: ${project.progress}%`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: project.progress }} style={styles.watchRail}><View style={[styles.watchRailFill, { width: `${project.progress}%` }]} /></View><Text numberOfLines={1} style={styles.watchTileMeta}>◷  {project.meta}</Text></View></View>
    </Pressable>)}</View>
    <Text style={styles.sectionTitle}>My Portfolio</Text>
    <Pressable accessibilityLabel="Open My Portfolio" accessibilityRole="button" onPress={() => onAction({ type: 'select-tab', tab: 'portfolio' })} style={({pressed}) => [styles.portfolioPanel, pressed && styles.pressed]}>
      <View style={styles.portfolioSummary}><View style={styles.summaryCell}><Text style={styles.summaryValue}>1</Text><Text style={styles.summaryLabel}>Investment</Text></View><View style={styles.summaryDivider} /><View style={styles.summaryCell}><Text style={styles.summaryValue}>₹ —</Text><Text style={styles.summaryLabel}>Portfolio value</Text></View><View style={styles.summaryDivider} /><View style={styles.summaryCell}><Text style={styles.summaryValue}>18 Sep</Text><Text style={styles.summaryLabel}>Next due date</Text></View></View>
      <View style={styles.portfolioProject}><View style={styles.buildingBadge}><Text style={styles.buildingGlyph}>▥</Text></View><View style={styles.flex}><Text style={styles.portfolioProjectTitle}>Aarohan Medical City</Text><Text style={styles.portfolioProjectDetail}>Project timeline</Text></View><GoldArrow /></View>
    </Pressable>
    <SectionHeading action="View all" onPress={() => openProject('amaravati-smart-mobility-corridor')} title="Latest Progress" />
    <View style={styles.progressCard}>
      <Pressable accessibilityLabel="Open Amaravati Smart Mobility Corridor latest progress" accessibilityRole="button" onPress={() => openProject('amaravati-smart-mobility-corridor')} style={({pressed}) => pressed && styles.pressed}>
        <View style={styles.progressTop}><Image accessibilityLabel="Construction structural framework progress" source={require('../../assets/portfolio/aarohan-medical-city-progress.webp')} style={styles.progressPhoto} /><View style={styles.progressCopy}><Text style={styles.progressEyebrow}>LIVE SITE UPDATE</Text><Text style={styles.progressHeadline}>Structural framework reaches the next milestone</Text><Text style={styles.progressProject}>Amaravati Smart Mobility Corridor</Text><Text style={styles.progressTimestamp}>◷  Today  ·  10:42 AM  ·  ✓ Verified on site</Text><View style={styles.fieldRow}><Text style={styles.fieldTeam}>Field Team</Text><Text style={styles.updateLink}>View update  →</Text></View></View></View>
      </Pressable>
      <Pressable accessibilityLabel="Open Amaravati Smart Mobility Corridor important notice" accessibilityRole="button" onPress={() => openProject('amaravati-smart-mobility-corridor', 'documents')} style={({pressed}) => [styles.noticeRow, pressed && styles.pressed]}><Text style={styles.noticeBell}>♧</Text><View style={styles.flex}><Text style={styles.latestNoticeTitle}>Important notice</Text><Text style={styles.latestNoticeText}>A new project update and document are available.</Text></View><Text style={styles.noticeChevron}>›</Text></Pressable>
    </View>
    <Text style={styles.sectionTitle}>Quick Access</Text>
    <View style={styles.quickGrid}>{([['▥','Track Progress','timeline'],['⚑','Milestones','timeline'],['▧','Media Gallery','media'],['♧','Notices','documents']] as const).map(([icon,label,tab]) => <Pressable accessibilityLabel={`Open ${label} for Amaravati Smart Mobility Corridor`} accessibilityRole="button" key={label} onPress={() => openProject('amaravati-smart-mobility-corridor', tab)} style={({pressed}) => [styles.quickControl, pressed && styles.pressed]}><Text style={[styles.quickGlyph, label === 'Track Progress' && styles.quickGlyphGold]}>{icon}</Text><Text style={styles.quickControlLabel}>{label}</Text></Pressable>)}</View>
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
  dashboard: { gap: 14, paddingBottom: 4 },
  welcome: { borderBottomColor: '#DDD7CB', borderBottomWidth: 1, gap: 3, paddingBottom: 16 },
  contextDate: { color: '#706D67', fontSize: 11, fontWeight: '700', letterSpacing: .85 },
  goodMorning: { color: '#625F58', fontSize: 13, lineHeight: 18 },
  welcomeTitle: { color: '#292825', fontFamily: 'serif', fontSize: 28, lineHeight: 33 },
  customerNumber: { color: '#907334', fontSize: 11, fontWeight: '800', letterSpacing: .8, marginTop: 2 },
  headingBlock: { gap: 4, paddingTop: 3 },
  eyebrow: { color: '#B18A2C', fontSize: 10, fontWeight: '700', letterSpacing: 1.9 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  powerTitle: { color: '#080808', fontFamily: 'serif', fontSize: 37, fontWeight: '700', letterSpacing: -.8, lineHeight: 43 }, powerSubtitle: { color: '#4B4B4B', fontSize: 13, lineHeight: 18 }, goldRule: { backgroundColor: '#B68B24', height: 2, marginTop: 7, width: 25 },
  dashboardSearch: { alignItems: 'center', backgroundColor: '#FAF8F2', borderBottomColor: '#BEB7AA', borderBottomWidth: 1, flexDirection: 'row', minHeight: 45, paddingLeft: 4 }, searchInput: { color: '#292A27', flex: 1, fontSize: 13, height: 45, paddingHorizontal: 8 }, searchClear: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, searchClearGlyph: { color: '#77736B', fontSize: 22, lineHeight: 24 },
  rootGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, verticalCard: { backgroundColor: '#FFFFFF', borderColor: '#E9E9E9', borderRadius: 11, borderWidth: 1, overflow: 'hidden', width: '31%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: .09, shadowRadius: 4, elevation: 2 }, photoFrame: { aspectRatio: .84, overflow: 'hidden', position: 'relative', width: '100%' }, verticalPhoto: { height: '100%', width: '100%' }, verticalNumber: { color: '#AE8629', fontSize: 9, fontWeight: '500', left: 7, letterSpacing: .3, position: 'absolute', top: 7 }, arrowButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, bottom: 7, height: 29, justifyContent: 'center', position: 'absolute', right: 7, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:.16, shadowRadius:3, width: 29 }, cardArrowShaft: { backgroundColor: '#B28929', height: 1.5, width: 12 }, cardArrowHead: { borderRightColor: '#B28929', borderRightWidth: 1.5, borderTopColor: '#B28929', borderTopWidth: 1.5, height: 6, position: 'absolute', right: 8, transform: [{ rotate: '45deg' }], width: 6 }, verticalFooter: { backgroundColor: '#FFFFFF', justifyContent: 'center', minHeight: 49, paddingHorizontal: 7, paddingVertical: 6 }, verticalTitle: { color: '#111111', fontSize: 9.2, fontWeight: '500', lineHeight: 11.5 }, scrollPrompt: { alignItems: 'center', gap: 1, marginTop: -3 }, doubleChevron: { height: 19, position: 'relative', width: 22 }, chevronLine: { backgroundColor: '#B68B24', height: 1.5, position: 'absolute', width: 9 }, chevronLeft: { left: 3, top: 4, transform: [{ rotate: '35deg' }] }, chevronRight: { right: 3, top: 4, transform: [{ rotate: '-35deg' }] }, chevronLeftLower: { left: 3, top: 10, transform: [{ rotate: '35deg' }] }, chevronRightLower: { right: 3, top: 10, transform: [{ rotate: '-35deg' }] }, scrollLabel: { color: '#4A4A4A', fontSize: 9, letterSpacing: 2 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, sectionTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 20, lineHeight: 24 }, sectionActionHit: { alignItems: 'center', flexDirection: 'row', minHeight: 44 }, sectionAction: { color: '#80672F', fontSize: 12, fontWeight: '800' },
  watchList: { borderTopColor: '#D7D1C5', borderTopWidth: 1 }, watchCard: { alignItems: 'center', borderBottomColor: '#D7D1C5', borderBottomWidth: 1, flexDirection: 'row', gap: 12, minHeight: 104, paddingVertical: 12 }, watchImage: { borderRadius: 3, height: 76, width: 92 }, watchBody: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 }, watchCopy: { flex: 1, gap: 3 }, watchProgress: { gap: 4, width: 82 }, watchName: { color: '#292A27', fontSize: 13, fontWeight: '800', lineHeight: 17 }, watchCategory: { color: '#6B675F', fontSize: 11 }, progressLine: { flexDirection: 'row', justifyContent: 'space-between' }, progressValue: { color: '#292A27', fontSize: 13, fontWeight: '900' }, onTrack: { color: '#80672F', fontSize: 9, fontWeight: '800' }, rail: { backgroundColor: '#DCD6CA', height: 2 }, railFill: { backgroundColor: '#9B7B37', height: 2 }, watchMeta: { color: '#6B675F', fontSize: 10 },
  portfolioCard: { alignItems: 'center', borderBottomColor: '#CFC8BA', borderBottomWidth: 1, borderTopColor: '#CFC8BA', borderTopWidth: 1, flexDirection: 'row', minHeight: 72, paddingVertical: 12 }, portfolioMetric: { flex: 1, gap: 4 }, metricLabel: { color: '#6B675F', fontSize: 10, fontWeight: '800', letterSpacing: .4 }, goldValue: { color: '#725C2A', fontFamily: 'serif', fontSize: 17 }, paymentRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 56, paddingVertical: 8 }, flex: { flex: 1 }, paymentTitle: { color: '#292A27', fontSize: 13, fontWeight: '800' }, paymentDetail: { color: '#6B675F', fontSize: 11, marginTop: 2 },
  latestCard: { backgroundColor: '#F4F0E7', borderRadius: 4, flexDirection: 'row', height: 136, overflow: 'hidden', marginTop: 8 }, latestImage: { height: 136, width: '42%' }, latestCopy: { flex: 1, gap: 5, justifyContent: 'center', padding: 12 }, latestEyebrow: { color: '#80672F', fontSize: 10, fontWeight: '900', letterSpacing: .6 }, latestTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 16, lineHeight: 20 }, latestDetail: { color: '#625F58', fontSize: 11 }, latestMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }, latestDate: { color: '#625F58', fontSize: 11 }, notice: { alignItems: 'center', borderBottomColor: '#CFC8BA', borderBottomWidth: 1, borderTopColor: '#CFC8BA', borderTopWidth: 1, flexDirection: 'row', gap: 10, minHeight: 64, paddingVertical: 10 }, noticeTitle: { color: '#292A27', fontSize: 13, fontWeight: '800' }, noticeText: { color: '#625F58', fontSize: 11, lineHeight: 15, marginTop: 2 }, quickRow: { borderTopColor: '#D7D1C5', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, quickItem: { alignItems: 'center', justifyContent: 'center', minHeight: 72, paddingHorizontal: 3, width: '24%' }, quickLabel: { color: '#292A27', fontSize: 11, lineHeight: 14, marginTop: 5, textAlign: 'center' },
  iconBox: { alignItems: 'center', height: 18, justifyContent: 'center', width: 18 }, iconBoxLight: { height: 14, width: 14 }, iconLine: { borderColor: '#80672F', borderRightWidth: 1.5, borderTopWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }], width: 7 }, iconCross: { borderBottomWidth: 0, borderRightWidth: 1.5, height: 12, transform: [{ rotate: '45deg' }], width: 1 }, iconLineSecond: { borderColor: '#80672F', borderRadius: 8, borderWidth: 1.5, height: 12, position: 'absolute', transform: [{ rotate: '-12deg' }], width: 12 }, iconLineLight: { borderColor: '#F9F3E6' }, pressed: { opacity: .72, transform: [{ scale: .985 }] },
  continuation: { gap: 14, paddingTop: 4 }, transition: { alignItems: 'center', gap: 8, paddingBottom: 6 }, transitionRule: { backgroundColor: '#B98A20', height: 2, width: 17 }, transitionText: { color: '#77736D', fontSize: 8, letterSpacing: 1.7 }, goldArrow: { color: '#B48720', fontSize: 22 }, watchGrid: { flexDirection: 'row', gap: 8 }, watchTile: { backgroundColor: '#FFF', borderColor: '#E5E3DF', borderRadius: 8, borderWidth: 1, flex: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:.06, shadowRadius:5 }, watchTileImage: { height: 82, width: '100%' }, watchTileBody: { flex: 1, gap: 3, minHeight: 106, padding: 8 }, watchTileTitle: { color: '#171717', fontSize: 11, fontWeight: '500', lineHeight: 14, minHeight: 28 }, watchTileCategory: { color: '#77736D', fontSize: 8.5 }, watchTileBottom: { marginTop: 'auto' }, watchStatusRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 4 }, watchTilePercent: { color: '#111', fontSize: 17 }, statusDot: { color: '#C58E17', fontSize: 8 }, watchOnTrack: { color: '#917127', fontSize: 8.5 }, watchRail: { backgroundColor: '#ECECEB', borderRadius: 2, height: 3, marginVertical: 3, overflow: 'hidden' }, watchRailFill: { backgroundColor: '#C08B17', borderRadius: 2, height: 3 }, watchTileMeta: { color: '#77736D', fontSize: 8 }, portfolioPanel: { backgroundColor: '#FFF', borderColor: '#E5E3DF', borderRadius: 8, borderWidth: 1, overflow: 'hidden' }, portfolioSummary: { alignItems: 'center', flexDirection: 'row', height: 58 }, summaryCell: { alignItems: 'center', flex: 1, gap: 4 }, summaryDivider: { backgroundColor: '#E6E3DD', height: 31, width: 1 }, summaryValue: { color: '#B0811D', fontFamily: 'serif', fontSize: 17 }, summaryLabel: { color: '#77736D', fontSize: 9 }, portfolioProject: { alignItems: 'center', borderTopColor: '#E8E5DF', borderTopWidth: 1, flexDirection: 'row', gap: 10, minHeight: 50, paddingHorizontal: 12 }, buildingBadge: { alignItems: 'center', backgroundColor: '#F6F4EF', borderRadius: 7, height: 35, justifyContent: 'center', width: 35 }, buildingGlyph: { color: '#171717', fontSize: 23 }, portfolioProjectTitle: { color: '#171717', fontSize: 12, fontWeight: '500' }, portfolioProjectDetail: { color: '#77736D', fontSize: 9, marginTop: 2 }, progressCard: { backgroundColor: '#FFF', borderColor: '#E5E3DF', borderRadius: 8, borderWidth: 1, overflow: 'hidden' }, progressTop: { flexDirection: 'row', height: 122 }, progressPhoto: { width: '51%' }, progressCopy: { flex: 1, gap: 4, padding: 9 }, progressEyebrow: { color: '#B0811D', fontSize: 8, letterSpacing: .8 }, progressHeadline: { color: '#171717', fontFamily: 'serif', fontSize: 13, lineHeight: 15 }, progressProject: { color: '#77736D', fontSize: 8.5 }, progressTimestamp: { color: '#77736D', fontSize: 7.5, marginTop: 2 }, fieldRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }, fieldTeam: { color: '#77736D', fontSize: 8 }, updateLink: { color: '#B0811D', fontSize: 8 }, noticeRow: { alignItems: 'center', borderTopColor: '#E5E3DF', borderTopWidth: 1, flexDirection: 'row', gap: 9, minHeight: 47, paddingHorizontal: 14 }, noticeBell: { color: '#B0811D', fontSize: 22 }, latestNoticeTitle: { color: '#171717', fontSize: 10, fontWeight: '500' }, latestNoticeText: { color: '#67645F', fontSize: 8.5 }, noticeChevron: { color: '#B0811D', fontSize: 24 }, quickGrid: { flexDirection: 'row', gap: 8 }, quickControl: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E5E3DF', borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 62, shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:.04, shadowRadius:4 }, quickGlyph: { color: '#171717', fontSize: 24 }, quickGlyphGold: { color: '#B0811D' }, quickControlLabel: { color: '#171717', fontSize: 8.5, marginTop: 3, textAlign: 'center' },
  localPanel: { alignItems: 'flex-start', backgroundColor: '#F4F0E7', borderLeftColor: '#9B7B37', borderLeftWidth: 2, flexDirection: 'row', gap: 12, padding: 12 }, panelEyebrow: { color: '#80672F', fontSize: 10, fontWeight: '900', letterSpacing: .7 }, panelTitle: { color: '#292A27', fontFamily: 'serif', fontSize: 17, marginTop: 2 }, panelText: { color: '#625F58', fontSize: 12, lineHeight: 17, marginTop: 3 }, closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  recordList: { borderTopColor: colors.line, borderTopWidth: 1 },
  subverticalRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 94, paddingVertical: spacing.sm },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  rowDescription: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  rowChevron: { color: colors.brass, fontSize: 28, fontWeight: '300' },
  aggregateStrip: { backgroundColor: '#FFFFFF', borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap' },
  aggregateFact: { borderBottomColor: '#565753', borderBottomWidth: 1, borderRightColor: '#565753', borderRightWidth: 1, gap: 3, minHeight: 62, padding: spacing.sm, width: '50%' },
  aggregateFactWide: { borderRightWidth: 0, width: '100%' },
  aggregateLabel: { color: colors.brass, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  aggregateValue: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 17 },
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
