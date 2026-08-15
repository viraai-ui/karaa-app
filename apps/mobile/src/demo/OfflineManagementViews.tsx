import { DemoChatExperience } from './DemoChatExperience';
import { DemoExplorer } from './DemoExplorer';
import { DemoManagementExperience } from './DemoManagementExperience';
import { DemoTenderExperience } from './DemoTenderExperience';
import type { OfflineDemoAction, OfflineDemoState } from './offline-demo';

type Props = { state: OfflineDemoState; onAction: (action: OfflineDemoAction) => void };

export function OfflineManagementViews({ state, onAction }: Props) {
  switch (state.selectedTab) {
    case 'tenders': return <DemoTenderExperience onAction={onAction} role="management" state={state} />;
    case 'command': return <DemoManagementExperience onAction={onAction} state={state} view="command" />;
    case 'map': return <DemoManagementExperience onAction={onAction} state={state} view="map" />;
    case 'chat': return <DemoChatExperience state={state} onAction={onAction} />;
    case 'power':
    default: return <DemoExplorer onAction={onAction} state={state} />;
  }
}
