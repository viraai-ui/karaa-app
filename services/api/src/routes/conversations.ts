import { randomUUID } from 'node:crypto';

import {
  conversationResponseSchema,
  conversationsResponseSchema,
  messageResponseSchema,
  messageSchema,
  type Conversation,
  type Message,
} from '@karaa/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthService } from '../auth.js';
import type { KaraaDatabase } from '../db.js';
import type { RealtimeGateway } from '../realtime.js';

const directConversationInputSchema = z.object({ employeeId: z.string().uuid() }).strict();
const messageInputSchema = z.object({ body: z.string().trim().min(1).max(2_000) }).strict();

interface ConversationRow { id: string; project_id: string; kind: 'direct' | 'support'; created_at: string }
interface MessageRow { id: string; conversation_id: string; sender_id: string; body: string; created_at: string }

function hasProjectMembership(db: KaraaDatabase, projectId: string, userId: string): boolean {
  return Boolean(db.prepare(
    'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
  ).get(projectId, userId));
}

function readConversations(db: KaraaDatabase, projectId: string, userId: string, userRole: 'customer' | 'employee' | 'management'): Conversation[] {
  const rows = db.prepare(`
    SELECT conversations.id, conversations.project_id, conversations.kind, conversations.created_at
    FROM conversations
    JOIN conversation_members ON conversation_members.conversation_id = conversations.id
    WHERE conversations.project_id = ?
      AND conversation_members.user_id = ?
      AND (? <> 'customer' OR conversations.kind = 'support')
    ORDER BY conversations.created_at DESC, conversations.id DESC
  `).all(projectId, userId, userRole) as ConversationRow[];
  const messages = db.prepare(`
    SELECT id, conversation_id, sender_id, body, created_at
    FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    kind: row.kind,
    createdAt: row.created_at,
    messages: (messages.all(row.id) as MessageRow[]).map((message) => messageSchema.parse({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      body: message.body,
      createdAt: message.created_at,
    })),
  }));
}

function findDirectConversation(db: KaraaDatabase, projectId: string, managementId: string, employeeId: string): ConversationRow | undefined {
  return db.prepare(`
    SELECT conversations.id, conversations.project_id, conversations.kind, conversations.created_at
    FROM conversations
    JOIN conversation_members AS manager_member
      ON manager_member.conversation_id = conversations.id AND manager_member.user_id = ?
    JOIN conversation_members AS employee_member
      ON employee_member.conversation_id = conversations.id AND employee_member.user_id = ?
    WHERE conversations.project_id = ?
      AND conversations.kind = 'direct'
      AND (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = conversations.id) = 2
    ORDER BY conversations.created_at DESC, conversations.id DESC
    LIMIT 1
  `).get(managementId, employeeId, projectId) as ConversationRow | undefined;
}

export function registerConversationRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService, realtime: RealtimeGateway): void {
  app.get('/v1/projects/:projectId/conversations', { preHandler: auth.requireRole('customer', 'employee', 'management') }, (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    if (!hasProjectMembership(db, projectId, request.karaaUser!.id)) {
      return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });
    }
    return conversationsResponseSchema.parse({ conversations: readConversations(db, projectId, request.karaaUser!.id, request.karaaUser!.role) });
  });

  app.post('/v1/projects/:projectId/conversations/direct', { preHandler: auth.requireRole('management') }, (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const parsed = directConversationInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'CONVERSATION_INVALID' });
    if (!hasProjectMembership(db, projectId, request.karaaUser!.id)) {
      return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });
    }

    const employee = db.prepare(`
      SELECT users.id FROM users
      JOIN project_memberships ON project_memberships.user_id = users.id
      WHERE users.id = ? AND users.role = 'employee' AND project_memberships.project_id = ?
    `).get(parsed.data.employeeId, projectId) as { id: string } | undefined;
    if (!employee) return reply.code(403).send({ error: 'PROJECT_ACCESS_DENIED' });

    const existing = findDirectConversation(db, projectId, request.karaaUser!.id, employee.id);
    if (existing) {
      const conversation = readConversations(db, projectId, request.karaaUser!.id, request.karaaUser!.role).find((item) => item.id === existing.id);
      return conversationResponseSchema.parse({ conversation });
    }

    const conversationId = randomUUID();
    const createdAt = new Date().toISOString();
    db.transaction(() => {
      db.prepare('INSERT INTO conversations (id, project_id, kind, created_at) VALUES (?, ?, ?, ?)').run(conversationId, projectId, 'direct', createdAt);
      const addMember = db.prepare('INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)');
      addMember.run(conversationId, request.karaaUser!.id);
      addMember.run(conversationId, employee.id);
    })();

    return reply.code(201).send(conversationResponseSchema.parse({
      conversation: { id: conversationId, projectId, kind: 'direct', createdAt, messages: [] },
    }));
  });

  app.post('/v1/conversations/:conversationId/messages', { preHandler: auth.requireRole('customer', 'employee', 'management') }, (request, reply) => {
    const { conversationId } = request.params as { conversationId: string };
    const parsed = messageInputSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'MESSAGE_INVALID' });
    const conversation = db.prepare(`
      SELECT conversations.id, conversations.project_id, conversations.kind, conversations.created_at
      FROM conversations
      JOIN conversation_members ON conversation_members.conversation_id = conversations.id
      WHERE conversations.id = ? AND conversation_members.user_id = ?
    `).get(conversationId, request.karaaUser!.id) as ConversationRow | undefined;
    if (!conversation) return reply.code(403).send({ error: 'CONVERSATION_ACCESS_DENIED' });
    if (request.karaaUser!.role === 'customer' && conversation.kind !== 'support') {
      return reply.code(403).send({ error: 'CONVERSATION_ACCESS_DENIED' });
    }

    const message: Message = messageSchema.parse({
      id: randomUUID(),
      conversationId: conversation.id,
      senderId: request.karaaUser!.id,
      body: parsed.data.body,
      createdAt: new Date().toISOString(),
    });
    db.transaction(() => {
      db.prepare('INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)').run(
        message.id, message.conversationId, message.senderId, message.body, message.createdAt,
      );
    })();

    const recipients = db.prepare('SELECT user_id FROM conversation_members WHERE conversation_id = ?').all(conversation.id) as Array<{ user_id: string }>;
    realtime.emitCommittedMessage(message.conversationId, recipients.map((recipient) => recipient.user_id));
    return reply.code(201).send(messageResponseSchema.parse({ message }));
  });
}
