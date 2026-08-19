// @ts-nocheck -- Jest runs in Node; the mobile package intentionally does not ship Node typings.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { verticalDetails } from '../src/demo/vertical-detail';

const dataFile = path.resolve(__dirname, '../src/demo/vertical-detail.ts');
const source = readFileSync(dataFile, 'utf8');
const generatedRefs = [...source.matchAll(/require\('\.\.\/\.\.\/assets\/verticals\/(generated\/[^']+\.webp)'\)/g)].map(match => match[1]);
const healthcareRefs = [
  'healthcare-hero-user-supplied.webp',
  'multi-specialty-hospitals-user-supplied.webp',
  'diagnostics-clinics-preventive-health-user-supplied.webp',
  'digital-health-telemedicine-user-supplied.webp',
  'medical-education-life-sciences-research-user-supplied.webp',
];
const expected = [
  ['01','infrastructure-urban-development','Infrastructure & Urban Development'],
  ['02','ports-airports-logistics','Ports, Airports & Integrated Logistics'],
  ['03','energy-utilities','Energy & Utilities'],
  ['04','healthcare-life-sciences','Healthcare & Life Sciences'],
  ['05','hospitality-tourism-leisure','Hospitality, Tourism & Leisure'],
  ['06','real-estate-asset-development','Real Estate & Asset Development'],
  ['07','manufacturing-industrial-solutions','Manufacturing & Industrial Solutions'],
  ['08','spiritual-renaissance-for-bharat','Spiritual Renaissance for Bharat'],
  ['09','education-technology-innovation','Education, Technology & Innovation'],
];

function webpDimensions(buffer: Buffer): [number, number] {
  expect(buffer.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buffer.toString('ascii', 8, 12)).toBe('WEBP');
  const kind = buffer.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  throw new Error(`Unsupported WebP chunk ${kind}`);
}

describe('final vertical image integration', () => {
  it('keeps exactly nine verticals, five image slots apiece, and all titles/routes intact', () => {
    expect(verticalDetails).toHaveLength(9);
    expect(verticalDetails.map(({number,id,title}) => [number,id,title])).toEqual(expected);
    for (const vertical of verticalDetails) {
      expect(vertical.pathways).toHaveLength(4);
      expect([vertical.hero, ...vertical.pathways.map(item => item.image)]).toHaveLength(5);
      expect(new Set(vertical.pathways.map(item => item.title)).size).toBe(4);
      expect(vertical.pathways.every(item => item.title.length > 0 && item.description.length > 0)).toBe(true);
    }
  });

  it('preserves the five locked manual Healthcare references exactly', () => {
    expect(healthcareRefs.map(file => source.includes(`../../assets/verticals/${file}`))).toEqual([true,true,true,true,true]);
    const healthcareBlock = source.slice(source.indexOf("{ id:'healthcare-life-sciences'"), source.indexOf("{ id:'hospitality-tourism-leisure'"));
    expect(healthcareRefs.map(file => (healthcareBlock.match(new RegExp(file.replaceAll('.', '\\.'), 'g')) ?? []).length)).toEqual([1,1,1,1,1]);
    expect(healthcareBlock).not.toContain('/generated/');
  });

  it('references exactly 40 distinct generated WebPs and no conceptual placeholders', () => {
    expect(generatedRefs).toHaveLength(40);
    expect(new Set(generatedRefs).size).toBe(40);
    expect(source).not.toContain('conceptual-');
    for (const [number,id] of expected.filter(([number]) => number !== '04')) {
      expect(generatedRefs.filter(ref => ref.startsWith(`generated/${number}-${id}/`)).map(ref => path.basename(ref))).toEqual(['hero.webp','01.webp','02.webp','03.webp','04.webp']);
    }
  });

  it('ships healthy, correctly shaped, non-duplicate local files', () => {
    const hashes = new Set<string>();
    for (const ref of generatedRefs) {
      const file = path.resolve(__dirname, '../assets/verticals', ref);
      expect(existsSync(file)).toBe(true);
      const bytes = statSync(file).size;
      expect(bytes).toBeGreaterThan(50_000);
      expect(bytes).toBeLessThan(1_500_000);
      const buffer = readFileSync(file);
      const [width,height] = webpDimensions(buffer);
      expect(width).toBeGreaterThanOrEqual(1200);
      expect(height).toBeGreaterThanOrEqual(600);
      const ratio = width / height;
      expect(path.basename(file) === 'hero.webp' ? ratio : ratio).toBeGreaterThanOrEqual(path.basename(file) === 'hero.webp' ? 2.35 : 1.55);
      expect(ratio).toBeLessThanOrEqual(path.basename(file) === 'hero.webp' ? 2.45 : 1.65);
      hashes.add(createHash('sha256').update(buffer).digest('hex'));
    }
    expect(hashes.size).toBe(40);
  });
});
