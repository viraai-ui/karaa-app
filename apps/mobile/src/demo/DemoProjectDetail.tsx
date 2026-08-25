import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import {
  DemoImageFrame,
  DemoProgressRail,
  DemoStatusPill,
  DemoSurfaceBackButton,
} from './OfflineDemoPrimitives';
import { type DemoProject, verticalForId } from './demo-catalog';
import { demoVisualAssets } from './demo-visual-assets';
import type { OfflineDemoAction, OfflineDemoState } from './offline-demo';

type ProjectDetailTab = OfflineDemoState['selectedProjectDetailTab'];
type TimelineFilter = 'all' | 'milestone' | 'site' | 'document';

interface TimelineRecord {
  readonly id: string;
  readonly kind: Exclude<TimelineFilter, 'all'>;
  readonly title: string;
  readonly detail: string;
  readonly context: string;
  readonly reviewed?: boolean;
}

const projectTabs: readonly { key: ProjectDetailTab; label: string }[] = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'media', label: 'Media' },
];


const sharedAmaravatiProjectId = 'amaravati-solar-commons';

function visualForProject(project: DemoProject) {
  if (project.visual === 'hero') return demoVisualAssets.hero;
  if (project.visual === 'inspection') return demoVisualAssets.inspection;
  return demoVisualAssets.progress;
}

function statusTone(project: DemoProject): 'positive' | 'attention' | 'danger' {
  if (project.status === 'On track') return 'positive';
  if (project.status === 'Attention') return 'danger';
  return 'attention';
}

function timelineForProject(project: DemoProject, includeReviewedFieldUpdate: boolean): readonly TimelineRecord[] {
  const projectRecords: readonly TimelineRecord[] = [
    {
      id: `${project.id}-milestone`,
      kind: 'milestone',
      title: `${project.milestone} review recorded`,
      detail: `The project team recorded the current milestone context for ${project.name}.`,
      context: 'Milestone · Current delivery',
    },
    {
      id: `${project.id}-site`,
      kind: 'site',
      title: `${project.name} field coordination`,
      detail: `The delivery team aligned the next field review with work at ${project.location}.`,
      context: 'Site update · Field team',
    },
    {
      id: `${project.id}-document`,
      kind: 'document',
      title: `${project.milestone} brief`,
      detail: 'Revision 02 summarizes the planning decisions carried into the current milestone.',
      context: 'Document · Revision 02',
    },
    {
      id: `${project.id}-upcoming`,
      kind: 'milestone',
      title: `Upcoming · ${project.nextMilestone}`,
      detail: 'The next review is listed as upcoming context for the project team.',
      context: 'Milestone · Upcoming',
    },
  ];

  if (!includeReviewedFieldUpdate) return projectRecords;
  return [
    {
      id: 'amaravati-reviewed-field-update',
      kind: 'site',
      title: 'Cabinet checks and inverter-row alignment',
      detail: '68% delivery recorded',
      context: 'Today · Field update',
      reviewed: true,
    },
    ...projectRecords,
  ];
}

export function DemoProjectDetail({
  backLabel,
  state,
  project,
  onAction,
}: {
  backLabel?: string;
  state: OfflineDemoState;
  project: DemoProject;
  onAction: (action: OfflineDemoAction) => void;
}): React.ReactElement {
  const isSharedAmaravatiProject = project.id === sharedAmaravatiProjectId;
  const progress = isSharedAmaravatiProject ? state.currentProgress : project.progress;
  const includeReviewedFieldUpdate = isSharedAmaravatiProject && state.fieldUpdateReviewed;
  const visual = visualForProject(project);

  return (
    <View style={styles.page}>
      <DemoSurfaceBackButton label={backLabel} onPress={() => onAction(backLabel ? { type: 'return-to-subvertical' } : { type: 'back-to-root' })} />
      <View style={styles.header}>
        <View style={styles.headerVisual}>
          {isSharedAmaravatiProject ? (
            <DemoImageFrame
              accessibilityLabel={visual.accessibilityLabel}
              caption={visual.label}
              height={112}
              source={visual.source}
            />
          ) : (
            <View style={styles.projectIdentityVisual}>
              <Text style={styles.projectIdentityEyebrow}>PROJECT INTELLIGENCE</Text>
              <Text numberOfLines={2} style={styles.projectIdentityName}>{verticalForId(project.verticalId).title}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRecord}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Text style={styles.location}>{project.location}</Text>
            </View>
            <DemoStatusPill label={project.status.toUpperCase()} tone={statusTone(project)} />
          </View>
        </View>
        <View style={styles.deliveryPanel}>
          <DemoProgressRail
            detail={project.milestone}
            label="PROJECT DELIVERY"
            progress={progress}
            valueLabel={`${progress}% delivery recorded`}
          />
        </View>
      </View>

      <View accessibilityRole="tablist" style={styles.tabList}>
        {projectTabs.map((tab) => {
          const selected = state.selectedProjectDetailTab === tab.key;
          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.key}
              onPress={() => onAction({ type: 'select-project-detail-tab', tab: tab.key })}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {state.selectedProjectDetailTab === 'timeline' ? (
        <TimelineTab includeReviewedFieldUpdate={includeReviewedFieldUpdate} project={project} />
      ) : null}
      {state.selectedProjectDetailTab === 'overview' ? <OverviewTab project={project} progress={progress} /> : null}
      {state.selectedProjectDetailTab === 'documents' ? <DocumentsTab project={project} /> : null}
      {state.selectedProjectDetailTab === 'media' ? <MediaTab project={project} /> : null}
    </View>
  );
}

function TimelineTab({
  project,
  includeReviewedFieldUpdate,
}: {
  project: DemoProject;
  includeReviewedFieldUpdate: boolean;
}) {
  const records = timelineForProject(project, includeReviewedFieldUpdate);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Project timeline</Text>
        <Text style={styles.sectionIntro}>Delivery decisions, field notes, document revisions, and the next review.</Text>
      </View>
      <View style={styles.recordList}>
        {records.map((record) => (
          <View key={record.id} style={styles.timelineRecord} testID={record.reviewed ? 'reviewed-field-update' : undefined}>
            <Text style={styles.recordContext}>{record.context}</Text>
            <Text style={styles.recordTitle}>{record.title}</Text>
            <Text style={styles.recordDetail}>{record.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function OverviewTab({ project, progress }: { project: DemoProject; progress: number }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Project facts</Text>
        <Text style={styles.sectionIntro}>A compact delivery record for review and coordination.</Text>
      </View>
      <View style={styles.factList}>
        <Fact label="Location" value={project.location} />
        <Fact label="Delivery status" value={`${project.status} · ${progress}% recorded`} />
        <Fact label="Current milestone" value={project.milestone} />
        <Fact label="Next milestone" value={project.nextMilestone} />
        <Fact
          label="Responsibility & context"
          value="The project team coordinates milestone evidence, field review, and stakeholder decisions for this fictional scenario record."
        />
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function DocumentsTab({ project }: { project: DemoProject }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Project documents</Text>
        <Text style={styles.sectionIntro}>Fictional in-app summaries prepared for project review.</Text>
      </View>
      <View style={styles.recordList}>
        <DocumentRecord
          detail="Revision 02 · In-app summary"
          summary="Milestone decisions and review context for the current delivery stage."
          title={`${project.milestone} brief`}
        />
        <DocumentRecord
          detail="Revision 01 · In-app summary"
          summary={`Coordination notes leading toward ${project.nextMilestone}.`}
          title="Delivery coordination note"
        />
        <DocumentRecord
          detail="Revision 03 · In-app summary"
          summary={`Responsibility and review context for work in ${project.location}.`}
          title="Project responsibility schedule"
        />
      </View>
    </View>
  );
}

function DocumentRecord({ title, detail, summary }: { title: string; detail: string; summary: string }) {
  return (
    <View style={styles.documentRecord}>
      <Text style={styles.recordContext}>{detail}</Text>
      <Text style={styles.recordTitle}>{title}</Text>
      <Text style={styles.recordDetail}>{summary}</Text>
    </View>
  );
}

function MediaTab({ project }: { project: DemoProject }) {
  const isSharedAmaravatiProject = project.id === sharedAmaravatiProjectId;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Project media</Text>
        <Text style={styles.sectionIntro}>
          {isSharedAmaravatiProject
            ? 'Generated scenario imagery used to support project review.'
            : `${project.name} has no generated project media in this demo record.`}
        </Text>
      </View>
      {isSharedAmaravatiProject ? (
        <View style={styles.mediaList}>
          {Object.values(demoVisualAssets).map((asset) => (
            <DemoImageFrame
              accessibilityLabel={asset.accessibilityLabel}
              caption={asset.label}
              height={144}
              key={asset.accessibilityLabel}
              source={asset.source}
            />
          ))}
        </View>
      ) : (
        <View style={styles.mediaEmptyState}>
          <Text style={styles.mediaEmptyTitle}>No project media listed</Text>
          <Text style={styles.mediaEmptyDetail}>Timeline, overview, and document records remain available for this project.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.md },
  header: { borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, overflow: 'hidden' },
  headerVisual: { backgroundColor: colors.paper, padding: spacing.sm },
  projectIdentityVisual: { backgroundColor: colors.ink, borderRadius: radii.sm, gap: 6, height: 112, justifyContent: 'flex-end', padding: spacing.md },
  projectIdentityEyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  projectIdentityName: { color: colors.paper, fontSize: 18, fontWeight: '900', lineHeight: 22 },
  headerRecord: { backgroundColor: colors.ink, padding: spacing.md },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  titleBlock: { flex: 1, gap: 4 },
  projectName: { color: colors.paper, fontSize: 21, fontWeight: '900', lineHeight: 25 },
  location: { color: '#D6D3CD', fontSize: 12, lineHeight: 17 },
  deliveryPanel: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, padding: spacing.md },
  tabList: { backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row' },
  tab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 3, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 3 },
  tabSelected: { borderBottomColor: colors.brass },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  tabTextSelected: { color: colors.brass },
  section: { gap: spacing.md },
  sectionHeading: { gap: 4 },
  sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', lineHeight: 25 },
  sectionIntro: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  recordList: { gap: 8 },
  timelineRecord: { backgroundColor: colors.ink, borderRadius: radii.sm, gap: 4, padding: spacing.md },
  recordContext: { color: '#D6D3CD', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  recordTitle: { color: colors.paper, fontSize: 15, fontWeight: '900', lineHeight: 19 },
  recordDetail: { color: '#D6D3CD', fontSize: 11, lineHeight: 16 },
  factList: { backgroundColor: colors.ink, borderRadius: radii.sm, overflow: 'hidden' },
  factRow: { borderBottomColor: '#46534B', borderBottomWidth: 1, gap: 4, padding: spacing.md },
  factLabel: { color: '#D6D3CD', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  factValue: { color: colors.paper, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  documentRecord: { backgroundColor: colors.ink, borderRadius: radii.sm, gap: 4, padding: spacing.md },
  mediaList: { gap: spacing.md },
  mediaEmptyState: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, gap: 4, padding: spacing.md },
  mediaEmptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  mediaEmptyDetail: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
