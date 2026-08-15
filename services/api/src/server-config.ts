export type ServerConfig = {
  host: string;
  port: number;
  allowedWebOrigins: string[];
};

type ServerEnvironment = Record<string, string | undefined>;

const defaultWebOrigin = 'http://127.0.0.1:4173';

const rejectedJwtSecrets = new Set([
  'replace-with-a-local-secret',
  'karaa-demo-development-secret',
]);

const minimumJwtSecretLength = 32;

export function requireJwtSecret(value: string | undefined): string {
  const secret = value?.trim();
  if (!secret || secret.length < minimumJwtSecretLength || rejectedJwtSecrets.has(secret)) {
    throw new Error(
      'KARAA_DEMO_JWT_SECRET must be a non-placeholder JWT signing secret of at least 32 characters. Generate one with: openssl rand -hex 32',
    );
  }
  return secret;
}

export function resolveJwtSecret(environment: ServerEnvironment): string {
  return requireJwtSecret(environment.KARAA_DEMO_JWT_SECRET ?? environment.KARAA_JWT_SECRET);
}

export function resolveServerConfig(environment: ServerEnvironment): ServerConfig {
  const candidatePort = Number(environment.KARAA_API_PORT ?? environment.PORT ?? '4310');
  const port = Number.isInteger(candidatePort) && candidatePort > 0 && candidatePort <= 65_535 ? candidatePort : 4310;
  const host = environment.KARAA_API_HOST?.trim() || environment.HOST?.trim() || '127.0.0.1';
  const allowedWebOrigins = (environment.KARAA_WEB_ORIGINS ?? defaultWebOrigin)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => /^https?:\/\/[^/]+$/i.test(origin));

  return { host, port, allowedWebOrigins };
}
