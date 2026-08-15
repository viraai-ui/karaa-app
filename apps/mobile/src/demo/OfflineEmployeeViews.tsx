import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { DemoAction, DemoImageFrame, DemoListRow, DemoProgressRail, DemoSectionTitle } from './OfflineDemoPrimitives';
import { DemoChatExperience } from './DemoChatExperience';
import { DemoExplorer } from './DemoExplorer';
import { DemoTenderExperience } from './DemoTenderExperience';
import { demoVisualAssets } from './demo-visual-assets';
import { currentDelivery, offlineProject, type OfflineDemoAction, type OfflineDemoState } from './offline-demo';

const { source: evidence } = demoVisualAssets.inspection;


type Props = { state: OfflineDemoState; onAction: (action: OfflineDemoAction) => void };

export function OfflineEmployeeViews({ state, onAction }: Props) {
  switch (state.selectedTab) {
    case 'tenders': return <DemoTenderExperience onAction={onAction} role="employee" state={state} />;
    case 'work': return state.fieldReviewOpen ? <ReviewView onAction={onAction} /> : <WorkView onAction={onAction} state={state} />;
    case 'chat': return <DemoChatExperience state={state} onAction={onAction} />;
    case 'power':
    default: return <PowerView onAction={onAction} state={state} />;
  }
}

function PowerView({ state, onAction }: Pick<Props, 'state' | 'onAction'>) {
  return <DemoExplorer onAction={onAction} state={state} />;
}


function WorkView({ state, onAction }: Pick<Props, 'state' | 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>AMARAVATI SOLAR COMMONS</Text><Text style={styles.title}>My Work</Text><View style={styles.workCard}><Text style={styles.workLabel}>Current work package</Text><Text style={styles.workTitle}>{offlineProject.workPackage}</Text><View style={styles.metaRow}><Text style={styles.workMeta}>MILESTONE</Text><Text style={styles.workMetaValue}>{offlineProject.milestone}</Text></View><Text style={styles.workMeta}>NEXT REVIEW · 22 AUG</Text><DemoProgressRail detail="Project delivery" detailColor="#D6D3CD" labelColor={colors.paper} labelTestID="employee-work-progress-label" progress={state.currentProgress} valueLabel={currentDelivery(state)} /></View><DemoSectionTitle title="Recent submissions" trailing="View all" /><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><DemoListRow detail="Cabinet checks and inverter-row alignment" meta="TODAY · FIELD UPDATE" title={state.fieldUpdateReviewed ? 'Update added to project activity' : 'Alignment review in progress'} /><DemoAction label="Record progress update" onPress={() => onAction({ type: 'open-field-review' })} /></View>;
}

function ReviewView({ onAction }: Pick<Props, 'onAction'>) {
  return <View style={styles.page}><Text style={styles.eyebrow}>MY WORK / REVIEW</Text><Text style={styles.title}>Review field update</Text><DemoImageFrame accessibilityLabel="Demo visual: Amaravati inverter inspection" source={evidence} /><View style={styles.reviewCard}><Detail label="COMPLETED WORK" value="Inverter-row alignment and cabinet checks" /><Detail label="CLAIMED PROGRESS" value="68% delivery recorded" /><Detail label="CREW" value="3 specialists · 18 crew hours" /><Detail label="SITE CONDITIONS" value="Dry, clear access route" /><Detail label="BLOCKER" value="No active blocker reported" /></View><DemoAction label="Add update to project timeline" onPress={() => onAction({ type: 'review-field-update' })} /></View>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  page: { gap: spacing.md }, eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, title: { color: colors.ink, fontSize: 32, fontWeight: '800', lineHeight: 37 }, subtitle: { color: colors.muted, fontSize: 16, lineHeight: 22 }, projectCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, category: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, project: { color: colors.ink, fontSize: 22, fontWeight: '800' }, workCard: { backgroundColor: colors.ink, borderRadius: radii.md, gap: spacing.sm, padding: spacing.md }, workLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .9 }, workTitle: { color: colors.paper, fontSize: 21, fontWeight: '800', lineHeight: 27 }, workMeta: { color: '#D6D3CD', fontSize: 11, fontWeight: '800', letterSpacing: .55 }, metaRow: { flexDirection: 'row', justifyContent: 'space-between' }, workMetaValue: { color: colors.paper, fontSize: 12, fontWeight: '800' }, checklist: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, checklistTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, check: { color: colors.muted, fontSize: 14, lineHeight: 20 }, reviewCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, detail: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: 3, paddingBottom: spacing.sm }, detailLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, detailValue: { color: colors.ink, fontSize: 15, fontWeight: '700', lineHeight: 21 }, thread: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md }, threadTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, incoming: { alignSelf: 'flex-start', backgroundColor: colors.statusStructuralSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm }, outgoing: { alignSelf: 'flex-end', backgroundColor: colors.statusAssuredSurface, borderRadius: radii.sm, color: colors.ink, fontSize: 14, lineHeight: 20, padding: spacing.sm },
});
