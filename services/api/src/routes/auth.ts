import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthService } from '../auth.js';
import { findUserByEmail, passwordMatches, type KaraaDatabase } from '../db.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export function registerAuthRoutes(app: FastifyInstance, db: KaraaDatabase, auth: AuthService): void {
  app.post('/v1/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request' });
    }

    const user = findUserByEmail(db, parsed.data.email);
    if (!user || !(await passwordMatches(parsed.data.password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    return {
      token: auth.issueToken(user),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
      },
    };
  });
}
