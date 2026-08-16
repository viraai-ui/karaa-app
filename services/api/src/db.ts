import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { createDemoSeed } from '@karaa/demo-data';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';

export const roles = ['customer', 'employee', 'management'] as const;
export type Role = (typeof roles)[number];

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  display_name: string;
}

/**
 * The complete Task 3 demo account roster. All accounts use `demo-password`.
 * Roles are persisted here and are never accepted from login requests.
 */
export const demoAccountEmails = {
  customer: 'anika.customer@karaa.demo',
  employee: 'dev.employee@karaa.demo',
  management: 'mira.management@karaa.demo',
} as const;

const demoPasswordHash = '$2b$10$cytuGFxrUW9DdXQxXBuF2uG1sDKCQITPnNy4nx.yUUX7eMyZh3hVi';

const demoUsers: ReadonlyArray<Omit<UserRecord, 'password_hash'>> = [
  { id: '30000001-0000-4000-8000-000000000001', email: demoAccountEmails.customer, role: 'customer', display_name: 'Anika Customer' },
  { id: '30000002-0000-4000-8000-000000000002', email: demoAccountEmails.employee, role: 'employee', display_name: 'Dev Employee' },
  { id: '30000003-0000-4000-8000-000000000003', email: demoAccountEmails.management, role: 'management', display_name: 'Mira Management' },
];

export type KaraaDatabase = Database.Database;

export interface CreateDatabaseOptions {
  /** Add the clearly fictional record used only by the local audience-demo server. */
  includeAudienceEvidence?: boolean;
}

export function createDatabase(filename = ':memory:', options: CreateDatabaseOptions = {}): KaraaDatabase {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  if (filename !== ':memory:') db.pragma('journal_mode = WAL');

  // Preserve records when a persistent service restarts. Schema changes must
  // introduce explicit migrations rather than replaying bootstrap SQL.
  const existingSchema = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (existingSchema) return db;

  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer', 'employee', 'management')),
      display_name TEXT NOT NULL
    );
    CREATE TABLE vertical_nodes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      vertical_node_id TEXT NOT NULL REFERENCES vertical_nodes(id),
      name TEXT NOT NULL,
      showcase INTEGER NOT NULL DEFAULT 0,
      progress REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
    );
    CREATE TABLE milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      name TEXT NOT NULL,
      due_at TEXT,
      weight REAL NOT NULL DEFAULT 1 CHECK (weight > 0),
      progress REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)
    );
    CREATE TABLE project_memberships (
      project_id TEXT NOT NULL REFERENCES projects(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (project_id, user_id)
    );
    CREATE TABLE progress_updates (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects(id),
      milestone_id TEXT NOT NULL REFERENCES milestones(id),
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      next_action TEXT NOT NULL,
      crew_count INTEGER NOT NULL CHECK (crew_count >= 0),
      crew_hours REAL NOT NULL CHECK (crew_hours >= 0),
      quantity_value REAL CHECK (quantity_value IS NULL OR quantity_value >= 0),
      quantity_unit TEXT,
      site_conditions TEXT NOT NULL CHECK (length(trim(site_conditions)) > 0),
      blocker TEXT,
      latitude REAL,
      longitude REAL,
      location_state TEXT NOT NULL CHECK (location_state IN ('active', 'simulated', 'denied', 'unavailable')),
      claimed_progress REAL NOT NULL CHECK (claimed_progress >= 0 AND claimed_progress <= 100),
      occurred_at TEXT NOT NULL,
      server_timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE update_media (
      id TEXT PRIMARY KEY,
      progress_update_id TEXT NOT NULL REFERENCES progress_updates(id),
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
      is_demo_visual INTEGER NOT NULL DEFAULT 0 CHECK (is_demo_visual IN (0, 1)),
      content_sha256 TEXT NOT NULL,
      content BLOB NOT NULL
    );
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      project_id TEXT NOT NULL REFERENCES projects(id),
      progress_update_id TEXT NOT NULL REFERENCES progress_updates(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
    CREATE TABLE current_locations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('active', 'simulated')),
      recorded_at TEXT NOT NULL
    );
    CREATE TABLE project_documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL CHECK (length(trim(title)) > 0),
      issuing_authority TEXT NOT NULL CHECK (length(trim(issuing_authority)) > 0),
      reference TEXT NOT NULL CHECK (length(trim(reference)) > 0),
      issued_at TEXT NOT NULL,
      disclaimer TEXT NOT NULL CHECK (disclaimer = 'Demo data — verify with issuing authority')
    );
    CREATE TABLE payment_demo_records (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      reference TEXT NOT NULL CHECK (length(trim(reference)) > 0),
      description TEXT NOT NULL CHECK (length(trim(description)) > 0),
      amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
      currency TEXT NOT NULL CHECK (currency = 'INR'),
      recorded_at TEXT NOT NULL,
      disclaimer TEXT NOT NULL CHECK (disclaimer = 'Demo data — verify with issuing authority')
    );
    CREATE TABLE conversations (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      kind TEXT NOT NULL CHECK (kind IN ('direct', 'support')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE conversation_members (
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (conversation_id, user_id)
    );
    CREATE TABLE messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id),
      sender_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE project_issues (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      description TEXT NOT NULL,
      assignee_id TEXT NOT NULL REFERENCES users(id),
      due_at TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );
    CREATE INDEX project_issues_project_status_idx ON project_issues(project_id, status, due_at);
    CREATE INDEX milestones_project_id_idx ON milestones(project_id);
    CREATE INDEX project_memberships_user_id_idx ON project_memberships(user_id);
    CREATE INDEX progress_updates_project_id_idx ON progress_updates(project_id);
    CREATE INDEX progress_updates_milestone_id_idx ON progress_updates(milestone_id);
    CREATE INDEX update_media_progress_update_id_idx ON update_media(progress_update_id);
    CREATE INDEX notifications_project_update_idx ON notifications(project_id, progress_update_id);
    CREATE INDEX notifications_user_id_idx ON notifications(user_id);
    CREATE INDEX project_documents_project_id_idx ON project_documents(project_id);
    CREATE INDEX payment_demo_records_project_id_idx ON payment_demo_records(project_id);
  `);

  const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, role, display_name) VALUES (?, ?, ?, ?, ?)');
  const insertVertical = db.prepare('INSERT INTO vertical_nodes (id, name) VALUES (?, ?)');
  const insertProject = db.prepare('INSERT INTO projects (id, vertical_node_id, name, showcase) VALUES (?, ?, ?, ?)');
  const insertMilestone = db.prepare('INSERT INTO milestones (id, project_id, name, weight, progress) VALUES (?, ?, ?, ?, ?)');
  const insertMembership = db.prepare('INSERT INTO project_memberships (project_id, user_id) VALUES (?, ?)');
  const seed = createDemoSeed();

  db.transaction(() => {
    for (const user of demoUsers) insertUser.run(user.id, user.email, demoPasswordHash, user.role, user.display_name);

    let projectOrdinal = 0;
    for (const vertical of seed.verticals) {
      insertVertical.run(vertical.id, vertical.name);
      for (const project of vertical.projects) {
        projectOrdinal += 1;
        insertProject.run(project.id, vertical.id, project.name, Number(project.showcase));
        const milestoneId = `4000000${projectOrdinal}-0000-4000-8000-00000000000${projectOrdinal}`;
        insertMilestone.run(milestoneId, project.id, `${project.name} delivery`, 1, 0);
        if (projectOrdinal === 1) {
          for (const user of demoUsers) insertMembership.run(project.id, user.id);
        } else {
          insertMembership.run(project.id, '30000003-0000-4000-8000-000000000003');
        }
      }
    }

    if (options.includeAudienceEvidence) {
      const audienceUpdate = {
        eventId: '50000001-0000-4000-8000-000000000001',
        projectId: '20000001-0000-4000-8000-000000000001',
        milestoneId: '40000001-0000-4000-8000-000000000001',
        occurredAt: '2026-08-11T08:15:00.000Z',
        latitude: 16.5062,
        longitude: 80.648,
        locationState: 'simulated',
        claimedProgress: 65,
        workDescription: 'Installed and aligned the first solar inverter row.',
        nextAction: 'Inspect the completed electrical connections before commissioning.',
        crewCount: 4,
        crewHours: 28.5,
        quantityValue: 18,
        quantityUnit: 'inverter units',
        siteConditions: 'Dry demo site with clear access.',
        blocker: null,
      };
      const authorId = '30000002-0000-4000-8000-000000000002';
      const updateId = '51000001-0000-4000-8000-000000000001';
      const mediaId = '60000001-0000-4000-8000-000000000001';
      // Karaa-owned local generated Demo visual; never fetched from a network source.
      const audienceMedia = readFileSync(new URL('../../../apps/mobile/assets/demo/amaravati-inverter-evidence.webp', import.meta.url));
      const audienceMediaDigest = createHash('sha256').update(audienceMedia).digest('hex');
      const audienceMediaPath = `/v1/media/${mediaId}`;
      const serverTimestamp = '2026-08-11T08:16:00.000Z';
      const payloadHash = createHash('sha256').update(JSON.stringify({ authorId, input: audienceUpdate, contentDigest: audienceMediaDigest })).digest('hex');

      db.prepare(`
        INSERT INTO progress_updates (
          id, event_id, payload_hash, project_id, milestone_id, author_id, body, next_action,
          crew_count, crew_hours, quantity_value, quantity_unit, site_conditions, blocker,
          latitude, longitude, location_state, claimed_progress, occurred_at, server_timestamp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        updateId, audienceUpdate.eventId, payloadHash, audienceUpdate.projectId, audienceUpdate.milestoneId, authorId,
        audienceUpdate.workDescription, audienceUpdate.nextAction, audienceUpdate.crewCount, audienceUpdate.crewHours,
        audienceUpdate.quantityValue, audienceUpdate.quantityUnit, audienceUpdate.siteConditions, audienceUpdate.blocker,
        audienceUpdate.latitude, audienceUpdate.longitude, audienceUpdate.locationState,
        audienceUpdate.claimedProgress, audienceUpdate.occurredAt, serverTimestamp, serverTimestamp,
      );
      db.prepare('INSERT INTO update_media (id, progress_update_id, media_url, media_type, size_bytes, is_demo_visual, content_sha256, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        mediaId, updateId, audienceMediaPath, 'image/png', audienceMedia.length, 1, audienceMediaDigest, audienceMedia,
      );
      db.prepare('UPDATE milestones SET progress = ? WHERE id = ?').run(audienceUpdate.claimedProgress, audienceUpdate.milestoneId);
      db.prepare('UPDATE projects SET progress = ? WHERE id = ?').run(audienceUpdate.claimedProgress, audienceUpdate.projectId);

      const insertNotification = db.prepare(`
        INSERT INTO notifications (id, user_id, project_id, progress_update_id, body, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const [id, userId] of [
        ['70000001-0000-4000-8000-000000000001', '30000001-0000-4000-8000-000000000001'],
        ['70000002-0000-4000-8000-000000000002', '30000003-0000-4000-8000-000000000003'],
      ]) {
        insertNotification.run(id, userId, audienceUpdate.projectId, updateId, 'New progress update for project Amaravati Solar Commons', serverTimestamp);
      }

      const disclaimer = 'Demo data — verify with issuing authority';
      db.prepare(`
        INSERT INTO project_documents (id, project_id, title, issuing_authority, reference, issued_at, disclaimer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        '80000001-0000-4000-8000-000000000001', audienceUpdate.projectId,
        'Commissioning readiness note', 'Karaa demo project office', 'KAR-AA/AMR/CRN-01',
        '2026-08-11T08:20:00.000Z', disclaimer,
      );
      db.prepare(`
        INSERT INTO payment_demo_records (id, project_id, reference, description, amount_minor, currency, recorded_at, disclaimer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        '81000001-0000-4000-8000-000000000001', audienceUpdate.projectId,
        'KAR-AA/AMR/PAY-01', 'Fictional mobilisation milestone record', 12_500_000, 'INR',
        '2026-08-11T08:25:00.000Z', disclaimer,
      );

      const supportConversationId = '90000002-0000-4000-8000-000000000002';
      db.prepare('INSERT INTO conversations (id, project_id, kind, created_at) VALUES (?, ?, ?, ?)').run(
        supportConversationId, audienceUpdate.projectId, 'support', '2026-08-11T08:30:00.000Z',
      );
      const addSupportMember = db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)');
      addSupportMember.run(supportConversationId, '30000001-0000-4000-8000-000000000001');
      addSupportMember.run(supportConversationId, '30000003-0000-4000-8000-000000000003');
      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, body, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        '91000001-0000-4000-8000-000000000001',
        supportConversationId,
        '30000003-0000-4000-8000-000000000003',
        'Karaa project support is ready to help with your commissioning records.',
        '2026-08-11T08:31:00.000Z',
      );
    }
  })();

  return db;
}

export function findUserByEmail(db: KaraaDatabase, email: string): UserRecord | undefined {
  return db.prepare('SELECT id, email, password_hash, role, display_name FROM users WHERE email = ?').get(email) as UserRecord | undefined;
}

export function findUserById(db: KaraaDatabase, id: string): UserRecord | undefined {
  return db.prepare('SELECT id, email, password_hash, role, display_name FROM users WHERE id = ?').get(id) as UserRecord | undefined;
}

export async function passwordMatches(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
