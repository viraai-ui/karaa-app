import * as React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { OfflineManagementViews } from '../src/demo/OfflineManagementViews';
import { createOfflineDemoState } from '../src/demo/offline-demo';

const screen = () => render(<OfflineManagementViews onAction={jest.fn()} state={{...createOfflineDemoState('management'), selectedTab:'command'}} />);

describe('management Overview', () => {
  it('keeps the exact continuous section order and headline data', () => {
    const r=screen();
    const copy=['Overview','Company snapshot','Project health','Portfolio progress','Upcoming milestones','Overdue milestones','Critical blockers','Latest activity','Tender deadlines','Workforce status','Project portfolio','Project detail','Employee activity','3 items need your attention'];
    copy.forEach(x=>expect(r.getByText(x)).toBeTruthy());
    const json=JSON.stringify(r.toJSON()); let at=-1; copy.forEach(x=>{const next=json.indexOf(x); expect(next).toBeGreaterThan(at); at=next;});
    expect(r.queryByText('Command Centre')).toBeNull();
    ['27','61%','₹1,248 Cr','14','19','05','03','4,860','3,912','628','320','80%'].forEach(x=>expect(r.getAllByText(x).length).toBeGreaterThan(0));
  });
  it('filters verticals and month with semantic 44px controls',()=>{const r=screen(); const v=r.getByRole('button',{name:'Filter vertical'}); const m=r.getByRole('button',{name:'Filter month'}); [v,m].forEach(x=>expect(StyleSheet.flatten(x.props.style).minHeight).toBeGreaterThanOrEqual(44)); fireEvent.press(v); expect(r.queryByText('Ports & Logistics')).toBeNull(); expect(r.getAllByText('Energy & Utilities').length).toBeGreaterThan(0); fireEvent.press(m); expect(r.getByText(/August/)).toBeTruthy();});
  it('assigns blockers and opens milestone/activity/tender details',()=>{const r=screen(); fireEvent.press(r.getByRole('button',{name:'Assign Land title clearance'})); expect(r.getByText('Assigned')).toBeTruthy(); fireEvent.press(r.getByRole('button',{name:'Open Envelope works'})); expect(r.getByText(/locally displayed/)).toBeTruthy(); fireEvent.press(r.getByRole('button',{name:'Open activity RFI closed'})); expect(r.getByText(/Activity detail/)).toBeTruthy(); fireEvent.press(r.getByRole('button',{name:'Open tender Interior Fit-out Works'})); expect(r.getByText(/prototype data/)).toBeTruthy();});
  it('selects a project and updates detail and chart',()=>{const r=screen(); expect(r.getByRole('button',{name:'Select Project Aarohan'}).props.accessibilityState.selected).toBe(true); fireEvent.press(r.getByRole('button',{name:'Select Amaravati Capital City'})); expect(r.getByRole('button',{name:'Select Amaravati Capital City'}).props.accessibilityState.selected).toBe(true); expect(r.getByRole('button',{name:'August progress 64%'})).toBeTruthy(); expect(r.getByLabelText('Monthly progress chart April to August')).toBeTruthy();});
  it('opens workforce, chart points, employees, locations and attention',()=>{const r=screen(); fireEvent.press(r.getByRole('button',{name:'Open workforce role Field 628'})); fireEvent.press(r.getByRole('button',{name:'Monday activity 22'})); expect(r.getByLabelText('Employee activity weekly chart')).toBeTruthy(); fireEvent.press(r.getByRole('button',{name:'Open employee Priya Shah'})); expect(r.getByText(/Employee activity detail/)).toBeTruthy(); expect(StyleSheet.flatten(r.getAllByRole('button',{name:'Open location for Priya Shah'}).at(-1)!.props.style).minHeight).toBeGreaterThanOrEqual(44); fireEvent.press(r.getByRole('button',{name:'Open attention items'})); expect(r.getByText(/2 overdue milestones/)).toBeTruthy();});
});
