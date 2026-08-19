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
    expect(rendered.getByText('POWER OF 9  •  04')).toBeTruthy();
    expect(rendered.getByText('Healthcare &\nLife Sciences')).toBeTruthy();
    expect(rendered.getByText('04 SUB-VERTICALS')).toBeTruthy();
    expect(rendered.getByText('EXPLORE HEALTHCARE')).toBeTruthy();
    expect(rendered.getByText('Choose a pathway')).toBeTruthy();
    expect(rendered.getAllByTestId(/healthcare-pathway-\d/)).toHaveLength(4);
    expect(['01', '02', '03', '04'].map((number) => rendered.getByText(number).props.children)).toEqual(['01', '02', '03', '04']);
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
    expect(rendered.getByText('Care designed as a continuum')).toBeTruthy();
    expect(StyleSheet.flatten(rendered.getByText('Care designed as a continuum').props.style).fontFamily).toBe(
      Platform.select({ android: 'serif', ios: 'Georgia', web: 'Georgia, Times New Roman, serif' }),
    );
    healthcare.matters.forEach((matter) => {
      expect(rendered.getByText(matter.title)).toBeTruthy();
      expect(rendered.getByText(matter.copy)).toBeTruthy();
    });
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
