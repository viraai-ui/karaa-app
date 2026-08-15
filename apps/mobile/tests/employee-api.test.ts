jest.mock('expo-file-system', () => {
  class File extends Blob {
    uri: string;

    constructor(value: string) {
      super(['PC QA image'], { type: 'image/png' });
      this.uri = value;
    }
  }
  return { File };
});

import { submitEmployeeFieldRecord } from '../src/features/employee/employee-api';
import type { EmployeeFieldRecord } from '../src/features/employee/EmployeeWorkScreen';
import type { Session } from '../src/lib/session';

const session: Session = {
  token: 'server-issued-token',
  expiresAt: '2033-05-18T03:33:20.000Z',
  user: { id: '30000002-0000-4000-8000-000000000002', role: 'employee' },
};

const record: EmployeeFieldRecord = {
  eventId: '50000002-0000-4000-8000-000000000002',
  occurredAt: '2026-08-11T12:00:00.000Z',
  projectId: '20000001-0000-4000-8000-000000000001',
  milestoneId: '40000001-0000-4000-8000-000000000001',
  workDescription: 'Installed and aligned the second inverter row.',
  claimedProgress: 71,
  crewCount: 4,
  crewHours: 28,
  quantityValue: null,
  quantityUnit: null,
  siteConditions: 'Dry access with clear cable routes.',
  blocker: null,
  nextAction: 'Inspect electrical connections before commissioning.',
  photo: { uri: 'file:///demo/evidence.png', fileName: 'evidence.png', mimeType: 'image/png' },
  location: { state: 'simulated', latitude: 16.5062, longitude: 80.648 },
};

describe('employee field-record API', () => {
  it('posts one authenticated multipart payload with client-held retry metadata and selected photo descriptor', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify({ replayed: false }), { status: 201, headers: { 'content-type': 'application/json' } });
    };

    const result = await submitEmployeeFieldRecord(session, record, {
      fetcher,
      baseUrl: 'http://karaa.test',
    });

    expect(result).toEqual({ replayed: false });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      url: 'http://karaa.test/v1/progress-updates',
      init: {
        method: 'POST',
        headers: { authorization: 'Bearer server-issued-token' },
        body: expect.any(FormData),
      },
    });

    const multipart = requests[0].init?.body as FormData;
    const payload = JSON.parse(String(multipart.get('payload')));
    expect(payload).toEqual({
      eventId: '50000002-0000-4000-8000-000000000002',
      projectId: record.projectId,
      milestoneId: record.milestoneId,
      occurredAt: '2026-08-11T12:00:00.000Z',
      latitude: 16.5062,
      longitude: 80.648,
      locationState: 'simulated',
      claimedProgress: 71,
      workDescription: record.workDescription,
      nextAction: record.nextAction,
      crewCount: 4,
      crewHours: 28,
      quantityValue: null,
      quantityUnit: null,
      siteConditions: record.siteConditions,
      blocker: null,
    });
    expect(Array.from(multipart.keys())).toEqual(['payload', 'photo']);
    const photo = multipart.get('photo');
    expect(photo).toBeInstanceOf(Blob);
    expect(photo).toMatchObject({ type: 'image/png' });
  });

  it('reposts unchanged retry metadata after a response is lost', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      requests.push({ url: String(input), init });
      if (requests.length === 1) throw new Error('response lost after commit');
      return new Response(JSON.stringify({ replayed: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    await expect(submitEmployeeFieldRecord(session, record, { fetcher, baseUrl: 'http://karaa.test' }))
      .rejects.toMatchObject({ message: 'Connection unavailable — try again.' });
    await expect(submitEmployeeFieldRecord(session, record, { fetcher, baseUrl: 'http://karaa.test' }))
      .resolves.toEqual({ replayed: true });

    const payloads = requests.map(({ init }) => JSON.parse(String((init?.body as FormData).get('payload'))));
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toEqual(payloads[1]);
    expect(payloads[0]).toMatchObject({
      eventId: record.eventId,
      occurredAt: record.occurredAt,
    });
  });
});
