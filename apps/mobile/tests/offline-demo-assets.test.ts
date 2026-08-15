import { demoVisualAssets } from '../src/demo/demo-visual-assets';

describe('Karaa Global demo visual asset registry', () => {
  it('centralizes the three generated Amaravati visuals with visible provenance labels', () => {
    expect(demoVisualAssets).toEqual(expect.objectContaining({
      hero: expect.objectContaining({ label: 'Demo visual', accessibilityLabel: 'Demo visual: Amaravati solar campus' }),
      inspection: expect.objectContaining({ label: 'Demo visual', accessibilityLabel: 'Demo visual: Amaravati inverter inspection' }),
      progress: expect.objectContaining({ label: 'Demo visual', accessibilityLabel: 'Demo visual: Amaravati structural progress' }),
    }));
  });
});
