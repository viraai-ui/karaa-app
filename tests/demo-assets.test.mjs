import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demoAssetsPath = 'apps/mobile/assets/demo';
const verifier = resolve(root, 'scripts/verify-demo-assets.mjs');
const expectedPaths = [
  'apps/mobile/assets/demo/amaravati-hero.png',
  'apps/mobile/assets/demo/amaravati-pour.png',
  'apps/mobile/assets/demo/amaravati-structure.png',
  'apps/mobile/assets/demo/amaravati-finish.png',
  'apps/mobile/assets/demo/amaravati-inverter-evidence.png',
  'apps/mobile/assets/demo/amaravati-solar-hero.png',
  'apps/mobile/assets/demo/amaravati-inverter-inspection.png',
  'apps/mobile/assets/demo/amaravati-structure-progress.png',
];

function runVerifier(assetRoot, cwd = root) {
  return execFileSync(process.execPath, [verifier, '--root', assetRoot], {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function withFixture(mutate, assertion) {
  const fixture = mkdtempSync(resolve(tmpdir(), 'karaa-demo-assets-'));
  const fixtureAssets = resolve(fixture, demoAssetsPath);
  cpSync(resolve(root, demoAssetsPath), fixtureAssets, { recursive: true });

  try {
    mutate(fixture, fixtureAssets);
    assertion(fixture);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function readFixtureManifest(fixture) {
  return JSON.parse(readFileSync(resolve(fixture, demoAssetsPath, 'manifest.json'), 'utf8'));
}

function writeFixtureManifest(fixture, manifest) {
  writeFileSync(resolve(fixture, demoAssetsPath, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

test('the verifier accepts the canonical eight assets from an unrelated working directory', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, demoAssetsPath, 'manifest.json'), 'utf8'));

  assert.deepEqual(manifest.assets.map((asset) => asset.path), expectedPaths);
  assert.match(runVerifier(root, tmpdir()), /OK apps\/mobile\/assets\/demo\/amaravati-finish\.png/);
});

test('the verifier rejects an unlisted fifth local PNG', () => {
  withFixture(
    (_fixture, fixtureAssets) => {
      cpSync(resolve(fixtureAssets, 'amaravati-hero.png'), resolve(fixtureAssets, 'unexpected.png'));
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /Unexpected local PNG: apps\/mobile\/assets\/demo\/unexpected\.png/);
    },
  );
});

test('the verifier rejects a hash-updated truncated PNG', () => {
  withFixture(
    (fixture, fixtureAssets) => {
      const filename = 'amaravati-hero.png';
      const truncated = readFileSync(resolve(fixtureAssets, filename)).subarray(0, 24);
      writeFileSync(resolve(fixtureAssets, filename), truncated);

      const manifest = readFixtureManifest(fixture);
      manifest.assets[0].sha256 = createHash('sha256').update(truncated).digest('hex');
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png is not a readable PNG/);
    },
  );
});

test('the verifier rejects a manifest asset without a meaningful subject', () => {
  withFixture(
    (fixture) => {
      const manifest = readFixtureManifest(fixture);
      delete manifest.assets[0].subject;
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png is missing a subject/);
    },
  );
});

test('the verifier rejects a valid PNG substituted under a noncanonical filename', () => {
  withFixture(
    (fixture, fixtureAssets) => {
      const replacement = 'alternate.png';
      cpSync(resolve(fixtureAssets, 'amaravati-hero.png'), resolve(fixtureAssets, replacement));
      rmSync(resolve(fixtureAssets, 'amaravati-hero.png'));

      const manifest = readFixtureManifest(fixture);
      manifest.assets[0].path = `${demoAssetsPath}/${replacement}`;
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /Manifest asset paths must use the canonical Karaa demo filenames/);
    },
  );
});

test('the verifier rejects a manifest asset with a missing demo label', () => {
  withFixture(
    (fixture) => {
      const manifest = readFixtureManifest(fixture);
      delete manifest.assets[0].label;
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png is missing required demo label/);
    },
  );
});

test('the verifier rejects a manifest asset with a wrong demo label', () => {
  withFixture(
    (fixture) => {
      const manifest = readFixtureManifest(fixture);
      manifest.assets[0].label = 'Verified client evidence';
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png is missing required demo label/);
    },
  );
});

test('the verifier rejects a manifest asset with a wrong generated origin', () => {
  withFixture(
    (fixture) => {
      const manifest = readFixtureManifest(fixture);
      manifest.assets[0].origin = 'official-client-site';
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png is missing required demo origin/);
    },
  );
});

test('the verifier rejects manifest dimensions that differ from decoded pixels', () => {
  withFixture(
    (fixture) => {
      const manifest = readFixtureManifest(fixture);
      manifest.assets[0].width += 1;
      writeFixtureManifest(fixture, manifest);
    },
    (fixture) => {
      assert.throws(() => runVerifier(fixture), /amaravati-hero\.png dimensions do not match the manifest/);
    },
  );
});
