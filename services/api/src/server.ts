import { buildApp } from './app.js';
import { resolveJwtSecret, resolveServerConfig } from './server-config.js';

const config = resolveServerConfig(process.env);
const app = buildApp({
  allowedWebOrigins: config.allowedWebOrigins,
  databasePath: config.databasePath,
  includeAudienceEvidence: true,
  jwtSecret: resolveJwtSecret(process.env),
});
const { host, port } = config;

try {
  await app.listen({ host, port });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void app.close().finally(() => process.exit(0));
    });
  }
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
