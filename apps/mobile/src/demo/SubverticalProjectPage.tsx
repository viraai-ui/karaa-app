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
            <ProjectCard key={project.id} project={project} />
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
function Metric({
  value,
  label,
  last = false,
}: {
  value: string;
  label: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.metric, !last && styles.metricRule]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function ProjectCard({ project }: { project: PortfolioProject }) {
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
          <Text style={styles.projectName}>
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
          <Text style={styles.update}>
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
    paddingBottom: 24,
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
  hero: { height: 184, position: "relative", overflow: "hidden" },
  heroCopy: {
    backgroundColor: "#F7F3E9",
    height: "100%",
    justifyContent: "center",
    paddingLeft: 17,
    paddingRight: 9,
    width: "64%",
    zIndex: 2,
  },
  heroImage: {
    height: "100%",
    position: "absolute",
    right: 0,
    top: 0,
    width: "43%",
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
    fontSize: 23,
    lineHeight: 27,
  },
  subtitle: { color: "#5F5A52", fontSize: 10, lineHeight: 14, marginTop: 7 },
  summary: {
    backgroundColor: "#FFF",
    borderColor: "#DED8CC",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 11,
    marginTop: -10,
    minHeight: 62,
    zIndex: 3,
  },
  metric: { alignItems: "center", flex: 1, justifyContent: "center" },
  metricRule: { borderRightColor: "#E1DBCF", borderRightWidth: 1 },
  metricValue: { color: "#B1842D", fontFamily: "serif", fontSize: 18 },
  metricLabel: { color: "#45423D", fontSize: 9, marginTop: 2, textAlign: "center" },
  controls: { paddingHorizontal: 12, paddingTop: 12 },
  search: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E3DED4",
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: 10,
  },
  searchIcon: { color: "#88837A", fontSize: 15 },
  input: {
    color: "#25241F",
    flex: 1,
    fontSize: 12,
    minHeight: 44,
    paddingHorizontal: 6,
  },
  filters: { flexDirection: "row", gap: 5, marginTop: 4 },
  chipTarget: { height: 44, justifyContent: "center", minWidth: 44 },
  chip: {
    alignItems: "center",
    backgroundColor: "#FFF",
    borderColor: "#E2DCD0",
    borderRadius: 4,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  chipActive: { backgroundColor: "#F6EEDC", borderColor: "#C99B36" },
  chipText: { color: "#55514A", fontSize: 9, fontWeight: "700" },
  chipTextActive: { color: "#A27827" },
  body: { paddingHorizontal: 12, paddingTop: 15 },
  sectionTitle: {
    color: "#272621",
    fontFamily: "serif",
    fontSize: 20,
    marginBottom: 9,
  },
  list: { gap: 14 },
  card: {
    backgroundColor: "#FFF",
    borderColor: "#E1DBCF",
    borderRadius: 6,
    borderWidth: 1,
    overflow: "hidden",
    padding: 0,
  },
  cardTop: { flexDirection: "column" },
  projectImage: { aspectRatio: 1.78, width: "100%" },
  cardLead: { paddingHorizontal: 14, paddingTop: 12, position: "relative" },
  projectName: {
    color: "#24231F",
    fontFamily: "serif",
    fontSize: 18,
    lineHeight: 22,
  },
  location: { color: "#666159", fontSize: 12, lineHeight: 16, marginTop: 3 },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 5,
  },
  progress: { color: "#25241F", fontSize: 24, fontWeight: "700" },
  status: {
    backgroundColor: "#E8F2E7",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusProgress: { backgroundColor: "#E8F0F5" },
  statusText: { color: "#4C8651", fontSize: 9, fontWeight: "900" },
  statusProgressText: { color: "#477187" },
  update: { color: "#57534C", fontSize: 11, fontWeight: "700", lineHeight: 15, marginTop: 4 },
  track: { backgroundColor: "#E9E4DA", borderRadius: 3, height: 6, marginTop: 9, overflow: "hidden" },
  fill: { backgroundColor: "#C99128", height: 6 },
  trackValue: {
    alignSelf: "flex-end",
    color: "#777168",
    fontSize: 10,
    marginBottom: 10,
    marginTop: 3,
  },
  milestone: {
    alignItems: "center",
    borderBottomColor: "#ECE7DE",
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  milestoneIcon: { color: "#B78629", fontSize: 15 },
  milestoneLabel: { color: "#555149", fontSize: 10, marginLeft: 6 },
  milestoneValue: {
    color: "#6B665D",
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "800",
    marginLeft: "auto",
    textAlign: "right",
  },
  timeline: {
    flexDirection: "row",
    height: 74,
    justifyContent: "space-between",
    paddingHorizontal: 7,
    position: "relative",
  },
  timelineRule: {
    backgroundColor: "#DED8CD",
    height: 1,
    left: "10%",
    position: "absolute",
    right: "10%",
    top: 18,
  },
  stage: { alignItems: "center", flex: 1, zIndex: 2 },
  dot: {
    backgroundColor: "#FFF",
    borderColor: "#C9C3B8",
    borderRadius: 5,
    borderWidth: 1,
    height: 9,
    marginTop: 14,
    width: 9,
  },
  dotActive: { backgroundColor: "#D09B32", borderColor: "#D09B32" },
  stageText: {
    color: "#777168",
    fontSize: 9,
    lineHeight: 11,
    marginTop: 6,
    textAlign: "center",
  },
  stageActive: { color: "#9C7425", fontWeight: "800" },
  cardFooter: {
    alignItems: "center",
    borderTopColor: "#ECE7DE",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  activity: { alignItems: "center", flexDirection: "row", marginRight: 12 },
  footerIcon: { color: "#B48227", fontSize: 11, marginRight: 4 },
  footerText: { color: "#625E57", fontSize: 10 },
  timelineLink: {
    color: "#B17D20",
    fontSize: 10,
    fontWeight: "800",
  },
  timelineTarget: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginLeft: "auto",
    minWidth: 120,
  },
  empty: {
    color: "#777168",
    fontSize: 10,
    paddingVertical: 20,
    textAlign: "center",
  },
});
