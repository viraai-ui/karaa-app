import { describe, expect, it } from 'vitest';

import {
  conversationRefreshEvent,
  conversationSchema,
  currentLocationSchema,
  eventDefinitions,
  notificationSchema,
  notificationsResponseSchema,
  progressUpdateCreatedEvent,
  projectRefreshEvent,
  projectDetailResponseSchema,
  projectSummarySchema,
  roleSchema,
  roles,
} from '../src/index.js';

const validProgressUpdate = {
  id: '11111111-1111-4111-8111-111111111111',
  eventId: 'aaaaaaaa-1111-4111-8111-111111111111',
  projectId: '22222222-2222-4222-8222-222222222222',
  milestoneId: '33333333-3333-4333-8333-333333333333',
  authorId: '44444444-4444-4444-8444-444444444444',
  occurredAt: '2026-08-10T09:15:00.000Z',
  serverTimestamp: '2026-08-10T09:16:00.000Z',
  latitude: 16.5062,
  longitude: 80.648,
  locationState: 'simulated',
  claimedProgress: 65,
  workDescription: 'Installed the first solar inverter row.',
  nextAction: 'Inspect the completed electrical connections.',
  crewCount: 4,
  crewHours: 28.5,
  quantityValue: 18,
  quantityUnit: 'panels',
  siteConditions: 'Dry ground with clear access.',
  blocker: null,
  media: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      mediaPath: '/v1/media/55555555-5555-4555-8555-555555555555',
      mimeType: 'image/jpeg',
      sizeBytes: 1_024_000,
    },
  ],
};

describe('Karaa domain contracts', () => {
  it('exposes exactly the customer, employee, and management roles', () => {
    expect(roles).toEqual(['customer', 'employee', 'management']);
    expect(roleSchema.parse('customer')).toBe('customer');
    expect(roleSchema.parse('employee')).toBe('employee');
    expect(roleSchema.parse('management')).toBe('management');
    expect(roleSchema.safeParse('owner').success).toBe(false);
  });

  it('preserves active and explicitly simulated current field-location provenance', () => {
    const location = {
      userId: '44444444-4444-4444-8444-444444444444',
      displayName: 'Dev Employee',
      latitude: 16.5062,
      longitude: 80.648,
      state: 'simulated',
      recordedAt: '2026-08-10T09:16:00.000Z',
    };

    expect(currentLocationSchema.parse(location)).toEqual(location);
    expect(currentLocationSchema.parse({ ...location, state: 'active' })).toMatchObject({ state: 'active' });
    expect(currentLocationSchema.safeParse({ ...location, state: 'denied' }).success).toBe(false);
  });

  it('accepts a complete persisted progress update event with its client event id', () => {
    expect(progressUpdateCreatedEvent.parse(validProgressUpdate)).toEqual(validProgressUpdate);
    expect(eventDefinitions.progressUpdateCreated.name).toBe('progress_update.created');
  });

  it('exposes opaque realtime refresh hints instead of persisted record contents', () => {
    const projectHint = { projectId: validProgressUpdate.projectId };
    const conversationHint = { conversationId: '77777777-7777-4777-8777-777777777777' };

    expect(projectRefreshEvent.parse(projectHint)).toEqual(projectHint);
    expect(conversationRefreshEvent.parse(conversationHint)).toEqual(conversationHint);
    expect(projectRefreshEvent.safeParse({ ...projectHint, workDescription: validProgressUpdate.workDescription }).success).toBe(false);
    expect(conversationRefreshEvent.safeParse({ ...conversationHint, body: 'private reply' }).success).toBe(false);
    expect(eventDefinitions.progressUpdateCreated.payload).toBe(projectRefreshEvent);
    expect(eventDefinitions.messageCreated.payload).toBe(conversationRefreshEvent);
  });

  it('exposes only public media metadata and persisted field-record facts', () => {
    const media = validProgressUpdate.media[0];
    expect(progressUpdateCreatedEvent.parse(validProgressUpdate).media[0]).toEqual(media);
    expect(progressUpdateCreatedEvent.safeParse({
      ...validProgressUpdate,
      media: [{ ...media, objectPath: 'private/object/key', content: 'private bytes' }],
    }).success).toBe(false);
  });

  it('accepts the persisted project evidence and user-notification read models', () => {
    const project = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Amaravati Solar Commons',
      verticalName: 'Renewable Infrastructure',
      showcase: true,
      progress: 65,
    };
    const milestone = {
      id: '33333333-3333-4333-8333-333333333333',
      projectId: project.id,
      name: 'Solar array installation',
      dueAt: null,
      weight: 1,
      progress: 65,
    };
    const notification = {
      id: '66666666-6666-4666-8666-666666666666',
      projectId: project.id,
      progressUpdateId: validProgressUpdate.id,
      body: 'New progress update for project Amaravati Solar Commons',
      createdAt: '2026-08-10T09:16:00.000Z',
      readAt: null,
    };

    expect(projectSummarySchema.parse(project)).toEqual(project);
    expect(notificationSchema.parse(notification)).toEqual(notification);
    expect(notificationsResponseSchema.parse({ notifications: [notification] })).toEqual({ notifications: [notification] });
    expect(projectDetailResponseSchema.parse({
      project,
      milestones: [milestone],
      updates: [validProgressUpdate],
      notifications: [notification],
      documents: [],
      paymentDemoRecords: [],
    })).toMatchObject({ project, milestones: [milestone], updates: [validProgressUpdate], notifications: [notification], documents: [], paymentDemoRecords: [] });
  });

  it('exposes explicitly-disclaimed Customer assurance records and typed support conversations', () => {
    const project = {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Amaravati Solar Commons',
      verticalName: 'Renewable Infrastructure',
      showcase: true,
      progress: 65,
    };
    const assuranceDocument = {
      id: '88888888-8888-4888-8888-888888888888',
      projectId: project.id,
      title: 'Commissioning readiness note',
      issuingAuthority: 'Karaa demo project office',
      reference: 'KAR-AA/AMR/CRN-01',
      issuedAt: '2026-08-11T08:00:00.000Z',
      disclaimer: 'Demo data — verify with issuing authority',
    };
    const paymentRecord = {
      id: '99999999-9999-4999-8999-999999999999',
      projectId: project.id,
      reference: 'KAR-AA/AMR/PAY-01',
      description: 'Fictional mobilisation milestone record',
      amountMinor: 12500000,
      currency: 'INR',
      recordedAt: '2026-08-11T08:05:00.000Z',
      disclaimer: 'Demo data — verify with issuing authority',
    };
    const supportConversation = {
      id: '77777777-7777-4777-8777-777777777777',
      projectId: project.id,
      kind: 'support',
      createdAt: '2026-08-11T08:10:00.000Z',
      messages: [],
    };

    expect(projectDetailResponseSchema.safeParse({
      project,
      milestones: [],
      updates: [],
      notifications: [],
      documents: [assuranceDocument],
      paymentDemoRecords: [paymentRecord],
    }).success).toBe(true);
    expect(projectDetailResponseSchema.safeParse({
      project,
      milestones: [],
      updates: [],
      notifications: [],
      documents: [{ ...assuranceDocument, disclaimer: 'Draft only' }],
      paymentDemoRecords: [paymentRecord],
    }).success).toBe(false);
    expect(conversationSchema.safeParse(supportConversation).success).toBe(true);
    expect(conversationSchema.safeParse({ ...supportConversation, kind: 'untrusted' }).success).toBe(false);
  });

  it('rejects unsafe project read-model values', () => {
    expect(projectSummarySchema.safeParse({
      id: 'not-a-uuid', name: '', verticalName: '', showcase: 'true', progress: 101,
    }).success).toBe(false);
    expect(notificationSchema.safeParse({
      id: 'not-a-uuid', projectId: 'not-a-uuid', progressUpdateId: 'not-a-uuid', body: '', createdAt: 'not-a-date', readAt: 'not-a-date',
    }).success).toBe(false);
  });

  it.each([
    ['id', { id: 'update-1' }],
    ['eventId', { eventId: 'event-1' }],
    ['projectId', { projectId: 'project-1' }],
    ['milestoneId', { milestoneId: 'milestone-1' }],
    ['authorId', { authorId: 'author-1' }],
    ['occurredAt', { occurredAt: 'not-a-datetime' }],
    ['serverTimestamp', { serverTimestamp: 'not-a-datetime' }],
    ['latitude', { latitude: '16.5062' }],
    ['longitude', { longitude: '80.6480' }],
    ['claimedProgress below zero', { claimedProgress: -1 }],
    ['claimedProgress above 100', { claimedProgress: 101 }],
    ['empty workDescription', { workDescription: '' }],
    ['empty nextAction', { nextAction: '' }],
    ['empty media', { media: [] }],
    ['media id', { media: [{ ...validProgressUpdate.media[0], id: 'media-1' }] }],
    ['mediaPath', { media: [{ ...validProgressUpdate.media[0], mediaPath: '' }] }],
    ['media mimeType', { media: [{ ...validProgressUpdate.media[0], mimeType: '' }] }],
    ['media sizeBytes', { media: [{ ...validProgressUpdate.media[0], sizeBytes: 0 }] }],
    ['missing crewCount', { crewCount: undefined }],
    ['negative crewHours', { crewHours: -0.1 }],
    ['quantity value without unit', { quantityUnit: null }],
    ['blank siteConditions', { siteConditions: ' ' }],
    ['client media digest', { media: [{ ...validProgressUpdate.media[0], contentDigest: 'private' }] }],
  ])('rejects an invalid %s field', (_field, patch) => {
    expect(progressUpdateCreatedEvent.safeParse({ ...validProgressUpdate, ...patch }).success).toBe(false);
  });
});
