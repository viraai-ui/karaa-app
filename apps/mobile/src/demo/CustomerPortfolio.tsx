import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { OfflineDemoAction } from "./offline-demo";

export const customerPortfolioProjects = [
  {
    id: "aarohan-medical-city-pune",
    name: "Aarohan Medical City",
    location: "Pune, Maharashtra",
    category: "HEALTHCARE & LIFE SCIENCES",
    role: "INVESTOR",
    status: "ON TRACK",
    progress: 42,
    update: "Structural frame underway",
    next: "Building envelope · Q1 2027",
    docs: 4,
    fresh: true,
    image: require("../../assets/portfolio/aarohan-medical-city-progress.webp"),
  },
  {
    id: "amaravati-riverfront-district",
    name: "Amaravati Riverfront District",
    location: "Amaravati, Andhra Pradesh",
    category: "INFRASTRUCTURE & URBAN DEVELOPMENT",
    role: "UNIT HOLDER",
    status: "ON TRACK",
    progress: 64,
    update: "Public realm and utilities underway",
    next: "Landscape works · Dec 2026",
    docs: 5,
    fresh: true,
    image: require("../../assets/portfolio/amaravati-riverfront.webp"),
  },
  {
    id: "surya-integrated-energy-park",
    name: "Surya Integrated Energy Park",
    location: "Kurnool, Andhra Pradesh",
    category: "ENERGY & UTILITIES",
    role: "STAKEHOLDER",
    status: "IN PROGRESS",
    progress: 31,
    update: "Solar array foundations underway",
    next: "Module installation · Q2 2027",
    docs: 2,
    fresh: false,
    image: require("../../assets/portfolio/surya-solar-park.webp"),
  },
] as const;

export type CustomerPortfolioProject = (typeof customerPortfolioProjects)[number];

/** Canonical navigation for records displayed by My Portfolio surfaces. */
export function customerPortfolioProjectAction(project: CustomerPortfolioProject): OfflineDemoAction {
  return project.id === "aarohan-medical-city-pune"
    ? { type: "open-portfolio-project", projectId: project.id }
    : { type: "select-tab", tab: "portfolio" };
}

type Props = { onAction: (action: OfflineDemoAction) => void };
type Panel = { title: string; body: string } | null;
const filters = ["All projects", "On track", "In progress"] as const;
const gold = "#b57a19",
  ink = "#171717",
  ivory = "#fbf8f1",
  muted = "#62615e",
  line = "#e4e1da",
  orange = "#dc7e09";

type IconName =
  | "building"
  | "file"
  | "bell"
  | "clock"
  | "refresh"
  | "wallet"
  | "filter"
  | "pin"
  | "calendar"
  | "lock"
  | "arrow";
function LineIcon({
  name,
  color = "#303331",
  size = 18,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const frame = { width: size, height: size };
  if (name === "clock" || name === "refresh")
    return (
      <View style={[frame, i.round, { borderColor: color }]}>
        <View style={[i.handV, { backgroundColor: color }]} />
        <View style={[i.handH, { backgroundColor: color }]} />
      </View>
    );
  if (name === "building")
    return (
      <View style={[frame, i.building, { borderColor: color }]}>
        <View style={i.windows}>
          <View style={[i.window, { borderColor: color }]} />
          <View style={[i.window, { borderColor: color }]} />
          <View style={[i.window, { borderColor: color }]} />
          <View style={[i.window, { borderColor: color }]} />
        </View>
      </View>
    );
  if (name === "bell")
    return (
      <View style={[frame, i.bell, { borderColor: color }]}>
        <View style={[i.clapper, { backgroundColor: color }]} />
      </View>
    );
  if (name === "pin")
    return (
      <View style={[frame, i.pin, { borderColor: color }]}>
        <View style={[i.pinDot, { borderColor: color }]} />
      </View>
    );
  if (name === "calendar")
    return (
      <View style={[frame, i.calendar, { borderColor: color }]}>
        <View style={[i.calRule, { backgroundColor: color }]} />
      </View>
    );
  if (name === "lock")
    return (
      <View style={[frame, i.lockBody, { borderColor: color }]}>
        <View style={[i.lockTop, { borderColor: color }]} />
      </View>
    );
  if (name === "filter")
    return (
      <View style={frame}>
        <View style={[i.filterTop, { borderTopColor: color }]} />
        <View style={[i.filterStem, { backgroundColor: color }]} />
      </View>
    );
  if (name === "arrow")
    return (
      <View style={frame}>
        <View style={[i.arrowLine, { backgroundColor: color }]} />
        <View style={[i.arrowHead, { borderColor: color }]} />
      </View>
    );
  if (name === "wallet")
    return (
      <View style={[frame, i.wallet, { borderColor: color }]}>
        <View style={[i.walletTab, { borderColor: color }]} />
      </View>
    );
  return (
    <View style={[frame, i.file, { borderColor: color }]}>
      <View style={[i.fileLine, { backgroundColor: color }]} />
      <View style={[i.fileLine, { backgroundColor: color }]} />
    </View>
  );
}

export function CustomerPortfolio({ onAction }: Props) {
  const { width } = useWindowDimensions();
  const narrow = width < 350;
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All projects");
  const [panel, setPanel] = useState<Panel>(null);
  const [synced, setSynced] = useState("today, 10:42 AM");
  const shown = customerPortfolioProjects.filter(
    (p) => filter === "All projects" || p.status === filter.toUpperCase(),
  );
  const open = (title: string, body: string) => setPanel({ title, body });
  const quick: [IconName, string, string][] = [
    [
      "clock",
      "Recent Updates",
      "Two unread project updates are available in this prototype.",
    ],
    [
      "file",
      "My Documents",
      "11 private project documents are represented locally.",
    ],
    [
      "wallet",
      "Payment Records",
      "No live payment service is connected; this is a prototype record panel.",
    ],
  ];
  return (
    <View style={s.page} testID="my-portfolio-page">
      <View style={s.hero}>
        <Image
          source={require("../../assets/portfolio/my-portfolio-hero.webp")}
          style={s.heroImage}
          accessibilityLabel="Construction site"
        />
        <View style={s.heroFade} />
        <View style={s.heroCopy}>
          <Text style={s.eyebrow}>PERSONALISED ACCESS</Text>
          <Text style={s.title}>My Portfolio</Text>
          <Text style={s.subtitle}>
            Your projects, progress and private records—{`\n`}all in one place.
          </Text>
        </View>
        <View style={s.identity}>
          <Text style={s.welcome}>Welcome, Arjun</Text>
          <Text style={s.member}>KG-INV-••4821</Text>
        </View>
      </View>
      <View style={s.content}>
        <View style={s.overview}>
          <Text style={s.overline}>Portfolio overview</Text>
          <View style={s.metrics}>
            <Metric icon="building" n="03" l="Linked Projects" />
            <Metric icon="file" n="11" l="Documents" />
            <Metric icon="bell" n="02" l="New Updates" last />
          </View>
          <View style={s.syncRow}>
            <View style={s.inline}>
              <LineIcon name="clock" color="#a9aaa7" size={13} />
              <Text style={s.sync}>Last synced {synced}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh portfolio"
              hitSlop={12}
              onPress={() => {
                setSynced("just now");
                open(
                  "Portfolio refreshed",
                  "This local prototype has refreshed the records shown on this device.",
                );
              }}
              style={s.refresh}
            >
              <LineIcon name="refresh" color={gold} size={13} />
              <Text style={s.refreshText}>Refresh</Text>
            </Pressable>
          </View>
        </View>
        <View style={s.quick}>
          {quick.map(([icon, title, body]) => (
            <Pressable
              key={title}
              accessibilityRole="button"
              accessibilityLabel={title}
              hitSlop={5}
              onPress={() => open(title, body)}
              style={s.quickButton}
            >
              <LineIcon name={icon} size={18} />
              <Text numberOfLines={1} style={s.quickText}>
                {title}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.sectionTitle}>My Projects</Text>
            <Text style={s.sectionSub}>
              Projects connected to your verified account.
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
            <LineIcon name="filter" size={17} />
          </Pressable>
        </View>
        <View style={s.cards}>
          {shown.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              narrow={narrow}
              open={open}
              onAction={onAction}
            />
          ))}
        </View>
        <View style={s.privacy}>
          <View style={s.lockCircle}>
            <LineIcon name="lock" color={gold} size={17} />
          </View>
          <View style={s.flex}>
            <Text style={s.privacyTitle}>Private project records</Text>
            <Text style={s.privacyCopy}>
              Documents and payment records are{`\n`}visible only to your
              verified account.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage access"
            hitSlop={10}
            onPress={() =>
              open(
                "Manage access",
                "Access is limited to verified account KG-INV-••4821. No permissions are changed in this local prototype.",
              )
            }
            style={s.manage}
          >
            <Text style={s.manageText}>Manage access</Text>
            <LineIcon name="arrow" color={gold} size={16} />
          </Pressable>
        </View>
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
function Metric({
  icon,
  n,
  l,
  last,
}: {
  icon: IconName;
  n: string;
  l: string;
  last?: boolean;
}) {
  return (
    <View style={[s.metric, last && s.metricLast]}>
      <LineIcon name={icon} color={gold} size={21} />
      <Text style={s.metricN}>{n}</Text>
      <Text style={s.metricL}>{l}</Text>
    </View>
  );
}
function ProjectCard({
  p,
  open,
  onAction,
  narrow,
}: {
  p: CustomerPortfolioProject;
  open: (a: string, b: string) => void;
  onAction: Props["onAction"];
  narrow: boolean;
}) {
  const detail = () => {
    const action = customerPortfolioProjectAction(p);
    return action.type === "open-portfolio-project"
      ? onAction(action)
      : open(
          p.name,
          `${p.update}. This subscribed-project preview is local; a live project record is not connected.`,
        );
  };
  return (
    <View
      style={[s.card, narrow && s.cardNarrow]}
      testID={`portfolio-card-${p.id}`}
    >
      <Image
        accessibilityLabel={`${p.name} project`}
        source={p.image as ImageSourcePropType}
        resizeMode="cover"
        style={[s.cardImage, narrow && s.cardImageNarrow]}
      />
      <View style={s.cardBody}>
        <Text numberOfLines={1} style={s.category}>
          {p.category}
        </Text>
        <Text numberOfLines={2} style={s.cardTitle}>
          {p.name}
        </Text>
        <View style={s.inline}>
          <LineIcon name="pin" size={11} color={muted} />
          <Text numberOfLines={1} style={s.location}>
            {p.location}
          </Text>
        </View>
        <View style={s.badges}>
          <Text
            style={[
              s.role,
              p.role === "UNIT HOLDER" && s.roleBlue,
              p.role === "STAKEHOLDER" && s.rolePurple,
            ]}
          >
            {p.role}
          </Text>
          <Text style={[s.status, p.status !== "ON TRACK" && s.statusBlue]}>
            {p.status}
          </Text>
        </View>
        <View style={s.progressTop}>
          <Text style={s.progress}>{p.progress}%</Text>
          <Text style={s.complete}>Complete</Text>
          <Text numberOfLines={1} style={s.update}>
            {p.update}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={`${p.name} completion`}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: p.progress,
            text: `${p.progress}% complete`,
          }}
          style={s.progressRow}
        >
          <View style={s.rail}>
            <View style={[s.fill, { width: `${p.progress}%` }]} />
          </View>
          <Text style={s.percent}>{p.progress}%</Text>
        </View>
        <View style={s.factStrip}>
          <View style={s.milestone}>
            <LineIcon name="calendar" size={15} />
            <View>
              <Text style={s.factLabel}>Next milestone</Text>
              <Text numberOfLines={1} style={s.factValue}>
                {p.next}
              </Text>
            </View>
          </View>
          <View style={s.fact}>
            <LineIcon name="file" size={15} />
            <Text style={s.factValue}>{p.docs} documents</Text>
          </View>
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
              style={s.fact}
            >
              <LineIcon name="bell" size={15} />
              <View style={s.dot} />
              <Text style={s.factValue}>1 new update</Text>
            </Pressable>
          ) : (
            <View style={s.fact} />
          )}
        </View>
        <View style={s.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View project ${p.name}`}
            hitSlop={10}
            onPress={detail}
            style={s.textAction}
          >
            <Text style={s.actionText}>View project</Text>
            <LineIcon name="arrow" color={gold} size={16} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Documents for ${p.name}`}
            hitSlop={10}
            onPress={() =>
              open(
                `${p.name} documents`,
                `${p.docs} project documents are represented in this local prototype.`,
              )
            }
            style={s.textAction}
          >
            <LineIcon name="file" color={gold} size={15} />
            <Text style={s.actionText}>Documents</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const i = StyleSheet.create({
  round: { borderWidth: 1.4, borderRadius: 20 },
  handV: { height: 5, left: 7.6, position: "absolute", top: 3.5, width: 1 },
  handH: { height: 1, left: 7.5, position: "absolute", top: 8, width: 4 },
  building: {
    borderWidth: 1.2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  windows: { flexDirection: "row", flexWrap: "wrap", gap: 3, padding: 4 },
  window: { borderWidth: 1, height: 4, width: 4 },
  bell: {
    borderWidth: 1.3,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomWidth: 0,
    height: 14,
    marginTop: 2,
  },
  clapper: {
    borderRadius: 3,
    bottom: -3,
    height: 3,
    left: 7,
    position: "absolute",
    width: 4,
  },
  file: {
    borderWidth: 1.2,
    borderRadius: 1,
    paddingHorizontal: 3,
    paddingTop: 6,
    gap: 3,
  },
  fileLine: { height: 1, width: "100%" },
  wallet: { borderWidth: 1.2, borderRadius: 2, marginTop: 2, height: 14 },
  walletTab: {
    borderWidth: 1,
    borderRadius: 2,
    height: 6,
    position: "absolute",
    right: -2,
    top: 3,
    width: 7,
  },
  pin: {
    borderWidth: 1.2,
    borderRadius: 10,
    height: 10,
    marginTop: 1,
    transform: [{ rotate: "45deg" }],
    width: 10,
  },
  pinDot: {
    borderWidth: 1,
    borderRadius: 4,
    height: 3,
    left: 2.3,
    position: "absolute",
    top: 2.3,
    width: 3,
  },
  calendar: { borderWidth: 1.2, borderRadius: 1, marginTop: 2, height: 14 },
  calRule: { height: 1, left: 1, position: "absolute", right: 1, top: 4 },
  lockBody: { borderWidth: 1.2, borderRadius: 2, height: 12, marginTop: 6 },
  lockTop: {
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 8,
    left: 3,
    position: "absolute",
    top: -7,
    width: 9,
  },
  filterTop: {
    borderTopWidth: 1.5,
    height: 7,
    marginTop: 3,
    transform: [{ skewX: "-24deg" }],
    width: 16,
  },
  filterStem: { height: 7, left: 8, position: "absolute", top: 8, width: 1.5 },
  arrowLine: { height: 1, left: 1, position: "absolute", top: 8, width: 13 },
  arrowHead: {
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    height: 7,
    left: 8,
    position: "absolute",
    top: 4,
    transform: [{ rotate: "-45deg" }],
    width: 7,
  },
});
const s = StyleSheet.create({
  page: {
    backgroundColor: ivory,
    marginHorizontal: -16,
    marginTop: -16,
    paddingBottom: 6,
  },
  hero: {
    backgroundColor: "#f3eee4",
    height: 136,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: { height: "100%", position: "absolute", right: 0, width: "48%" },
  heroFade: {
    backgroundColor: "rgba(243,238,228,.34)",
    height: "100%",
    position: "absolute",
    right: "32%",
    width: "20%",
  },
  heroCopy: { left: 17, position: "absolute", top: 24, width: "58%" },
  identity: { left: "51.5%", position: "absolute", top: 29, zIndex: 2 },
  eyebrow: { color: gold, fontSize: 8, fontWeight: "700", letterSpacing: 0.7 },
  title: {
    color: ink,
    fontFamily: "serif",
    fontSize: 25,
    lineHeight: 30,
    marginTop: 5,
  },
  subtitle: { color: "#555451", fontSize: 9, lineHeight: 13, marginTop: 6 },
  welcome: { color: ink, fontSize: 8, fontWeight: "600" },
  member: { color: "#383838", fontSize: 8, marginTop: 2 },
  content: { gap: 11, paddingHorizontal: 17, paddingTop: 0 },
  overview: {
    backgroundColor: "#ffffff",
    borderColor: line,
    borderWidth: 1,
    borderRadius: 7,
    elevation: 3,
    height: 147,
    marginTop: -1,
    paddingHorizontal: 13,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  overline: { color: ink, fontSize: 10, marginBottom: 8 },
  metrics: { flexDirection: "row", height: 62 },
  metric: {
    alignItems: "center",
    borderRightColor: line,
    borderRightWidth: 1,
    flex: 1,
    gap: 1,
  },
  metricLast: { borderRightWidth: 0 },
  metricN: {
    color: "#d18a20",
    fontFamily: "serif",
    fontSize: 21,
    lineHeight: 24,
  },
  metricL: { color: muted, fontSize: 8 },
  syncRow: {
    alignItems: "center",
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
  },
  inline: { alignItems: "center", flexDirection: "row", gap: 5 },
  sync: { color: muted, fontSize: 8 },
  refresh: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 44,
  },
  refreshText: { color: gold, fontSize: 8 },
  quick: { flexDirection: "row", gap: 9 },
  quickButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: line,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 44,
    justifyContent: "center",
    minHeight: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  quickText: { color: "#2d2d2c", fontSize: 8, fontWeight: "600" },
  sectionHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  sectionTitle: {
    color: ink,
    fontFamily: "serif",
    fontSize: 20,
    lineHeight: 23,
  },
  sectionSub: { color: muted, fontSize: 8, marginTop: 3 },
  filter: {
    alignItems: "center",
    borderColor: line,
    borderRadius: 6,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    minHeight: 44,
    width: 38,
  },
  cards: { gap: 8 },
  card: {
    backgroundColor: "#fff",
    borderColor: line,
    borderRadius: 7,
    borderWidth: 1,
    elevation: 2,
    height: 168,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardNarrow: { height: 192 },
  cardImage: {
    height: 96,
    left: 8,
    position: "absolute",
    top: 8,
    width: "37%",
    borderRadius: 5,
  },
  cardImageNarrow: { height: 106, width: "34%" },
  cardBody: {
    height: "100%",
    paddingLeft: "41.5%",
    paddingRight: 8,
    paddingTop: 8,
  },
  category: {
    color: "#343432",
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 0.35,
  },
  cardTitle: {
    color: ink,
    fontFamily: "serif",
    fontSize: 14,
    lineHeight: 17,
    marginTop: 2,
  },
  location: { color: muted, flexShrink: 1, fontSize: 7 },
  badges: { flexDirection: "row", gap: 8, marginTop: 4 },
  role: {
    backgroundColor: "#fff7eb",
    borderColor: "#efd8b6",
    borderRadius: 3,
    borderWidth: 1,
    color: "#9c661c",
    fontSize: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  roleBlue: {
    backgroundColor: "#eef7fb",
    borderColor: "#c5dfeb",
    color: "#35657d",
  },
  rolePurple: {
    backgroundColor: "#f7f0fb",
    borderColor: "#dec9e8",
    color: "#6d3d82",
  },
  status: {
    backgroundColor: "#edf8ef",
    borderColor: "#c9e5cf",
    borderRadius: 3,
    borderWidth: 1,
    color: "#397448",
    fontSize: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBlue: {
    backgroundColor: "#edf5fb",
    borderColor: "#c8dceb",
    color: "#356181",
  },
  progressTop: { alignItems: "baseline", flexDirection: "row", marginTop: 5 },
  progress: { color: ink, fontFamily: "serif", fontSize: 17 },
  complete: { color: muted, fontSize: 6, marginLeft: 3 },
  update: { color: "#454542", flex: 1, fontSize: 6, marginLeft: 14 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  rail: {
    backgroundColor: "#e5e5e3",
    borderRadius: 3,
    flex: 1,
    height: 4,
    overflow: "hidden",
  },
  fill: { backgroundColor: orange, borderRadius: 3, height: 4 },
  percent: { color: muted, fontSize: 6 },
  factStrip: {
    alignItems: "center",
    borderColor: "#ece9e3",
    borderRadius: 4,
    borderWidth: 1,
    bottom: 27,
    flexDirection: "row",
    height: 29,
    left: 8,
    position: "absolute",
    right: 8,
  },
  milestone: {
    alignItems: "center",
    borderRightColor: line,
    borderRightWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 20,
    paddingHorizontal: 7,
    width: "41%",
  },
  fact: {
    alignItems: "center",
    borderRightColor: line,
    borderRightWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    height: 20,
    justifyContent: "center",
  },
  factLabel: { color: muted, fontSize: 5 },
  factValue: { color: "#343431", fontSize: 6 },
  dot: {
    backgroundColor: orange,
    borderRadius: 3,
    height: 4,
    marginLeft: -7,
    marginTop: -12,
    width: 4,
  },
  actions: {
    alignItems: "center",
    bottom: 0,
    flexDirection: "row",
    height: 25,
    justifyContent: "space-between",
    left: 8,
    position: "absolute",
    right: 8,
  },
  textAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    minHeight: 44,
  },
  actionText: { color: gold, fontSize: 8, fontWeight: "600" },
  privacy: {
    alignItems: "center",
    backgroundColor: "#fdf7ec",
    borderColor: "#eadcc7",
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 65,
    paddingHorizontal: 12,
  },
  lockCircle: {
    alignItems: "center",
    backgroundColor: "#fff1d7",
    borderRadius: 30,
    height: 42,
    justifyContent: "center",
    marginRight: 10,
    width: 42,
  },
  flex: { flex: 1 },
  privacyTitle: { color: ink, fontSize: 10, fontWeight: "600" },
  privacyCopy: { color: muted, fontSize: 7, lineHeight: 10, marginTop: 2 },
  manage: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 44 },
  manageText: { color: gold, fontSize: 8, fontWeight: "600" },
  modalShade: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,.6)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: ivory,
    borderRadius: 8,
    maxWidth: 342,
    padding: 22,
    width: "100%",
  },
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
    borderRadius: 5,
    justifyContent: "center",
    minHeight: 44,
  },
  closeText: { color: ivory, fontSize: 11, fontWeight: "800" },
});
