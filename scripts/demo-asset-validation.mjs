import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const DEMO_ASSET_DIRECTORY = 'apps/mobile/assets/demo';
const CANONICAL_ASSET_PATHS = [
  'apps/mobile/assets/demo/amaravati-hero.webp',
  'apps/mobile/assets/demo/amaravati-pour.webp',
  'apps/mobile/assets/demo/amaravati-structure.webp',
  'apps/mobile/assets/demo/amaravati-finish.webp',
  'apps/mobile/assets/demo/amaravati-inverter-evidence.webp',
  'apps/mobile/assets/demo/amaravati-solar-hero.webp',
  'apps/mobile/assets/demo/amaravati-inverter-inspection.webp',
  'apps/mobile/assets/demo/amaravati-structure-progress.webp',
];
const EXPECTED_ASSET_COUNT = CANONICAL_ASSET_PATHS.length;


function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizedRelativePath(root, path) {
  return relative(root, path).split(sep).join('/');
}

function parseWebp(bytes) {
  ensure(bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', 'invalid WebP signature');
  ensure(bytes.readUInt32LE(4) + 8 === bytes.length, 'invalid WebP RIFF length');
  const kind = bytes.toString('ascii', 12, 16);
  const chunkLength = bytes.readUInt32LE(16);
  ensure(20 + chunkLength <= bytes.length, 'truncated WebP image chunk');
  if (kind === 'VP8 ') {
    ensure(bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a, 'invalid VP8 frame header');
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (kind === 'VP8L') {
    ensure(bytes[20] === 0x2f, 'invalid VP8L frame header');
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (kind === 'VP8X') {
    return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  }
  throw new Error(`unsupported WebP chunk ${kind}`);
}

function loadManifest(root) {
  const manifestPath = resolve(root, DEMO_ASSET_DIRECTORY, 'manifest.json');
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function validateManifestAsset(root, asset) {
  ensure(typeof asset?.path === 'string' && /^apps\/mobile\/assets\/demo\/[a-z-]+\.webp$/.test(asset.path), 'manifest contains an invalid asset path');
  ensure(asset.origin === 'generated-for-karaa-demo', `${asset.path} is missing required demo origin`);
  ensure(asset.label === 'Demo visual', `${asset.path} is missing required demo label`);
  ensure(typeof asset.subject === 'string' && asset.subject.trim().length > 0, `${asset.path} is missing a subject`);
  ensure(Number.isInteger(asset.width) && asset.width > 0 && Number.isInteger(asset.height) && asset.height > 0, `${asset.path} has invalid dimensions`);
  ensure(typeof asset.sha256 === 'string' && /^[a-f0-9]{64}$/.test(asset.sha256), `${asset.path} has an invalid checksum`);

  const absolutePath = resolve(root, asset.path);
  ensure(normalizedRelativePath(root, absolutePath) === asset.path, `${asset.path} escapes the repository root`);
  const bytes = readFileSync(absolutePath);
  let dimensions;
  try {
    dimensions = parseWebp(bytes);
  } catch (error) {
    throw new Error(`${asset.path} is not a readable WebP: ${error.message}`);
  }

  ensure(dimensions.width === asset.width && dimensions.height === asset.height, `${asset.path} dimensions do not match the manifest`);
  ensure(createHash('sha256').update(bytes).digest('hex') === asset.sha256, `${asset.path} checksum does not match the manifest`);

  return { path: asset.path, width: dimensions.width, height: dimensions.height };
}

export function validateDemoAssets(root) {
  const manifest = loadManifest(root);
  ensure(Array.isArray(manifest.assets) && manifest.assets.length === EXPECTED_ASSET_COUNT, `Expected exactly five demo assets, received ${manifest.assets?.length ?? 'none'}`);

  const manifestPaths = manifest.assets.map((asset) => asset.path);
  ensure(new Set(manifestPaths).size === EXPECTED_ASSET_COUNT, 'Manifest contains duplicate asset paths');
  ensure(
    [...manifestPaths].sort().join('\n') === [...CANONICAL_ASSET_PATHS].sort().join('\n'),
    'Manifest asset paths must use the canonical Karaa demo filenames',
  );

  const assetDirectory = resolve(root, DEMO_ASSET_DIRECTORY);
  const localWebps = readdirSync(assetDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.webp'))
    .map((entry) => `${DEMO_ASSET_DIRECTORY}/${entry.name}`)
    .sort();
  const declaredWebps = [...manifestPaths].sort();

  for (const path of localWebps) {
    ensure(declaredWebps.includes(path), `Unexpected local WebP: ${path}`);
  }
  for (const path of declaredWebps) {
    ensure(localWebps.includes(path), `Manifest references missing local WebP: ${path}`);
  }

  return manifest.assets.map((asset) => validateManifestAsset(root, asset));
}
