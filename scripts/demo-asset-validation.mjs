import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const DEMO_ASSET_DIRECTORY = 'apps/mobile/assets/demo';
const CANONICAL_ASSET_PATHS = [
  'apps/mobile/assets/demo/amaravati-hero.png',
  'apps/mobile/assets/demo/amaravati-pour.png',
  'apps/mobile/assets/demo/amaravati-structure.png',
  'apps/mobile/assets/demo/amaravati-finish.png',
  'apps/mobile/assets/demo/amaravati-inverter-evidence.png',
  'apps/mobile/assets/demo/amaravati-solar-hero.png',
  'apps/mobile/assets/demo/amaravati-inverter-inspection.png',
  'apps/mobile/assets/demo/amaravati-structure-progress.png',
];
const EXPECTED_ASSET_COUNT = CANONICAL_ASSET_PATHS.length;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS_BY_COLOR_TYPE = new Map([
  [0, 1],
  [2, 3],
  [3, 1],
  [4, 2],
  [6, 4],
]);
const VALID_BIT_DEPTHS = new Map([
  [0, new Set([1, 2, 4, 8, 16])],
  [2, new Set([8, 16])],
  [3, new Set([1, 2, 4, 8])],
  [4, new Set([8, 16])],
  [6, new Set([8, 16])],
]);

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizedRelativePath(root, path) {
  return relative(root, path).split(sep).join('/');
}

function parsePng(bytes) {
  ensure(bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE), 'invalid PNG signature');

  let offset = PNG_SIGNATURE.length;
  let header;
  let seenIdat = false;
  let endedIdat = false;
  let ended = false;
  const idatChunks = [];

  while (offset < bytes.length) {
    ensure(offset + 12 <= bytes.length, 'truncated PNG chunk');
    const length = bytes.readUInt32BE(offset);
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;

    ensure(dataEnd <= bytes.length && crcEnd <= bytes.length, `truncated ${type} chunk`);
    ensure(bytes.readUInt32BE(dataEnd) === crc32(Buffer.concat([typeBytes, bytes.subarray(dataStart, dataEnd)])), `invalid ${type} CRC`);
    ensure(!ended, 'data found after IEND');

    const data = bytes.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      ensure(!header && offset === PNG_SIGNATURE.length && length === 13, 'invalid IHDR');
      const width = data.readUInt32BE(0);
      const height = data.readUInt32BE(4);
      const bitDepth = data[8];
      const colorType = data[9];
      const compression = data[10];
      const filter = data[11];
      const interlace = data[12];

      ensure(width > 0 && height > 0, 'invalid PNG dimensions');
      ensure(VALID_BIT_DEPTHS.get(colorType)?.has(bitDepth), 'unsupported PNG color format');
      ensure(compression === 0 && filter === 0 && interlace === 0, 'unsupported PNG encoding');
      header = { width, height, bitDepth, colorType };
    } else if (type === 'IDAT') {
      ensure(header, 'IDAT appears before IHDR');
      ensure(!endedIdat, 'non-contiguous IDAT chunks');
      seenIdat = true;
      idatChunks.push(data);
    } else if (type === 'IEND') {
      ensure(header && seenIdat && length === 0, 'invalid IEND');
      ended = true;
      ensure(crcEnd === bytes.length, 'data found after IEND');
    } else if (seenIdat) {
      endedIdat = true;
    }

    offset = crcEnd;
  }

  ensure(header && seenIdat && ended, 'PNG is missing required image chunks');

  let pixels;
  try {
    pixels = inflateSync(Buffer.concat(idatChunks));
  } catch {
    throw new Error('PNG pixel data cannot be decompressed');
  }

  const channels = CHANNELS_BY_COLOR_TYPE.get(header.colorType);
  const bytesPerRow = Math.ceil((header.width * channels * header.bitDepth) / 8);
  const expectedPixelBytes = (bytesPerRow + 1) * header.height;
  ensure(pixels.length === expectedPixelBytes, 'PNG pixel data has an invalid length');

  for (let offset = 0; offset < pixels.length; offset += bytesPerRow + 1) {
    ensure(pixels[offset] <= 4, 'PNG contains an invalid scanline filter');
  }

  return { width: header.width, height: header.height };
}

function loadManifest(root) {
  const manifestPath = resolve(root, DEMO_ASSET_DIRECTORY, 'manifest.json');
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function validateManifestAsset(root, asset) {
  ensure(typeof asset?.path === 'string' && /^apps\/mobile\/assets\/demo\/[a-z-]+\.png$/.test(asset.path), 'manifest contains an invalid asset path');
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
    dimensions = parsePng(bytes);
  } catch (error) {
    throw new Error(`${asset.path} is not a readable PNG: ${error.message}`);
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
  const localPngs = readdirSync(assetDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
    .map((entry) => `${DEMO_ASSET_DIRECTORY}/${entry.name}`)
    .sort();
  const declaredPngs = [...manifestPaths].sort();

  for (const path of localPngs) {
    ensure(declaredPngs.includes(path), `Unexpected local PNG: ${path}`);
  }
  for (const path of declaredPngs) {
    ensure(localPngs.includes(path), `Manifest references missing local PNG: ${path}`);
  }

  return manifest.assets.map((asset) => validateManifestAsset(root, asset));
}
