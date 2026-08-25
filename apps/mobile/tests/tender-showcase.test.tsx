import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { DemoTenderExperience, displayedTenderDetailIds } from '../src/demo/DemoTenderExperience';
import { createOfflineDemoState } from '../src/demo/offline-demo';

const setup = () => render(<DemoTenderExperience onAction={jest.fn()} role="customer" state={createOfflineDemoState('customer')} />);

describe('reusable tender showcase', () => {
  it('publishes a unique resolver id for every displayed tender', () => {
    expect(displayedTenderDetailIds.length).toBe(11);
    expect(new Set(displayedTenderDetailIds).size).toBe(displayedTenderDetailIds.length);
  });

  it('opens exact Bhopal content from latest applied and preserves board search on back', () => {
    const ui=setup(); fireEvent.changeText(ui.getByLabelText('Search tenders'),'solar');
    fireEvent.press(ui.getByRole('button',{name:'View latest applied 400kV Substation at Bhopal'}));
    for(const text of ['MP Power Transmission Company','Energy & Utilities','₹28.75 Cr','18 Aug 2026','Mar 2027','MPTC/400KV/2026/014','₹45 Lakh','02 Aug 2026','120 Days','Karaa Global Energy Infrastructure Pvt. Ltd.','Pre-Qualified','Financial review expected · Sep 2026']) expect(ui.getByText(text)).toBeTruthy();
    fireEvent.press(ui.getByRole('button',{name:'Back to Tenders'}));
    expect(ui.getByLabelText('Search tenders').props.value).toBe('solar');
  });

  it('supports document/company previews and local detail panels', () => {
    const ui=setup(); fireEvent.press(ui.getByRole('button',{name:'View latest applied 400kV Substation at Bhopal'}));
    fireEvent.press(ui.getByRole('tab',{name:'Documents'})); fireEvent.press(ui.getByRole('button',{name:'Preview Technical Bid Package'})); expect(ui.getByText('Document preview')).toBeTruthy(); fireEvent.press(ui.getByRole('button',{name:'Close Document preview'}));
    fireEvent.press(ui.getByRole('tab',{name:'Companies'})); fireEvent.press(ui.getByRole('button',{name:'View Meridian Grid Systems'})); expect(ui.getByText('Company preview')).toBeTruthy(); fireEvent.press(ui.getByRole('button',{name:'Close Company preview'}));
    for(const [button,title] of [['Share tender','Share tender'],['Tender notifications','Notification preferences'],['Next update details','Next update']] as const){fireEvent.press(ui.getByRole('button',{name:button}));expect(ui.getByText(title)).toBeTruthy();fireEvent.press(ui.getByRole('button',{name:`Close ${title}`}));}
  });

  it.each(displayedTenderDetailIds)('opens complete unique detail for %s', id => {
    const ui=setup();
    const latestName = id === 'bhopal' ? '400kV Substation at Bhopal' : undefined;
    if (latestName) fireEvent.press(ui.getByRole('button',{name:`View latest applied ${latestName}`}));
    else {
      const latestButtons=ui.queryAllByRole('button',{name:/View latest applied/});
      const latest=latestButtons.find(button=>String(button.props.accessibilityLabel).includes(id==='solar-50'?'Solar Power Plant - 50 MW':id==='smart-city-applied'?'Smart City Infrastructure Works':id==='equipment-applied'?'Supply of Electrical Equipment':'__none__'));
      if(latest) fireEvent.press(latest); else {
        const title:Record<string,string>={solar:'Construction of Solar Power Plant 100 MW',transmission:'400kV Transmission Line Package-II',substation:'Electric Substation (220/132kV) EPC Project','wind-solar':'Wind-Solar Hybrid Project 500 MW','equipment-ongoing':'Supply of HT Electrical Equipment','smart-city':'Smart City Infrastructure Works',equipment:'Supply of Electrical Equipment'};
        if(id==='smart-city'||id==='equipment'){fireEvent.press(ui.getByRole('tab',{name:id==='smart-city'?'Show In Progress tenders':'Show Applied tenders'}));}
        fireEvent.press(ui.getByRole('button',{name:`Open ${title[id]} tender details`}));
      }
    }
    expect(ui.getByTestId(`tender-detail-${id}`)).toBeTruthy();
    expect(ui.getByRole('tab',{name:'Overview'}).props.accessibilityState.selected).toBe(true);
    for(const name of ['Overview','Documents','Companies']) expect(StyleSheet.flatten(ui.getByRole('tab',{name}).props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(StyleSheet.flatten(ui.getByRole('button',{name:'Back to Tenders'}).props.style).height).toBe(44);
    expect(ui.getByText('Karaa Global Energy Infrastructure Pvt. Ltd.')).toBeTruthy();
  });

  it('opens distinct populated details from list rows',()=>{const ui=setup();fireEvent.press(ui.getByRole('button',{name:'Open Construction of Solar Power Plant 100 MW tender details'}));expect(ui.getByTestId('tender-detail-solar')).toBeTruthy();expect(ui.getByText('KRG/RJ/2026/038')).toBeTruthy();});
});
