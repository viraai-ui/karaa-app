import {
  demoProjects,
  demoSubverticals,
  demoVerticals,
  projectForId,
} from '../src/demo/demo-catalog';
import { createOfflineDemoState, offlineDemoReducer, offlineProject } from '../src/demo/offline-demo';

describe('Karaa Power-of-9 demo catalog', () => {
  it('defines all nine distinct Power-of-9 verticals with browseable scenario projects', () => {
    expect(demoVerticals.map(({ title }) => title)).toEqual([
      'Infrastructure & Urban Development',
      'Ports, Airports & Integrated Logistics',
      'Energy & Utilities',
      'Healthcare & Life Sciences',
      'Hospitality, Tourism & Leisure',
      'Real Estate & Asset Development',
      'Manufacturing & Industrial Solutions',
      'Spiritual Renaissance for Bharat',
      'Education, Technology & Innovation',
    ]);
    expect(demoVerticals).toHaveLength(9);
    expect(demoSubverticals).toHaveLength(9);
    expect(demoProjects).toHaveLength(9);
    expect(demoProjects.every((project) => project.verticalId)).toBe(true);
    expect(projectForId('amaravati-solar-commons')).toEqual(expect.objectContaining({
      id: 'amaravati-solar-commons',
      verticalId: 'energy-utilities',
      subverticalId: 'solar-generation',
      name: 'Amaravati Solar Commons',
    }));
  });

  it('returns the requested project and rejects unknown project IDs', () => {
    expect(projectForId('amaravati-solar-commons').name).toBe('Amaravati Solar Commons');
    expect(() => projectForId('unknown-project')).toThrow('Unknown demo project: unknown-project');
  });

  it('keeps every featured project, subvertical, and project attached to its catalog parent', () => {
    for (const vertical of demoVerticals) {
      const featuredProject = projectForId(vertical.featuredProjectId);
      expect(featuredProject.verticalId).toBe(vertical.id);
    }

    for (const subvertical of demoSubverticals) {
      expect(demoVerticals.some((vertical) => vertical.id === subvertical.verticalId)).toBe(true);
    }

    for (const project of demoProjects) {
      expect(demoVerticals.some((vertical) => vertical.id === project.verticalId)).toBe(true);
      expect(demoSubverticals.some((subvertical) => (
        subvertical.id === project.subverticalId && subvertical.verticalId === project.verticalId
      ))).toBe(true);
    }
  });

  it('derives Amaravati shared facts coherently from the catalog', () => {
    const amaravati = projectForId('amaravati-solar-commons');
    const energyVertical = demoVerticals.find((vertical) => vertical.id === amaravati.verticalId);

    expect(energyVertical).toBeDefined();
    expect(offlineProject).toEqual(expect.objectContaining({
      name: amaravati.name,
      vertical: energyVertical?.title,
      milestone: amaravati.milestone,
      nextMilestone: amaravati.nextMilestone,
      progress: amaravati.progress,
      location: amaravati.location,
    }));
  });

  it('moves from the root through Energy, solar generation, and Amaravati project detail', () => {
    let state = createOfflineDemoState('customer');

    expect(state).toEqual(expect.objectContaining({
      surface: 'root',
      selectedVerticalId: null,
      selectedSubverticalId: null,
      selectedProjectId: null,
      selectedProjectDetailTab: 'timeline',
    }));

    state = offlineDemoReducer(state, { type: 'select-vertical', verticalId: 'energy-utilities' });
    expect(state).toEqual(expect.objectContaining({
      surface: 'vertical',
      selectedVerticalId: 'energy-utilities',
      selectedSubverticalId: null,
      selectedProjectId: null,
    }));

    state = offlineDemoReducer(state, { type: 'select-subvertical', subverticalId: 'solar-generation' });
    expect(state).toEqual(expect.objectContaining({
      surface: 'subvertical',
      selectedVerticalId: 'energy-utilities',
      selectedSubverticalId: 'solar-generation',
      selectedProjectId: null,
    }));

    state = offlineDemoReducer(state, { type: 'select-project', projectId: 'amaravati-solar-commons' });
    expect(state.selectedVerticalId).toBe('energy-utilities');
    expect(state.selectedSubverticalId).toBe('solar-generation');
    expect(state.selectedProjectId).toBe('amaravati-solar-commons');
    expect(state.surface).toBe('project');
  });

  it('selects project detail tabs and returns to the root with all selections cleared', () => {
    let state = createOfflineDemoState('management');
    state = offlineDemoReducer(state, { type: 'select-vertical', verticalId: 'energy-utilities' });
    state = offlineDemoReducer(state, { type: 'select-subvertical', subverticalId: 'solar-generation' });
    state = offlineDemoReducer(state, { type: 'select-project', projectId: 'amaravati-solar-commons' });
    state = offlineDemoReducer(state, { type: 'select-project-detail-tab', tab: 'documents' });

    expect(state).toEqual(expect.objectContaining({
      surface: 'project',
      selectedVerticalId: 'energy-utilities',
      selectedSubverticalId: 'solar-generation',
      selectedProjectId: 'amaravati-solar-commons',
      selectedProjectDetailTab: 'documents',
    }));

    state = offlineDemoReducer(state, { type: 'back-to-root' });
    expect(state).toEqual(expect.objectContaining({
      surface: 'root',
      selectedVerticalId: null,
      selectedSubverticalId: null,
      selectedProjectId: null,
    }));
  });

  it('rejects an unknown vertical with a deterministic error', () => {
    expect(() => offlineDemoReducer(createOfflineDemoState(), {
      type: 'select-vertical',
      verticalId: 'unknown-vertical',
    })).toThrow('Unknown demo vertical: unknown-vertical');
  });

  it('requires a selected catalog vertical before selecting a subvertical', () => {
    expect(() => offlineDemoReducer(createOfflineDemoState(), {
      type: 'select-subvertical',
      subverticalId: 'solar-generation',
    })).toThrow('No demo vertical selected');

    expect(() => offlineDemoReducer({
      ...createOfflineDemoState(),
      selectedVerticalId: 'unknown-vertical',
    }, {
      type: 'select-subvertical',
      subverticalId: 'solar-generation',
    })).toThrow('Unknown demo vertical: unknown-vertical');
  });

  it('rejects unknown and mismatched subvertical selections', () => {
    const energyState = offlineDemoReducer(createOfflineDemoState(), {
      type: 'select-vertical',
      verticalId: 'energy-utilities',
    });

    expect(() => offlineDemoReducer(energyState, {
      type: 'select-subvertical',
      subverticalId: 'unknown-subvertical',
    })).toThrow('Unknown demo subvertical: unknown-subvertical');
    expect(() => offlineDemoReducer(energyState, {
      type: 'select-subvertical',
      subverticalId: 'logistics-hubs',
    })).toThrow('Subvertical does not belong to selected vertical: logistics-hubs');
  });

  it('rejects unknown and mismatched project selections', () => {
    let state = offlineDemoReducer(createOfflineDemoState(), {
      type: 'select-vertical',
      verticalId: 'energy-utilities',
    });
    state = offlineDemoReducer(state, { type: 'select-subvertical', subverticalId: 'solar-generation' });

    expect(() => offlineDemoReducer(state, {
      type: 'select-project',
      projectId: 'unknown-project',
    })).toThrow('Unknown demo project: unknown-project');
    expect(() => offlineDemoReducer(state, {
      type: 'select-project',
      projectId: 'aarohan-medical-city',
    })).toThrow('Project does not belong to selected hierarchy: aarohan-medical-city');
  });

  it('resets a newly selected project detail tab to timeline', () => {
    let state = createOfflineDemoState();
    state = offlineDemoReducer(state, { type: 'select-vertical', verticalId: 'energy-utilities' });
    state = offlineDemoReducer(state, { type: 'select-subvertical', subverticalId: 'solar-generation' });
    state = offlineDemoReducer(state, { type: 'select-project', projectId: 'amaravati-solar-commons' });
    state = offlineDemoReducer(state, { type: 'select-project-detail-tab', tab: 'documents' });
    state = offlineDemoReducer(state, { type: 'select-vertical', verticalId: 'ports-airports-logistics' });
    state = offlineDemoReducer(state, { type: 'select-subvertical', subverticalId: 'logistics-hubs' });
    state = offlineDemoReducer(state, { type: 'select-project', projectId: 'vijayawada-integrated-logistics-hub' });

    expect(state.selectedProjectDetailTab).toBe('timeline');
  });
});
