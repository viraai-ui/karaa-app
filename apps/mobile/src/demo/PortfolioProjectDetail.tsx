import { useState } from "react";
import type React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type { OfflineDemoAction, OfflineDemoState } from "./offline-demo";
import type {
  PortfolioProject,
  SubverticalPortfolio,
} from "./subvertical-projects";

const photos = [
  require("../../assets/demo/amaravati-structure.webp"),
  require("../../assets/demo/amaravati-structure-progress.webp"),
  require("../../assets/demo/amaravati-pour.webp"),
];
const tabs = ["timeline", "overview", "documents", "media"] as const;
const filters = [
  "All updates",
  "Milestones",
  "Site Updates",
  "Documents",
] as const;

export function PortfolioProjectDetail({
  project,
  portfolio,
  selectedTab,
  onAction,
}: {
  project: PortfolioProject;
  portfolio: SubverticalPortfolio;
  selectedTab: OfflineDemoState["selectedProjectDetailTab"];
  onAction: (action: OfflineDemoAction) => void;
}): React.ReactElement {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All updates");
  const [notify, setNotify] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const previewPhotoNumber = preview?.match(/photo (\d+)/i)?.[1];
  const previewPhoto = previewPhotoNumber
    ? photos[(Number(previewPhotoNumber) - 1) % photos.length]
    : photos[0];
  const aarohan = project.id === "aarohan-medical-city-pune";
  const title = aarohan
    ? "Structural frame reaches Level 8"
    : `${project.currentMilestone} reaches the next delivery stage`;
  return (
    <View style={s.page} testID={`project-detail-${project.id}`}>
      <Pressable
        accessibilityLabel={`Back to ${portfolio.title}`}
        accessibilityRole="button"
        onPress={() => onAction({ type: "return-to-subvertical" })}
        style={s.back}
      >
        <Text style={s.backText}>
          ‹ {portfolio.verticalTitle.toUpperCase()} /{" "}
          {portfolio.title.toUpperCase()} / PROJECT 01
        </Text>
      </Pressable>
      <View style={s.summary}>
        <Image
          accessibilityLabel={`${project.name} project site`}
          resizeMode="cover"
          source={project.image}
          style={s.hero}
        />
        <View style={s.summaryCopy}>
          <Text style={s.name}>{project.name}</Text>
          <Text style={s.location}>⌖ {project.location}</Text>
          <Text style={s.status}>● {project.status.toUpperCase()}</Text>
          <View style={s.metrics}>
            <Text style={s.metric}>
              <Text style={s.metricBig}>{project.progress}%</Text>
              {"\n"}Complete
            </Text>
            <Text style={s.metric}>
              <Text style={s.metricBig}>{project.openingYear}</Text>
              {"\n"}Opening
            </Text>
            <Text style={s.updated}>18 Aug 2026{"\n"}Last updated</Text>
          </View>
          <View style={s.rail}>
            <View style={[s.fill, { width: `${project.progress}%` }]} />
          </View>
        </View>
      </View>
      <View accessibilityRole="tablist" style={s.tabs}>
        {tabs.map((tab) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={tab[0].toUpperCase() + tab.slice(1)}
            accessibilityState={{ selected: selectedTab === tab }}
            key={tab}
            onPress={() => onAction({ type: "select-project-detail-tab", tab })}
            style={[s.tab, selectedTab === tab && s.tabOn]}
          >
            <Text style={[s.tabText, selectedTab === tab && s.gold]}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {selectedTab === "timeline" && (
        <View style={s.body}>
          <View style={s.filters}>
            {filters.map((item) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Filter ${item}`}
                key={item}
                onPress={() => setFilter(item)}
                style={[s.chip, filter === item && s.chipOn]}
              >
                <Text style={s.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.heading}>Project Timeline</Text>
          <Text style={s.intro}>
            Follow every milestone, update and verified site record.
          </Text>
          {(filter === "All updates" ||
            filter === "Milestones" ||
            filter === "Site Updates") && (
            <TimelineCard
              featured
              title={title}
              date="18 AUG 2026"
              status="IN PROGRESS"
              detail={
                aarohan
                  ? "The main clinical block has reached Level 8. Core structural work remains on schedule, with the next wing slab now underway."
                  : `${project.name} has advanced through ${project.currentMilestone.toLowerCase()}. Delivery remains coordinated across the active site.`
              }
              onPreview={setPreview}
            />
          )}
          {(filter === "All updates" || filter === "Milestones") && (
            <TimelineCard
              title="Foundation works completed"
              date="01 JUL 2026"
              status="COMPLETE"
              detail="Pile foundations, raft works and substructure quality checks have been completed and verified."
              onPreview={setPreview}
            />
          )}
          {(filter === "All updates" || filter === "Site Updates") && (
            <TimelineCard
              title="Basement and services core underway"
              date="14 MAR 2026"
              status="SITE UPDATE"
              detail="Basement retaining works and the central services core progressed across the active work fronts."
              onPreview={setPreview}
            />
          )}
          {(filter === "All updates" || filter === "Milestones") && (
            <TimelineCard
              title="Site mobilisation completed"
              date="10 NOV 2025"
              status="COMPLETE"
              detail="Temporary services, welfare areas, material routes and perimeter controls were fully commissioned."
              onPreview={setPreview}
            />
          )}
          {(filter === "All updates" || filter === "Documents") && (
            <TimelineCard
              title="Planning and statutory approvals"
              date="20 AUG 2025"
              status="COMPLETE"
              detail="Planning consent and statutory approvals were recorded for the approved development programme."
              onPreview={setPreview}
            />
          )}
          {(filter === "All updates" || filter === "Milestones") && (
            <TimelineCard
              title="Building envelope"
              date="Q2 2027"
              status="UPCOMING"
              detail="Façade procurement, performance mock-ups and installation sequencing form the next delivery package."
              onPreview={setPreview}
            />
          )}
          <View style={s.next}>
            <View>
              <Text style={s.nextLabel}>NEXT MAJOR MILESTONE</Text>
              <Text style={s.nextTitle}>Building envelope</Text>
              <Text style={s.intro}>Expected Q2 2027</Text>
            </View>
            <View style={s.notify}>
              <Text style={s.chipText}>Notify me</Text>
              <Switch
                accessibilityLabel="Notify me"
                style={s.notifySwitch}
                value={notify}
                onValueChange={setNotify}
                trackColor={{ true: "#C28A20", false: "#D8D3C9" }}
              />
            </View>
          </View>
        </View>
      )}
      {selectedTab === "overview" && (
        <View style={s.body}>
          <Text style={s.heading}>Project Overview</Text>
          <Fact label="Development" value={portfolio.title} />
          <Fact label="Location" value={project.location} />
          <Fact
            label="Current delivery"
            value={`${project.progress}% complete · ${project.status}`}
          />
          <Fact label="Opening" value={project.openingYear} />
          <Fact
            label="Scope"
            value="A coordinated destination combining resilient infrastructure, public realm and operationally ready facilities."
          />
        </View>
      )}
      {selectedTab === "documents" && (
        <View style={s.body}>
          <Text style={s.heading}>Project Documents</Text>
          {[
            "Site Report · 18 Aug 2026",
            "Foundation QA Report",
            "Planning Approval Record",
          ].map((x) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Preview ${x}`}
              key={x}
              onPress={() => setPreview(x)}
              style={s.document}
            >
              <Text style={s.docIcon}>PDF</Text>
              <View>
                <Text style={s.docTitle}>{x}</Text>
                <Text style={s.intro}>
                  Local demo preview · prototype record
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {selectedTab === "media" && (
        <View style={s.body}>
          <Text style={s.heading}>Project Media</Text>
          <Text style={s.intro}>Eight local prototype site photographs</Text>
          <View style={s.grid}>
            {[...photos, ...photos, photos[0], photos[1]].map((p, i) => (
              <Pressable
                accessibilityLabel={`Open project photo ${i + 1}`}
                key={i}
                onPress={() => setPreview(`Project photo ${i + 1}`)}
                style={s.gridItem}
              >
                <Image
                  accessibilityLabel={`Prototype project photo ${i + 1}`}
                  resizeMode="cover"
                  source={p}
                  style={s.gridPhoto}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Modal
        transparent
        visible={!!preview}
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={s.modalShade}>
          <View style={s.modal}>
            <Text style={s.heading}>{preview}</Text>
            <Text style={s.modalText}>
              This is an honest local demo preview for the Karaa prototype. It
              is not a live project document or delivery record.
            </Text>
            {preview?.includes("photo") ? (
              <Image
                accessibilityLabel={`${preview} preview`}
                resizeMode="cover"
                source={previewPhoto}
                style={s.previewImage}
              />
            ) : (
              <View style={s.paper}>
                <Text style={s.paperTitle}>DEMO PROJECT RECORD</Text>
                <Text style={s.intro}>
                  Preview-only sample attachment. No external file has been
                  fetched.
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              onPress={() => setPreview(null)}
              style={s.close}
            >
              <Text style={s.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fact}>
      <Text style={s.nextLabel}>{label}</Text>
      <Text style={s.factValue}>{value}</Text>
    </View>
  );
}
function TimelineCard({
  title,
  date,
  status,
  detail,
  featured = false,
  onPreview,
}: {
  title: string;
  date: string;
  status: string;
  detail: string;
  featured?: boolean;
  onPreview: (x: string) => void;
}) {
  return (
    <View style={s.timelineRow}>
      <View style={s.line} />
      <View style={[s.dot, status === "UPCOMING" && s.dotOpen]}>
        <Text style={s.tick}>{status === "UPCOMING" ? "" : "✓"}</Text>
      </View>
      <View style={[s.event, featured && s.featured]}>
        <View style={s.meta}>
          <Text style={s.date}>{date}</Text>
          <Text style={s.badge}>{status}</Text>
        </View>
        <Text style={s.eventTitle}>{title}</Text>
        <Text style={s.detail}>{detail}</Text>
        {featured && (
          <View style={s.gallery}>
            {photos.map((p, i) => (
              <Pressable
                accessibilityLabel={`Open featured photo ${i + 1}`}
                key={i}
                onPress={() => onPreview(`Project photo ${i + 1}`)}
                style={s.photoTarget}
              >
                <Image source={p} style={s.photo} />
              </Pressable>
            ))}
          </View>
        )}
        {featured && (
          <View style={s.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View 8 Photos"
              onPress={() => onPreview("Project photo gallery")}
              style={s.action}
            >
              <Text style={s.actionText}>▧ View 8 Photos</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview Site Report PDF"
              onPress={() => onPreview("Site Report PDF")}
              style={s.action}
            >
              <Text style={s.actionText}>▣ Site Report PDF</Text>
            </Pressable>
          </View>
        )}
        {featured && (
          <Text style={s.verified}>✓ Verified by Project Engineering Team</Text>
        )}
      </View>
    </View>
  );
}
const gold = "#C38A20",
  ink = "#26231D",
  line = "#E5DFD3";
const s = StyleSheet.create({
  page: {
    backgroundColor: "#FBFAF6",
    marginHorizontal: -16,
    marginTop: -16,
    paddingBottom: 16,
  },
  back: {
    backgroundColor: "#090A09",
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  backText: { color: "#D9B258", fontSize: 7, fontWeight: "800" },
  summary: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  hero: { width: 118, height: 94, borderRadius: 3 },
  summaryCopy: { flex: 1 },
  name: { fontFamily: "serif", fontSize: 18, color: ink },
  location: { fontSize: 8, color: "#68625A", marginTop: 2 },
  status: { color: "#4C8552", fontSize: 7, fontWeight: "900", marginTop: 3 },
  metrics: { flexDirection: "row", alignItems: "flex-end", marginTop: 7 },
  metric: { fontSize: 7, color: "#777168", width: 64 },
  metricBig: { fontFamily: "serif", fontSize: 18, color: gold },
  updated: { fontSize: 6, color: "#777168" },
  rail: { height: 3, backgroundColor: "#E8E2D7", marginTop: 6 },
  fill: { height: 3, backgroundColor: gold },
  tabs: {
    height: 45,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: line,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: gold },
  tabText: { fontSize: 8, color: "#504B44", fontWeight: "700" },
  gold: { color: gold },
  body: { padding: 12 },
  filters: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  chip: { height: 44, justifyContent: "center", paddingHorizontal: 10 },
  chipOn: {
    backgroundColor: "#F7ECD6",
    borderColor: gold,
    borderWidth: 1,
    borderRadius: 4,
  },
  chipText: { fontSize: 7, color: "#504B44", fontWeight: "700" },
  heading: { fontFamily: "serif", fontSize: 18, color: ink },
  intro: { fontSize: 8, color: "#777168", lineHeight: 12, marginTop: 2 },
  timelineRow: { paddingLeft: 28, position: "relative", paddingTop: 9 },
  line: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: -10,
    width: 1,
    backgroundColor: gold,
  },
  dot: {
    position: "absolute",
    left: 2,
    top: 12,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: gold,
    alignItems: "center",
    justifyContent: "center",
  },
  dotOpen: { backgroundColor: "#FFF", borderColor: "#AAA49A", borderWidth: 1 },
  tick: { color: "#FFF", fontSize: 7 },
  event: {
    backgroundColor: "#FFF",
    borderColor: line,
    borderWidth: 1,
    borderRadius: 5,
    padding: 9,
  },
  featured: { backgroundColor: "#FFFCF5", borderColor: "#E7C77F" },
  meta: { flexDirection: "row", gap: 7 },
  date: { fontSize: 6, color: gold, fontWeight: "900" },
  badge: { fontSize: 5, color: "#43804C", fontWeight: "900" },
  eventTitle: { fontFamily: "serif", fontSize: 12, color: ink, marginTop: 3 },
  detail: { fontSize: 7, color: "#625D55", lineHeight: 10, marginTop: 3 },
  gallery: { flexDirection: "row", gap: 4, marginTop: 7 },
  photoTarget: { flex: 1, minHeight: 44, justifyContent: "center" },
  photo: { width: "100%", height: 45, borderRadius: 2 },
  actions: { flexDirection: "row", gap: 5, marginTop: 5 },
  action: {
    flex: 1,
    minHeight: 44,
    borderColor: line,
    borderWidth: 1,
    borderRadius: 3,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  actionText: { fontSize: 6, color: gold, fontWeight: "800" },
  verified: { fontSize: 6, color: "#777168", marginTop: 2 },
  next: {
    minHeight: 65,
    borderColor: "#E7C77F",
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 12,
    padding: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFCF5",
  },
  nextLabel: {
    fontSize: 6,
    color: gold,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nextTitle: { fontFamily: "serif", fontSize: 13, color: ink },
  notify: { alignItems: "center", flexDirection: "row", gap: 5 },
  notifySwitch: { height: 44, width: 44 },
  fact: { borderBottomWidth: 1, borderColor: line, paddingVertical: 14 },
  factValue: { fontSize: 12, color: ink, marginTop: 5 },
  document: {
    minHeight: 60,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: line,
  },
  docIcon: { color: "#A34037", fontSize: 9, fontWeight: "900" },
  docTitle: { fontSize: 11, color: ink, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 9 },
  gridItem: { width: "32%", minHeight: 90 },
  gridPhoto: { width: "100%", height: 90, borderRadius: 3 },
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.68)",
    justifyContent: "center",
    padding: 24,
  },
  modal: { backgroundColor: "#FFF", borderRadius: 8, padding: 18 },
  modalText: { fontSize: 10, color: "#625D55", lineHeight: 15, marginTop: 8 },
  previewImage: { width: "100%", height: 190, marginTop: 12 },
  paper: {
    height: 150,
    backgroundColor: "#F6F3EA",
    marginTop: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: line,
  },
  paperTitle: { fontSize: 10, color: gold, fontWeight: "900" },
  close: {
    height: 44,
    backgroundColor: ink,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    borderRadius: 4,
  },
  closeText: { color: "#FFF", fontWeight: "800" },
});
