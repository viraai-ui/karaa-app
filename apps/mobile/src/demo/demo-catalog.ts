export interface DemoVertical {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly featuredProjectId: string;
}

export interface DemoSubvertical {
  readonly id: string;
  readonly verticalId: string;
  readonly title: string;
  readonly description: string;
}

export interface DemoProject {
  readonly id: string;
  readonly verticalId: string;
  readonly subverticalId: string;
  readonly name: string;
  readonly location: string;
  readonly status: 'On track' | 'In progress' | 'Attention';
  readonly progress: number;
  readonly milestone: string;
  readonly nextMilestone: string;
  readonly visual: 'hero' | 'inspection' | 'progress';
}

export const demoVerticals: readonly DemoVertical[] = [
  {
    id: 'infrastructure-urban-development',
    number: '01',
    title: 'Infrastructure & Urban Development',
    description: 'Scenario planning for connected public infrastructure and resilient districts.',
    featuredProjectId: 'amaravati-smart-mobility-corridor',
  },
  {
    id: 'ports-airports-logistics',
    number: '02',
    title: 'Ports, Airports & Integrated Logistics',
    description: 'Scenario delivery for integrated freight movement and logistics hubs.',
    featuredProjectId: 'vijayawada-integrated-logistics-hub',
  },
  {
    id: 'energy-utilities',
    number: '03',
    title: 'Energy & Utilities',
    description: 'Scenario delivery for reliable renewable energy and utility systems.',
    featuredProjectId: 'amaravati-solar-commons',
  },
  {
    id: 'healthcare-life-sciences',
    number: '04',
    title: 'Healthcare & Life Sciences',
    description: 'Scenario planning for integrated care, diagnostics, and research facilities.',
    featuredProjectId: 'aarohan-medical-city',
  },
  {
    id: 'hospitality-tourism-leisure',
    number: '05',
    title: 'Hospitality, Tourism & Leisure',
    description: 'Scenario delivery for cultural destinations and guest experiences.',
    featuredProjectId: 'karaa-lakeside-resort',
  },
  {
    id: 'real-estate-asset-development',
    number: '06',
    title: 'Real Estate & Asset Development',
    description: 'Scenario planning for mixed-use districts and long-term assets.',
    featuredProjectId: 'narmada-riverfront-district',
  },
  {
    id: 'manufacturing-industrial-solutions',
    number: '07',
    title: 'Manufacturing & Industrial Solutions',
    description: 'Scenario delivery for advanced manufacturing and industrial ecosystems.',
    featuredProjectId: 'vidarbha-advanced-manufacturing-park',
  },
  {
    id: 'spiritual-renaissance-for-bharat',
    number: '08',
    title: 'Spiritual Renaissance for Bharat',
    description: 'Scenario planning for heritage restoration and pilgrim facilities.',
    featuredProjectId: 'narmada-heritage-corridor',
  },
  {
    id: 'education-technology-innovation',
    number: '09',
    title: 'Education, Technology & Innovation',
    description: 'Scenario delivery for learning campuses and innovation districts.',
    featuredProjectId: 'amaravati-knowledge-campus',
  },
] as const;

export const demoSubverticals: readonly DemoSubvertical[] = [
  {
    id: 'smart-mobility',
    verticalId: 'infrastructure-urban-development',
    title: 'Smart mobility',
    description: 'Connected corridor and public-realm scenario projects.',
  },
  {
    id: 'logistics-hubs',
    verticalId: 'ports-airports-logistics',
    title: 'Logistics hubs',
    description: 'Integrated freight and distribution scenario projects.',
  },
  {
    id: 'solar-generation',
    verticalId: 'energy-utilities',
    title: 'Solar generation',
    description: 'Renewable generation and commissioning scenario projects.',
  },
  {
    id: 'integrated-care',
    verticalId: 'healthcare-life-sciences',
    title: 'Integrated care',
    description: 'Care-campus and diagnostics scenario projects.',
  },
  {
    id: 'cultural-destinations',
    verticalId: 'hospitality-tourism-leisure',
    title: 'Cultural destinations',
    description: 'Hospitality and visitor-experience scenario projects.',
  },
  {
    id: 'mixed-use-districts',
    verticalId: 'real-estate-asset-development',
    title: 'Mixed-use districts',
    description: 'Residential, commercial, and public-realm scenario projects.',
  },
  {
    id: 'advanced-manufacturing',
    verticalId: 'manufacturing-industrial-solutions',
    title: 'Advanced manufacturing',
    description: 'Production, equipment, and industrial-park scenario projects.',
  },
  {
    id: 'heritage-restoration',
    verticalId: 'spiritual-renaissance-for-bharat',
    title: 'Heritage restoration',
    description: 'Cultural infrastructure and pilgrim-facility scenario projects.',
  },
  {
    id: 'innovation-districts',
    verticalId: 'education-technology-innovation',
    title: 'Innovation districts',
    description: 'Learning, research, and technology scenario projects.',
  },
] as const;

export const demoProjects: readonly DemoProject[] = [
  {
    id: 'amaravati-smart-mobility-corridor',
    verticalId: 'infrastructure-urban-development',
    subverticalId: 'smart-mobility',
    name: 'Amaravati Smart Mobility Corridor',
    location: 'Amaravati, Andhra Pradesh',
    status: 'In progress',
    progress: 54,
    milestone: 'Station access alignment',
    nextMilestone: 'Public-realm design review',
    visual: 'progress',
  },
  {
    id: 'vijayawada-integrated-logistics-hub',
    verticalId: 'ports-airports-logistics',
    subverticalId: 'logistics-hubs',
    name: 'Vijayawada Integrated Logistics Hub',
    location: 'Vijayawada, Andhra Pradesh',
    status: 'On track',
    progress: 62,
    milestone: 'Freight yard works',
    nextMilestone: 'Warehouse systems review',
    visual: 'hero',
  },
  {
    id: 'amaravati-solar-commons',
    verticalId: 'energy-utilities',
    subverticalId: 'solar-generation',
    name: 'Amaravati Solar Commons',
    location: 'Amaravati, Andhra Pradesh',
    status: 'On track',
    progress: 65,
    milestone: 'Inverter row commissioning',
    nextMilestone: 'Commissioning readiness review · 22 Aug',
    visual: 'hero',
  },
  {
    id: 'aarohan-medical-city',
    verticalId: 'healthcare-life-sciences',
    subverticalId: 'integrated-care',
    name: 'Aarohan Medical City',
    location: 'Hyderabad, Telangana',
    status: 'In progress',
    progress: 47,
    milestone: 'Diagnostics wing fit-out',
    nextMilestone: 'Clinical workflow review',
    visual: 'inspection',
  },
  {
    id: 'karaa-lakeside-resort',
    verticalId: 'hospitality-tourism-leisure',
    subverticalId: 'cultural-destinations',
    name: 'Karaa Lakeside Resort',
    location: 'Bhopal, Madhya Pradesh',
    status: 'Attention',
    progress: 39,
    milestone: 'Guest pavilion foundations',
    nextMilestone: 'Waterfront access decision',
    visual: 'inspection',
  },
  {
    id: 'narmada-riverfront-district',
    verticalId: 'real-estate-asset-development',
    subverticalId: 'mixed-use-districts',
    name: 'Narmada Riverfront District',
    location: 'Jabalpur, Madhya Pradesh',
    status: 'On track',
    progress: 58,
    milestone: 'District utilities coordination',
    nextMilestone: 'Residential phase review',
    visual: 'progress',
  },
  {
    id: 'vidarbha-advanced-manufacturing-park',
    verticalId: 'manufacturing-industrial-solutions',
    subverticalId: 'advanced-manufacturing',
    name: 'Vidarbha Advanced Manufacturing Park',
    location: 'Nagpur, Maharashtra',
    status: 'In progress',
    progress: 51,
    milestone: 'Production bay structure',
    nextMilestone: 'Equipment layout workshop',
    visual: 'progress',
  },
  {
    id: 'narmada-heritage-corridor',
    verticalId: 'spiritual-renaissance-for-bharat',
    subverticalId: 'heritage-restoration',
    name: 'Narmada Heritage Corridor',
    location: 'Maheshwar, Madhya Pradesh',
    status: 'On track',
    progress: 44,
    milestone: 'Heritage precinct restoration',
    nextMilestone: 'Pilgrim facilities review',
    visual: 'inspection',
  },
  {
    id: 'amaravati-knowledge-campus',
    verticalId: 'education-technology-innovation',
    subverticalId: 'innovation-districts',
    name: 'Amaravati Knowledge Campus',
    location: 'Amaravati, Andhra Pradesh',
    status: 'In progress',
    progress: 49,
    milestone: 'Learning commons framework',
    nextMilestone: 'Research studio planning review',
    visual: 'hero',
  },
] as const;

export function projectForId(projectId: string): DemoProject {
  const project = demoProjects.find((candidate) => candidate.id === projectId);
  if (!project) throw new Error(`Unknown demo project: ${projectId}`);
  return project;
}

export function verticalForId(verticalId: string): DemoVertical {
  const vertical = demoVerticals.find((candidate) => candidate.id === verticalId);
  if (!vertical) throw new Error(`Unknown demo vertical: ${verticalId}`);
  return vertical;
}

export function subverticalForId(subverticalId: string): DemoSubvertical {
  const subvertical = demoSubverticals.find((candidate) => candidate.id === subverticalId);
  if (!subvertical) throw new Error(`Unknown demo subvertical: ${subverticalId}`);
  return subvertical;
}
