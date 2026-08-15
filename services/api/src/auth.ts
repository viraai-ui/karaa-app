import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { findUserById, type KaraaDatabase, type Role, type UserRecord } from './db.js';

export type AuthenticatedUser = Pick<UserRecord, 'id' | 'email' | 'role' | 'display_name'>;

export interface AuthService {
  issueToken(user: UserRecord): string;
  requireRole(...allowedRoles: Role[]): preHandlerHookHandler;
}

function toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
  return { id: user.id, email: user.email, role: user.role, display_name: user.display_name };
}

function unauthorized(reply: FastifyReply): void {
  reply.code(401).send({ error: 'Unauthorized' });
}

/** Validates the same issued JWT used by HTTP and resolves the current persisted user role. */
export function authenticateToken(db: KaraaDatabase, jwtSecret: string, token: string): AuthenticatedUser | undefined {
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as JwtPayload | string;
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return undefined;
    const user = findUserById(db, payload.sub);
    return user ? toAuthenticatedUser(user) : undefined;
  } catch {
    return undefined;
  }
}

export function createAuthService(db: KaraaDatabase, jwtSecret: string): AuthService {
  function issueToken(user: UserRecord): string {
    return jwt.sign({ sub: user.id }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });
  }

  function authenticate(request: FastifyRequest, reply: FastifyReply): AuthenticatedUser | undefined {
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      unauthorized(reply);
      return undefined;
    }
    const user = authenticateToken(db, jwtSecret, token);
    if (!user) unauthorized(reply);
    return user;
  }

  function requireRole(...allowedRoles: Role[]): preHandlerHookHandler {
    return async (request, reply) => {
      const user = authenticate(request, reply);
      if (!user) return;
      request.karaaUser = user;
      if (!allowedRoles.includes(user.role)) reply.code(403).send({ error: 'Forbidden' });
    };
  }

  return { issueToken, requireRole };
}

declare module 'fastify' {
  interface FastifyRequest {
    karaaUser?: AuthenticatedUser;
  }
}
