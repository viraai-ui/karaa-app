import { fireEvent, render } from '@testing-library/react-native';
import { Image, Platform, StyleSheet } from 'react-native';

import { VerticalDetailPage } from '../src/demo/VerticalDetailPage';
import { verticalDetailForId } from '../src/demo/vertical-detail';
import { subverticalPortfolioForPathway } from '../src/demo/subvertical-projects';

const healthcare = verticalDetailForId('healthcare-life-sciences');

describe('healthcare-only vertical detail reference composition', () => {
  it('renders exact healthcare content, ordering, fade and four solid-image cards', () => {
    const rendered = render(<VerticalDetailPage onAction={jest.fn()} verticalId={healthcare.id} />);
    expect(rendered.getByTestId('healthcare-white-hero-fade')).toBeTruthy();
    expect(rendered.queryByText('POWER OF 9  •  04')).toBeNull();
    expect(rendered.getByText('Healthcare &\nLife Sciences')).toBeTruthy();
    expect(rendered.queryByText('04 SUB-VERTICALS')).toBeNull();
    expect(rendered.getByText('EXPLORE HEALTHCARE')).toBeTruthy();
    expect(rendered.getByText('Choose a pathway')).toBeTruthy();
    const pathwaySubtitle = rendered.getByText('Select a sub-vertical to view its projects, milestones and latest progress.');
    expect(StyleSheet.flatten(pathwaySubtitle.props.style)).toMatchObject({ fontSize: 12, lineHeight: 16 });
    expect(rendered.getAllByTestId(/^healthcare-pathway-\d$/)).toHaveLength(4);
    ['01', '02', '03', '04', '♜', '♨', '▣', '▤'].forEach((removedContent) => {
      expect(rendered.queryByText(removedContent)).toBeNull();
    });
    const heroDescriptionStyle = StyleSheet.flatten(rendered.getByTestId('healthcare-hero-description').props.style);
    expect(heroDescriptionStyle).toMatchObject({ fontSize: 10, lineHeight: 14 });
    expect(heroDescriptionStyle.fontSize).toBeGreaterThanOrEqual(10);
    expect(rendered.getByTestId('healthcare-hero-description').props).toMatchObject({ ellipsizeMode: 'tail', numberOfLines: 6 });
    healthcare.pathways.forEach((_, index) => {
      const title = rendered.getByTestId(`healthcare-pathway-title-${index + 1}`);
      const description = rendered.getByTestId(`healthcare-pathway-description-${index + 1}`);
      expect(StyleSheet.flatten(title.props.style)).toMatchObject({ fontSize: 16, lineHeight: 17 });
      expect(StyleSheet.flatten(title.props.style).fontSize).toBeGreaterThanOrEqual(16);
      expect(StyleSheet.flatten(description.props.style)).toMatchObject({ fontSize: 9, lineHeight: 12 });
      expect(StyleSheet.flatten(description.props.style).fontSize).toBeGreaterThanOrEqual(9);
      expect(title.props).toMatchObject({ ellipsizeMode: 'tail', numberOfLines: 3 });
      expect(description.props).toMatchObject({ numberOfLines: 1 });
      expect(description.props.ellipsizeMode).toBeUndefined();
      const cardHeight = StyleSheet.flatten(rendered.getByTestId(`healthcare-pathway-${index + 1}`).props.style).height;
      const copyStyle = StyleSheet.flatten(rendered.getByTestId(`healthcare-pathway-copy-${index + 1}`).props.style);
      const maximumTextBlockHeight = (17 * 3) + 7 + 12 + (copyStyle.paddingVertical * 2);
      expect(cardHeight).toBe(101);
      expect(maximumTextBlockHeight).toBeLessThanOrEqual(cardHeight - 2);
    });
    const cardImages = rendered.UNSAFE_getAllByType(Image).filter((image) => String(image.props.accessibilityLabel).endsWith(' pathway'));
    expect(cardImages).toHaveLength(4);
    cardImages.forEach((image) => {
      expect(image.props.resizeMode).toBe('cover');
      expect(StyleSheet.flatten(image.props.style).tintColor).toBeUndefined();
    });
    healthcare.pathways.forEach((pathway) => {
      expect(rendered.getByText(pathway.title)).toBeTruthy();
      expect(rendered.getByText(pathway.description)).toBeTruthy();
    });
    expect(healthcare.pathways.map(({ title, description }) => ({ title, description }))).toEqual([
      { title: 'Multi-Specialty Hospitals', description: 'Connected, people-first care.' },
      { title: 'Diagnostics, Clinics & Preventive Health', description: 'Earlier insight, healthier lives.' },
      { title: 'Digital Health & Telemedicine', description: 'Care that reaches every need.' },
      { title: 'Medical Education, Life Sciences & Research', description: 'Learning and research for health.' },
    ]);
    expect(rendered.queryByText('Digital Health, Telemedicine & Emergency Response')).toBeNull();
    expect(rendered.getByText('Care designed as a continuum')).toBeTruthy();
    expect(StyleSheet.flatten(rendered.getByText('Care designed as a continuum').props.style).fontFamily).toBe(
      Platform.select({ android: 'serif', ios: 'Georgia', web: 'Georgia, Times New Roman, serif' }),
    );
    healthcare.matters.forEach((matter) => {
      expect(rendered.getByText(matter.title)).toBeTruthy();
      expect(rendered.getByText(matter.copy)).toBeTruthy();
      expect(StyleSheet.flatten(rendered.getByText(matter.title).props.style)).toMatchObject({ fontWeight: '700' });
      expect(StyleSheet.flatten(rendered.getByText(matter.copy).props.style)).toMatchObject({ fontSize: 9, lineHeight: 12 });
    });
    expect(rendered.getByLabelText('Continuous care heart icon')).toBeTruthy();
    expect(rendered.getByLabelText('Connected care network icon')).toBeTruthy();
    expect(rendered.getByLabelText('Care continuity path icon')).toBeTruthy();
  });

  it.each(healthcare.pathways)('routes $title to its existing subvertical page', (pathway) => {
    const onAction = jest.fn();
    const rendered = render(<VerticalDetailPage onAction={onAction} verticalId={healthcare.id} />);
    fireEvent.press(rendered.getByRole('button', { name: `Explore ${pathway.title}` }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'select-subvertical',
      subverticalId: subverticalPortfolioForPathway(healthcare.id, pathway.title).id,
    });
  });

  it('keeps the renamed digital-health pathway on its established route', () => {
    expect(subverticalPortfolioForPathway(healthcare.id, healthcare.pathways[2].title).id).toBe(
      'digital-health-telemedicine-emergency-response',
    );
  });

  it('leaves another vertical on the unchanged legacy composition', () => {
    const rendered = render(<VerticalDetailPage onAction={jest.fn()} verticalId="energy-utilities" />);
    expect(rendered.getByTestId('vertical-detail-energy-utilities')).toBeTruthy();
    expect(rendered.getByTestId('pathway-list')).toBeTruthy();
    expect(rendered.getByTestId('matters-list')).toBeTruthy();
    expect(rendered.queryByTestId('healthcare-white-hero-fade')).toBeNull();
    expect(rendered.getByRole('button', { name: 'Back to Power of 9' })).toBeTruthy();
  });

  it('also leaves infrastructure on the legacy composition', () => {
    const rendered = render(<VerticalDetailPage onAction={jest.fn()} verticalId="infrastructure-urban-development" />);
    expect(rendered.getByTestId('vertical-detail-infrastructure-urban-development')).toBeTruthy();
    expect(rendered.queryByTestId('vertical-detail-healthcare-life-sciences')).toBeNull();
    expect(rendered.getByRole('button', { name: 'Back to Power of 9' })).toBeTruthy();
  });
});
