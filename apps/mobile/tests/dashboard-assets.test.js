import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { demoVerticals } from '../src/demo/demo-catalog';
import { dashboardAssetFiles, dashboardAssets } from '../src/demo/dashboard-assets';

function lossyWebpDimensions(buffer) {
  expect(buffer.subarray(0, 4).toString()).toBe('RIFF');
  expect(buffer.subarray(8, 12).toString()).toBe('WEBP');
  const marker = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
  expect(marker).toBeGreaterThan(0);
  return [buffer.readUInt16LE(marker + 3) & 0x3fff, buffer.readUInt16LE(marker + 5) & 0x3fff];
}

describe('dashboard asset manifest', () => {
  it('maps every canonical vertical to one valid, decodable, unique portrait asset', () => {
    expect(Object.keys(dashboardAssets)).toEqual(demoVerticals.map(vertical => vertical.id));
    expect(Object.keys(dashboardAssetFiles)).toEqual(demoVerticals.map(vertical => vertical.id));
    const checksums = demoVerticals.map((vertical) => {
      const buffer = readFileSync(resolve(__dirname, '../assets/dashboard', dashboardAssetFiles[vertical.id]));
      expect(lossyWebpDimensions(buffer)).toEqual([512, 768]);
      return createHash('sha256').update(buffer).digest('hex');
    });
    expect(new Set(checksums).size).toBe(9);
  });
});
