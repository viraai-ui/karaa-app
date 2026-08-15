import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function npmCommandFor(platform) {
  return platform === 'win32' ? 'npm.cmd' : 'npm';
}

export function npmSpawnOptions(platform, root) {
  return {
    cwd: root,
    shell: platform === 'win32',
    stdio: 'inherit',
  };
}

function queryWorkspaces(platform, root) {
  const result = spawnSync(
    npmCommandFor(platform),
    ['query', '.workspace', '--json'],
    {
      cwd: root,
      encoding: 'utf8',
      shell: platform === 'win32',
    },
  );

  if (result.error) {
    throw new Error(`Unable to query npm workspaces: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '');
    process.stderr.write(result.stdout ?? '');
    throw new Error(`npm workspace query failed with exit code ${result.status ?? 1}`);
  }

  try {
    const workspaces = JSON.parse(result.stdout);
    if (!Array.isArray(workspaces)) {
      throw new Error('expected an array');
    }
    return workspaces;
  } catch (error) {
    throw new Error(`Unable to parse npm workspace query JSON: ${error.message}`);
  }
}

function main() {
  const scriptName = process.argv[2];

  if (!scriptName) {
    throw new Error('Usage: node scripts/run-workspace-script.mjs <script-name>');
  }

  if (!/^[A-Za-z0-9:_.-]+$/.test(scriptName)) {
    throw new Error(
      'Invalid script name: use only ASCII letters, digits, colon, underscore, hyphen, and dot',
    );
  }

  const root = resolve(process.cwd());
  if (queryWorkspaces(process.platform, root).length === 0) {
    return;
  }

  const result = spawnSync(
    npmCommandFor(process.platform),
    ['run', scriptName, '--workspaces', '--if-present'],
    npmSpawnOptions(process.platform, root),
  );

  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
