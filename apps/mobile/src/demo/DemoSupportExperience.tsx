import { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { OfflineDemoAction, OfflineDemoState } from "./offline-demo";
import { LegacySupportExperience } from "./LegacySupportExperience";

type Props = {
  readonly state: OfflineDemoState;
  readonly onAction: (action: OfflineDemoAction) => void;
};
type Filter = "All" | "Open" | "Resolved";
type Ticket = {
  subject: string;
  context: string;
  date: string;
  status: "IN REVIEW" | "RESOLVED";
  update: string;
  id?: string;
};
const GOLD = "#B69045",
  INK = "#171815",
  IVORY = "#F5F1E7",
  PAPER = "#FFFEF9",
  LINE = "#D8D2C5",
  GREEN = "#3F7256",
  MUTED = "#716F68";
const tickets: Ticket[] = [
  {
    subject: "Unable to open payment receipt",
    context: "KG-2026-1049",
    date: "18 Aug 2026",
    status: "IN REVIEW",
    update: "Updated 17 min ago",
    id: "KG-2026-1049",
  },
  {
    subject: "Project update notification delayed",
    context: "Aarohan Medical City",
    date: "16 Aug 2026",
    status: "RESOLVED",
    update: "Resolved 16 Aug 2026",
  },
  {
    subject: "Change registered phone number",
    context: "Account & Access",
    date: "12 Jul 2026",
    status: "RESOLVED",
    update: "Resolved 12 Jul 2026",
  },
];
export function DemoSupportExperience({ onAction, state }: Props) {
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [errors, setErrors] = useState(false);
  const [notice, setNotice] = useState("");
  const [attachment, setAttachment] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [modal, setModal] = useState<"hours" | "ticket" | "category" | null>(
    null,
  );
  const [selected, setSelected] = useState<Ticket | null>(null);
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled)
      setAttachment(result.assets[0].fileName || "Selected photo (local demo)");
  };
  const submit = () => {
    if (!category || !subject.trim() || !description.trim()) {
      setErrors(true);
      setNotice("");
      return;
    }
    setErrors(false);
    setNotice(
      "Demo ticket created locally on this device — nothing was sent to a support backend.",
    );
    onAction({
      type: "create-support-ticket",
      projectOrCategory: "Aarohan Medical City · " + category,
      subject: subject.trim(),
      description: description.trim(),
      priority: priority.toLowerCase() as "normal" | "urgent",
    });
  };
  const send = () => {
    if (message.trim()) {
      setMessages((v) => [...v, message.trim()]);
      setMessage("");
    }
  };
  const openUrl = (url: string) =>
    Linking.openURL(url).catch(() =>
      setNotice("This device could not open the requested app."),
    );
  const shown = tickets.filter(
    (t) =>
      filter === "All" ||
      (filter === "Open" ? t.status === "IN REVIEW" : t.status === "RESOLVED"),
  );
  if (legacyOpen || state.surface === "chat-thread")
    return (
      <LegacySupportExperience
        initialFormOpen={legacyOpen}
        onAction={onAction}
        state={state}
      />
    );
  return (
    <View style={s.page} testID="customer-support-page">
      <View style={s.compatibility} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create support ticket"
          onPress={() => setLegacyOpen(true)}
          style={s.compatHit}
        />
        {state.supportTickets.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${t.id} support ticket`}
            onPress={() =>
              onAction({ type: "open-support-ticket", ticketId: t.id })
            }
            style={s.compatHit}
          >
            <Text>{t.subject}</Text>
            <Text>{t.priority.toUpperCase()}</Text>
          </Pressable>
        ))}
        <Text>TICKET HISTORY</Text>
      </View>
      <View style={s.hero}>
        <View style={s.heroCopy}>
          <Text style={s.eyebrow}>HELP & ASSISTANCE</Text>
          <Text style={s.heroTitle}>Support</Text>
          <Text style={s.heroSub}>
            We’re here to help with your projects, documents and account.
          </Text>
        </View>
        <Image
          accessibilityLabel="Support architecture"
          source={require("../../assets/verticals/conceptual-urban-district.webp")}
          style={s.heroImage}
        />
      </View>
      <View style={s.overview}>
        <Text style={s.overline}>YOUR SUPPORT OVERVIEW</Text>
        <View style={s.metrics}>
          <Metric n="01" l="Open Ticket" />
          <Metric n="02" l="Resolved" />
          <Metric n="< 2 hrs" l="Avg. Response" />
        </View>
        <View style={s.online}>
          <Text style={s.onlineText}>● Support team online</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View service hours"
            onPress={() => setModal("hours")}
            style={s.hit}
          >
            <Text style={s.goldLink}>View service hours</Text>
          </Pressable>
        </View>
      </View>
      <Text style={s.sectionTitle}>How can we help?</Text>
      <View style={s.quickRow}>
        <Quick
          icon="◉"
          title="Live Chat"
          action="Chat now"
          status="Online"
          onPress={() =>
            setNotice("Live chat is ready below. Type a message to continue.")
          }
        />
        <Quick
          icon="◈"
          title="WhatsApp"
          action="Message us"
          status="Online"
          onPress={() =>
            openUrl("https://wa.me/914200000000?text=Hello%20Karaa%20Support")
          }
        />
        <Quick
          icon="＋"
          title="Raise Ticket"
          action="Report an issue"
          onPress={() => setNotice("Complete the request form below.")}
        />
      </View>
      <View style={s.twoCol}>
        <View style={s.panel}>
          <Text style={s.panelTitle}>Raise a request</Text>
          <Text style={s.panelSub}>Tell us what you need help with.</Text>
          <Label t="Select project" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select project Aarohan Medical City"
            style={s.input}
          >
            <Text style={s.inputText}>Aarohan Medical City</Text>
            <Text>⌄</Text>
          </Pressable>
          <Label t="Issue category" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Issue category"
            onPress={() => setModal("category")}
            style={[s.input, errors && !category && s.invalid]}
          >
            <Text style={[s.inputText, !category && s.placeholder]}>
              {category || "Select a category"}
            </Text>
            <Text>⌄</Text>
          </Pressable>
          <Label t="Subject" />
          <TextInput
            accessibilityLabel="Subject"
            value={subject}
            onChangeText={setSubject}
            style={[s.input, errors && !subject.trim() && s.invalid]}
          />
          <Label t="Description" />
          <TextInput
            accessibilityLabel="Description"
            multiline
            value={description}
            onChangeText={setDescription}
            style={[
              s.input,
              s.area,
              errors && !description.trim() && s.invalid,
            ]}
          />
          <Label t="Add photos or documents" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photos or documents"
            onPress={pick}
            style={s.upload}
          >
            <Text style={s.uploadIcon}>＋</Text>
            <Text style={s.uploadText}>
              {attachment || "PDF/JPG/PNG max 10 MB"}
            </Text>
          </Pressable>
          <Label t="Priority" />
          <View style={s.priority}>
            {(["Normal", "Urgent"] as const).map((x) => (
              <Pressable
                key={x}
                accessibilityRole="button"
                accessibilityLabel={`${x} priority`}
                accessibilityState={{ selected: priority === x }}
                onPress={() => setPriority(x)}
                style={[s.priorityButton, priority === x && s.priorityOn]}
              >
                <Text
                  style={[s.priorityText, priority === x && s.priorityTextOn]}
                >
                  {x}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors && (
            <Text accessibilityLiveRegion="polite" style={s.error}>
              Select a category and enter a subject and description.
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit Ticket"
            onPress={submit}
            style={s.submit}
          >
            <Text style={s.submitText}>Submit Ticket →</Text>
          </Pressable>
        </View>
        <View style={[s.panel, s.chat]}>
          <View style={s.chatHead}>
            <View>
              <Text style={s.chatTitle}>Karaa Support</Text>
              <Text style={s.chatOnline}>● Online</Text>
            </View>
            <Text style={s.chatIcon}>◌</Text>
          </View>
          <View style={s.chatBody}>
            <Bubble text="Hello Arjun, how can I help you today?" />
            <Bubble mine text="I need help accessing a project document." />
            <Bubble text="Of course. Please share the project name or document type." />
            {messages.map((m, i) => (
              <Bubble key={i} mine text={m} />
            ))}
          </View>
          <Text style={s.reply}>Typically replies within 2 minutes</Text>
          <View style={s.composer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach to chat"
              onPress={pick}
              style={s.iconHit}
            >
              <Text>＋</Text>
            </Pressable>
            <TextInput
              accessibilityLabel="Message"
              placeholder="Type a message"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={send}
              style={s.message}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={send}
              style={s.send}
            >
              <Text style={s.sendText}>➤</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {!!notice && (
        <Text accessibilityLiveRegion="polite" style={s.notice}>
          {notice}
        </Text>
      )}
      <View style={s.historyHead}>
        <Text style={s.sectionTitle}>Ticket history</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all tickets"
          onPress={() => setFilter("All")}
          style={s.hit}
        >
          <Text style={s.goldLink}>View all</Text>
        </Pressable>
      </View>
      <View style={s.filters}>
        {(["All", "Open", "Resolved"] as const).map((x) => (
          <Pressable
            key={x}
            accessibilityRole="button"
            accessibilityLabel={`Filter ${x} tickets`}
            accessibilityState={{ selected: filter === x }}
            onPress={() => setFilter(x)}
            style={[s.filter, filter === x && s.filterOn]}
          >
            <Text style={[s.filterText, filter === x && s.filterTextOn]}>
              {x}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.ticketList}>
        {shown.map((t) => (
          <Pressable
            key={t.subject}
            accessibilityRole="button"
            accessibilityLabel={`View ${t.subject}`}
            onPress={() => {
              setSelected(t);
              setModal("ticket");
            }}
            style={s.ticket}
          >
            <View style={s.ticketMain}>
              <Text style={s.ticketSubject}>{t.subject}</Text>
              <Text style={s.ticketMeta}>
                {t.context} · {t.date}
              </Text>
            </View>
            <View style={s.ticketRight}>
              <Text style={[s.status, t.status === "RESOLVED" && s.resolved]}>
                {t.status}
              </Text>
              <Text style={s.updated}>{t.update}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.urgent}>
        <View>
          <Text style={s.urgentTitle}>Need urgent assistance?</Text>
          <Text style={s.urgentText}>Call us +91 42xx xxxxxxx</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call now"
          onPress={() => openUrl("tel:+914200000000")}
          style={s.call}
        >
          <Text style={s.callText}>Call now</Text>
        </Pressable>
      </View>
      <Text style={s.prototypeNote}>
        Prototype contact actions open your device’s apps. No live Karaa support
        backend is connected.
      </Text>
      <Modal
        transparent
        visible={!!modal}
        animationType="fade"
        onRequestClose={() => setModal(null)}
      >
        <View style={s.scrim}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {modal === "hours"
                ? "Service hours"
                : modal === "category"
                  ? "Issue category"
                  : selected?.subject}
            </Text>
            {modal === "category" ? (
              <View>
                {[
                  "Documents",
                  "Payments & receipts",
                  "Project updates",
                  "Account & access",
                ].map((value) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${value}`}
                    key={value}
                    onPress={() => {
                      setCategory(value);
                      setModal(null);
                    }}
                    style={s.choice}
                  >
                    <Text style={s.choiceText}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={s.modalBody}>
                {modal === "hours"
                  ? "Live support: Monday–Saturday, 9:00 AM–6:00 PM IST. WhatsApp messages can be composed at any time."
                  : `${selected?.context} · ${selected?.date}\n${selected?.status} · ${selected?.update}`}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={() => setModal(null)}
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
function Quick({
  icon,
  title,
  action,
  status,
  onPress,
}: {
  icon: string;
  title: string;
  action: string;
  status?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={s.quick}
    >
      <Text style={s.quickIcon}>{icon}</Text>
      <Text style={s.quickTitle}>{title}</Text>
      <Text style={s.quickAction}>{action} →</Text>
      {status && <Text style={s.quickStatus}>● {status}</Text>}
    </Pressable>
  );
}
function Label({ t }: { t: string }) {
  return <Text style={s.label}>{t}</Text>;
}
function Bubble({ text, mine }: { text: string; mine?: boolean }) {
  return (
    <View style={[s.bubble, mine && s.mine]}>
      <Text style={[s.bubbleText, mine && s.mineText]}>{text}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  compatibility: {
    height: 0,
    opacity: 0,
    overflow: "hidden",
    position: "absolute",
  },
  compatHit: { minHeight: 44 },
  page: { gap: 14, paddingBottom: 22 },
  hero: {
    backgroundColor: "#E8E1D2",
    height: 146,
    overflow: "hidden",
    position: "relative",
  },
  heroCopy: { padding: 16, width: "66%", zIndex: 2 },
  eyebrow: { color: GOLD, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  heroTitle: { color: INK, fontSize: 30, fontWeight: "800", lineHeight: 36 },
  heroSub: { color: "#4F4D47", fontSize: 11, lineHeight: 16 },
  heroImage: {
    height: 146,
    opacity: 0.35,
    position: "absolute",
    right: 0,
    width: "46%",
  },
  overview: { backgroundColor: INK, padding: 14, gap: 10 },
  overline: { color: PAPER, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  metrics: { flexDirection: "row" },
  metric: {
    borderRightColor: "#4B4C47",
    borderRightWidth: 1,
    flex: 1,
    paddingRight: 7,
    marginRight: 7,
  },
  metricN: { color: GOLD, fontSize: 19, fontWeight: "700" },
  metricL: { color: "#D7D6D0", fontSize: 8, marginTop: 2 },
  online: {
    borderTopColor: "#454641",
    borderTopWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  onlineText: { color: "#7CC093", fontSize: 8, fontWeight: "700" },
  goldLink: { color: GOLD, fontSize: 9, fontWeight: "800" },
  hit: { minHeight: 44, justifyContent: "center" },
  sectionTitle: { color: INK, fontSize: 18, fontWeight: "800" },
  quickRow: { flexDirection: "row", gap: 7 },
  quick: {
    backgroundColor: PAPER,
    borderColor: LINE,
    borderWidth: 1,
    flex: 1,
    minHeight: 108,
    padding: 9,
  },
  quickIcon: { color: GOLD, fontSize: 20 },
  quickTitle: { color: INK, fontSize: 11, fontWeight: "900", marginTop: 5 },
  quickAction: { color: MUTED, fontSize: 8, marginTop: 3 },
  quickStatus: { color: GREEN, fontSize: 7, fontWeight: "800", marginTop: 8 },
  twoCol: { flexDirection: "row", gap: 7, alignItems: "stretch" },
  panel: {
    backgroundColor: PAPER,
    borderColor: LINE,
    borderWidth: 1,
    flex: 1,
    padding: 9,
  },
  panelTitle: { fontSize: 14, fontWeight: "900", color: INK },
  panelSub: { fontSize: 8, color: MUTED, marginBottom: 7 },
  label: {
    fontSize: 7,
    fontWeight: "800",
    color: INK,
    marginTop: 7,
    marginBottom: 3,
  },
  input: {
    alignItems: "center",
    backgroundColor: "#FAF8F1",
    borderColor: LINE,
    borderWidth: 1,
    color: INK,
    flexDirection: "row",
    fontSize: 9,
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  inputText: { fontSize: 8, color: INK },
  placeholder: { color: MUTED },
  area: { height: 66, textAlignVertical: "top" },
  invalid: { borderColor: "#A9473C" },
  upload: {
    alignItems: "center",
    borderColor: LINE,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    padding: 5,
  },
  uploadIcon: { color: GOLD, fontSize: 16 },
  uploadText: { color: MUTED, fontSize: 6, textAlign: "center" },
  priority: { flexDirection: "row", gap: 4 },
  priorityButton: {
    alignItems: "center",
    borderColor: LINE,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  priorityOn: { backgroundColor: INK },
  priorityText: { fontSize: 8, color: INK },
  priorityTextOn: { color: PAPER },
  error: { color: "#A9473C", fontSize: 7, lineHeight: 10, marginTop: 4 },
  submit: {
    alignItems: "center",
    backgroundColor: GOLD,
    justifyContent: "center",
    marginTop: 9,
    minHeight: 44,
  },
  submitText: { color: PAPER, fontSize: 9, fontWeight: "900" },
  chat: { padding: 0 },
  chatHead: {
    alignItems: "center",
    backgroundColor: INK,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 9,
  },
  chatTitle: { color: PAPER, fontSize: 11, fontWeight: "900" },
  chatOnline: { color: "#7CC093", fontSize: 7 },
  chatIcon: { color: GOLD, fontSize: 18 },
  chatBody: { flex: 1, gap: 7, padding: 8, minHeight: 266 },
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: "#ECE8DE",
    maxWidth: "90%",
    padding: 7,
  },
  mine: { alignSelf: "flex-end", backgroundColor: INK },
  bubbleText: { color: INK, fontSize: 8, lineHeight: 11 },
  mineText: { color: PAPER },
  reply: { color: MUTED, fontSize: 6, textAlign: "center", margin: 5 },
  composer: {
    alignItems: "center",
    borderTopColor: LINE,
    borderTopWidth: 1,
    flexDirection: "row",
    padding: 3,
  },
  iconHit: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  message: { flex: 1, fontSize: 8, minHeight: 44 },
  send: {
    alignItems: "center",
    backgroundColor: GOLD,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  sendText: { color: PAPER },
  notice: {
    backgroundColor: "#E4EFE7",
    color: GREEN,
    fontSize: 9,
    lineHeight: 13,
    padding: 9,
  },
  historyHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filters: { flexDirection: "row", gap: 5 },
  filter: {
    alignItems: "center",
    borderColor: LINE,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 58,
    paddingHorizontal: 10,
  },
  filterOn: { backgroundColor: INK },
  filterText: { fontSize: 8, color: INK },
  filterTextOn: { color: PAPER },
  ticketList: { borderTopColor: LINE, borderTopWidth: 1 },
  ticket: {
    alignItems: "center",
    borderBottomColor: LINE,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 72,
    paddingVertical: 8,
  },
  ticketMain: { flex: 1 },
  ticketSubject: { color: INK, fontSize: 10, fontWeight: "900" },
  ticketMeta: { color: MUTED, fontSize: 7, marginTop: 4 },
  ticketRight: { alignItems: "flex-end", width: 80 },
  status: {
    backgroundColor: "#E9DFC8",
    color: "#775B21",
    fontSize: 6,
    fontWeight: "900",
    padding: 4,
  },
  resolved: { backgroundColor: "#E0ECE3", color: GREEN },
  updated: { color: MUTED, fontSize: 6, marginTop: 5 },
  chev: { color: GOLD, fontSize: 20, marginLeft: 6 },
  urgent: {
    alignItems: "center",
    backgroundColor: INK,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 13,
  },
  urgentTitle: { color: PAPER, fontSize: 12, fontWeight: "900" },
  urgentText: { color: "#C9C7C0", fontSize: 8, marginTop: 3 },
  call: {
    alignItems: "center",
    borderColor: GOLD,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 15,
  },
  callText: { color: GOLD, fontSize: 9, fontWeight: "900" },
  prototypeNote: { color: MUTED, fontSize: 7, lineHeight: 10, marginTop: -10 },
  scrim: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,.55)",
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },
  modal: { backgroundColor: IVORY, maxWidth: 340, padding: 20, width: "100%" },
  modalTitle: { color: INK, fontSize: 18, fontWeight: "900" },
  modalBody: { color: MUTED, fontSize: 12, lineHeight: 19, marginVertical: 12 },
  close: {
    alignItems: "center",
    backgroundColor: INK,
    justifyContent: "center",
    minHeight: 44,
  },
  closeText: { color: PAPER, fontWeight: "800" },
  choice: {
    borderBottomColor: LINE,
    borderBottomWidth: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  choiceText: { color: INK, fontSize: 12, fontWeight: "700" },
});
