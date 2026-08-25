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
import { cardShadow, colors, radii } from "../theme/tokens";

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

export type CustomerPortfolioProject =
  (typeof customerPortfolioProjects)[number];

/** Canonical navigation for records displayed by My Portfolio surfaces. */
export function customerPortfolioProjectAction(
  project: CustomerPortfolioProject,
): OfflineDemoAction {
  const projectId = project.id === "amaravati-riverfront-district"
    ? "smart-cities-and-complete-human-ecosystems-1"
    : project.id === "surya-integrated-energy-park"
      ? "renewable-energy-and-green-hydrogen-1"
      : project.id;
  return { type: "open-portfolio-project", projectId };
}

type Props = { onAction: (action: OfflineDemoAction) => void };
type Panel = { title: string; body: string } | null;
const gold = colors.brass,
  ink = "#171717",
  ivory = "#fbf8f1",
  muted = "#62615e",
  line = "#e4e1da",
  orange = colors.brass;

type IconName =
  | "building"
  | "file"
  | "bell"
  | "clock"
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
  if (name === "clock")
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
  const [panel, setPanel] = useState<Panel>(null);
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
        <View style={s.heroFadeSolid} />
        <View style={s.heroFadeStrong} />
        <View style={s.heroFadeMedium} />
        <View style={s.heroFadeSoft} />
        <View style={s.heroFadeEdge} />
        <View style={s.heroCopy}>
          <Text numberOfLines={1} style={s.title}>
            My Portfolio
          </Text>
          <Text style={s.subtitle}>
            Your projects, progress and private records—{`\n`}all in one place.
          </Text>
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
              <Text style={s.quickText}>
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
        </View>
        <View style={s.cards}>
          {customerPortfolioProjects.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              narrow={narrow}
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
  icon: "building" | "file" | "bell";
  n: string;
  l: string;
  last?: boolean;
}) {
  return (
    <View style={[s.metric, last && s.metricLast]}>
      <OverviewIcon name={icon} />
      <Text style={s.metricN}>{n}</Text>
      <Text style={s.metricL}>{l}</Text>
    </View>
  );
}

/** Consistent line symbols reserved for the three portfolio overview metrics. */
function OverviewIcon({ name }: { name: "building" | "file" | "bell" }) {
  return (
    <View style={s.overviewIcon} testID={`portfolio-overview-icon-${name}`}>
      {name === "building" ? (
        <View style={o.projects}>
          <View style={o.projectBack} />
          <View style={o.projectFront}>
            <View style={o.iconLine} />
            <View style={o.iconLineShort} />
          </View>
        </View>
      ) : name === "file" ? (
        <View style={o.document}>
          <View style={o.documentFold} />
          <View style={o.iconLine} />
          <View style={o.iconLineShort} />
        </View>
      ) : (
        <View style={o.notification}>
          <View style={o.notificationBody} />
          <View style={o.notificationBase} />
          <View style={o.notificationDot} />
        </View>
      )}
    </View>
  );
}

function ProjectCard({
  p,
  onAction,
  narrow,
}: {
  p: CustomerPortfolioProject;
  onAction: Props["onAction"];
  narrow: boolean;
}) {
  const detail = () => onAction(customerPortfolioProjectAction(p));
  return (
    <View
      style={[s.card, narrow && s.cardNarrow]}
      testID={`portfolio-card-${p.id}`}
    >
      <View style={s.cardLead}>
        <Image
          accessibilityLabel={`${p.name} project`}
          source={p.image as ImageSourcePropType}
          resizeMode="cover"
          style={[s.cardImage, narrow && s.cardImageNarrow]}
        />
        <View style={s.cardSummary}>
          <View style={s.statusRow}>
            <View style={s.newDot} />
            <Text style={s.status}>{p.status}</Text>
          </View>
          <Text numberOfLines={2} style={s.cardTitle}>
            {p.name}
          </Text>
          <View style={s.inline}>
            <LineIcon name="pin" size={12} color={muted} />
            <Text numberOfLines={1} style={s.location}>
              {p.location}
            </Text>
          </View>
          <View style={s.progressTop}>
            <Text style={s.progress}>{p.progress}%</Text><Text style={s.complete}>complete</Text><Text style={s.percent}>{p.progress}%</Text>
          </View>
          <View accessible accessibilityLabel={`${p.name} completion`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: p.progress, text: `${p.progress}% complete` }} style={s.progressRow}>
            <View style={s.rail}><View style={[s.fill, { width: `${p.progress}%` }]} /></View>
          </View>

        </View>
      </View>
      <View style={s.actions}>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View project ${p.name}`}
          onPress={detail}
          style={s.primaryAction}
        >
          <Text style={s.primaryActionText}>View project</Text>
        </Pressable>
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
const o = StyleSheet.create({
  projects: { height: 18, position: "relative", width: 18 },
  projectBack: { borderColor: gold, borderRadius: 2, borderWidth: 1.4, height: 12, left: 1, position: "absolute", top: 1, width: 13 },
  projectFront: { backgroundColor: "#FFFFFF", borderColor: gold, borderRadius: 2, borderWidth: 1.4, bottom: 1, height: 12, paddingLeft: 3, paddingTop: 3, position: "absolute", right: 1, width: 13 },
  iconLine: { backgroundColor: gold, height: 1.2, width: 6 },
  iconLineShort: { backgroundColor: gold, height: 1.2, marginTop: 2.5, width: 4 },
  document: { borderColor: gold, borderRadius: 2, borderWidth: 1.4, height: 18, overflow: "hidden", paddingLeft: 3, paddingTop: 7, position: "relative", width: 15 },
  documentFold: { borderBottomColor: gold, borderBottomWidth: 1.4, borderLeftColor: gold, borderLeftWidth: 1.4, height: 5, position: "absolute", right: -1, top: -1, width: 5 },
  notification: { height: 18, position: "relative", width: 18 },
  notificationBody: { borderColor: gold, borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1.4, height: 12, left: 3, position: "absolute", top: 2, width: 12 },
  notificationBase: { backgroundColor: gold, height: 1.4, left: 1.5, position: "absolute", top: 14, width: 15 },
  notificationDot: { backgroundColor: gold, borderRadius: 2, bottom: 0, height: 2.5, left: 7.75, position: "absolute", width: 2.5 },
});
// White-first portfolio language: generous rhythm, warm accents and one clear action per level.
const s = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    marginHorizontal: -16,
    marginTop: -17,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: "#fff",
    height: 192,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    bottom: 0,
    height: 192,
    position: "absolute",
    right: 0,
    width: "64%",
  },
  heroFadeSolid: {
    backgroundColor: "#fff",
    bottom: 0,
    height: 178,
    left: "32%",
    position: "absolute",
    width: "12%",
  },
  heroFadeStrong: {
    backgroundColor: "rgba(255,255,255,.92)",
    bottom: 0,
    height: 178,
    left: "44%",
    position: "absolute",
    width: "6%",
  },
  heroFadeMedium: {
    backgroundColor: "rgba(255,255,255,.72)",
    bottom: 0,
    height: 178,
    left: "50%",
    position: "absolute",
    width: "6%",
  },
  heroFadeSoft: {
    backgroundColor: "rgba(255,255,255,.45)",
    bottom: 0,
    height: 178,
    left: "56%",
    position: "absolute",
    width: "6%",
  },
  heroFadeEdge: {
    backgroundColor: "rgba(255,255,255,.2)",
    bottom: 0,
    height: 178,
    left: "62%",
    position: "absolute",
    width: "6%",
  },
  heroCopy: {
    left: 20,
    position: "absolute",
    top: 47,
    width: "64%",
    zIndex: 2,
  },
  title: {
    color: ink,
    fontFamily: "serif",
    fontSize: 31,
    lineHeight: 37,
  },
  subtitle: { color: "#4f4d49", fontSize: 10, lineHeight: 15, marginTop: 8 },
  content: { gap: 10, paddingHorizontal: 16 },
  overview: {
    backgroundColor: "#fff",
    borderColor: line,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: -22,
    paddingHorizontal: 14,
    paddingBottom: 15,
    paddingTop: 15,
    ...cardShadow,
  },
  overline: { color: ink, fontFamily: "serif", fontSize: 16, marginBottom: 14 },
  metrics: { flexDirection: "row", minHeight: 74 },
  metric: {
    alignItems: "center",
    borderRightColor: line,
    borderRightWidth: 1,
    flex: 1,
    gap: 3,
  },
  metricLast: { borderRightWidth: 0 },
  overviewIcon: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#eee2d0",
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    marginBottom: 1,
    width: 32,
  },
  metricN: { color: ink, fontFamily: "serif", fontSize: 23, lineHeight: 27 },
  metricL: { color: muted, fontSize: 10 },
  inline: { alignItems: "center", flexDirection: "row", gap: 6 },
  quick: { flexDirection: "row", gap: 6 },
  quickButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#eee5d8",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "column",
    gap: 6,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  quickText: { color: ink, fontSize: 10, fontWeight: "700", lineHeight: 12, textAlign: "center" },
  sectionHead: {
    marginTop: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: ink,
    fontFamily: "serif",
    fontSize: 24,
    lineHeight: 28,
  },
  sectionSub: { color: muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  cards: { gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderColor: line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    padding: 14,
    ...cardShadow,
  },
  cardNarrow: { padding: 12 },
  cardLead: { alignItems: "stretch", flexDirection: "row", minWidth: 0 },
  cardImage: { borderRadius: 9, height: 112, width: "38%" },
  cardImageNarrow: { height: 104, width: "34%" },
  cardSummary: { flex: 1, justifyContent: "center", minWidth: 0, paddingLeft: 13 },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  status: { color: gold, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  newDot: { backgroundColor: gold, borderRadius: 3, height: 5, width: 5 },
  cardTitle: {
    color: ink,
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 20,
    marginBottom: 5,
    marginTop: 4,
  },
  location: { color: muted, flex: 1, fontSize: 10, lineHeight: 14 },
  progressTop: { alignItems: "baseline", flexDirection: "row", marginTop: 11 },
  progress: { color: ink, fontFamily: "serif", fontSize: 16 },
  complete: { color: muted, fontSize: 10, marginLeft: 5 },
  percent: { color: muted, fontSize: 10, marginLeft: "auto" },
  progressRow: { marginTop: 4 },
  rail: {
    backgroundColor: "#ece9e3",
    borderRadius: 4,
    height: 3,
    overflow: "hidden",
    width: "100%",
  },
  fill: { backgroundColor: orange, borderRadius: 4, height: 3 },
  milestone: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    flexDirection: "row",
    marginTop: 5,
    minHeight: 27,
    paddingHorizontal: 4,
  },
  milestoneIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  factLabel: {
    color: gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  factValue: { color: ink, fontSize: 10, marginTop: 3 },
  updateButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    minWidth: 24,
  },
  actions: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  primaryAction: {
    alignItems: "center",
    alignSelf: "flex-end",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 8,
  },
  primaryActionText: { color: "#000", fontSize: 11, fontWeight: "700" },
  privacy: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#eadfce",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 86,
    padding: 12,
  },
  lockCircle: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginRight: 10,
    width: 44,
  },
  flex: { flex: 1, minWidth: 0 },
  privacyTitle: { color: ink, fontSize: 10, fontWeight: "700" },
  privacyCopy: { color: muted, fontSize: 10, lineHeight: 11, marginTop: 3 },
  manage: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 44,
    paddingLeft: 6,
  },
  manageText: { color: gold, fontSize: 10, fontWeight: "700" },
  modalShade: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,.62)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 14,
    maxWidth: 342,
    padding: 22,
    width: "100%",
  },
  modalEyebrow: {
    color: gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modalTitle: { color: ink, fontFamily: "serif", fontSize: 24, marginTop: 7 },
  modalBody: { color: muted, fontSize: 12, lineHeight: 18, marginVertical: 13 },
  close: {
    alignItems: "center",
    backgroundColor: ink,
    borderRadius: 7,
    justifyContent: "center",
    minHeight: 44,
  },
  closeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
