import { buildApp } from './app.js';
import { resolveJwtSecret, resolveServerConfig } from './server-config.js';

const config = resolveServerConfig(process.env);
const app = buildApp({
  allowedWebOrigins: config.allowedWebOrigins,
  includeAudienceEvidence: true,
  jwtSecret: resolveJwtSecret(process.env),
});
const { host, port } = config;

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
