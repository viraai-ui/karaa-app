import { fireEvent, render } from '@testing-library/react-native';
import { Image, Platform, StyleSheet } from 'react-native';

import { VerticalDetailPage } from '../src/demo/VerticalDetailPage';
import { verticalDetails } from '../src/demo/vertical-detail';
import { subverticalPortfolioForPathway } from '../src/demo/subvertical-projects';

const removedMetadata = ['POWER OF 9','01','02','03','04','◇','◎','⌁'];

describe.each(verticalDetails)('$title universal vertical detail', (vertical) => {
  it('uses locked template geometry, content, semantic icons and no legacy metadata', () => {
    const screen = render(<VerticalDetailPage onAction={jest.fn()} verticalId={vertical.id} />);
    expect(screen.getByTestId(`vertical-detail-${vertical.id}`)).toBeTruthy();
    expect(screen.getByTestId('vertical-white-hero-fade')).toBeTruthy();
    expect(screen.getAllByTestId(/^vertical-pathway-\d$/)).toHaveLength(4);
    expect(screen.getAllByTestId(/^vertical-matter-\d$/)).toHaveLength(3);
    expect(screen.queryByRole('button',{name:'Back to Power of 9'})).toBeNull();
    removedMetadata.forEach(value => expect(screen.queryByText(value)).toBeNull());
    expect(StyleSheet.flatten(screen.getByTestId('vertical-hero').props.style)).toMatchObject({height:202});
    expect(StyleSheet.flatten(screen.getByTestId('vertical-hero-title').props.style)).toMatchObject({fontSize:['ports-airports-logistics','manufacturing-industrial-solutions'].includes(vertical.id)?22:25,lineHeight:['ports-airports-logistics','manufacturing-industrial-solutions'].includes(vertical.id)?22:24});
    expect(screen.getByTestId('vertical-hero-title').props).toMatchObject({adjustsFontSizeToFit:true,minimumFontScale:.72,numberOfLines:3});
    expect(StyleSheet.flatten(screen.getByText('Pathways').props.style)).toMatchObject({fontSize:22,lineHeight:25});
    expect(screen.queryByText('Select a sub-vertical to view its projects, milestones and latest progress.')).toBeNull();
    vertical.pathways.forEach((pathway,index) => {
      expect(pathway.description.length).toBeLessThanOrEqual(56);
      expect(screen.getByText(pathway.title)).toBeTruthy();
      expect(screen.getByText(pathway.description)).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByTestId(`vertical-pathway-${index+1}`).props.style)).toMatchObject({height:101,borderRadius:10});
      expect(StyleSheet.flatten(screen.getByTestId(`vertical-pathway-title-${index+1}`).props.style)).toMatchObject({fontSize:16,lineHeight:17});
      expect(StyleSheet.flatten(screen.getByTestId(`vertical-pathway-description-${index+1}`).props.style)).toMatchObject({fontSize:10,lineHeight:12,marginTop:7});
      expect(screen.getByTestId(`vertical-pathway-description-${index+1}`).props.numberOfLines).toBe(1);
    });
    vertical.matters.forEach(matter => {
      expect(screen.getByText(matter.title)).toBeTruthy(); expect(screen.getByText(matter.copy)).toBeTruthy();
    });
    expect(screen.getAllByLabelText(/icon$/)).toHaveLength(3);
  });

  it.each(vertical.pathways)('preserves the exact route for $title', pathway => {
    const onAction=jest.fn(); const screen=render(<VerticalDetailPage onAction={onAction} verticalId={vertical.id}/>);
    fireEvent.press(screen.getByRole('button',{name:`Explore ${pathway.title}`}));
    expect(onAction).toHaveBeenCalledWith({type:'select-subvertical',subverticalId:subverticalPortfolioForPathway(vertical.id,pathway.title).id});
  });
});

describe('locked Healthcare regression',()=>{
  const healthcare=verticalDetails[3];
  it('preserves exact copy, images, third title/route and styles',()=>{
    const screen=render(<VerticalDetailPage onAction={jest.fn()} verticalId={healthcare.id}/>);
    expect(screen.getByText('Healthcare &\nLife Sciences')).toBeTruthy();
    expect(healthcare.intro).toBe('Building integrated healthcare systems that improve access, quality and outcomes across care delivery, diagnostics, digital health and life sciences.');
    expect(healthcare.pathways.map(({title,description})=>({title,description}))).toEqual([
      {title:'Multi-Specialty Hospitals',description:'Connected, people-first care.'},{title:'Diagnostics, Clinics & Preventive Health',description:'Earlier insight, healthier lives.'},{title:'Digital Health & Telemedicine',description:'Care that reaches every need.'},{title:'Medical Education, Life Sciences & Research',description:'Learning and research for health.'},
    ]);
    expect(subverticalPortfolioForPathway(healthcare.id,healthcare.pathways[2].title).id).toBe('digital-health-telemedicine-emergency-response');
    const images=screen.UNSAFE_getAllByType(Image);
    expect(images.find(i=>i.props.accessibilityLabel==='Healthcare & Life Sciences hero')?.props.source).toBe(healthcare.hero);
    healthcare.pathways.forEach(pathway=>expect(images.find(i=>i.props.accessibilityLabel===`${pathway.title} pathway`)?.props.source).toBe(pathway.image));
    expect(screen.getByLabelText('Continuous care heart icon')).toBeTruthy(); expect(screen.getByLabelText('Connected care network icon')).toBeTruthy(); expect(screen.getByLabelText('Care continuity path icon')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByText('Care designed as a continuum').props.style)).toMatchObject({fontFamily:Platform.select({android:'serif',ios:'Georgia',web:'Georgia, Times New Roman, serif'}),fontSize:19,lineHeight:23});
  });
});
