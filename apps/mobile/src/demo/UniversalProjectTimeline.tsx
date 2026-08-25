import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Asset } from "expo-asset";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import type { OfflineDemoAction, OfflineDemoState } from "./offline-demo";
import type {
  PortfolioProject,
  SubverticalPortfolio,
} from "./subvertical-projects";
export const projectDetailTabs = ["timeline", "overview", "documents", "media"] as const;
export type TimelineVariant = "current" | "foundation" | "site" | "mobilisation" | "approvals" | "upcoming";
export type TimelineItem = { variant: TimelineVariant; title: string; date: string; status: string; detail: string; filters: readonly string[] };
export const aarohanTimeline: readonly TimelineItem[] = [
  { variant: "current", date: "18 AUG 2026", status: "IN PROGRESS", title: "Structural frame reaches Level 8", detail: "The main clinical block has reached Level 8. Core structural work remains on schedule, with the next wing slab now underway.", filters: ["Milestones", "Site Updates"] },
  { variant: "foundation", date: "01 JUL 2026", status: "COMPLETE", title: "Foundation works completed", detail: "Pile foundations, raft works and substructure quality checks have been completed and verified.", filters: ["Milestones"] },
  { variant: "site", date: "14 MAR 2026", status: "SITE UPDATE", title: "Basement and services core underway", detail: "Basement retaining works and the central services core progressed across the active work fronts.", filters: ["Site Updates"] },
  { variant: "mobilisation", date: "10 NOV 2025", status: "COMPLETE", title: "Site mobilisation completed", detail: "Temporary services, welfare areas, material routes and perimeter controls were fully commissioned.", filters: ["Milestones", "Documents"] },
  { variant: "approvals", date: "20 AUG 2025", status: "COMPLETE", title: "Planning and statutory approvals", detail: "Planning consent and statutory approvals were recorded for the approved development programme.", filters: ["Documents"] },
  { variant: "upcoming", date: "Q2 2027", status: "UPCOMING", title: "Building envelope", detail: "Façade installation, weatherproofing and external envelope works.", filters: ["Milestones"] },
] as const;

export const aarohanPhotos: readonly ImageSourcePropType[] = [
  require("../../assets/demo/amaravati-structure.webp"),
  require("../../assets/demo/amaravati-structure-progress.webp"),
  require("../../assets/demo/amaravati-pour.webp"),
  require("../../assets/demo/amaravati-inverter-inspection.webp"),
  require("../../assets/demo/amaravati-inverter-evidence.webp"),
  require("../../assets/demo/amaravati-finish.webp"),
  require("../../assets/demo/amaravati-hero.webp"),
  require("../../assets/subverticals/multi-specialty-hospitals/aarohan-medical-city.webp"),
] as const;
export const aarohanGallerySizes = {
  current: 8,
  foundation: 5,
  site: 4,
} as const;
export const aarohanVisualMetrics = {
  gutter: 16,
  topInsetCompensation: -16,
  backTouchTarget: 44,
  backChevron: 23,
  postBackGap: 12,
  heroWidth: 108,
  heroHeight: 90,
  heroAspectRatio: 6 / 5,
  summaryMetricsInFlow: true,
  railX: 8,
  cardLeft: 30,
  cardRadius: 5,
  mediaHeight: 58,
  actionHeight: 44,
  widths: [320, 360, 390, 430],
} as const;
export const aarohanMotionContract = {
  transformOnly: true,
  opacityOnly: true,
  repeats: false,
  finite: true,
  reducedMotionSafe: true,
  pressFeedbackMs: 80,
  cardLift: 6,
  revealOrder: ["summary", "navigation", "timeline"],
  reducedMotionFinalValue: 1,
} as const;

function PremiumReveal({
  children,
  delay = 0,
  lift = 6,
  testID,
  reducedMotion,
}: {
  children: React.ReactNode;
  delay?: number;
  lift?: number;
  testID?: string;
  reducedMotion: boolean | null;
}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion === null) return;
    if (reducedMotion) {
      value.setValue(1);
      return;
    }
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 360,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, reducedMotion, value]);
  return (
    <Animated.View
      testID={testID}
      style={{
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [lift, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function useReducedMotion(): boolean | null {
  const testing = process.env.NODE_ENV === "test";
  const [reduced, setReduced] = useState<boolean | null>(testing ? true : null);
  useEffect(() => {
    if (testing) return;
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    return () => { active = false; };
  }, [testing]);
  return reduced;
}

const pressed = ({ pressed: isPressed }: { pressed: boolean }) =>
  isPressed ? a.pressed : undefined;

export const aarohanSiteReportModule = require("../../assets/documents/site-report.pdf");
export async function openAarohanSiteReport(): Promise<void> {
  const asset = Asset.fromModule(aarohanSiteReportModule);
  await asset.downloadAsync();
  await Linking.openURL(asset.localUri ?? asset.uri);
}
type GalleryKey = keyof typeof aarohanGallerySizes;
type GalleryState = {
  key: GalleryKey;
  mode: "gallery" | "lightbox";
  index: number;
} | null;
type IconName =
  | "back"
  | "timeline"
  | "overview"
  | "documents"
  | "media"
  | "pin"
  | "photo"
  | "file"
  | "shield"
  | "close"
  | "left"
  | "right"
  | "grid"
  | "check";
const GOLD = "#C88712",
  INK = "#27231D",
  LINE = "#E7E1D7";
const galleryOffset = (key: GalleryKey) =>
  key === "foundation" ? 2 : key === "site" ? 5 : 0;
const galleryPhoto = (key: GalleryKey, index: number) =>
  aarohanPhotos[(galleryOffset(key) + index) % aarohanPhotos.length];

function Icon({
  name,
  color = "#635D54",
  size = 14,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const common = { position: "absolute" as const, backgroundColor: color };
  if (name === "close")
    return (
      <View style={{ width: size, height: size }}>
        <View
          style={[
            common,
            {
              width: size,
              height: 1.5,
              top: size / 2,
              transform: [{ rotate: "45deg" }],
            },
          ]}
        />
        <View
          style={[
            common,
            {
              width: size,
              height: 1.5,
              top: size / 2,
              transform: [{ rotate: "-45deg" }],
            },
          ]}
        />
      </View>
    );
  if (name === "left" || name === "right" || name === "back")
    return (
      <View
        style={{
          width: size,
          height: size,
          transform: [{ rotate: name === "right" ? "225deg" : "45deg" }],
        }}
      >
        <View
          style={{
            width: size * 0.62,
            height: size * 0.62,
            borderLeftWidth: 1.7,
            borderBottomWidth: 1.7,
            borderColor: color,
          }}
        />
      </View>
    );
  if (name === "check")
    return (
      <View
        style={{ width: size, height: size, transform: [{ rotate: "-45deg" }] }}
      >
        <View
          style={{
            width: size * 0.7,
            height: size * 0.4,
            borderLeftWidth: 1.7,
            borderBottomWidth: 1.7,
            borderColor: color,
          }}
        />
      </View>
    );
  if (name === "timeline")
    return (
      <View
        style={{
          width: size,
          height: size,
          borderWidth: 1.3,
          borderColor: color,
          borderRadius: size / 2,
        }}
      >
        <View
          style={[
            common,
            { width: 1, height: size * 0.35, left: size / 2, top: size * 0.18 },
          ]}
        />
        <View
          style={[
            common,
            {
              height: 1,
              width: size * 0.3,
              left: size / 2,
              top: size / 2,
              transform: [{ rotate: "25deg" }],
            },
          ]}
        />
      </View>
    );
  if (name === "pin")
    return (
      <View
        style={{
          width: size * 0.7,
          height: size * 0.7,
          borderWidth: 1.3,
          borderColor: color,
          borderRadius: size / 2,
          transform: [{ rotate: "45deg" }],
        }}
      >
        <View
          style={{
            width: 3,
            height: 3,
            borderRadius: 2,
            backgroundColor: color,
            margin: 3,
          }}
        />
      </View>
    );
  if (name === "shield")
    return (
      <View
        style={{
          width: size * 0.75,
          height: size * 0.82,
          borderWidth: 1.3,
          borderColor: color,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="check" size={7} color={color} />
      </View>
    );
  if (name === "photo" || name === "media")
    return (
      <View
        style={{
          width: size,
          height: size * 0.78,
          borderWidth: 1.2,
          borderColor: color,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            borderWidth: 1,
            borderColor: color,
            transform: [{ rotate: "45deg" }],
            left: size * 0.25,
            top: size * 0.38,
          }}
        />
      </View>
    );
  if (name === "grid" || name === "overview")
    return (
      <View
        style={{
          width: size,
          height: size,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              width: (size - 2) / 2,
              height: (size - 2) / 2,
              borderWidth: 1,
              borderColor: color,
            }}
          />
        ))}
      </View>
    );
  return (
    <View
      style={{
        width: size * 0.8,
        height: size,
        borderWidth: 1.2,
        borderColor: color,
        borderRadius: 1,
      }}
    >
      <View
        style={{ height: 1, backgroundColor: color, margin: 2, marginTop: 4 }}
      />
      <View
        style={{ height: 1, backgroundColor: color, marginHorizontal: 2 }}
      />
    </View>
  );
}

export function UniversalProjectTimeline({
  backLabel,
  project,
  portfolio,
  selectedTab,
  onAction,
}: {
  backLabel?: string;
  project: PortfolioProject;
  portfolio: SubverticalPortfolio;
  selectedTab: OfflineDemoState["selectedProjectDetailTab"];
  onAction: (a: OfflineDemoAction) => void;
}): React.ReactElement {
  const [gallery, setGallery] = useState<GalleryState>(null);
  const [pdf, setPdf] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const timeline = useMemo<readonly TimelineItem[]>(() => {
    if (project.id === "aarohan-medical-city-pune") return aarohanTimeline;
    const activeStage = project.stages.find((stage) =>
      stage.toLowerCase().includes(project.currentMilestone.toLowerCase()),
    ) ?? project.currentMilestone;
    return aarohanTimeline.map((item, index) => index === 0 ? {
      ...item,
      title: `${project.currentMilestone} reaches the next delivery stage`,
      detail: `${project.name} has advanced through ${activeStage.toLowerCase()}. Delivery remains coordinated across the active site.`,
    } : item);
  }, [project]);
  const openGallery = useCallback((key: GalleryKey) =>
    setGallery({ key, mode: "gallery", index: 0 }), []);
  const openLightbox = useCallback((key: GalleryKey, index: number) =>
    setGallery({ key, mode: "lightbox", index }), []);
  return (
    <View style={a.page} testID="universal-project-timeline">
      <Pressable
        testID="aarohan-back-control"
        accessibilityRole="button"
        accessibilityLabel={`Back to ${backLabel ?? portfolio.title}`}
        accessibilityHint={`Returns to ${backLabel ?? `the ${portfolio.title} projects`}`}
        onPress={() => onAction({ type: "return-to-subvertical" })}
        style={a.back}
      >
        <Text style={a.backArrow}>‹</Text>
        <Text numberOfLines={1} style={a.backLabel}>{(backLabel ?? portfolio.title).toUpperCase()}</Text>
      </Pressable>
      <View style={a.postBackGap} testID="aarohan-post-back-gap" />
      <View style={a.summary} testID="aarohan-project-summary">
        <PremiumReveal reducedMotion={reducedMotion} testID="aarohan-hero-progress-reveal">
        <View style={a.summaryTop}>
          <Image source={project.image} resizeMode="cover" style={a.hero} />
          <View style={a.summaryCopy}>
            <Text style={a.name}>{project.name}</Text>
            <View style={a.inline}>
              <Icon name="pin" size={10} />
              <Text style={a.location}>{project.location}</Text>
            </View>
            <View style={a.inline}>
              <View style={a.liveDot} />
              <Text style={a.status}>{project.status.toUpperCase()}</Text>
            </View>
            <View style={a.metrics} testID="aarohan-summary-metrics">
              <Metric big={`${project.progress}%`} label="Complete" />
              <Metric big={String(project.openingYear)} label="Opening" />
              <Metric big="18 Aug 2026" label="Last updated" small />
            </View>
          </View>
        </View>
        <View
          accessibilityLabel={`${project.progress}% progress`}
          style={a.progress}
        >
          <View style={[a.progressFill, { width: `${project.progress}%` }]} />
        </View>
        </PremiumReveal>
      </View>
      <PremiumReveal reducedMotion={reducedMotion} delay={90} testID="aarohan-navigation-reveal">
      <View accessibilityRole="tablist" style={a.tabs}>
        {projectDetailTabs.map((tab) => (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={cap(tab)}
            accessibilityState={{ selected: selectedTab === tab }}
            onPress={() => onAction({ type: "select-project-detail-tab", tab })}
            style={(state) => [
              a.tab,
              selectedTab === tab && a.tabOn,
              pressed(state),
            ]}
          >
            <Icon
              name={tab}
              color={selectedTab === tab ? GOLD : "#655F56"}
              size={11}
            />
            <Text style={[a.tabText, selectedTab === tab && a.gold]}>
              {cap(tab)}
            </Text>
          </Pressable>
        ))}
      </View>
      </PremiumReveal>
      {selectedTab === "timeline" && (
        <View style={a.body}>
          <Text style={a.heading}>Project Timeline</Text>
          <Text style={a.intro}>
            Follow every milestone, update and verified site record.
          </Text>
          <View style={a.timeline}>
            {timeline.map((item, i, list) => (
                <Entry
                  key={item.variant}
                  item={item}
                  last={i === list.length - 1}
                  openGallery={openGallery}
                  openLightbox={openLightbox}
                  openPdf={setPdf}
                  index={i}
                  reducedMotion={reducedMotion}
                />
              ))}
          </View>
        </View>
      )}
      {selectedTab === "overview" && (
        <SimpleTab title="Project Overview">
          <Fact label="Development" value={portfolio.title} />
          <Fact label="Location" value={project.location} />
          <Fact
            label="Current delivery"
            value={`${project.progress}% complete · ${project.status}`}
          />
          <Fact label="Opening" value={String(project.openingYear)} />
        </SimpleTab>
      )}
      {selectedTab === "documents" && (
        <SimpleTab title="Project Documents">
          <Action
            label="Open Site report PDF"
            text="Site report.pdf · 2.4 MB"
            icon="file"
            onPress={() => void openAarohanSiteReport()}
          />
          {["Foundation QA Report", "Planning Approval Record"].map((x) => (
            <Action
              key={x}
              label={`Preview ${x}`}
              text={x}
              icon="file"
              onPress={() => setPdf(x)}
            />
          ))}
        </SimpleTab>
      )}
      {selectedTab === "media" && (
        <SimpleTab title="Project Media">
          <Text style={a.intro}>Eight local prototype site photographs</Text>
          <View style={a.modalGrid}>
            {aarohanPhotos.map((p, i) => (
              <Pressable
                key={i}
                accessibilityLabel={`Open project photo ${i + 1}`}
                onPress={() => openLightbox("current", i)}
                style={a.gridCell}
              >
                <Image source={p} style={a.gridImage} />
              </Pressable>
            ))}
          </View>
        </SimpleTab>
      )}
      <GalleryModal state={gallery} setState={setGallery} />
      <PdfModal title={pdf} close={() => setPdf(null)} />
    </View>
  );
}

/** @deprecated Use UniversalProjectTimeline. */
export const AarohanTimelineBody = UniversalProjectTimeline;

function Metric({
  big,
  label,
  small,
}: {
  big: string;
  label: string;
  small?: boolean;
}) {
  return (
    <View style={a.metric}>
      <Text style={[a.metricBig, small && a.metricSmall]}>{big}</Text>
      <Text style={a.metricLabel}>{label}</Text>
    </View>
  );
}
function Entry({ item, last, openGallery, openLightbox, openPdf, index, reducedMotion }: any) {
  const done = !["current", "upcoming"].includes(item.variant);
  return (
    <PremiumReveal reducedMotion={reducedMotion} delay={180 + index * 55} lift={4} testID={`timeline-reveal-${item.variant}`}>
    <View style={a.row} testID={`timeline-variant-${item.variant}`}>
      <View
        style={[
          a.line,
          last && a.lineLast,
          item.variant === "upcoming" && a.futureLine,
        ]}
      />
      <View
        style={[
          a.node,
          done && a.nodeDone,
          item.variant === "current" && a.nodeCurrent,
          item.variant === "upcoming" && a.nodeFuture,
        ]}
      >
        {done && <Icon name="check" color="#FFF" size={8} />}
        {item.variant === "current" && <View style={a.nodeCore} />}
      </View>
      <View style={[a.card, item.variant === "current" && a.featured]}>
        <CardCopy item={item} />
        {item.variant === "current" && (
          <>
            <MediaRow
              galleryKey="current"
              visible={3}
              more="+5"
              openGallery={openGallery}
              openLightbox={openLightbox}
            />
            <View style={a.actions}>
              <Action
                label="View 8 Photos"
                text="View 8 photos"
                icon="photo"
                onPress={() => openGallery("current")}
              />
              <Action
                label="Open Site report PDF"
                text="Site report.pdf · 2.4 MB"
                icon="file"
                onPress={() => void openAarohanSiteReport()}
              />
            </View>
            <View style={a.verified}>
              <Icon name="shield" color={GOLD} size={11} />
              <Text style={a.verifiedText}>
                Verified by Project Engineering Team
              </Text>
            </View>
          </>
        )}
        {item.variant === "foundation" && (
          <>
            <View style={a.sideMedia}>
              <MediaRow
                galleryKey="foundation"
                visible={2}
                more="+3"
                openGallery={openGallery}
                openLightbox={openLightbox}
              />
            </View>
            <View style={a.actions}>
              <Action
                label="View 5 Photos"
                text="View 5 photos"
                icon="photo"
                onPress={() => openGallery("foundation")}
              />
              <Action
                label="Preview Foundation QA Report"
                text="Foundation QA Report.pdf"
                icon="file"
                onPress={() => openPdf("Foundation QA Report")}
              />
            </View>
          </>
        )}
        {item.variant === "site" && (
          <View style={a.siteMedia}>
            <MediaRow
              galleryKey="site"
              visible={1}
              more="+4"
              openGallery={openGallery}
              openLightbox={openLightbox}
            />
          </View>
        )}
        {item.variant === "mobilisation" && (
          <View style={a.actions}>
            <Action
              label="Preview Mobilisation Report"
              text="Mobilisation Report.pdf"
              icon="file"
              onPress={() => openPdf("Mobilisation Report.pdf")}
            />
            <Action
              label="Preview Safety Plan"
              text="Safety Plan.pdf"
              icon="file"
              onPress={() => openPdf("Safety Plan.pdf")}
            />
          </View>
        )}
        {item.variant === "approvals" && (
          <View style={a.statusPanel}>
            <View style={a.inline}>
              <Icon name="check" color="#43804B" size={9} />
              <Text style={a.approved}>Approved</Text>
            </View>
            <View style={[a.inline, { marginTop: 5 }]}>
              <View style={a.miniBox} />
              <Text style={a.onSchedule}>On schedule</Text>
            </View>
          </View>
        )}
        {item.variant === "upcoming" && (
          <Text style={a.planned}>Planned start · Q2 2027</Text>
        )}
      </View>
    </View>
    </PremiumReveal>
  );
}
function CardCopy({ item }: any) {
  const side = item.variant === "foundation" || item.variant === "site";
  return (
    <View
      style={[
        a.cardCopy,
        side && a.sideCopy,
        item.variant === "approvals" && a.approvalCopy,
      ]}
    >
      <View style={a.meta}>
        <Text numberOfLines={2} style={a.date}>{item.date}</Text>
        <Text numberOfLines={2} style={[a.badge, item.variant === "upcoming" && a.badgeFuture]}>
          {item.status}
        </Text>
      </View>
      <Text numberOfLines={2} style={a.cardTitle}>{item.title}</Text>
      <Text numberOfLines={2} style={a.detail}>{item.detail}</Text>
    </View>
  );
}
function MediaRow({
  galleryKey,
  visible,
  more,
  openGallery,
  openLightbox,
}: {
  galleryKey: GalleryKey;
  visible: number;
  more: string;
  openGallery: (k: GalleryKey) => void;
  openLightbox: (k: GalleryKey, i: number) => void;
}) {
  return (
    <View style={a.mediaRow}>
      {Array.from({ length: visible }, (_, i) => (
        <Pressable
          key={i}
          accessibilityRole="imagebutton"
          accessibilityLabel={
            i === visible - 1
              ? `Open ${aarohanGallerySizes[galleryKey]} photo gallery`
              : `Open ${galleryKey} photo ${i + 1}`
          }
          onPress={() =>
            i === visible - 1 && more
              ? openGallery(galleryKey)
              : openLightbox(galleryKey, i)
          }
          style={a.thumb}
        >
          <Image source={galleryPhoto(galleryKey, i)} style={a.photo} />
          {i === visible - 1 && more && (
            <View style={a.shade}>
              <Text style={a.more}>{more}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
function Action({
  label,
  text,
  icon,
  onPress,
}: {
  label: string;
  text: string;
  icon: "photo" | "file";
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={(state) => [a.action, pressed(state)]}
    >
      <Icon name={icon} color={GOLD} size={11} />
      <Text numberOfLines={2} style={a.actionText}>
        {text}
      </Text>
    </Pressable>
  );
}
function GalleryModal({
  state,
  setState,
}: {
  state: GalleryState;
  setState: (x: GalleryState) => void;
}) {
  const close = () => setState(null);
  const count = state ? aarohanGallerySizes[state.key] : 0;
  const move = useCallback((d: number) => {
    if (!state) return;
    setState({
      ...state,
      index: Math.max(0, Math.min(count - 1, state.index + d)),
    });
  }, [count, setState, state]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -45) move(1);
      if (g.dx > 45) move(-1);
    },
  }), [move]);
  useEffect(() => {
    if (!state || typeof document === "undefined") return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        state.mode === "lightbox"
          ? setState({ ...state, mode: "gallery" })
          : close();
      if (state.mode === "lightbox" && e.key === "ArrowLeft") move(-1);
      if (state.mode === "lightbox" && e.key === "ArrowRight") move(1);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [state]);
  if (!state) return null;
  const title =
    state.key === "current"
      ? "Structural frame reaches Level 8"
      : state.key === "foundation"
        ? "Foundation works completed"
        : "Basement and services core underway";
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={
        state.mode === "lightbox"
          ? () => setState({ ...state, mode: "gallery" })
          : close
      }
      accessibilityViewIsModal
    >
      <View style={[a.modalShade, state.mode === "lightbox" && a.lightShade]}>
        <Pressable
          accessibilityLabel="Close modal backdrop"
          onPress={close}
          style={a.modalBackdrop}
        />
        {state.mode === "gallery" ? (
          <View style={a.galleryModal}>
            <View style={a.modalHead}>
              <View style={a.modalHeadCopy}>
                <Text numberOfLines={2} style={a.modalTitle}>{title}</Text>
                <Text numberOfLines={2} style={a.modalCount}>{count} photos</Text>
              </View>
              <Pressable
                accessibilityLabel="Close gallery"
                onPress={close}
                style={a.iconButton}
              >
                <Icon name="close" color={INK} size={16} />
              </Pressable>
            </View>
            <View style={a.modalGrid}>
              {Array.from({ length: count }, (_, i) => (
                <Pressable
                  key={i}
                  accessibilityLabel={`Enlarge photo ${i + 1} of ${count}`}
                  onPress={() =>
                    setState({ ...state, mode: "lightbox", index: i })
                  }
                  style={a.gridCell}
                >
                  <Image
                    source={galleryPhoto(state.key, i)}
                    style={a.gridImage}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={a.lightbox} {...pan.panHandlers}>
            <View style={a.lightHead}>
              <Pressable
                accessibilityLabel="Back to gallery"
                onPress={() => setState({ ...state, mode: "gallery" })}
                style={a.iconButton}
              >
                <Icon name="grid" color="#FFF" size={17} />
              </Pressable>
              <Text numberOfLines={1} accessibilityLiveRegion="polite" style={a.counter}>
                {state.index + 1} / {count}
              </Text>
              <Pressable
                accessibilityLabel="Close preview"
                accessibilityHint="Close enlarged photo"
                onPress={close}
                style={a.iconButton}
              >
                <Icon name="close" color="#FFF" size={17} />
              </Pressable>
            </View>
            <Image
              accessibilityLabel={`Enlarged photo ${state.index + 1} of ${count}`}
              source={galleryPhoto(state.key, state.index)}
              resizeMode="contain"
              style={a.largeImage}
            />
            <Pressable
              accessibilityLabel="Previous photo"
              accessibilityState={{ disabled: state.index === 0 }}
              disabled={state.index === 0}
              onPress={() => move(-1)}
              style={(pressState) => [a.arrow, a.arrowLeft, state.index === 0 && a.disabled, pressed(pressState)]}
            >
              <Icon name="left" color="#FFF" size={20} />
            </Pressable>
            <Pressable
              accessibilityLabel="Next photo"
              accessibilityState={{ disabled: state.index === count - 1 }}
              disabled={state.index === count - 1}
              onPress={() => move(1)}
              style={(pressState) => [
                a.arrow,
                a.arrowRight,
                state.index === count - 1 && a.disabled,
                pressed(pressState),
              ]}
            >
              <Icon name="right" color="#FFF" size={20} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}
function PdfModal({
  title,
  close,
}: {
  title: string | null;
  close: () => void;
}) {
  return (
    <Modal
      transparent
      visible={!!title}
      animationType="fade"
      onRequestClose={close}
      accessibilityViewIsModal
    >
      <View style={a.modalShade}>
        <View style={a.galleryModal}>
          <View style={a.modalHead}>
            <View style={a.modalHeadCopy}>
              <Text numberOfLines={2} style={a.modalTitle}>{title}</Text>
            </View>
            <Pressable
              accessibilityLabel="Close preview"
              onPress={close}
              style={a.iconButton}
            >
              <Icon name="close" color={INK} />
            </Pressable>
          </View>
          <View style={a.paper}>
            <Text style={a.nextLabel}>DEMO PROJECT RECORD</Text>
            <Text style={a.intro}>
              This is an honest local demo preview for the Karaa prototype. It
              is not a live project document or delivery record.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
function SimpleTab({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={a.body}>
      <Text style={a.heading}>{title}</Text>
      {children}
    </View>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={a.fact}>
      <Text style={a.nextLabel}>{label}</Text>
      <Text style={a.factValue}>{value}</Text>
    </View>
  );
}
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);

export const a = StyleSheet.create({
  page: {
    backgroundColor: "#FBFAF7",
    marginHorizontal: -16,
    marginTop: -16,
    paddingBottom: 14,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
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
  postBackGap: { height: 12, backgroundColor: "#FBFAF7" },
  summary: {
    backgroundColor: "#FFFDF8",
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 6,
  },
  summaryTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  hero: {
    width: 108,
    height: 90,
    aspectRatio: 6 / 5,
    borderRadius: 2,
    flexShrink: 0,
  },
  summaryCopy: { flex: 1, minWidth: 0, paddingTop: 1 },
  name: { fontFamily: "serif", fontSize: 19, lineHeight: 22, color: INK },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 10, color: "#716B63", marginTop: 3 },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#4B8A55",
    marginTop: 5,
  },
  status: { fontSize: 9, color: "#4B8A55", fontWeight: "800", marginTop: 5 },
  metrics: { flexDirection: "row", marginTop: 6 },
  metric: { flex: 1, minWidth: 0 },
  metricBig: { fontFamily: "serif", fontSize: 18, lineHeight: 19, color: GOLD },
  metricSmall: {
    fontFamily: undefined,
    fontSize: 9,
    color: INK,
    fontWeight: "700",
    paddingTop: 4,
  },
  metricLabel: { fontSize: 8, color: "#777168" },
  progress: { height: 2, backgroundColor: "#EAE4DA", marginTop: 6 },
  progressFill: { height: 2, backgroundColor: GOLD, shadowColor: GOLD, shadowOpacity: 0.25, shadowRadius: 2 },
  progressNumber: {
    position: "absolute",
    right: 16,
    bottom: 2,
    fontSize: 7,
    color: "#777168",
  },
  tabs: {
    height: 44,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: GOLD },
  tabText: { fontSize: 9, color: "#58534C", fontWeight: "700" },
  gold: { color: GOLD },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  filters: { flexDirection: "row", gap: 4, marginBottom: 7 },
  chip: {
    flex: 1,
    minWidth: 0,
    height: 29,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 1,
  },
  chipOn: { borderColor: GOLD, backgroundColor: "#FFF7E7" },
  chipText: { fontSize: 8.5, color: "#625D55", fontWeight: "700" },
  heading: { fontFamily: "serif", fontSize: 20, lineHeight: 23, color: INK },
  intro: { fontSize: 9.5, lineHeight: 13, color: "#777168", marginTop: 1 },
  timeline: { marginTop: 6 },
  row: { paddingLeft: 30, position: "relative", paddingBottom: 7 },
  line: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: -1,
    width: 1,
    backgroundColor: GOLD,
  },
  lineLast: { bottom: 14 },
  futureLine: { backgroundColor: "#CAC4BA" },
  node: {
    position: "absolute",
    left: 1,
    top: 7,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDone: { backgroundColor: GOLD },
  nodeCurrent: {
    left: 0,
    top: 6,
    width: 17,
    height: 17,
    shadowColor: GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nodeCore: { width: 5, height: 5, borderRadius: 3, backgroundColor: GOLD },
  nodeFuture: { borderColor: "#BDB7AD" },
  card: {
    minWidth: 0,
    minHeight: 58,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 5,
    padding: 8,
    backgroundColor: "#FFF",
    position: "relative",
  },
  featured: { borderColor: "#D9AD4D", backgroundColor: "#FFFCF4", shadowColor: GOLD, shadowOpacity: 0.16, shadowRadius: 9, elevation: 3 },
  cardCopy: { minWidth: 0 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, minWidth: 0 },
  date: { fontSize: 8, lineHeight: 10, color: "#8B6418", fontWeight: "900", backgroundColor: "#FBF3DF", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 8, flexShrink: 1 },
  badge: {
    fontSize: 7.5,
    lineHeight: 10,
    color: "#46804D",
    fontWeight: "900",
    backgroundColor: "#EEF6ED",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
    flexShrink: 1,
  },
  badgeFuture: { color: "#777168", backgroundColor: "#F0EFEC" },
  cardTitle: {
    fontFamily: "serif",
    fontSize: 13,
    lineHeight: 16,
    color: INK,
    marginTop: 3,
    flexShrink: 1,
  },
  detail: { fontSize: 8.5, lineHeight: 12, color: "#625D55", marginTop: 1, flexShrink: 1 },
  mediaRow: { flex: 1, flexDirection: "row", gap: 4, marginTop: 6 },
  thumb: { flex: 1, minWidth: 0, height: 58, position: "relative" },
  photo: { width: "100%", height: "100%", borderRadius: 2 },
  shade: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(20,18,16,.44)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
  },
  more: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  actions: { flexDirection: "row", gap: 4, marginTop: 4, minWidth: 0 },
  action: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 3,
  },
  actionText: {
    fontSize: 8,
    lineHeight: 10,
    color: "#69583F",
    fontWeight: "700",
    flexShrink: 1,
    minWidth: 0,
    textAlign: "center",
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  verifiedText: { fontSize: 8, color: "#777168", flexShrink: 1, minWidth: 0 },
  sideCopy: { paddingRight: 132, minHeight: 61 },
  sideMedia: { position: "absolute", right: 8, top: 8, width: 124 },
  siteMedia: { position: "absolute", right: 8, top: 8, width: 105 },
  approvalCopy: { paddingRight: 108 },
  statusPanel: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 99,
    padding: 6,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
  },
  approved: { fontSize: 8.5, color: "#43804B", fontWeight: "800" },
  onSchedule: { fontSize: 8.5, color: "#777168" },
  miniBox: { width: 8, height: 8, borderWidth: 1, borderColor: "#99938A" },
  planned: { fontSize: 8.5, color: GOLD, fontWeight: "700", marginTop: 4 },
  nextLabel: { fontSize: 8, color: GOLD, fontWeight: "900" },
  modalBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.72)",
    justifyContent: "center",
    padding: 16,
  },
  lightShade: { padding: 0, backgroundColor: "rgba(0,0,0,.94)" },
  galleryModal: {
    backgroundColor: "#FFFCF6",
    borderRadius: 8,
    padding: 14,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  modalHead: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  modalHeadCopy: { flex: 1, minWidth: 0 },
  modalTitle: { fontFamily: "serif", fontSize: 16.5, lineHeight: 20, color: INK, flexShrink: 1, minWidth: 0 },
  modalCount: { fontSize: 10, lineHeight: 13, color: "#777168", marginTop: 2, flexShrink: 1 },
  iconButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  modalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 8 },
  gridCell: { width: "32%", height: 86, minHeight: 44 },
  gridImage: { width: "100%", height: "100%", borderRadius: 3 },
  lightbox: { flex: 1, position: "relative", justifyContent: "center" },
  lightHead: {
    position: "absolute",
    top: 22,
    left: 12,
    right: 12,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  counter: { color: "#FFF", fontSize: 13, lineHeight: 17, fontWeight: "800", flex: 1, minWidth: 0, flexShrink: 1, textAlign: "center" },
  largeImage: { width: "100%", height: "82%" },
  arrow: {
    position: "absolute",
    top: "48%",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  disabled: { opacity: 0.25 },
  paper: {
    minHeight: 160,
    backgroundColor: "#F6F3EA",
    padding: 18,
    borderWidth: 1,
    borderColor: LINE,
    marginTop: 8,
  },
  fact: { borderBottomWidth: 1, borderColor: LINE, paddingVertical: 13 },
  factValue: { fontSize: 12, color: INK, marginTop: 4 },
});
