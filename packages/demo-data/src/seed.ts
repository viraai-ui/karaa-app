export interface DemoProject {
  id: string;
  name: string;
  showcase: boolean;
}

export interface DemoVertical {
  id: string;
  name: string;
  projects: DemoProject[];
}

export interface DemoSeed {
  verticals: DemoVertical[];
}

const realPersonMarkers = ['elon musk', 'jeff bezos', 'mark zuckerberg'] as const;

const demoSeed: DemoSeed = {
  verticals: [
    {
      id: '10000001-0000-4000-8000-000000000001',
      name: 'Renewable Infrastructure',
      projects: [{ id: '20000001-0000-4000-8000-000000000001', name: 'Amaravati Solar Commons', showcase: true }],
    },
    {
      id: '10000002-0000-4000-8000-000000000002',
      name: 'Logistics and Warehousing',
      projects: [{ id: '20000002-0000-4000-8000-000000000002', name: 'Kondapalli Logistics Yard', showcase: true }],
    },
    {
      id: '10000003-0000-4000-8000-000000000003',
      name: 'Residential Communities',
      projects: [{ id: '20000003-0000-4000-8000-000000000003', name: 'Krishna Riverfront Residences', showcase: true }],
    },
    {
      id: '10000004-0000-4000-8000-000000000004',
      name: 'Civic Learning',
      projects: [{ id: '20000004-0000-4000-8000-000000000004', name: 'Mangalagiri Learning Courtyard', showcase: false }],
    },
    {
      id: '10000005-0000-4000-8000-000000000005',
      name: 'Food Systems',
      projects: [{ id: '20000005-0000-4000-8000-000000000005', name: 'Delta Harvest Exchange', showcase: false }],
    },
    {
      id: '10000006-0000-4000-8000-000000000006',
      name: 'Wellness Campuses',
      projects: [{ id: '20000006-0000-4000-8000-000000000006', name: 'Suryalanka Wellness Pavilion', showcase: false }],
    },
    {
      id: '10000007-0000-4000-8000-000000000007',
      name: 'Fabrication',
      projects: [{ id: '20000007-0000-4000-8000-000000000007', name: 'Penamaluru Fabrication Commons', showcase: false }],
    },
    {
      id: '10000008-0000-4000-8000-000000000008',
      name: 'Hospitality',
      projects: [{ id: '20000008-0000-4000-8000-000000000008', name: 'Uppada Coastal Retreat', showcase: false }],
    },
    {
      id: '10000009-0000-4000-8000-000000000009',
      name: 'Digital Infrastructure',
      projects: [{ id: '20000009-0000-4000-8000-000000000009', name: 'Vijayawada Data Garden', showcase: false }],
    },
  ],
};

export function assertSyntheticSeedSafety(seed: DemoSeed): void {
  const serializedSeed = JSON.stringify(seed).toLowerCase();
  const marker = realPersonMarkers.find((candidate) => serializedSeed.includes(candidate));

  if (marker) {
    throw new Error(`Synthetic demo seed contains real-person marker: ${marker}`);
  }
}

export function createDemoSeed(): DemoSeed {
  const seed = {
    verticals: demoSeed.verticals.map((vertical) => ({
      ...vertical,
      projects: vertical.projects.map((project) => ({ ...project })),
    })),
  };

  assertSyntheticSeedSafety(seed);
  return seed;
}
