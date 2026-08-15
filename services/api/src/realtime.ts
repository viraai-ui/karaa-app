import type { Server as HttpServer } from 'node:http';

import { messageCreatedEventName, progressUpdateCreatedEventName } from '@karaa/contracts';
import { Server } from 'socket.io';
import { z } from 'zod';

import { authenticateToken, type AuthenticatedUser } from './auth.js';
import type { KaraaDatabase } from './db.js';
import type { CreateProgressUpdateResult } from './progress.js';

const subscriptionSchema = z.object({ projectId: z.string().uuid() }).strict();

type NewProgressUpdate = Extract<CreateProgressUpdateResult, { replayed: false }>;

function projectUserRoom(projectId: string, userId: string): string {
  return `project:${projectId}:user:${userId}`;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export interface RealtimeGateway {
  emitCommittedProgress(result: NewProgressUpdate): void;
  emitCommittedMessage(conversationId: string, recipientUserIds: readonly string[]): void;
  close(): void;
}

/**
 * Attaches Socket.IO to Fastify's existing HTTP server. It never creates a second listener.
 * A socket is authenticated from the HTTP JWT and its persisted role, not handshake role data.
 */
export function createRealtimeGateway(server: HttpServer, db: KaraaDatabase, jwtSecret: string): RealtimeGateway {
  const io = new Server(server, { serveClient: false });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = typeof token === 'string' ? authenticateToken(db, jwtSecret, token) : undefined;
    if (!user) return next(new Error('Unauthorized'));
    socket.data.karaaUser = user;
    return next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.karaaUser as AuthenticatedUser;
    socket.join(userRoom(user.id));
    socket.on('project.subscribe', (payload: unknown, acknowledge?: (result: { ok: boolean }) => void) => {
      const parsed = subscriptionSchema.safeParse(payload);
      if (!parsed.success || (user.role !== 'customer' && user.role !== 'management')) {
        acknowledge?.({ ok: false });
        return;
      }
      const permitted = db.prepare(
        'SELECT 1 FROM project_memberships WHERE project_id = ? AND user_id = ?',
      ).get(parsed.data.projectId, user.id);
      if (!permitted) {
        acknowledge?.({ ok: false });
        return;
      }
      socket.join(projectUserRoom(parsed.data.projectId, user.id));
      acknowledge?.({ ok: true });
    });
  });

  return {
    emitCommittedProgress(result) {
      for (const notification of result.notifications) {
        const room = projectUserRoom(notification.projectId, notification.userId);
        const refreshHint = { projectId: notification.projectId };
        io.to(room).emit(progressUpdateCreatedEventName, refreshHint);
        io.to(room).emit('project.progress_changed', refreshHint);
        io.to(room).emit('notification.created', refreshHint);
      }
    },
    emitCommittedMessage(conversationId, recipientUserIds) {
      for (const userId of new Set(recipientUserIds)) {
        io.to(userRoom(userId)).emit(messageCreatedEventName, { conversationId });
      }
    },
    close() {
      io.close();
    },
  };
}
