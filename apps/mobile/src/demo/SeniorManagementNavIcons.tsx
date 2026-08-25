import { StyleSheet, View } from 'react-native';

import type { OfflineDemoTabKey } from './offline-demo';
import { DashboardNavIcon } from './DashboardNavIcon';

export const SENIOR_MANAGEMENT_NAV_INACTIVE = '#303030';

const iconNames: Partial<Record<OfflineDemoTabKey, string>> = {
  power: 'Dashboard',
  tenders: 'Tenders folded document',
  command: 'Overview summary',
  map: 'Track location',
  chat: 'Chat speech bubble',
};

type Props = { tabKey: OfflineDemoTabKey; color: string };

export function SeniorManagementNavIcon({ tabKey, color }: Props) {
  const common = {
    accessible: false,
    testID: `senior-management-nav-icon-${tabKey}`,
  };

  if (tabKey === 'power') {
    return <DashboardNavIcon color={color} testID="senior-management-nav-icon-power" />;
  }
  if (tabKey === 'tenders') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.document, { borderColor: color }]} testID="senior-management-nav-document"><View style={[styles.fold, { backgroundColor: '#FFFFFF', borderBottomColor: color, borderLeftColor: color }]} /><View style={[styles.documentLine, styles.lineOne, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.lineTwo, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.lineThree, { backgroundColor: color }]} /></View></View>;
  }
  if (tabKey === 'command') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.overviewFrame, { borderColor: color }]} testID="senior-management-nav-overview"><View style={[styles.overviewBar, styles.overviewBarOne, { backgroundColor: color }]} /><View style={[styles.overviewBar, styles.overviewBarTwo, { backgroundColor: color }]} /><View style={[styles.overviewBar, styles.overviewBarThree, { backgroundColor: color }]} /></View></View>;
  }
  if (tabKey === 'map') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.trackRing, { borderColor: color }]} testID="senior-management-nav-track"><View style={[styles.trackDot, { backgroundColor: color }]} /></View><View style={[styles.trackNorth, { backgroundColor: color }]} /><View style={[styles.trackSouth, { backgroundColor: color }]} /><View style={[styles.trackWest, { backgroundColor: color }]} /><View style={[styles.trackEast, { backgroundColor: color }]} /></View>;
  }
  return <View {...common} style={styles.iconFrame}><View style={[styles.bubble, { borderColor: color }]} testID="senior-management-nav-chat-outline"><View style={[styles.chatDot, { backgroundColor: color }]} /><View style={[styles.chatDot, { backgroundColor: color }]} /></View><View style={[styles.bubbleTail, { backgroundColor: '#FFFFFF', borderBottomColor: color, borderRightColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  iconFrame: { alignItems: 'center', height: 22, justifyContent: 'center', position: 'relative', transform: [{ scale: 0.76 }], width: 22 },

  document: { borderRadius: 2, borderWidth: 1.7, height: 25, position: 'relative', width: 20 },
  fold: { borderBottomWidth: 1.7, borderLeftWidth: 1.7, height: 8, position: 'absolute', right: -1.7, top: -1.7, width: 8 },
  documentLine: { borderRadius: 1, height: 1.7, left: 4, position: 'absolute' },
  lineOne: { top: 10, width: 7 }, lineTwo: { top: 15, width: 11 }, lineThree: { top: 20, width: 8 },
  overviewFrame: { borderRadius: 4, borderWidth: 1.7, height: 20, justifyContent: 'flex-end', paddingBottom: 3, paddingHorizontal: 3, width: 21 }, overviewBar: { borderRadius: 1, height: 2, marginTop: 2 }, overviewBarOne: { width: 8 }, overviewBarTwo: { width: 14 }, overviewBarThree: { width: 11 },
  trackRing: { alignItems: 'center', borderRadius: 7, borderWidth: 1.7, height: 14, justifyContent: 'center', width: 14 }, trackDot: { borderRadius: 2, height: 4, width: 4 }, trackNorth: { height: 4, left: 10.2, position: 'absolute', top: 0, width: 1.6 }, trackSouth: { bottom: 0, height: 4, left: 10.2, position: 'absolute', width: 1.6 }, trackWest: { height: 1.6, left: 0, position: 'absolute', top: 10.2, width: 4 }, trackEast: { height: 1.6, position: 'absolute', right: 0, top: 10.2, width: 4 },
  bubble: { alignItems: 'center', borderRadius: 6, borderWidth: 1.7, flexDirection: 'row', gap: 3, height: 17, justifyContent: 'center', left: 1, position: 'absolute', top: 1, width: 20, zIndex: 2 }, chatDot: { borderRadius: 1.5, height: 3, width: 3 },
  bubbleTail: { borderBottomWidth: 1.7, borderRightWidth: 1.7, bottom: 1, height: 6, left: 5, position: 'absolute', transform: [{ rotate: '38deg' }], width: 6 },
});
