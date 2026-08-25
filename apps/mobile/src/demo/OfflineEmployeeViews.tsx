import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export const EMPLOYEE_ATTENDANCE_VISUAL_METRICS = { supportedWidths: [320, 360, 390, 480] as const, minimumTarget: 44, cardRadius: 12 };

export function AttendanceView() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [feedback, setFeedback] = useState('');
  const announce = (message: string) => setFeedback(message);
  const completeCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    announce('Checked in successfully at Amaravati Solar Commons, 08:43 IST.');
  };
  return <View style={styles.attendancePage} testID="employee-attendance-page">
    <View style={styles.headingBlock}><Text style={styles.eyebrow}>FIELD EMPLOYEE</Text><Text style={styles.title}>Attendance</Text><Text style={styles.attendanceSubtitle}>Check in, verify your location and manage your day on site.</Text></View>
    <View style={styles.checkCard}>
      <Text style={styles.category}>TODAY · ON SITE</Text>
      <Text accessibilityLiveRegion="polite" style={styles.checkTitle}>{checkedIn ? 'Checked in' : 'Ready to check in'}</Text>
      <View style={styles.siteLine}><Text style={styles.pinGlyph}>◆</Text><Text style={styles.siteName}>Amaravati Solar Commons</Text><View style={styles.dividerVertical} /><Text style={styles.time}>{checkedIn ? '08:43 IST' : '08:42 IST'}</Text></View>
      <Text style={styles.verified}>●  Location verified</Text>
      <View style={styles.rule} />
      <View style={styles.checkControlRow}><Text importantForAccessibility="no" style={styles.pressArrows}>›››</Text><Pressable accessibilityActions={[{ name: 'activate', label: 'Check in' }]} accessibilityHint={checkedIn ? undefined : 'Hold for one second to confirm your location and check in'} accessibilityLabel={checkedIn ? 'Checked in at Amaravati Solar Commons' : 'Long press to check in'} accessibilityRole="button" accessibilityState={{ disabled: checkedIn }} delayLongPress={800} disabled={checkedIn} onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === 'activate') completeCheckIn(); }} onLongPress={completeCheckIn} style={[styles.checkControl, checkedIn && styles.checkControlDone]} testID="attendance-check-in-control"><Text importantForAccessibility="no" style={styles.finger}>{checkedIn ? '✓' : '♧'}</Text></Pressable><Text importantForAccessibility="no" style={[styles.pressArrows, styles.reverseArrows]}>‹‹‹</Text></View>
      <Text style={styles.longPressLabel}>{checkedIn ? 'Checked in successfully' : 'Long press to check in'}</Text>
      <Text style={styles.verificationNote}>♢  Photo verification and live location will be confirmed after check-in.</Text>
    </View>
    <View style={styles.twoColumn}>
      <Pressable accessibilityLabel="Detected location details" accessibilityRole="button" onPress={() => announce('You are within the allowed Amaravati Solar Commons site area.')} style={styles.halfCard}>
        <Text style={styles.cardHeading}><Text style={styles.goldIcon}>◆  </Text>Detected location</Text><Text style={styles.locationName}>Amaravati Solar Commons</Text><Text style={styles.geofence}>◇  Geofence active</Text><Text style={styles.smallMuted}>You are within the allowed site area.</Text>
      </Pressable>
      <Pressable accessibilityLabel="Today’s attendance details" accessibilityRole="button" onPress={() => announce('Today’s shift is 09:00 to 18:00, reporting to Arjun Mehta.')} style={styles.halfCard}>
        <Text style={styles.cardHeading}><Text style={styles.goldIcon}>□  </Text>Today’s details</Text><DetailRow label="◷   Shift" value="09:00 – 18:00" /><DetailRow label="♙   Reporting manager" value="Arjun Mehta" /><DetailRow label="◇   Attendance mode" value="Selfie + GPS" />
      </Pressable>
    </View>
    <Pressable accessibilityLabel="This week attendance summary" accessibilityRole="button" onPress={() => announce('This week: 3 of 5 present days and 100 percent on-time.')} style={styles.weekCard}>
      <Text style={styles.cardHeading}><Text style={styles.goldIcon}>▥  </Text>This week</Text><View style={styles.days}>{[['Mon','✓'],['Tue','✓'],['Wed','✓'],['Thu','•'],['Fri','–'],['Sat','–'],['Sun','–']].map(([day,status]) => <View key={day} style={styles.day}><Text style={styles.dayLabel}>{day}</Text><View style={[styles.dayStatus, day === 'Thu' && styles.todayStatus]}><Text style={[styles.dayMark, status === '✓' && styles.green]}>{status}</Text></View></View>)}</View><View style={styles.weekMetrics}><Metric label="Present days" value="3" suffix=" / 5" /><Metric label="On-time rate" value="100" suffix="%" gold /><Metric label="Hours today" value="00h 00m" /></View>
    </Pressable>
    <View style={styles.activityCard}><View style={styles.activityHeader}><Text style={styles.cardHeading}>◷  Recent activity</Text><Pressable accessibilityLabel="View all recent activity" accessibilityRole="button" onPress={() => announce('All recent attendance activity is shown.')} style={styles.compactTarget}><Text style={styles.viewAll}>View all  ›</Text></Pressable></View><ActivityRow date="Yesterday" detail="Checked out" time="06:14 PM" tone="green" /><ActivityRow date="16 Aug 2025" detail="Checked in" time="08:39 AM" tone="green" /><ActivityRow date="15 Aug 2025" detail="Checked out" time="06:07 PM" tone="gold" /></View>
    {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback} testID="attendance-feedback">{feedback}</Text> : null}
  </View>;
}

function DetailRow({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><Text style={styles.detailRowLabel}>{label}</Text><Text style={styles.detailRowValue}>{value}</Text></View>; }
function Metric({ label, value, suffix, gold }: { label: string; value: string; suffix?: string; gold?: boolean }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, gold && styles.goldMetric]}>{value}<Text style={styles.metricSuffix}>{suffix}</Text></Text></View>; }
function ActivityRow({ date, detail, time, tone }: { date: string; detail: string; time: string; tone: 'green' | 'gold' }) { return <View accessible accessibilityLabel={`${date}, ${detail}, ${time}`} style={styles.activityRow}><View importantForAccessibility="no" style={[styles.activityIcon, tone === 'gold' && styles.activityIconGold]}><Text style={tone === 'green' ? styles.green : styles.goldIcon}>↔</Text></View><View importantForAccessibility="no" style={styles.activityCopy}><Text style={styles.activityDate}>{date}</Text><Text style={styles.smallMuted}>{detail}</Text></View><Text importantForAccessibility="no" style={styles.activityTime}>{time}</Text><Text importantForAccessibility="no" style={styles.activityChevron}>›</Text></View>; }


function WorkView({ state, onAction }: Pick<Props, 'state' | 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>AMARAVATI SOLAR COMMONS</Text><Text style={styles.title}>My Tasks</Text><View style={styles.workCard}><Text style={styles.workLabel}>Current work package</Text><Text style={styles.workTitle}>{offlineProject.workPackage}</Text><View style={styles.metaRow}><Text style={styles.workMeta}>MILESTONE</Text><Text style={styles.workMetaValue}>{offlineProject.milestone}</Text></View><Text style={styles.workMeta}>NEXT REVIEW · 22 AUG</Text><DemoProgressRail detail="Project delivery" detailColor="#D6D3CD" labelColor={colors.paper} labelTestID="employee-work-progress-label" progress={state.currentProgress} valueLabel={currentDelivery(state)} /></View><DemoSectionTitle title="Recent submissions" trailing="View all" /><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><DemoListRow detail="Cabinet checks and inverter-row alignment" meta="TODAY · FIELD UPDATE" title={state.fieldUpdateReviewed ? 'Update added to project activity' : 'Alignment review in progress'} /><DemoAction label="Record progress update" onPress={() => onAction({ type: 'open-field-review' })} /></View>;
}

function ReviewView({ onAction }: Pick<Props, 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>MY WORK / REVIEW</Text><Text style={styles.title}>Review field update</Text><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><View style={styles.reviewCard}><Detail label="COMPLETED WORK" value="Inverter-row alignment and cabinet checks" /><Detail label="CLAIMED PROGRESS" value="68% delivery recorded" /><Detail label="CREW" value="3 specialists · 18 crew hours" /><Detail label="SITE CONDITIONS" value="Dry, clear access route" /><Detail label="BLOCKER" value="No active blocker reported" /></View><DemoAction label="Add update to project timeline" onPress={() => onAction({ type: 'review-field-update' })} /></View>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  attendancePage: { gap: 12 },
  headingBlock: { gap: 3, marginBottom: 2 },
  attendanceSubtitle: { color: '#66635E', fontSize: 13, lineHeight: 18 },
  checkCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 12, borderWidth: 1, minHeight: 360, padding: 15 },
  checkTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 25, fontWeight: '700', lineHeight: 30, marginTop: 8 },
  siteLine: { alignItems: 'center', flexDirection: 'row', marginTop: 7, minWidth: 0 },
  pinGlyph: { color: '#B58A3A', fontSize: 10, marginRight: 8 },
  siteName: { color: colors.ink, flexShrink: 1, fontSize: 13 },
  dividerVertical: { backgroundColor: '#D9D6D0', height: 15, marginHorizontal: 12, width: 1 },
  time: { color: '#696660', fontSize: 12 },
  verified: { color: '#168D4A', fontSize: 11, marginTop: 10 },
  rule: { backgroundColor: '#E8E6E1', height: 1, marginTop: 14 },
  checkControlRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  checkControl: { alignItems: 'center', backgroundColor: '#FCFAF5', borderColor: '#A9853F', borderRadius: 64, borderWidth: 1.5, height: 126, justifyContent: 'center', marginHorizontal: 27, shadowColor: '#8F6E2D', shadowOpacity: .17, shadowRadius: 5, width: 126 },
  checkControlDone: { backgroundColor: '#EDF7EF', borderColor: '#168D4A' },
  finger: { color: '#A67D25', fontSize: 43, fontWeight: '300' },
  pressArrows: { color: '#C3AA70', fontSize: 23, letterSpacing: -2 }, reverseArrows: { letterSpacing: -3 },
  longPressLabel: { color: '#9A741F', fontSize: 12, fontWeight: '700', marginTop: 9, textAlign: 'center' },
  verificationNote: { color: '#77736D', fontSize: 9, lineHeight: 13, marginTop: 10, textAlign: 'center' },
  twoColumn: { flexDirection: 'row', gap: 10 },
  halfCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 11, borderWidth: 1, flex: 1, minHeight: 168, padding: 13 },
  cardHeading: { color: '#25231F', fontFamily: 'serif', fontSize: 13, fontWeight: '600' },
  goldIcon: { color: '#B08A3D' },
  locationName: { color: '#24221F', fontFamily: 'serif', fontSize: 12, fontWeight: '700', lineHeight: 17, marginTop: 19 },
  geofence: { alignSelf: 'flex-start', backgroundColor: '#EFF8F0', borderRadius: 14, color: '#24814A', fontSize: 10, marginTop: 10, paddingHorizontal: 7, paddingVertical: 5 },
  smallMuted: { color: '#77736E', fontSize: 9, lineHeight: 13 },
  detailRow: { alignItems: 'center', borderBottomColor: '#ECE9E4', borderBottomWidth: 1, flexDirection: 'row', minHeight: 34 },
  detailRowLabel: { color: '#76716A', flex: 1, fontSize: 9 }, detailRowValue: { color: '#35322E', fontSize: 9 },
  weekCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 11, borderWidth: 1, minHeight: 176, padding: 14 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 }, day: { alignItems: 'center', flex: 1, gap: 5 }, dayLabel: { color: '#3F3B36', fontSize: 8 },
  dayStatus: { alignItems: 'center', backgroundColor: '#F5F5F3', borderRadius: 13, height: 25, justifyContent: 'center', width: 25 }, todayStatus: { backgroundColor: '#FFFDF8', borderColor: '#B28A36', borderRadius: 8, borderWidth: 1, height: 37, marginTop: -6, width: 37 }, dayMark: { color: '#98958F', fontSize: 10 }, green: { color: '#29A35C' },
  weekMetrics: { borderTopColor: '#EAE7E2', borderTopWidth: 1, flexDirection: 'row', marginTop: 13, paddingTop: 11 }, metric: { alignItems: 'center', borderRightColor: '#ECE9E4', borderRightWidth: 1, flex: 1 }, metricLabel: { color: '#77736D', fontSize: 9 }, metricValue: { color: '#161512', fontFamily: 'serif', fontSize: 20, marginTop: 4 }, metricSuffix: { color: '#85817A', fontSize: 9 }, goldMetric: { color: '#AD8129' },
  activityCard: { backgroundColor: '#FFFFFF', borderColor: '#DEDCD6', borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, paddingTop: 7 }, activityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, compactTarget: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 68 }, viewAll: { color: '#A27B29', fontSize: 10 },
  activityRow: { alignItems: 'center', borderTopColor: '#EAE7E2', borderTopWidth: 1, flexDirection: 'row', minHeight: 51 }, activityIcon: { alignItems: 'center', backgroundColor: '#EDF7EF', borderRadius: 16, height: 28, justifyContent: 'center', width: 28 }, activityIconGold: { backgroundColor: '#FBF6E9' }, activityCopy: { flex: 1, gap: 2, marginLeft: 14 }, activityDate: { color: '#2D2A26', fontSize: 10 }, activityTime: { color: '#77736E', fontSize: 9 }, activityChevron: { color: '#B7A782', fontSize: 20, marginLeft: 10 },
  feedback: { color: '#257746', fontSize: 10, lineHeight: 14, textAlign: 'center' },
  page: { gap: spacing.md }, eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, title: { color: colors.ink, fontFamily: 'serif', fontSize: 32, fontWeight: '800', lineHeight: 37 }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 22 }, projectCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, category: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, project: { color: colors.ink, fontSize: 22, fontWeight: '800' }, workCard: { backgroundColor: colors.ink, borderRadius: radii.md, gap: spacing.sm, padding: spacing.md }, workLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .9 }, workTitle: { color: colors.paper, fontSize: 21, fontWeight: '800', lineHeight: 27 }, workMeta: { color: '#D6D3CD', fontSize: 11, fontWeight: '800', letterSpacing: .55 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between' }, workMetaValue: { color: colors.paper, fontSize: 12, fontWeight: '800' }, checklist: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, checklistTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, check: { color: colors.muted, fontSize: 14, lineHeight: 20 }, reviewCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, detail: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3, paddingBottom: spacing.sm }, detailLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, detailValue: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 }, thread: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, threadTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, incoming: { alignSelf: 'flex-start', backgroundColor: colors.statusStructuralSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm }, outgoing: { alignSelf: 'flex-end', backgroundColor: colors.statusAssuredSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm },
});
