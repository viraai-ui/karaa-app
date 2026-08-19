import { useMemo, useState } from "react";
import type React from "react";
import {
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
  const average = Math.round(
    data.projects.reduce((sum, p) => sum + p.progress, 0) /
      data.projects.length,
  );
  if (data.id === "multi-specialty-hospitals") {
    return (
      <HospitalPortfolioPage
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
  return (
    <View style={styles.page} testID={`subvertical-projects-${data.id}`}>
      <Pressable
        accessibilityLabel={`Back to ${data.verticalTitle}`}
        accessibilityRole="button"
        hitSlop={{ bottom: 1, top: 1 }}
        onPress={() =>
          onAction({ type: "select-vertical", verticalId: data.verticalId })
        }
        style={styles.back}
      >
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backLabel}>{data.verticalTitle.toUpperCase()}</Text>
      </Pressable>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>
            {data.verticalTitle.toUpperCase()} / {data.pathwayNumber}
          </Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>
        </View>
        <Image
          accessibilityLabel={`${data.title} projects`}
          resizeMode="cover"
          source={data.hero}
          style={styles.heroImage}
        />
      </View>
      <View style={styles.summary}>
        <Metric value="03" label="Projects" />
        <Metric value={`${average}%`} label="Average Progress" />
        <Metric value={data.horizon} label="Horizon" last />
      </View>
      <View style={styles.controls}>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel={`Search ${data.searchCategory}`}
            onChangeText={setQuery}
            placeholder={data.searchPlaceholder}
            placeholderTextColor="#8A867E"
            style={styles.input}
            value={query}
          />
        </View>
        <View style={styles.filters}>
          {filters.map((item) => (
            <Pressable
              accessibilityLabel={`Filter ${item}`}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              key={item}
              onPress={() => setFilter(item)}
              style={styles.chipTarget}
            >
              <View style={[styles.chip, filter === item && styles.chipActive]}>
                <Text
                  style={[
                    styles.chipText,
                    filter === item && styles.chipTextActive,
                  ]}
                >
                  {item === "On Track"
                    ? "●  "
                    : item === "In Progress"
                      ? "■  "
                      : ""}
                  {item}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Active Projects</Text>
        <View style={styles.list}>
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} onAction={onAction} />
          ))}
        </View>
        {visible.length === 0 ? (
          <Text style={styles.empty}>
            No projects match your search and filter.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

type HospitalPageProps = {
  data: SubverticalPortfolio;
  filter: (typeof filters)[number];
  onAction: (action: OfflineDemoAction) => void;
  query: string;
  setFilter: (value: (typeof filters)[number]) => void;
  setQuery: (value: string) => void;
  visible: readonly PortfolioProject[];
};

function LineIcon({ kind }: { kind: "search" | "building" | "check" | "calendar" | "arrow" | "timeline" }) {
  return (
    <View accessibilityElementsHidden style={[styles.hIcon, kind === "search" && styles.hSearchIcon]}>
      {kind === "search" ? <View style={styles.hSearchHandle} /> : null}
      {kind === "building" ? <><View style={styles.hWindow} /><View style={[styles.hWindow, styles.hWindowRight]} /></> : null}
      {kind === "check" ? <Text style={styles.hCheck}>✓</Text> : null}
      {kind === "calendar" ? <View style={styles.hCalendarTop} /> : null}
      {kind === "arrow" ? <Text style={styles.hArrow}>→</Text> : null}
      {kind === "timeline" ? <View style={styles.hTimelineDot} /> : null}
    </View>
  );
}

function HospitalPortfolioPage({ data, filter, onAction, query, setFilter, setQuery, visible }: HospitalPageProps) {
  return (
    <View style={styles.hPage} testID={`subvertical-projects-${data.id}`}>
      <Pressable accessibilityLabel={`Back to ${data.verticalTitle}`} accessibilityRole="button"
        onPress={() => onAction({ type: "select-vertical", verticalId: data.verticalId })} style={styles.back}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backLabel}>{data.verticalTitle.toUpperCase()}</Text>
      </Pressable>
      <View style={styles.hHero} testID="hospital-hero">
        <Image accessibilityLabel="Hospital construction site" resizeMode="cover" source={data.hero} style={styles.hHeroImage} />
        <View style={styles.hHeroWash} />
        <View style={styles.hHeroCopy}>
          <Text style={styles.hEyebrow}>HEALTHCARE &amp; LIFE SCIENCES  /  01</Text>
          <Text style={styles.hTitle}>Multi-Specialty Hospitals</Text>
          <Text style={styles.hSubtitle}>Track every hospital from construction to opening.</Text>
        </View>
      </View>
      <View style={styles.hSummary} testID="hospital-metrics">
        <Metric value={String(data.projects.length).padStart(2, "0")} label="Projects" large />
        <Metric value={`${Math.round(data.projects.reduce((sum, project) => sum + project.progress, 0) / data.projects.length)}%`} label="Avg. Progress" large />
        <Metric value={data.horizon} label="Horizon" large last />
      </View>
      <View style={styles.hControls}>
        <View style={styles.hSearch}><LineIcon kind="search" /><TextInput accessibilityLabel="Search hospitals"
          onChangeText={setQuery} placeholder="Search hospitals" placeholderTextColor="#89847B" style={styles.hInput} value={query} /></View>
        <View style={styles.hFilters}>{filters.map((item) => <Pressable accessibilityLabel={`Filter ${item}`} accessibilityRole="button"
          accessibilityState={{ selected: filter === item }} key={item} onPress={() => setFilter(item)} style={[styles.hChip, filter === item && styles.hChipActive]}>
          <Text style={[styles.hChipText, filter === item && styles.hChipTextActive]}>{item !== "All" ? "●  " : ""}{item}</Text>
        </Pressable>)}</View>
      </View>
      <View style={styles.hBody}><Text style={styles.hSectionTitle}>Active Projects</Text>
        <View style={styles.hList}>{visible.map(project => <HospitalProjectCard key={project.id} onAction={onAction} project={project} />)}</View>
        {!visible.length ? <Text style={styles.hEmpty}>No projects match your search and filter.</Text> : null}
      </View>
    </View>
  );
}

function HospitalProjectCard({ project, onAction }: { project: PortfolioProject; onAction: (action: OfflineDemoAction) => void }) {
  return <View style={styles.hCard} testID={`portfolio-project-${project.id}`}>
    <View style={styles.hCardTop}><Image accessibilityLabel={`${project.name} construction site`} resizeMode="cover" source={project.image} style={styles.hProjectImage} />
      <View style={styles.hCardLead}><Text numberOfLines={2} style={styles.hProjectName}>{project.name}</Text>
        <Text style={styles.hLocation}>{project.location}</Text><View style={styles.hProgressRow}><Text style={styles.hProgress}>{project.progress}%</Text>
          <View style={[styles.hStatus, project.status === "In Progress" && styles.hStatusProgress]}><Text style={[styles.hStatusText, project.status === "In Progress" && styles.hStatusProgressText]}>● {project.status.toUpperCase()}</Text></View></View>
        <Text numberOfLines={2} style={styles.hUpdate}>{project.update}</Text><View style={styles.hTrack}><View style={[styles.hFill, { width: `${project.progress}%` }]} /></View>
      </View></View>
    <View style={styles.hMilestone}><LineIcon kind="building" /><Text style={styles.hMilestoneLabel}>Current milestone</Text><Text style={styles.hMilestoneValue}>{project.currentMilestone} · {project.currentYear}</Text></View>
    <ProjectTimeline stages={project.stages} />
    <View style={styles.hFooter}><View style={styles.hActivity}><LineIcon kind="check" /><Text style={styles.hFooterText}>{project.completedActivity}</Text></View>
      <View style={styles.hActivity}><LineIcon kind="calendar" /><Text style={styles.hFooterText}>Opening {project.openingYear}</Text></View>
      <Pressable accessibilityLabel={`View full timeline for ${project.name}`} accessibilityRole="button" onPress={() => onAction({ type: "select-project", projectId: project.id })} style={styles.hTimelineTarget}>
        <Text style={styles.hTimelineLink}>View full timeline</Text><LineIcon kind="arrow" /></Pressable></View>
  </View>;
}

function ProjectTimeline({ stages }: { stages: PortfolioProject["stages"] }) {
  return <View style={styles.hTimeline} testID="project-timeline"><View style={styles.hTimelineRule} />{stages.map((stage, index) => {
    const [label, marker] = stage.replace(" ✓", "|✓").replace(" NOW", "|NOW").replace(" Next", "|Next").split("|");
    return <View key={stage} style={styles.hStage}><View style={[styles.hDot, index < 2 && styles.hDotActive]} />
      <Text style={[styles.hStageText, index < 2 && styles.hStageActive]}>{label}</Text>{marker ? <Text style={styles.hStageMarker}>{marker}</Text> : null}</View>;
  })}</View>;
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
function ProjectCard({ project, onAction }: { project: PortfolioProject; onAction: (action: OfflineDemoAction) => void }) {
  return (
    <View style={styles.card} testID={`portfolio-project-${project.id}`}>
      <View style={styles.cardTop}>
        <Image
          accessibilityLabel={`${project.name} site`}
          resizeMode="cover"
          source={project.image}
          style={styles.projectImage}
        />
        <View style={styles.cardLead}>
          <Text numberOfLines={2} style={styles.projectName}>
            {project.name}
          </Text>
          <Text style={styles.location}>{project.location}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progress}>{project.progress}%</Text>
            <View
              style={[
                styles.status,
                project.status === "In Progress" && styles.statusProgress,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  project.status === "In Progress" && styles.statusProgressText,
                ]}
              >
                ● {project.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.update}>
            {project.update}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${project.progress}%` }]} />
          </View>
          <Text style={styles.trackValue}>{project.progress}%</Text>
        </View>
      </View>
      <View style={styles.milestone}>
        <Text style={styles.milestoneIcon}>♜</Text>
        <Text style={styles.milestoneLabel}>Current milestone</Text>
        <Text style={styles.milestoneValue}>
          {project.currentMilestone} · {project.currentYear}
        </Text>
      </View>
      <View style={styles.timeline}>
        <View style={styles.timelineRule} />
        {project.stages.map((stage, index) => (
          <View key={stage} style={styles.stage}>
            <View style={[styles.dot, index < 2 && styles.dotActive]} />
            <Text
              numberOfLines={2}
              style={[styles.stageText, index < 2 && styles.stageActive]}
            >
              {stage}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.activity}>
          <Text style={styles.footerIcon}>◉</Text>
          <Text style={styles.footerText}>{project.completedActivity}</Text>
        </View>
        <View style={styles.activity}>
          <Text style={styles.footerIcon}>▣</Text>
          <Text style={styles.footerText}>Opening {project.openingYear}</Text>
        </View>
        <Pressable
          accessibilityLabel={`View full timeline for ${project.name}`}
          accessibilityRole="button"
          onPress={() => onAction({ type: "select-project", projectId: project.id })}
          style={styles.timelineTarget}
        >
          <Text style={styles.timelineLink}>View full timeline →</Text>
        </Pressable>
      </View>
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
  hHeroImage: { height: "100%", position: "absolute", right: 0, top: 0, width: "73%" },
  hHeroWash: { backgroundColor: "rgba(248,245,238,.76)", height: "100%", left: "35%", position: "absolute", top: 0, width: "31%" },
  hHeroCopy: { height: "100%", justifyContent: "center", paddingHorizontal: 18, width: "67%" },
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
  hCard: { backgroundColor: "#FFF", borderColor: "#DDD5C8", borderRadius: 12, borderWidth: 1, overflow: "hidden", padding: 10 },
  hCardTop: { flexDirection: "row", height: 156 },
  hProjectImage: { borderRadius: 7, height: 156, width: "45%" },
  hCardLead: { flex: 1, paddingLeft: 12 },
  hProjectName: { color: "#25231E", fontFamily: "serif", fontSize: 18, lineHeight: 20 },
  hLocation: { color: "#6C665D", fontSize: 11, lineHeight: 15, marginTop: 3 },
  hProgressRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 7 },
  hProgress: { color: "#27251F", fontSize: 20, fontWeight: "700" },
  hStatus: { backgroundColor: "#EAF3E8", borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  hStatusProgress: { backgroundColor: "#E7EFF4" }, hStatusText: { color: "#54844F", fontSize: 10, fontWeight: "900" }, hStatusProgressText: { color: "#527789" },
  hUpdate: { color: "#514D45", fontSize: 13, fontWeight: "700", lineHeight: 17, marginTop: 5 },
  hTrack: { backgroundColor: "#EAE4D9", borderRadius: 2, height: 4, marginTop: 9 }, hFill: { backgroundColor: "#C79129", borderRadius: 2, height: 4 },
  hMilestone: { alignItems: "center", borderBottomColor: "#EAE4DA", borderBottomWidth: 1, flexDirection: "row", minHeight: 44 },
  hMilestoneLabel: { color: "#5F5A52", fontSize: 11, marginLeft: 7 }, hMilestoneValue: { color: "#665F56", fontSize: 11, fontWeight: "800", marginLeft: "auto" },
  hTimeline: { flexDirection: "row", minHeight: 88, position: "relative" },
  hTimelineRule: { backgroundColor: "#DCD5C9", height: 1, left: "10%", position: "absolute", right: "10%", top: 18 },
  hStage: { alignItems: "center", flex: 1, paddingHorizontal: 2, zIndex: 2 }, hDot: { backgroundColor: "#FFF", borderColor: "#C5BEB2", borderRadius: 6, borderWidth: 1, height: 11, marginTop: 13, width: 11 },
  hDotActive: { backgroundColor: "#CA9228", borderColor: "#CA9228" }, hStageText: { color: "#625D55", fontSize: 11, lineHeight: 14, marginTop: 5, textAlign: "center" }, hStageActive: { color: "#9D7223", fontWeight: "800" }, hStageMarker: { color: "#8C867D", fontSize: 10, marginTop: 1 },
  hFooter: { alignItems: "center", borderTopColor: "#EAE4DA", borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", paddingTop: 6 },
  hActivity: { alignItems: "center", flexDirection: "row", minHeight: 44, width: "50%" }, hFooterText: { color: "#605B53", flexShrink: 1, fontSize: 11, marginLeft: 4 },
  hTimelineTarget: { alignItems: "center", borderTopColor: "#F0EBE2", borderTopWidth: 1, flexDirection: "row", height: 44, justifyContent: "flex-end", width: "100%" }, hTimelineLink: { color: "#A8761E", fontSize: 11, fontWeight: "800" },
  hEmpty: { color: "#6D675E", fontSize: 13, paddingVertical: 24, textAlign: "center" },
  hIcon: { borderColor: "#A87A27", borderRadius: 2, borderWidth: 1.2, height: 15, position: "relative", width: 15 },
  hSearchIcon: { borderColor: "#817B72", borderRadius: 8, height: 14, width: 14 }, hSearchHandle: { backgroundColor: "#817B72", height: 1.5, position: "absolute", right: -4, top: 12, transform: [{ rotate: "45deg" }], width: 6 },
  hWindow: { backgroundColor: "#A87A27", height: 3, left: 3, position: "absolute", top: 4, width: 3 }, hWindowRight: { left: 8 }, hCheck: { color: "#A87A27", fontSize: 12, fontWeight: "800", left: 1, position: "absolute", top: -2 },
  hCalendarTop: { borderBottomColor: "#A87A27", borderBottomWidth: 1, left: 1, position: "absolute", right: 1, top: 4 }, hArrow: { color: "#A8761E", fontSize: 17, left: 1, position: "absolute", top: -5 }, hTimelineDot: { backgroundColor: "#A87A27", borderRadius: 2, height: 4, left: 4, position: "absolute", top: 4, width: 4 },
});
