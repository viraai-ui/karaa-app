import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { OfflineDemoAction } from "./offline-demo";
import {
  subverticalPortfolioForId,
  type PortfolioProject,
  type PortfolioStatus,
  type SubverticalPortfolio,
} from "./subvertical-projects";

const portfolioHeroFade = require("../../assets/subverticals/multi-specialty-hospitals/hero-left-fade.png");

const filters: readonly ("All" | PortfolioStatus)[] = [
  "All",
  "On Track",
  "In Progress",
];

export function SubverticalProjectPage({
  subverticalId,
  onAction,
}: {
  subverticalId: string;
  onAction: (action: OfflineDemoAction) => void;
}): React.ReactElement {
  const data = subverticalPortfolioForId(subverticalId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = useMemo(
    () =>
      data.projects.filter(
        (project) =>
          (filter === "All" || project.status === filter) &&
          `${project.name} ${project.location} ${project.update} ${project.currentMilestone}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [data.projects, filter, query],
  );

  return (
    <SubverticalPortfolioPage
      data={data}
      filter={filter}
      onAction={onAction}
      query={query}
      setFilter={setFilter}
      setQuery={setQuery}
      visible={visible}
    />
  );
}

type PortfolioPageProps = {
  data: SubverticalPortfolio;
  filter: (typeof filters)[number];
  onAction: (action: OfflineDemoAction) => void;
  query: string;
  setFilter: (value: (typeof filters)[number]) => void;
  setQuery: (value: string) => void;
  visible: readonly PortfolioProject[];
};

function LineIcon({ kind }: { kind: "search" | "calendar" }) {
  return (
    <View accessibilityElementsHidden style={[styles.hIcon, kind === "search" && styles.hSearchIcon]}>
      {kind === "search" ? <View style={styles.hSearchHandle} /> : null}
      {kind === "calendar" ? <View style={styles.hCalendarTop} /> : null}
    </View>
  );
}

function SubverticalPortfolioPage({ data, filter, onAction, query, setFilter, setQuery, visible }: PortfolioPageProps) {
  return (
    <View style={styles.hPage} testID={`subvertical-projects-${data.id}`}>
      <Pressable accessibilityLabel={`Back to ${data.verticalTitle}`} accessibilityRole="button"
        onPress={() => onAction({ type: "select-vertical", verticalId: data.verticalId })} style={styles.back}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backLabel}>{data.verticalTitle.toUpperCase()}</Text>
      </Pressable>
      <View style={styles.hHero} testID="portfolio-hero">
        <Image accessibilityLabel={`${data.title} project portfolio`} resizeMode="cover" source={data.hero} style={styles.hHeroImage} testID="portfolio-hero-background" />
        <Image accessible={false} resizeMode="stretch" source={portfolioHeroFade} style={styles.hHeroWash} testID="portfolio-hero-fade" />
        <View style={styles.hHeroCopy}>
          <Text numberOfLines={2} style={styles.hEyebrow}>{data.verticalTitle.toUpperCase()}  /  {data.pathwayNumber}</Text>
          <Text numberOfLines={3} style={styles.hTitle}>{data.title}</Text>
          <Text numberOfLines={3} style={styles.hSubtitle}>{data.subtitle}</Text>
        </View>
      </View>
      <View style={styles.hSummary} testID="portfolio-metrics">
        <Metric value={String(data.projects.length).padStart(2, "0")} label="Projects" large />
        <Metric value={`${Math.round(data.projects.reduce((sum, project) => sum + project.progress, 0) / data.projects.length)}%`} label="Avg. Progress" large />
        <Metric value={data.horizon} label="Horizon" large last />
      </View>
      <View style={styles.hControls}>
        <View style={styles.hSearch}><LineIcon kind="search" /><TextInput accessibilityLabel={`Search ${data.searchCategory}`}
          onChangeText={setQuery} placeholder={data.searchPlaceholder} placeholderTextColor="#89847B" style={styles.hInput} value={query} /></View>
        <View style={styles.hFilters}>{filters.map((item) => <Pressable accessibilityLabel={`Filter ${item}`} accessibilityRole="button"
          accessibilityState={{ selected: filter === item }} key={item} onPress={() => setFilter(item)} style={[styles.hChip, filter === item && styles.hChipActive]}>
          <Text style={[styles.hChipText, filter === item && styles.hChipTextActive]}>{item !== "All" ? "●  " : ""}{item}</Text>
        </Pressable>)}</View>
      </View>
      <View style={styles.hBody}><Text style={styles.hSectionTitle}>Active Projects</Text>
        <View style={styles.hList}>{visible.map(project => <PortfolioProjectCard key={project.id} onAction={onAction} project={project} />)}</View>
        {!visible.length ? <Text style={styles.hEmpty}>No projects match your search and filter.</Text> : null}
      </View>
    </View>
  );
}

function PortfolioProjectCard({ project, onAction }: { project: PortfolioProject; onAction: (action: OfflineDemoAction) => void }) {
  return <View style={styles.hCard} testID={`portfolio-project-${project.id}`}>
    <View style={styles.hSplitRow} testID={`project-split-${project.id}`}>
      <View style={styles.hImageWrap} testID={`project-image-${project.id}`}>
        <Image accessibilityLabel={`${project.name} construction site`} resizeMode="cover" source={project.image} style={styles.hProjectImage} />
      </View>
      <View style={styles.hCardLead} testID={`project-summary-${project.id}`}>
        <Text numberOfLines={1} style={styles.hLocation}>{project.location.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.hProjectName}>{project.name}</Text>
        <Text numberOfLines={1} style={styles.hDescription}>{project.description}</Text>
        <View style={styles.hCompactMetrics}>
          <View style={styles.hProgressMetric}><Text style={styles.hProgress}>{project.progress}%</Text><Text style={styles.hMetricCaption}> COMPLETE</Text></View>
          <View style={styles.hOpeningMetric}><Text style={styles.hOpeningYear}>{project.openingYear}</Text><Text style={styles.hMetricCaption}> TARGET</Text></View>
        </View>
        <View style={styles.hProgressTrack} testID={`project-progress-track-${project.id}`}>
          <View style={[styles.hProgressFill, { width: `${project.progress}%` }]} testID={`project-progress-fill-${project.id}`} />
        </View>
      </View>
    </View>
    <View style={styles.hTimelineWrap} testID={`project-timeline-wrap-${project.id}`}>
      <VerticalMilestoneTimeline stages={project.stages} status={project.status} />
    </View>
    <View style={styles.hFooter} testID={`project-footer-${project.id}`}>
      <Pressable accessibilityLabel={`View full timeline for ${project.name}`} accessibilityRole="button" onPress={() => onAction({ type: "select-project", projectId: project.id })} style={styles.hTimelineTarget}>
        <Text style={styles.hTimelineLink}>Timeline →</Text></Pressable>
    </View>
  </View>;
}

export const PORTFOLIO_TIMELINE_HEIGHT = 176;
export const PORTFOLIO_TIMELINE_NODE_SIZE = 22;

export function currentTimelineFraction(stages: PortfolioProject["stages"]): number {
  const currentIndex = Math.max(0, stages.findIndex(stage => stage.includes(" NOW")));
  return currentIndex / Math.max(1, stages.length - 1);
}

export function timelineRowStep(stageCount: number): number {
  return (PORTFOLIO_TIMELINE_HEIGHT - PORTFOLIO_TIMELINE_NODE_SIZE) / Math.max(1, stageCount - 1);
}

export function timelineConnectorHeight(stageCount: number): number {
  return timelineRowStep(stageCount) - PORTFOLIO_TIMELINE_NODE_SIZE;
}

export function VerticalMilestoneTimeline({ stages, status }: { stages: PortfolioProject["stages"]; status: PortfolioStatus }) {
  const progress = useRef(new Animated.Value(0)).current;
  const fraction = currentTimelineFraction(stages);
  const currentIndex = Math.max(0, stages.findIndex(stage => stage.includes(" NOW")));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!active) return;
      if (reduced) progress.setValue(fraction);
      else Animated.timing(progress, { duration: 650, easing: Easing.out(Easing.cubic), toValue: fraction, useNativeDriver: false }).start();
    });
    return () => { active = false; progress.stopAnimation(); };
  }, [fraction, progress]);
  return <View accessibilityLabel="Project milestone timeline" accessibilityValue={{ max: 1, min: 0, now: fraction }} style={styles.hTimeline} testID="project-timeline">
    {stages.map((stage, index) => {
      const label = stage.replace(" ✓", "").replace(" NOW", "").replace(" Next", "");
      const completed = index < currentIndex;
      const current = index === currentIndex;
      return <Animated.View key={stage} style={[styles.hStage, { opacity: progress.interpolate({ inputRange: [Math.max(0, index / (stages.length - 1) - .08), Math.max(.01, index / (stages.length - 1))], outputRange: [.45, 1], extrapolate: "clamp" }) }]}>
        <View style={[styles.hDot, completed && styles.hDotComplete, current && styles.hDotCurrent]} testID="timeline-node"><Text style={[styles.hNodeText, (completed || current) && styles.hNodeTextActive]}>{completed ? "✓" : index + 1}</Text></View>
        <Text numberOfLines={1} style={[styles.hStageText, (completed || current) && styles.hStageActive]} testID="timeline-stage-text">{label}</Text>
        {current ? <Text style={styles.hStageMarker}>{status === "On Track" ? "ON TRACK" : "IN PROGRESS"}</Text> : null}
        {index < stages.length - 1 ? <View pointerEvents="none" style={[styles.hConnector, {
          height: timelineConnectorHeight(stages.length),
          top: PORTFOLIO_TIMELINE_NODE_SIZE,
        }]} testID="timeline-connector">
          {index < currentIndex ? <Animated.View style={[styles.hConnectorProgress, {
            opacity: progress.interpolate({
              inputRange: [index / (stages.length - 1), (index + 1) / (stages.length - 1)],
              outputRange: [0, 1], extrapolate: "clamp",
            }),
          }]} testID="timeline-connector-progress" /> : null}
        </View> : null}
      </Animated.View>;
    })}
  </View>;
}

function Metric({
  value,
  label,
  last = false,
  large = false,
}: {
  value: string;
  label: string;
  last?: boolean;
  large?: boolean;
}) {
  return (
    <View style={[styles.metric, !last && styles.metricRule]}>
      <Text style={[styles.metricValue, large && styles.hMetricValue]}>{value}</Text>
      <Text style={[styles.metricLabel, large && styles.hMetricLabel]}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F9F7F1",
    marginHorizontal: -16,
    marginTop: -16,
    paddingBottom: 12,
  },
  back: {
    alignItems: "center",
    backgroundColor: "#080908",
    flexDirection: "row",
    height: 44,
    paddingHorizontal: 15,
  },
  backArrow: { color: "#C99B36", fontSize: 23, marginRight: 6 },
  backLabel: {
    color: "#EEE9DF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hero: { height: 159, position: "relative", overflow: "hidden" },
  heroCopy: {
    backgroundColor: "#F7F3E9",
    height: "100%",
    justifyContent: "center",
    paddingLeft: 17,
    paddingRight: 9,
    width: "58%",
    zIndex: 2,
  },
  heroImage: {
    height: "100%",
    position: "absolute",
    right: 0,
    top: 0,
    width: "49%",
  },
  eyebrow: {
    color: "#9F7727",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.65,
    marginBottom: 7,
  },
  title: {
    color: "#25241F",
    fontFamily: "serif",
    fontSize: 22,
    lineHeight: 24,
  },
  subtitle: { color: "#5F5A52", fontSize: 8, lineHeight: 11, marginTop: 6 },
  summary: {
    backgroundColor: "#FFF",
    borderColor: "#DED8CC",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 11,
    marginTop: -10,
    minHeight: 53,
    zIndex: 3,
  },
  metric: { alignItems: "center", flex: 1, justifyContent: "center" },
  metricRule: { borderRightColor: "#E1DBCF", borderRightWidth: 1 },
  metricValue: { color: "#B1842D", fontFamily: "serif", fontSize: 16 },
  metricLabel: { color: "#45423D", fontSize: 7, marginTop: 1 },
  controls: { paddingHorizontal: 11, paddingTop: 10 },
  search: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E3DED4",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    height: 34,
    paddingHorizontal: 8,
  },
  searchIcon: { color: "#88837A", fontSize: 15 },
  input: {
    color: "#25241F",
    flex: 1,
    fontSize: 8,
    height: 34,
    paddingHorizontal: 6,
  },
  filters: { flexDirection: "row", gap: 6, marginTop: 1 },
  chipTarget: { height: 44, justifyContent: "center", minWidth: 44 },
  chip: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E2DCD0",
    borderRadius: 4,
    borderWidth: 1,
    height: 27,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  chipActive: { backgroundColor: "#F6EEDC", borderColor: "#C99B36" },
  chipText: { color: "#55514A", fontSize: 7, fontWeight: "700" },
  chipTextActive: { color: "#A27827" },
  body: { paddingHorizontal: 11, paddingTop: 13 },
  sectionTitle: {
    color: "#272621",
    fontFamily: "serif",
    fontSize: 17,
    marginBottom: 6,
  },
  list: { gap: 8 },
  card: {
    backgroundColor: "#FFF",
    borderColor: "#E1DBCF",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
    padding: 8,
  },
  cardTop: { flexDirection: "row", height: 102 },
  projectImage: { borderRadius: 3, height: 102, width: "44%" },
  cardLead: { flex: 1, paddingLeft: 10, position: "relative" },
  projectName: {
    color: "#24231F",
    fontFamily: "serif",
    fontSize: 14,
    lineHeight: 15,
  },
  location: { color: "#666159", fontSize: 7, marginTop: 2 },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 5,
  },
  progress: { color: "#25241F", fontSize: 17, fontWeight: "700" },
  status: {
    backgroundColor: "#E8F2E7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusProgress: { backgroundColor: "#E8F0F5" },
  statusText: { color: "#4C8651", fontSize: 5, fontWeight: "900" },
  statusProgressText: { color: "#477187" },
  update: { color: "#57534C", fontSize: 7, fontWeight: "700", marginTop: 2 },
  track: { backgroundColor: "#E9E4DA", height: 3, marginTop: 6 },
  fill: { backgroundColor: "#C99128", height: 3 },
  trackValue: {
    alignSelf: "flex-end",
    color: "#777168",
    fontSize: 6,
    marginTop: 2,
  },
  milestone: {
    alignItems: "center",
    borderBottomColor: "#ECE7DE",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 28,
  },
  milestoneIcon: { color: "#B78629", fontSize: 11 },
  milestoneLabel: { color: "#555149", fontSize: 6, marginLeft: 5 },
  milestoneValue: {
    color: "#6B665D",
    fontSize: 6,
    fontWeight: "800",
    marginLeft: "auto",
  },
  timeline: {
    flexDirection: "row",
    height: 47,
    justifyContent: "space-between",
    position: "relative",
  },
  timelineRule: {
    backgroundColor: "#DED8CD",
    height: 1,
    left: "10%",
    position: "absolute",
    right: "10%",
    top: 13,
  },
  stage: { alignItems: "center", flex: 1, zIndex: 2 },
  dot: {
    backgroundColor: "#FFF",
    borderColor: "#C9C3B8",
    borderRadius: 5,
    borderWidth: 1,
    height: 7,
    marginTop: 10,
    width: 7,
  },
  dotActive: { backgroundColor: "#D09B32", borderColor: "#D09B32" },
  stageText: {
    color: "#777168",
    fontSize: 5,
    lineHeight: 7,
    marginTop: 4,
    textAlign: "center",
  },
  stageActive: { color: "#9C7425", fontWeight: "800" },
  cardFooter: {
    alignItems: "center",
    borderTopColor: "#ECE7DE",
    borderTopWidth: 1,
    flexDirection: "row",
    height: 44,
  },
  activity: { alignItems: "center", flexDirection: "row", marginRight: 12 },
  footerIcon: { color: "#B48227", fontSize: 8, marginRight: 4 },
  footerText: { color: "#625E57", fontSize: 5.5 },
  timelineLink: {
    color: "#B17D20",
    fontSize: 6,
    fontWeight: "800",
  },
  timelineTarget: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginLeft: "auto",
  },
  empty: {
    color: "#777168",
    fontSize: 10,
    paddingVertical: 20,
    textAlign: "center",
  },
  hPage: { backgroundColor: "#F8F5EE", marginHorizontal: -16, marginTop: -16, paddingBottom: 24 },
  hHero: { height: 196, overflow: "hidden", position: "relative" },
  hHeroImage: { bottom: 0, height: "100%", left: 0, position: "absolute", right: 0, top: 0, width: "100%" },
  hHeroWash: { bottom: 0, height: "100%", left: 0, position: "absolute", top: 0, width: "82%", zIndex: 1 },
  hHeroCopy: { height: "100%", justifyContent: "center", paddingHorizontal: 18, width: "67%", zIndex: 2 },
  hEyebrow: { color: "#A77A20", fontSize: 10, fontWeight: "900", letterSpacing: .75, marginBottom: 9 },
  hTitle: { color: "#24221D", fontFamily: "serif", fontSize: 23, lineHeight: 27 },
  hSubtitle: { color: "#5D584F", fontSize: 13, lineHeight: 18, marginTop: 8 },
  hSummary: { backgroundColor: "#FFF", borderColor: "#DDD5C7", borderRadius: 10, borderWidth: 1, flexDirection: "row", marginHorizontal: 16, marginTop: -17, minHeight: 70, shadowColor: "#2D281F", shadowOffset: { height: 3, width: 0 }, shadowOpacity: .08, shadowRadius: 8, zIndex: 3 },
  hMetricValue: { fontSize: 20 }, hMetricLabel: { fontSize: 11, marginTop: 3 },
  hControls: { paddingHorizontal: 16, paddingTop: 14 },
  hSearch: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#E0D9CD", borderRadius: 8, borderWidth: 1, flexDirection: "row", height: 44, paddingHorizontal: 12 },
  hInput: { color: "#292721", flex: 1, fontSize: 13, height: 44, paddingHorizontal: 10 },
  hFilters: { flexDirection: "row", gap: 7, marginTop: 8 },
  hChip: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#DED7CB", borderRadius: 8, borderWidth: 1, flex: 1, height: 44, justifyContent: "center", minWidth: 0, paddingHorizontal: 4 },
  hChipActive: { backgroundColor: "#F6ECD8", borderColor: "#C79735" },
  hChipText: { color: "#555047", fontSize: 11, fontWeight: "700" },
  hChipTextActive: { color: "#9E7020" },
  hBody: { paddingHorizontal: 16, paddingTop: 17 },
  hSectionTitle: { color: "#292721", fontFamily: "serif", fontSize: 22, marginBottom: 10 },
  hList: { gap: 14 },
  hCard: { backgroundColor: "#FFF", borderColor: "#DDD5C8", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  hSplitRow: { flexDirection: "row", height: 140, maxHeight: 140, width: "100%" },
  hImageWrap: { borderTopLeftRadius: 13, height: "100%", overflow: "hidden", position: "relative", width: "40%" },
  hProjectImage: { height: "100%", width: "100%" },
  hCardLead: { flex: 1, minWidth: 0, paddingBottom: 10, paddingHorizontal: 12, paddingTop: 10, width: "60%" },
  hProjectName: { color: "#25231E", fontFamily: "serif", fontSize: 18, lineHeight: 20, marginTop: 2 },
  hLocation: { color: "#A27625", fontSize: 8, fontWeight: "800", letterSpacing: .8 },
  hDescription: { color: "#625D54", fontSize: 10, lineHeight: 13, marginTop: 3 },
  hCompactMetrics: { alignItems: "flex-end", flexDirection: "row", marginTop: "auto" },
  hProgressMetric: { alignItems: "baseline", flexDirection: "row" },
  hOpeningMetric: { alignItems: "baseline", flexDirection: "row", marginLeft: "auto" },
  hProgress: { color: "#27251F", fontFamily: "serif", fontSize: 18 },
  hOpeningYear: { color: "#27251F", fontFamily: "serif", fontSize: 14 },
  hMetricCaption: { color: "#777168", fontSize: 7, fontWeight: "700" },
  hProgressTrack: { backgroundColor: "#E8E1D5", height: 2, marginTop: 4, overflow: "hidden", width: "100%" },
  hProgressFill: { backgroundColor: "#C28D2A", height: 2 },
  hTimelineWrap: { borderTopColor: "#E8E1D6", borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  hTimeline: { height: PORTFOLIO_TIMELINE_HEIGHT, justifyContent: "space-between", position: "relative" },
  hStage: { alignItems: "center", flexDirection: "row", height: PORTFOLIO_TIMELINE_NODE_SIZE, paddingLeft: 0, position: "relative" },
  hConnector: { backgroundColor: "#DDD6CA", left: (PORTFOLIO_TIMELINE_NODE_SIZE - 1) / 2, overflow: "hidden", position: "absolute", width: 1 },
  hConnectorProgress: { backgroundColor: "#C28D2A", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  hDot: { alignItems: "center", backgroundColor: "#FFF", borderColor: "#C7C0B5", borderRadius: PORTFOLIO_TIMELINE_NODE_SIZE / 2, borderWidth: 1, height: PORTFOLIO_TIMELINE_NODE_SIZE, justifyContent: "center", width: PORTFOLIO_TIMELINE_NODE_SIZE },
  hDotComplete: { backgroundColor: "#C28D2A", borderColor: "#C28D2A" },
  hDotCurrent: { backgroundColor: "#FFF", borderColor: "#C28D2A", borderWidth: 2 },
  hNodeText: { color: "#908A81", fontSize: 10, fontWeight: "800" }, hNodeTextActive: { color: "#A87720" },
  hStageText: { color: "#777168", flex: 1, fontSize: 12, lineHeight: 16, marginLeft: 12, paddingRight: 8 },
  hStageActive: { color: "#342F28", fontWeight: "700" },
  hStageMarker: { color: "#9C7123", fontSize: 8, fontWeight: "900", letterSpacing: .65, marginLeft: "auto" },
  hFooter: { alignItems: "center", borderTopColor: "#E8E1D6", borderTopWidth: 1, flexDirection: "row", height: 44, paddingHorizontal: 16 },
  hTimelineTarget: { alignItems: "center", flexShrink: 0, height: 44, justifyContent: "center", marginLeft: "auto", minWidth: 82 }, hTimelineLink: { color: "#A8761E", fontSize: 12, fontWeight: "800" },
  hEmpty: { color: "#6D675E", fontSize: 13, paddingVertical: 24, textAlign: "center" },
  hIcon: { borderColor: "#A87A27", borderRadius: 2, borderWidth: 1.2, height: 15, position: "relative", width: 15 },
  hSearchIcon: { borderColor: "#817B72", borderRadius: 8, height: 14, width: 14 }, hSearchHandle: { backgroundColor: "#817B72", height: 1.5, position: "absolute", right: -4, top: 12, transform: [{ rotate: "45deg" }], width: 6 },
  hCalendarTop: { borderBottomColor: "#A87A27", borderBottomWidth: 1, left: 1, position: "absolute", right: 1, top: 4 },
});
