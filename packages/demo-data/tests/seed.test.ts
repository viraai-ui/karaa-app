import { describe, expect, it } from 'vitest';

import { assertSyntheticSeedSafety, createDemoSeed, type DemoSeed } from '../src/seed.js';

const personalMarkerPattern = /@|\b(?:aadhaar|author|customer|dob|email|employee|firstName|lastName|mobile|passport|person|phone|user)\b/i;
const realPersonMarkers = ['elon musk', 'jeff bezos', 'mark zuckerberg'] as const;

describe('Karaa synthetic demo seed', () => {
  it('is deterministic and uses stable UUIDs', () => {
    const first = createDemoSeed();
    const second = createDemoSeed();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.verticals.every((vertical) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vertical.id))).toBe(true);
    expect(first.verticals.flatMap((vertical) => vertical.projects).every((project) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(project.id))).toBe(true);
  });

  it('has nine top-level verticals, exactly one project per vertical, and three showcases', () => {
    const seed = createDemoSeed();
    const projects = seed.verticals.flatMap((vertical) => vertical.projects);

    expect(seed.verticals).toHaveLength(9);
    expect(seed.verticals.every((vertical) => vertical.projects)).toBe(true);
    expect(seed.verticals.map((vertical) => vertical.projects)).toEqual([
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
      expect.arrayContaining([expect.any(Object)]),
    ]);
    expect(seed.verticals.every((vertical) => vertical.projects.length === 1)).toBe(true);
    expect(projects.filter((project) => project.showcase)).toHaveLength(3);
    expect(projects.map((project) => project.name)).toEqual(expect.arrayContaining([
      'Amaravati Solar Commons',
      'Kondapalli Logistics Yard',
      'Krishna Riverfront Residences',
    ]));
  });

  it('contains only synthetic vertical and project fields, with no real-person marker content', () => {
    const seed = createDemoSeed();

    expect(Object.keys(seed)).toEqual(['verticals']);
    for (const vertical of seed.verticals) {
      expect(Object.keys(vertical).sort()).toEqual(['id', 'name', 'projects']);
      expect(Object.keys(vertical.projects[0]).sort()).toEqual(['id', 'name', 'showcase']);
    }
    expect(JSON.stringify(seed)).not.toMatch(personalMarkerPattern);
  });

  it('passes the public safety assertion and contains no explicit real-person markers', () => {
    const seed = createDemoSeed();
    const serializedSeed = JSON.stringify(seed).toLowerCase();

    expect(() => assertSyntheticSeedSafety(seed)).not.toThrow();
    expect(realPersonMarkers.some((marker) => serializedSeed.includes(marker))).toBe(false);
  });

  it('rejects an otherwise-valid DemoSeed containing a known real-person marker', () => {
    const seed = createDemoSeed();
    const contaminatedSeed: DemoSeed = {
      verticals: seed.verticals.map((vertical, verticalIndex) => verticalIndex === 0
        ? {
            ...vertical,
            projects: vertical.projects.map((project, projectIndex) => projectIndex === 0
              ? { ...project, name: 'Elon Musk Memorial' }
              : project),
          }
        : vertical),
    };

    expect(() => assertSyntheticSeedSafety(contaminatedSeed)).toThrow('elon musk');
  });
});
