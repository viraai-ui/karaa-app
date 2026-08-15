import { z } from 'zod';

export const roles = ['customer', 'employee', 'management'] as const;
export const roleSchema = z.enum(roles);
export const locationStates = ['active', 'simulated', 'denied', 'unavailable'] as const;
export const locationStateSchema = z.enum(locationStates);

/** Public metadata only. Binary bytes, hashes, and storage columns never cross this boundary. */
export const progressUpdateMediaSchema = z.object({
  id: z.string().uuid(),
  mediaPath: z.string().regex(/^\/v1\/media\/[0-9a-f-]{36}$/i),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(10_000_000),
  isDemoVisual: z.boolean().optional(),
}).strict();

/** Public persisted update payload used by the `progress_update.created` event. */
export const progressUpdateCreatedEvent = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  authorId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  serverTimestamp: z.string().datetime(),
  latitude: z.number().finite().gte(-90).lte(90).nullable(),
  longitude: z.number().finite().gte(-180).lte(180).nullable(),
  locationState: locationStateSchema,
  claimedProgress: z.number().finite().min(0).max(100),
  workDescription: z.string().trim().min(1).max(4_000),
  nextAction: z.string().trim().min(1).max(2_000),
  crewCount: z.number().int().min(0),
  crewHours: z.number().finite().min(0),
  quantityValue: z.number().finite().min(0).nullable(),
  quantityUnit: z.string().trim().min(1).max(128).nullable(),
  siteConditions: z.string().trim().min(1).max(1_000),
  blocker: z.string().trim().min(1).max(1_000).nullable(),
  media: z.array(progressUpdateMediaSchema).length(1),
}).strict().superRefine((value, context) => {
  if (value.quantityValue === null && value.quantityUnit !== null) {
    context.addIssue({ code: 'custom', path: ['quantityUnit'], message: 'quantityUnit requires quantityValue' });
  }
  if (value.quantityValue !== null && value.quantityUnit === null) {
    context.addIssue({ code: 'custom', path: ['quantityUnit'], message: 'quantityValue requires quantityUnit' });
  }
  const coordinatesRequired = value.locationState === 'active' || value.locationState === 'simulated';
  if (coordinatesRequired && (value.latitude === null || value.longitude === null)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'coordinates are required for active or simulated location' });
  }
  if (!coordinatesRequired && (value.latitude !== null || value.longitude !== null)) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'coordinates must be absent when location is denied or unavailable' });
  }
});

export const progressUpdateCreatedEventName = 'progress_update.created' as const;
export const messageCreatedEventName = 'message.created' as const;

/** Opaque Socket.IO hint for an authorized project refresh. Canonical state is read over REST. */
export const projectRefreshEvent = z.object({
  projectId: z.string().uuid(),
}).strict();

/** Opaque Socket.IO hint for an authorized conversation refresh. Canonical state is read over REST. */
export const conversationRefreshEvent = z.object({
  conversationId: z.string().uuid(),
}).strict();

export const projectSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  verticalName: z.string().trim().min(1),
  showcase: z.boolean(),
  progress: z.number().finite().min(0).max(100),
}).strict();

export const milestoneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().trim().min(1),
  dueAt: z.string().datetime().nullable(),
  weight: z.number().finite().positive(),
  progress: z.number().finite().min(0).max(100),
}).strict();

export const notificationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  progressUpdateId: z.string().uuid(),
  body: z.string().trim().min(1),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
}).strict();

/** A server-timestamped current field location with explicit coordinate provenance. */
export const currentLocationSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().trim().min(1).max(256),
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
  state: z.enum(['active', 'simulated']),
  recordedAt: z.string().datetime(),
}).strict();

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string().trim().min(1).max(2_000),
  createdAt: z.string().datetime(),
}).strict();

export const demoDataDisclaimer = 'Demo data — verify with issuing authority' as const;

export const projectDocumentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(240),
  issuingAuthority: z.string().trim().min(1).max(240),
  reference: z.string().trim().min(1).max(120),
  issuedAt: z.string().datetime(),
  disclaimer: z.literal(demoDataDisclaimer),
}).strict();

export const paymentDemoRecordSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  reference: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500),
  amountMinor: z.number().int().nonnegative(),
  currency: z.literal('INR'),
  recordedAt: z.string().datetime(),
  disclaimer: z.literal(demoDataDisclaimer),
}).strict();

export const conversationKindSchema = z.enum(['direct', 'support']);

export const conversationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  kind: conversationKindSchema,
  createdAt: z.string().datetime(),
  messages: z.array(messageSchema),
}).strict();

export const issueStatuses = ['open', 'resolved'] as const;
export const issueStatusSchema = z.enum(issueStatuses);
export const managementPriorities = ['attention', 'stale', 'healthy'] as const;
export const managementPrioritySchema = z.enum(managementPriorities);
export const projectAssigneeSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().trim().min(1).max(256),
}).strict();

export const projectIssueSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  description: z.string().trim().min(1).max(2_000),
  assigneeId: z.string().uuid(),
  assigneeName: z.string().trim().min(1).max(256),
  dueAt: z.string().datetime(),
  rootCause: z.string().trim().min(1).max(2_000),
  status: issueStatusSchema,
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
}).strict();

export const managementProjectSchema = projectSummarySchema.extend({
  latestUpdateAt: z.string().datetime().nullable(),
  openIssueCount: z.number().int().nonnegative(),
  priority: managementPrioritySchema,
  assignees: z.array(projectAssigneeSchema),
  issues: z.array(projectIssueSchema),
}).strict();

export const projectsResponseSchema = z.object({ projects: z.array(projectSummarySchema) }).strict();
export const notificationsResponseSchema = z.object({ notifications: z.array(notificationSchema) }).strict();
export const locationsResponseSchema = z.object({ locations: z.array(currentLocationSchema) }).strict();
export const conversationResponseSchema = z.object({ conversation: conversationSchema }).strict();
export const conversationsResponseSchema = z.object({ conversations: z.array(conversationSchema) }).strict();
export const messageResponseSchema = z.object({ message: messageSchema }).strict();
export const issueResponseSchema = z.object({ issue: projectIssueSchema }).strict();
export const managementSummaryResponseSchema = z.object({ projects: z.array(managementProjectSchema) }).strict();
export const projectDetailResponseSchema = z.object({
  project: projectSummarySchema,
  milestones: z.array(milestoneSchema),
  updates: z.array(progressUpdateCreatedEvent),
  notifications: z.array(notificationSchema),
  documents: z.array(projectDocumentSchema),
  paymentDemoRecords: z.array(paymentDemoRecordSchema),
}).strict();

export const eventDefinitions = {
  progressUpdateCreated: {
    name: progressUpdateCreatedEventName,
    payload: projectRefreshEvent,
  },
  messageCreated: {
    name: messageCreatedEventName,
    payload: conversationRefreshEvent,
  },
} as const;

export type Role = z.infer<typeof roleSchema>;
export type LocationState = z.infer<typeof locationStateSchema>;
export type ProgressUpdateMedia = z.infer<typeof progressUpdateMediaSchema>;
export type ProgressUpdateCreatedEvent = z.infer<typeof progressUpdateCreatedEvent>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type CurrentLocation = z.infer<typeof currentLocationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type ConversationKind = z.infer<typeof conversationKindSchema>;
export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
export type PaymentDemoRecord = z.infer<typeof paymentDemoRecordSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ProjectIssue = z.infer<typeof projectIssueSchema>;
export type ManagementProject = z.infer<typeof managementProjectSchema>;
