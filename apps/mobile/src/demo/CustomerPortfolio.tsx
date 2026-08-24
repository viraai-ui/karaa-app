import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { OfflineDemoAction } from "./offline-demo";

export const customerPortfolioProjects = [
  {
    id: "aarohan-medical-city-pune",
    name: "Aarohan Medical City",
    location: "Pune, Maharashtra",
    category: "HEALTHCARE & LIFE SCIENCES",
    status: "ON TRACK",
    progress: 42,
    update: "Structural frame underway",
    next: "Building envelope · Q1 2027",
    docs: 4,
    fresh: true,
    image: require("../../assets/verticals/multi-specialty-hospitals-user-supplied.webp"),
  },
  {
    id: "amaravati-riverfront-district",
    name: "Amaravati Riverfront District",
    location: "Amaravati, Andhra Pradesh",
    category: "INFRASTRUCTURE & URBAN",
    status: "ON TRACK",
    progress: 64,
    update: "Public realm and utilities underway",
    next: "Landscape works · Dec 2026",
    docs: 5,
    fresh: true,
    image: require("../../assets/verticals/conceptual-real-estate-district.webp"),
  },
  {
    id: "surya-integrated-energy-park",
    name: "Surya Integrated Energy Park",
    location: "Kurnool, Andhra Pradesh",
    category: "ENERGY & UTILITIES",
    status: "IN PROGRESS",
    progress: 31,
    update: "Solar array foundations underway",
    next: "Module installation · Q2 2027",
    docs: 2,
    fresh: false,
    image: require("../../assets/verticals/conceptual-clean-energy.webp"),
  },
] as const;

type Props = { onAction: (action: OfflineDemoAction) => void };
type Panel = { title: string; body: string } | null;
const filters = ["All projects", "On track", "In progress"] as const;

export function CustomerPortfolio({ onAction }: Props) {
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All projects");
  const [panel, setPanel] = useState<Panel>(null);
  const [synced, setSynced] = useState("today, 10:42 AM");
  const shown = customerPortfolioProjects.filter(
    (p) => filter === "All projects" || p.status === filter.toUpperCase(),
  );
  const open = (title: string, body: string) => setPanel({ title, body });
  return (
    <View style={s.page} testID="my-portfolio-page">
      <View style={s.hero}>
        <View style={s.heroCopy}>
          <Text style={s.eyebrow}>PERSONAL SPACE</Text>
          <Text style={s.title}>My Portfolio</Text>
          <Text style={s.subtitle}>
            Your projects, progress and private records — all in one place.
          </Text>
        </View>
        <View style={s.identity}>
          <Text style={s.welcome}>Welcome, Arjun</Text>
          <Text style={s.member}>KG-INV-0421</Text>
        </View>
        <Image
          accessibilityLabel="Portfolio architecture"
          source={require("../../assets/verticals/conceptual-urban-district.webp")}
          style={s.heroImage}
        />
      </View>
      <View style={s.overview}>
        <Text style={s.overline}>PORTFOLIO OVERVIEW</Text>
        <View style={s.metrics}>
          <Metric n="03" l="Linked Projects" />
          <Metric n="11" l="Documents" />
          <Metric n="02" l="New Updates" />
        </View>
        <View style={s.syncRow}>
          <Text style={s.sync}>Last synced {synced}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh portfolio"
            hitSlop={10}
            onPress={() => {
              setSynced("just now");
              open(
                "Portfolio refreshed",
                "This local prototype has refreshed the records shown on this device.",
              );
            }}
            style={s.darkButton}
          >
            <Text style={s.darkButtonText}>↻ Refresh</Text>
          </Pressable>
        </View>
      </View>
      <View style={s.quick}>
        {[
          [
            "●",
            "Recent Updates",
            "Two unread project updates are available in this prototype.",
          ],
          [
            "▤",
            "My Documents",
            "11 private project documents are represented locally.",
          ],
          [
            "₹",
            "Payment Records",
            "No live payment service is connected; this is a prototype record panel.",
          ],
        ].map(([icon, title, body]) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            hitSlop={4}
            key={title}
            onPress={() => open(title, body)}
            style={s.quickButton}
          >
            <Text style={s.quickIcon}>{icon}</Text>
            <Text style={s.quickText}>{title}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.sectionHead}>
        <View>
          <Text style={s.sectionTitle}>My Projects</Text>
          <Text style={s.sectionSub}>
            Projects you are subscribed to or invested in.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter projects"
          accessibilityHint="Cycles between all, on-track, and in-progress projects"
          accessibilityValue={{ text: filter }}
          hitSlop={10}
          onPress={() =>
            setFilter(filters[(filters.indexOf(filter) + 1) % filters.length])
          }
          style={s.filter}
        >
          <Text style={s.filterText}>⌁ {filter} ⌄</Text>
        </Pressable>
      </View>
      <View style={s.cards}>
        {shown.map((p) => (
          <ProjectCard key={p.id} p={p} open={open} onAction={onAction} />
        ))}
      </View>
      {shown.length === 0 ? (
        <Text>No subscribed projects match this filter.</Text>
      ) : null}
      <View style={s.privacy}>
        <Text style={s.lock}>⌾</Text>
        <View style={s.flex}>
          <Text style={s.privacyTitle}>Private project records</Text>
          <Text style={s.privacyCopy}>
            Documents and personal records are visible only to your verified
            account.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage access"
          hitSlop={8}
          onPress={() =>
            open(
              "Manage access",
              "Access is limited to verified account KG-INV-0421. No permissions are changed in this local prototype.",
            )
          }
          style={s.manage}
        >
          <Text style={s.manageText}>Manage access</Text>
        </Pressable>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => setPanel(null)}
        transparent
        visible={!!panel}
      >
        <View style={s.modalShade}>
          <View accessibilityViewIsModal style={s.modal}>
            <Text style={s.modalEyebrow}>LOCAL PROTOTYPE</Text>
            <Text style={s.modalTitle}>{panel?.title}</Text>
            <Text style={s.modalBody}>{panel?.body}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close panel"
              onPress={() => setPanel(null)}
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
function Metric({ n, l }: { n: string; l: string }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricN}>{n}</Text>
      <Text style={s.metricL}>{l}</Text>
    </View>
  );
}
function ProjectCard({
  p,
  open,
  onAction,
}: {
  p: (typeof customerPortfolioProjects)[number];
  open: (a: string, b: string) => void;
  onAction: Props["onAction"];
}) {
  const detail = () =>
    p.id === "aarohan-medical-city-pune"
      ? onAction({ type: "select-project", projectId: p.id })
      : open(
          p.name,
          `${p.update}. This subscribed-project preview is local; a live project record is not connected.`,
        );
  return (
    <View style={s.card} testID={`portfolio-card-${p.id}`}>
      <Image
        accessibilityLabel={`${p.name} project`}
        source={p.image as ImageSourcePropType}
        style={s.cardImage}
      />
      <View style={s.cardBody}>
        <View style={s.badges}>
          <Text style={s.category}>{p.category}</Text>
          <Text style={s.status}>{p.status}</Text>
        </View>
        <Text style={s.cardTitle}>{p.name}</Text>
        <Text style={s.location}>⌖ {p.location}</Text>
        <View style={s.progressTop}>
          <Text style={s.progress}>{p.progress}%</Text>
          <Text style={s.update}>{p.update}</Text>
        </View>
        <View style={s.rail}>
          <View style={[s.fill, { width: `${p.progress}%` }]} />
        </View>
        <View style={s.meta}>
          <Text style={s.metaLabel}>NEXT MILESTONE</Text>
          <Text style={s.metaValue}>{p.next}</Text>
        </View>
        <View style={s.meta}>
          <Text style={s.docs}>▤ {p.docs} documents</Text>
          {p.fresh ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open new update for ${p.name}`}
              hitSlop={10}
              onPress={() =>
                open(
                  "New project update",
                  `${p.update} — unread local prototype update.`,
                )
              }
              style={s.updateTarget}
            >
              <Text style={s.newUpdate}>● 1 new update</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>
        <View style={s.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View project ${p.name}`}
            hitSlop={8}
            onPress={detail}
            style={s.primary}
          >
            <Text style={s.primaryText}>View project →</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Documents for ${p.name}`}
            hitSlop={8}
            onPress={() =>
              open(
                `${p.name} documents`,
                `${p.docs} project documents are represented in this local prototype.`,
              )
            }
            style={s.secondary}
          >
            <Text style={s.secondaryText}>Documents</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const gold = "#B88A2E",
  ink = "#11110F",
  ivory = "#F5F0E5",
  line = "#D8D0C1",
  muted = "#68645D";
const s = StyleSheet.create({
  page: { gap: 8, marginHorizontal: -16, marginTop: -16, paddingBottom: 4 },
  hero: {
    backgroundColor: "#EEE6D6",
    flexDirection: "row",
    height: 112,
    overflow: "hidden",
  },
  heroCopy: { paddingLeft: 18, paddingTop: 17, width: "61%" },
  heroImage: { height: 112, width: "39%" },
  identity: { left: "50%", position: "absolute", top: 17, zIndex: 2 },
  eyebrow: { color: gold, fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  title: {
    color: ink,
    fontFamily: "serif",
    fontSize: 24,
    lineHeight: 28,
    marginTop: 3,
  },
  subtitle: {
    color: muted,
    fontSize: 8,
    lineHeight: 11,
    marginTop: 2,
    width: "70%",
  },
  goldRule: { backgroundColor: gold, height: 1, marginVertical: 10, width: 28 },
  welcome: { color: ink, fontSize: 7, fontWeight: "700" },
  member: {
    color: gold,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 2,
  },
  overview: {
    backgroundColor: ink,
    gap: 7,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  overline: {
    color: ivory,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  metrics: { flexDirection: "row" },
  metric: { borderRightColor: "#474640", borderRightWidth: 1, flex: 1 },
  metricN: { color: gold, fontFamily: "serif", fontSize: 21 },
  metricL: { color: "#D7D1C6", fontSize: 7, marginTop: 2 },
  syncRow: {
    alignItems: "center",
    borderTopColor: "#41403B",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
  },
  sync: { color: "#AAA69E", fontSize: 7 },
  darkButton: {
    alignItems: "center",
    borderColor: "#6A665D",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  darkButtonText: { color: ivory, fontSize: 8, fontWeight: "700" },
  quick: { flexDirection: "row", gap: 6, marginHorizontal: 10 },
  quickButton: {
    alignItems: "center",
    backgroundColor: "#FFFCF5",
    borderColor: line,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  quickIcon: { color: gold, fontSize: 11 },
  quickText: { color: ink, fontSize: 7, fontWeight: "700", marginTop: 2 },
  sectionHead: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 4,
  },
  sectionTitle: { color: ink, fontFamily: "serif", fontSize: 19 },
  sectionSub: { color: muted, fontSize: 8, marginTop: 2 },
  filter: {
    alignItems: "center",
    borderColor: line,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 8,
  },
  filterText: { color: ink, fontSize: 8 },
  cards: { gap: 8, marginHorizontal: 10 },
  card: {
    backgroundColor: "#FFFCF5",
    borderColor: line,
    borderWidth: 1,
    flexDirection: "row",
    height: 190,
    overflow: "hidden",
  },
  cardImage: { height: "100%", width: "34%" },
  cardBody: { flex: 1, paddingHorizontal: 9, paddingVertical: 7 },
  badges: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  category: { color: gold, fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  status: {
    backgroundColor: "#E8E5DB",
    color: "#4E5B4E",
    fontSize: 6,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cardTitle: {
    color: ink,
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 21,
    marginTop: 5,
  },
  location: { color: muted, fontSize: 8, marginTop: 2 },
  progressTop: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  progress: { color: ink, fontFamily: "serif", fontSize: 20 },
  update: { color: muted, flex: 1, fontSize: 7 },
  rail: { backgroundColor: "#DDD7CB", height: 3, marginTop: 4 },
  fill: { backgroundColor: gold, height: 3 },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
  },
  metaLabel: { color: muted, fontSize: 6, fontWeight: "800" },
  metaValue: { color: ink, fontSize: 7, fontWeight: "700" },
  docs: { color: muted, fontSize: 7 },
  updateTarget: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginVertical: -15,
  },
  newUpdate: { color: gold, fontSize: 7, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 6, marginTop: 4 },
  primary: {
    alignItems: "center",
    backgroundColor: ink,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  primaryText: { color: ivory, fontSize: 8, fontWeight: "800" },
  secondary: {
    alignItems: "center",
    borderColor: ink,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 10,
  },
  secondaryText: { color: ink, fontSize: 8, fontWeight: "800" },
  privacy: {
    alignItems: "center",
    backgroundColor: "#EAE1D0",
    flexDirection: "row",
    gap: 9,
    marginHorizontal: 12,
    minHeight: 82,
    padding: 12,
  },
  lock: { color: gold, fontSize: 19 },
  flex: { flex: 1 },
  privacyTitle: { color: ink, fontFamily: "serif", fontSize: 13 },
  privacyCopy: { color: muted, fontSize: 7, lineHeight: 11, marginTop: 2 },
  manage: { alignItems: "center", justifyContent: "center", minHeight: 44 },
  manageText: { color: gold, fontSize: 8, fontWeight: "800" },
  modalShade: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,.6)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modal: { backgroundColor: ivory, maxWidth: 342, padding: 22, width: "100%" },
  modalEyebrow: {
    color: gold,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modalTitle: { color: ink, fontFamily: "serif", fontSize: 24, marginTop: 7 },
  modalBody: { color: muted, fontSize: 12, lineHeight: 18, marginVertical: 13 },
  close: {
    alignItems: "center",
    backgroundColor: ink,
    justifyContent: "center",
    minHeight: 44,
  },
  closeText: { color: ivory, fontSize: 11, fontWeight: "800" },
});
