import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoAction, DemoImageFrame, DemoListRow, DemoProgressRail, DemoSectionTitle } from './OfflineDemoPrimitives';
import { DemoChatExperience } from './DemoChatExperience';
import { DemoExplorer } from './DemoExplorer';

import { demoVisualAssets } from './demo-visual-assets';
import { currentDelivery, offlineProject, type OfflineDemoAction, type OfflineDemoState } from './offline-demo';

const { source: evidence } = demoVisualAssets.inspection;


type Props = { state: OfflineDemoState; onAction: (action: OfflineDemoAction) => void };

export function OfflineEmployeeViews({ state, onAction }: Props) {
  switch (state.selectedTab) {
    case 'attendance': return <AttendanceView />;
    case 'projects': return <ProjectsView onAction={onAction} state={state} />;
    case 'tasks': return state.fieldReviewOpen ? <ReviewView onAction={onAction} /> : <WorkView onAction={onAction} state={state} />;
    case 'chat': return <DemoChatExperience state={state} onAction={onAction} />;
    default: return <AttendanceView />;
  }
}

function ProjectsView({ state, onAction }: Pick<Props, 'state' | 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>ASSIGNED PORTFOLIO</Text><Text style={styles.title}>My Projects</Text><DemoExplorer onAction={onAction} state={state} /></View>;
}

export const EMPLOYEE_ATTENDANCE_VISUAL_METRICS = { supportedWidths: [320, 360, 390, 480] as const, minimumTarget: 44, cardRadius: 14, pageGutter: 23, checkControlDiameter: 126 };

type AttendancePhase = 'checked-out' | 'holding-check-in' | 'checked-in' | 'holding-check-out';
type AttendanceActivity = { id: string; date: string; detail: 'Checked in' | 'Checked out'; time: string; tone: 'green' | 'gold' };
type AttendanceViewProps = { now?: () => Date; holdDurationMs?: number };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOLD_RING_SEGMENTS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2 - Math.PI / 2;
  return { index, left: 60 + Math.cos(angle) * 59, top: 60 + Math.sin(angle) * 59, rotation: `${index * 15}deg` };
});
const INITIAL_ACTIVITY: AttendanceActivity[] = [
  { id: 'prior-1', date: 'Yesterday', detail: 'Checked out', time: '06:14 PM', tone: 'green' },
  { id: 'prior-2', date: '16 Aug 2025', detail: 'Checked in', time: '08:39 AM', tone: 'green' },
  { id: 'prior-3', date: '15 Aug 2025', detail: 'Checked out', time: '06:07 PM', tone: 'gold' },
];
function formatISTTime(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${String(hours % 12 || 12).padStart(2, '0')}:${minutes} ${hours >= 12 ? 'PM' : 'AM'} IST`;
}
function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}h ${String(totalMinutes % 60).padStart(2, '0')}m`;
}

export function AttendanceView({ now = () => new Date(), holdDurationMs = 800 }: AttendanceViewProps = {}) {
  const { width } = useWindowDimensions();
  const narrow = width <= 360;
  const compact = width <= 340;
  const [phase, setPhase] = useState<AttendancePhase>('checked-out');
  const [feedback, setFeedback] = useState('');
  const [displayTime, setDisplayTime] = useState('08:42 IST');
  const [checkInAt, setCheckInAt] = useState<Date | null>(null);
  const [workedMs, setWorkedMs] = useState(0);
  const [presentDay, setPresentDay] = useState<string | null>(null);
  const [activities, setActivities] = useState(INITIAL_ACTIVITY);
  const progress = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const phaseRef = useRef(phase);
  const completedRef = useRef(false);
  phaseRef.current = phase;
  useEffect(() => () => progress.stopAnimation(), [progress]);
  const checkedIn = phase === 'checked-in' || phase === 'holding-check-out';
  const holding = phase === 'holding-check-in' || phase === 'holding-check-out';
  const announce = (message: string) => { setFeedback(message); AccessibilityInfo.announceForAccessibility?.(message); };
  const complete = () => {
    if (completedRef.current || !phaseRef.current.startsWith('holding-')) return;
    completedRef.current = true;
    const completedAt = now();
    const time = formatISTTime(completedAt);
    if (phaseRef.current === 'holding-check-in') {
      setPhase('checked-in'); setCheckInAt(completedAt); setPresentDay(WEEKDAYS[completedAt.getDay()]); setDisplayTime(time);
      setActivities(items => [{ id: `in-${completedAt.getTime()}`, date: 'Today', detail: 'Checked in', time, tone: 'green' }, ...items]);
      announce(`Checked in successfully at Amaravati Solar Commons, ${time}.`);
    } else {
      setPhase('checked-out'); setDisplayTime(time);
      if (checkInAt) setWorkedMs(value => value + Math.max(0, completedAt.getTime() - checkInAt.getTime()));
      setCheckInAt(null);
      setActivities(items => [{ id: `out-${completedAt.getTime()}`, date: 'Today', detail: 'Checked out', time, tone: 'gold' }, ...items]);
      announce(`Checked out successfully at Amaravati Solar Commons, ${time}.`);
    }
    progress.setValue(0);
  };
  const startHold = () => {
    if (holding) return;
    completedRef.current = false;
    const next: AttendancePhase = checkedIn ? 'holding-check-out' : 'holding-check-in';
    phaseRef.current = next; setPhase(next); progress.setValue(0);
    Animated.spring(pressScale, { friction: 8, tension: 170, toValue: .965, useNativeDriver: true }).start();
    Animated.timing(progress, { duration: holdDurationMs, toValue: 1, useNativeDriver: true }).start(({ finished }) => { if (finished) complete(); });
  };
  const releasePressScale = () => Animated.spring(pressScale, { friction: 7, tension: 150, toValue: 1, useNativeDriver: true }).start();
  const cancelHold = () => {
    if (!phaseRef.current.startsWith('holding-') || completedRef.current) return;
    progress.stopAnimation(); progress.setValue(0); releasePressScale();
    const idle = phaseRef.current === 'holding-check-out' ? 'checked-in' : 'checked-out';
    phaseRef.current = idle; setPhase(idle);
  };
  const finishHold = () => { if (!phaseRef.current.startsWith('holding-')) startHold(); complete(); releasePressScale(); };
  const today = presentDay ?? WEEKDAYS[new Date().getDay()];
  const presentDays = presentDay ? 4 : 3;
  const displayedWorkedMs = workedMs;
  const action = checkedIn ? 'Check out' : 'Check in';
  const completedCheckout = !checkedIn && feedback.startsWith('Checked out successfully');
  const stateTitle = holding ? (checkedIn ? 'Checking out' : 'Checking in') : checkedIn ? 'Checked in' : completedCheckout ? 'Checked out' : 'Ready to check in';
  return <View style={styles.attendancePage} testID="employee-attendance-page">
    <View style={[styles.checkCard, narrow && styles.checkCardNarrow, compact && styles.checkCardCompact]}>
      <Text style={styles.category}>TODAY · ON SITE</Text>
      <Text accessibilityLiveRegion="polite" style={styles.checkTitle} testID="attendance-state">{stateTitle}</Text>
      <View style={styles.siteLine}><LineIcon name="pin" /><Text style={styles.siteName}>Amaravati Solar Commons</Text><View style={styles.dividerVertical} /><Text style={styles.time}>{displayTime}</Text></View>
      <View style={styles.verifiedRow}><View style={styles.checkDot}><Text style={styles.checkDotText}>✓</Text></View><Text style={styles.verified}>Location verified</Text></View>
      <View style={styles.rule} />
      <View style={styles.checkControlRow}><Animated.View style={[styles.checkControlHalo, holding && styles.checkControlHaloActive, { transform: [{ scale: pressScale }] }]}><Pressable accessibilityActions={[{ name: 'activate', label: action }]} accessibilityHint={`Hold for ${holdDurationMs} milliseconds to ${action.toLowerCase()}`} accessibilityLabel={`Long press to ${action.toLowerCase()}`} accessibilityRole="button" delayLongPress={holdDurationMs} onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === 'activate') finishHold(); }} onLongPress={finishHold} onPressIn={startHold} onPressOut={cancelHold} style={[styles.checkControl, checkedIn && styles.checkControlDone, completedCheckout && styles.checkControlCheckedOut]} testID="attendance-check-in-control"><View style={[styles.checkRing, checkedIn && styles.checkRingDone]}><AttendanceActionIcon checkedIn={checkedIn} completedCheckout={completedCheckout} holding={holding} /><Text style={[styles.controlAction, holding && styles.controlActionHolding, checkedIn && styles.controlActionDone]}>{holding ? 'KEEP HOLDING' : action.toUpperCase()}</Text><Text style={[styles.controlDuration, checkedIn && styles.controlDurationDone]}>{holding ? 'RELEASE TO CANCEL' : 'HOLD 0.8 SEC'}</Text></View>{holding ? <View pointerEvents="none" style={styles.progressSweep} testID="attendance-progress-ring">{HOLD_RING_SEGMENTS.map(({ index, left, top, rotation }) => <Animated.View key={index} style={[styles.progressSegment, checkedIn && styles.progressSegmentOut, { left, opacity: progress.interpolate({ inputRange: [index / 24, Math.min(1, (index + 1) / 24)], outputRange: [.12, 1], extrapolate: 'clamp' }), top, transform: [{ rotate: rotation }] }]} />)}<Animated.View style={[styles.progressCapOrbit, { transform: [{ rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}><View style={[styles.progressCap, checkedIn && styles.progressCapOut]} /></Animated.View></View> : null}</Pressable></Animated.View></View>
      {feedback && !holding ? <View style={[styles.noteRow, styles.successNoteRow]}><LineIcon name="shield" /><Text accessibilityLiveRegion="polite" style={[styles.verificationNote, styles.successNote]} testID="attendance-feedback">{feedback}</Text></View> : null}
    </View>
    <View style={styles.twoColumn}>
      <Pressable accessibilityLabel="Detected location details" accessibilityRole="button" onPress={() => announce('You are within the allowed Amaravati Solar Commons site area.')} style={[styles.halfCard, narrow && styles.halfCardNarrow, compact && styles.halfCardCompact]}>
        <View style={styles.headingRow}><LineIcon name="pin" /><Text style={styles.cardHeading}>Detected location</Text></View><Text style={styles.locationName}>Amaravati Solar Commons</Text><View style={styles.geofence}><LineIcon name="shield" /><Text style={styles.geofenceText}>Geofence active</Text></View>
      </Pressable>
      <Pressable accessibilityLabel="Today’s attendance details" accessibilityRole="button" onPress={() => announce('Today’s shift is 09:00 to 18:00, reporting to Arjun Mehta.')} style={[styles.halfCard, narrow && styles.halfCardNarrow, compact && styles.halfCardCompact]}>
        <View style={styles.headingRow}><LineIcon name="calendar" /><Text style={styles.cardHeading}>Today’s details</Text></View><DetailRow icon="clock" label="Shift" value="09:00 – 18:00" /><DetailRow icon="user" label="Reporting manager" value="Arjun Mehta" /><DetailRow icon="shield" label="Attendance mode" value="Selfie + GPS" />
      </Pressable>
    </View>
    <Pressable accessibilityLabel="This week attendance summary" accessibilityRole="button" onPress={() => announce(`This week: ${presentDays} of 5 present days and ${formatDuration(displayedWorkedMs)} worked today.`)} style={styles.weekCard} testID="attendance-weekly-summary">
      <View style={styles.headingRow}><LineIcon name="bars" /><Text style={styles.cardHeading}>This week</Text></View><View style={styles.days}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => { const status = day === presentDay || ['Mon','Tue','Wed'].includes(day) ? '✓' : day === today ? '•' : '–'; return <View key={day} style={styles.day}><Text style={styles.dayLabel}>{day}</Text><View style={[styles.dayStatus, day === today && styles.todayStatus]}><Text style={[styles.dayMark, status === '✓' && styles.green]}>{status}</Text></View></View>; })}</View><View style={styles.weekMetrics}><Metric label="Present days" value={String(presentDays)} suffix=" / 5" /><Metric label="On-time rate" value="100" suffix="%" gold /><Metric label="Hours today" value={formatDuration(displayedWorkedMs)} /></View>
    </Pressable>
    <View style={styles.activityCard} testID="attendance-recent-activity"><View style={styles.activityHeader}><View style={styles.headingRow}><LineIcon name="clock" /><Text style={styles.cardHeading}>Recent activity</Text></View><Pressable accessibilityLabel="View all recent activity" accessibilityRole="button" onPress={() => announce('All recent attendance activity is shown.')} style={styles.compactTarget}><Text style={styles.viewAll}>View all</Text><LineIcon name="chevron" /></Pressable></View>{activities.map(item => <ActivityRow key={item.id} {...item} />)}</View>
  </View>;
}

type AttendanceIcon = 'pin' | 'shield' | 'calendar' | 'clock' | 'user' | 'bars' | 'chevron';
function LineIcon({ name }: { name: AttendanceIcon }) {
  if (name === 'pin') return <View importantForAccessibility="no" style={styles.iconPin}><View style={styles.iconPinHole} /></View>;
  if (name === 'shield') return <View importantForAccessibility="no" style={styles.iconShield}><View style={styles.shieldCheck} /></View>;
  if (name === 'calendar') return <View importantForAccessibility="no" style={styles.iconCalendar}><View style={styles.calendarTop} /></View>;
  if (name === 'clock') return <View importantForAccessibility="no" style={styles.iconClock}><View style={styles.clockHandV} /><View style={styles.clockHandH} /></View>;
  if (name === 'user') return <View importantForAccessibility="no" style={styles.iconUser}><View style={styles.userHead} /><View style={styles.userBody} /></View>;
  if (name === 'bars') return <View importantForAccessibility="no" style={styles.iconBars}><View style={[styles.bar, { height: 7 }]} /><View style={[styles.bar, { height: 12 }]} /><View style={[styles.bar, { height: 9 }]} /></View>;
  return <View importantForAccessibility="no" style={styles.iconChevron} />;
}
function AttendanceActionIcon({ checkedIn, completedCheckout, holding }: { checkedIn: boolean; completedCheckout: boolean; holding: boolean }) {
  const outgoing = checkedIn;
  return <View importantForAccessibility="no" style={[styles.attendanceActionIcon, outgoing && styles.attendanceActionIconOut]}>
    {completedCheckout && !holding ? <View style={styles.actionCheck}><View style={styles.actionCheckStem} /><View style={styles.actionCheckArm} /></View> : <View style={[styles.actionArrow, outgoing && styles.actionArrowOut]}><View style={styles.actionArrowShaft} /><View style={styles.actionArrowHead} /></View>}
  </View>;
}
function DetailRow({ icon, label, value }: { icon: AttendanceIcon; label: string; value: string }) { return <View style={styles.detailRow}><LineIcon name={icon} /><Text style={styles.detailRowLabel}>{label}</Text><Text style={styles.detailRowValue}>{value}</Text></View>; }
function Metric({ label, value, suffix, gold }: { label: string; value: string; suffix?: string; gold?: boolean }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, gold && styles.goldMetric]}>{value}<Text style={styles.metricSuffix}>{suffix}</Text></Text></View>; }
function ActivityRow({ date, detail, time, tone }: { date: string; detail: string; time: string; tone: 'green' | 'gold' }) { return <View accessible accessibilityLabel={`${date}, ${detail}, ${time}`} style={styles.activityRow}><View importantForAccessibility="no" style={[styles.activityIcon, tone === 'gold' && styles.activityIconGold]}><View style={[styles.activityArrow, tone === 'gold' && styles.activityArrowGold]} /><View style={[styles.activityArrow, styles.activityArrowReverse, tone === 'gold' && styles.activityArrowGold]} /></View><View importantForAccessibility="no" style={styles.activityCopy}><Text style={styles.activityDate}>{date}</Text><Text style={styles.smallMuted}>{detail}</Text></View><Text importantForAccessibility="no" style={styles.activityTime}>{time}</Text><LineIcon name="chevron" /></View>; }


function WorkView({ state, onAction }: Pick<Props, 'state' | 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>AMARAVATI SOLAR COMMONS</Text><Text style={styles.title}>My Tasks</Text><View style={styles.workCard}><Text style={styles.workLabel}>Current work package</Text><Text style={styles.workTitle}>{offlineProject.workPackage}</Text><View style={styles.metaRow}><Text style={styles.workMeta}>MILESTONE</Text><Text style={styles.workMetaValue}>{offlineProject.milestone}</Text></View><Text style={styles.workMeta}>NEXT REVIEW · 22 AUG</Text><DemoProgressRail detail="Project delivery" detailColor="#D6D3CD" labelColor={colors.paper} labelTestID="employee-work-progress-label" progress={state.currentProgress} valueLabel={currentDelivery(state)} /></View><DemoSectionTitle title="Recent submissions" trailing="View all" /><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><DemoListRow detail="Cabinet checks and inverter-row alignment" meta="TODAY · FIELD UPDATE" title={state.fieldUpdateReviewed ? 'Update added to project activity' : 'Alignment review in progress'} /><DemoAction label="Record progress update" onPress={() => onAction({ type: 'open-field-review' })} /></View>;
}

function ReviewView({ onAction }: Pick<Props, 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>MY WORK / REVIEW</Text><Text style={styles.title}>Review field update</Text><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><View style={styles.reviewCard}><Detail label="COMPLETED WORK" value="Inverter-row alignment and cabinet checks" /><Detail label="CLAIMED PROGRESS" value="68% delivery recorded" /><Detail label="CREW" value="3 specialists · 18 crew hours" /><Detail label="SITE CONDITIONS" value="Dry, clear access route" /><Detail label="BLOCKER" value="No active blocker reported" /></View><DemoAction label="Add update to project timeline" onPress={() => onAction({ type: 'review-field-update' })} /></View>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  attendancePage: { gap: 12 },
  checkCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 14, borderWidth: 1, minHeight: 326, paddingBottom: 12, paddingHorizontal: 16, paddingTop: 20 },
  checkCardNarrow: { minHeight: 340 }, checkCardCompact: { minHeight: 356 },
  checkTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 27, fontWeight: '500', lineHeight: 32, marginTop: 11 },
  siteLine: { alignItems: 'center', flexDirection: 'row', marginTop: 7, minWidth: 0 },
  siteName: { color: colors.ink, flexShrink: 1, fontSize: 14, marginLeft: 9 },
  dividerVertical: { backgroundColor: '#D9D6D0', height: 16, marginHorizontal: 12, width: 1 },
  time: { color: '#696660', fontSize: 13 },
  verifiedRow: { alignItems: 'center', flexDirection: 'row', marginTop: 11 }, checkDot: { alignItems: 'center', backgroundColor: '#15904A', borderRadius: 7, height: 13, justifyContent: 'center', width: 13 }, checkDotText: { color: '#fff', fontSize: 9, fontWeight: '900', lineHeight: 10 }, verified: { color: '#168D4A', fontSize: 12, marginLeft: 8 },
  rule: { backgroundColor: '#E8E6E1', height: 1, marginTop: 18 },
  checkControlRow: { alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  checkControlHalo: { alignItems: 'center', backgroundColor: 'rgba(177, 132, 45, .08)', borderRadius: 72, height: 144, justifyContent: 'center', shadowColor: '#8F6E2D', shadowOffset: { height: 5, width: 0 }, shadowOpacity: .18, shadowRadius: 14, width: 144 },
  checkControlHaloActive: { backgroundColor: 'rgba(177, 132, 45, .15)', shadowOpacity: .28, shadowRadius: 20 },
  checkControl: { alignItems: 'center', backgroundColor: '#FFFCF5', borderColor: '#B58A3A', borderRadius: 63, borderWidth: 1, height: 126, justifyContent: 'center', overflow: 'visible', width: 126 },
  checkRing: { alignItems: 'center', borderColor: '#E8DDC7', borderRadius: 57, borderWidth: 1, height: 114, justifyContent: 'center', width: 114 },
  checkControlDone: { backgroundColor: '#173F32', borderColor: '#2D6C55' }, checkRingDone: { borderColor: 'rgba(247, 235, 207, .28)' }, checkControlCheckedOut: { backgroundColor: '#F8F4E9', borderColor: '#9E7A34' },
  attendanceActionIcon: { alignItems: 'center', backgroundColor: '#B58A3A', borderRadius: 16, height: 31, justifyContent: 'center', marginBottom: 7, width: 31 }, attendanceActionIconOut: { backgroundColor: '#F2DCAD' },
  actionArrow: { height: 18, transform: [{ rotate: '90deg' }], width: 18 }, actionArrowOut: { transform: [{ rotate: '-90deg' }] }, actionArrowShaft: { backgroundColor: '#FFFDF8', height: 1.8, left: 3, position: 'absolute', top: 8, width: 12 }, actionArrowHead: { borderRightColor: '#FFFDF8', borderRightWidth: 1.8, borderTopColor: '#FFFDF8', borderTopWidth: 1.8, height: 7, position: 'absolute', right: 2, top: 5, transform: [{ rotate: '45deg' }], width: 7 },
  actionCheck: { height: 18, transform: [{ rotate: '-45deg' }], width: 18 }, actionCheckStem: { backgroundColor: '#FFFDF8', bottom: 3, height: 8, left: 4, position: 'absolute', width: 2 }, actionCheckArm: { backgroundColor: '#FFFDF8', bottom: 3, height: 2, left: 4, position: 'absolute', width: 12 },
  controlAction: { color: '#6F5118', fontSize: 12, fontWeight: '900', letterSpacing: 1.25 }, controlActionHolding: { fontSize: 10, letterSpacing: .9 }, controlActionDone: { color: '#FFF6E1' }, controlDuration: { color: '#9D8250', fontSize: 8, fontWeight: '700', letterSpacing: .8, marginTop: 4 }, controlDurationDone: { color: '#C7B992' },
  progressSweep: { height: 126, left: -1, position: 'absolute', top: -1, width: 126 }, progressSegment: { backgroundColor: '#B1842D', borderRadius: 3, height: 4, marginLeft: -4, marginTop: -2, position: 'absolute', width: 8 }, progressSegmentOut: { backgroundColor: '#F1D28D' }, progressCapOrbit: { height: 126, left: 0, position: 'absolute', top: 0, width: 126 }, progressCap: { backgroundColor: '#B1842D', borderColor: '#FFFDF8', borderRadius: 5, borderWidth: 1.5, height: 10, left: 58, position: 'absolute', top: -1.5, width: 10 }, progressCapOut: { backgroundColor: '#F1D28D', borderColor: '#173F32' },
  noteRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 10, minHeight: 28, paddingHorizontal: 4 }, successNoteRow: { backgroundColor: '#F0F8F2', borderRadius: 8 }, verificationNote: { color: '#77736D', flexShrink: 1, fontSize: 10, lineHeight: 14, marginLeft: 7, textAlign: 'center' }, successNote: { color: '#257746', fontWeight: '700' },
  twoColumn: { flexDirection: 'row', gap: 10 },
  halfCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 13, borderWidth: 1, flex: 1, height: 170, padding: 14 },
  halfCardNarrow: { height: 180 }, halfCardCompact: { height: 190 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 9 }, cardHeading: { color: '#25231F', fontFamily: 'serif', fontSize: 14, fontWeight: '500' },
  locationName: { color: '#24221F', fontFamily: 'serif', fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 20 },
  geofence: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#EFF8F0', borderRadius: 14, flexDirection: 'row', gap: 6, marginTop: 10, paddingHorizontal: 7, paddingVertical: 5 }, geofenceText: { color: '#24814A', fontSize: 10 },
  smallMuted: { color: '#77736E', fontSize: 9, lineHeight: 13 },
  detailRow: { alignItems: 'center', borderBottomColor: '#ECE9E4', borderBottomWidth: 1, flexDirection: 'row', gap: 8, height: 36 },
  detailRowLabel: { color: '#76716A', flex: 1, fontSize: 9 }, detailRowValue: { color: '#35322E', fontSize: 9 },
  weekCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 13, borderWidth: 1, height: 180, padding: 14 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, day: { alignItems: 'center', flex: 1, gap: 5 }, dayLabel: { color: '#3F3B36', fontSize: 8 },
  dayStatus: { alignItems: 'center', backgroundColor: '#F5F5F3', borderRadius: 13, height: 25, justifyContent: 'center', width: 25 }, todayStatus: { backgroundColor: '#FFFDF8', borderColor: '#B28A36', borderRadius: 8, borderWidth: 1, height: 40, marginTop: -7, width: 38 }, dayMark: { color: '#98958F', fontSize: 10 }, green: { color: '#29A35C' },
  weekMetrics: { borderTopColor: '#EAE7E2', borderTopWidth: 1, flexDirection: 'row', marginTop: 13, paddingTop: 11 }, metric: { alignItems: 'center', borderRightColor: '#ECE9E4', borderRightWidth: 1, flex: 1 }, metricLabel: { color: '#77736D', fontSize: 9 }, metricValue: { color: '#161512', fontFamily: 'serif', fontSize: 21, marginTop: 4 }, metricSuffix: { color: '#85817A', fontSize: 9 }, goldMetric: { color: '#AD8129' },
  activityCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 13, borderWidth: 1, minHeight: 198, paddingHorizontal: 13, paddingTop: 7 }, activityHeader: { alignItems: 'center', flexDirection: 'row', height: 42, justifyContent: 'space-between' }, compactTarget: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44, minWidth: 76 }, viewAll: { color: '#A27B29', fontSize: 10 },
  activityRow: { alignItems: 'center', borderTopColor: '#EAE7E2', borderTopWidth: 1, flexDirection: 'row', height: 49 }, activityIcon: { alignItems: 'center', backgroundColor: '#EDF7EF', borderRadius: 16, height: 28, justifyContent: 'center', width: 28 }, activityIconGold: { backgroundColor: '#FBF6E9' }, activityCopy: { flex: 1, gap: 2, marginLeft: 14 }, activityDate: { color: '#2D2A26', fontSize: 10 }, activityTime: { color: '#77736E', fontSize: 9, marginRight: 12 },
  iconPin: { borderColor: '#B08A3D', borderRadius: 8, borderWidth: 1.5, height: 14, transform: [{ rotate: '45deg' }], width: 14 }, iconPinHole: { borderColor: '#B08A3D', borderRadius: 2, borderWidth: 1, height: 4, left: 4, position: 'absolute', top: 4, width: 4 }, iconShield: { borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderColor: '#9B8A62', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1.2, height: 15, width: 13 }, shieldCheck: { borderBottomColor: '#278B50', borderBottomWidth: 1, borderRightColor: '#278B50', borderRightWidth: 1, height: 5, left: 4, position: 'absolute', top: 3, transform: [{ rotate: '45deg' }], width: 3 }, iconCalendar: { borderColor: '#9B8A62', borderRadius: 2, borderWidth: 1.2, height: 14, width: 15 }, calendarTop: { borderTopColor: '#9B8A62', borderTopWidth: 1, left: 1, position: 'absolute', right: 1, top: 4 }, iconClock: { borderColor: '#9B8A62', borderRadius: 8, borderWidth: 1.2, height: 15, width: 15 }, clockHandV: { backgroundColor: '#9B8A62', height: 5, left: 6, position: 'absolute', top: 3, width: 1 }, clockHandH: { backgroundColor: '#9B8A62', height: 1, left: 6, position: 'absolute', top: 7, transform: [{ rotate: '30deg' }], width: 4 }, iconUser: { height: 15, width: 15 }, userHead: { borderColor: '#9B8A62', borderRadius: 4, borderWidth: 1.1, height: 7, left: 4, position: 'absolute', width: 7 }, userBody: { borderColor: '#9B8A62', borderRadius: 7, borderWidth: 1.1, bottom: 0, height: 7, position: 'absolute', width: 15 }, iconBars: { alignItems: 'flex-end', flexDirection: 'row', gap: 2, height: 14, width: 15 }, bar: { backgroundColor: '#B08A3D', width: 3 }, iconChevron: { borderRightColor: '#AA9B78', borderRightWidth: 1, borderTopColor: '#AA9B78', borderTopWidth: 1, height: 6, transform: [{ rotate: '45deg' }], width: 6 }, activityArrow: { borderLeftColor: '#25A05A', borderLeftWidth: 1.2, borderTopColor: '#25A05A', borderTopWidth: 1.2, height: 6, position: 'absolute', transform: [{ rotate: '-45deg' }], width: 6 }, activityArrowReverse: { transform: [{ rotate: '135deg' }] }, activityArrowGold: { borderLeftColor: '#B08A3D', borderTopColor: '#B08A3D' },
  feedback: { color: '#257746', fontSize: 10, lineHeight: 14, textAlign: 'center' },
  page: { gap: spacing.md }, eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, title: { color: colors.ink, fontFamily: 'serif', fontSize: 32, fontWeight: '800', lineHeight: 37 }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 22 }, projectCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, category: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, project: { color: colors.ink, fontSize: 22, fontWeight: '800' }, workCard: { backgroundColor: colors.ink, borderRadius: radii.md, gap: spacing.sm, padding: spacing.md }, workLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .9 }, workTitle: { color: colors.paper, fontSize: 21, fontWeight: '800', lineHeight: 27 }, workMeta: { color: '#D6D3CD', fontSize: 11, fontWeight: '800', letterSpacing: .55 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between' }, workMetaValue: { color: colors.paper, fontSize: 12, fontWeight: '800' }, checklist: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, checklistTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, check: { color: colors.muted, fontSize: 14, lineHeight: 20 }, reviewCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, detail: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3, paddingBottom: spacing.sm }, detailLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, detailValue: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 }, thread: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, threadTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, incoming: { alignSelf: 'flex-start', backgroundColor: colors.statusStructuralSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm }, outgoing: { alignSelf: 'flex-end', backgroundColor: colors.statusAssuredSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm },
});
