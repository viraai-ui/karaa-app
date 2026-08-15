import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { npmCommandFor, npmSpawnOptions } from '../scripts/run-workspace-script.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dispatcher = join(repositoryRoot, 'scripts', 'run-workspace-script.mjs');
const rootPackage = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));

function createWorkspaceFixture(workspaces = ['apps/*']) {
  const directory = mkdtempSync(join(tmpdir(), 'karaa-workspace-dispatcher-'));
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({
      name: 'workspace-dispatcher-fixture',
      private: true,
      workspaces,
    }),
  );
  return directory;
}

function runDispatcher(cwd, scriptName, env = process.env) {
  return spawnSync(process.execPath, [dispatcher, scriptName], {
    cwd,
    encoding: 'utf8',
    env,
  });
}

function createNpmShim(behavior, platform = process.platform) {
  const directory = mkdtempSync(join(tmpdir(), 'karaa-workspace-npm-shim-'));
  const source = `
if (
  process.argv[2] === 'query'
  && process.argv[3] === '.workspace'
  && process.argv[4] === '--json'
) {
  ${behavior}
}
process.stdout.write('[]');
`;

  if (platform === 'win32') {
    writeFileSync(join(directory, 'npm-shim.cjs'), source);
    writeFileSync(
      join(directory, 'npm.cmd'),
      '@echo off\r\nnode "%~dp0npm-shim.cjs" %*\r\n',
    );
  } else {
    const executable = join(directory, 'npm');
    writeFileSync(executable, `#!/usr/bin/env node\n${source}`);
    chmodSync(executable, 0o755);
  }

  return directory;
}

function installWorkspaceFixture(directory) {
  const result = spawnSync(
    npmCommandFor(process.platform),
    ['install', '--ignore-scripts', '--package-lock=false'],
    {
      cwd: directory,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}

test('root test command runs the dispatcher suite before workspace aggregation', () => {
  assert.equal(
    rootPackage.scripts.test,
    'node --test tests/workspace-script-dispatcher.test.mjs && node scripts/run-workspace-script.mjs test',
  );
});

test('uses shell execution only for the Windows npm.cmd dispatcher', () => {
  assert.equal(npmCommandFor('win32'), 'npm.cmd');
  assert.equal(npmSpawnOptions('win32', '/fixture').shell, true);
  assert.equal(npmCommandFor('linux'), 'npm');
  assert.equal(npmSpawnOptions('linux', '/fixture').shell, false);
});

test('Windows npm.cmd shim target writes a query marker in its executed module format', () => {
  const fixture = createWorkspaceFixture();
  const marker = join(fixture, 'windows-npm-query-marker');
  const npmShim = createNpmShim(
    `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'query');`,
    'win32',
  );

  try {
    const command = readFileSync(join(npmShim, 'npm.cmd'), 'utf8');
    const target = command.match(/npm-shim\.(?:cjs|mjs)/)?.[0];
    assert.ok(target, `npm.cmd must invoke a shim target: ${command}`);

    const result = spawnSync(
      process.execPath,
      [join(npmShim, target), 'query', '.workspace', '--json'],
      { encoding: 'utf8' },
    );
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(readFileSync(marker, 'utf8'), 'query');
  } finally {
    rmSync(npmShim, { force: true, recursive: true });
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('accepts ordinary npm script names', () => {
  const fixture = createWorkspaceFixture();
  const marker = join(fixture, 'npm-query-count');
  const npmShim = createNpmShim(
    `require('node:fs').appendFileSync(${JSON.stringify(marker)}, 'query\\n');`,
  );
  const env = {
    ...process.env,
    PATH: `${npmShim}${delimiter}${process.env.PATH}`,
  };
  const scriptNames = ['test', 'typecheck', 'dev:api', 'dev:mobile', 'seed:reset'];

  try {
    for (const scriptName of scriptNames) {
      const result = runDispatcher(fixture, scriptName, env);
      assert.equal(result.status, 0, result.stderr);
    }
    assert.equal(readFileSync(marker, 'utf8'), 'query\n'.repeat(scriptNames.length));
  } finally {
    rmSync(npmShim, { force: true, recursive: true });
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('rejects unsafe script names before launching npm', () => {
  const fixture = createWorkspaceFixture();
  const marker = join(fixture, 'npm-was-invoked');
  const npmShim = createNpmShim(
    `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'invoked');`,
  );

  try {
    const result = runDispatcher(fixture, 'test & echo owned', {
      ...process.env,
      PATH: `${npmShim}${delimiter}${process.env.PATH}`,
    });
    assert.equal(existsSync(marker), false, 'npm must not be launched for unsafe script names');
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /invalid script name/i);
  } finally {
    rmSync(npmShim, { force: true, recursive: true });
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('succeeds when no configured workspace package manifests exist', () => {
  const fixture = createWorkspaceFixture();

  try {
    const result = runDispatcher(fixture, 'test');
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('fails closed when npm workspace query returns malformed JSON', () => {
  const fixture = createWorkspaceFixture();
  const npmShim = createNpmShim("process.stdout.write('not json'); process.exit(0);");

  try {
    const result = runDispatcher(fixture, 'test', {
      ...process.env,
      PATH: `${npmShim}${delimiter}${process.env.PATH}`,
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /workspace query|JSON/i);
  } finally {
    rmSync(npmShim, { force: true, recursive: true });
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('fails closed when npm workspace query cannot run', () => {
  const fixture = createWorkspaceFixture();
  const npmShim = createNpmShim("process.stderr.write('query unavailable'); process.exit(71);");

  try {
    const result = runDispatcher(fixture, 'test', {
      ...process.env,
      PATH: `${npmShim}${delimiter}${process.env.PATH}`,
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /workspace query|query unavailable/i);
  } finally {
    rmSync(npmShim, { force: true, recursive: true });
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('returns a child workspace script failure instead of hiding it', () => {
  const fixture = createWorkspaceFixture();
  const child = join(fixture, 'apps', 'failing-child');
  mkdirSync(child, { recursive: true });
  writeFileSync(
    join(child, 'package.json'),
    JSON.stringify({
      name: '@fixture/failing-child',
      version: '1.0.0',
      scripts: {
        test: "node -e \"console.error('intentional child failure'); process.exit(23)\"",
      },
    }),
  );
  try {
    installWorkspaceFixture(fixture);
    const result = runDispatcher(fixture, 'test');
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /intentional child failure/);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('returns a nested recursive workspace script failure instead of silently succeeding', () => {
  const fixture = createWorkspaceFixture(['apps/**']);
  const child = join(fixture, 'apps', 'nested', 'failing-child');
  mkdirSync(child, { recursive: true });
  writeFileSync(
    join(child, 'package.json'),
    JSON.stringify({
      name: '@fixture/nested-failing-child',
      version: '1.0.0',
      scripts: {
        test: "node -e \"console.error('intentional nested child failure'); process.exit(37)\"",
      },
    }),
  );
  try {
    installWorkspaceFixture(fixture);
    const result = runDispatcher(fixture, 'test');
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /intentional nested child failure/);
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});
