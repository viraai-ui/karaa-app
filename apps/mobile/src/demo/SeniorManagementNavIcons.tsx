import { StyleSheet, View } from 'react-native';

import type { OfflineDemoTabKey } from './offline-demo';

export const SENIOR_MANAGEMENT_NAV_INACTIVE = '#F1EEE7';

const iconNames: Partial<Record<OfflineDemoTabKey, string>> = {
  power: 'Power of 9 hollow grid',
  tenders: 'Tenders folded document',
  command: 'Command Centre speedometer',
  map: 'Geo Location map pin',
  chat: 'Chat speech bubble',
};

type Props = { tabKey: OfflineDemoTabKey; color: string };

export function SeniorManagementNavIcon({ tabKey, color }: Props) {
  const common = {
    accessible: true,
    accessibilityLabel: `${iconNames[tabKey]} icon`,
    accessibilityRole: 'image' as const,
    testID: `senior-management-nav-icon-${tabKey}`,
  };

  if (tabKey === 'power') {
    return <View {...common} style={styles.gridFrame}>{Array.from({ length: 9 }, (_, index) => <View key={index} style={[styles.hollowDot, { borderColor: color }]} testID={`senior-management-nav-power-dot-${index + 1}`} />)}</View>;
  }
  if (tabKey === 'tenders') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.document, { borderColor: color }]} testID="senior-management-nav-document"><View style={[styles.fold, { backgroundColor: '#050605', borderBottomColor: color, borderLeftColor: color }]} /><View style={[styles.documentLine, styles.lineOne, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.lineTwo, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.lineThree, { backgroundColor: color }]} /></View></View>;
  }
  if (tabKey === 'command') {
    return <View {...common} style={styles.gaugeFrame}><View style={[styles.gaugeArc, { borderColor: color }]} testID="senior-management-nav-gauge-arc" /><View style={styles.gaugeMask} />{[-62, -31, 0, 31, 62].map((angle, index) => <View key={angle} style={[styles.tickAnchor, { transform: [{ rotate: `${angle}deg` }] }]}><View style={[styles.gaugeTick, { backgroundColor: color }]} testID={`senior-management-nav-gauge-tick-${index + 1}`} /></View>)}<View style={[styles.needle, { backgroundColor: color }]} /><View style={[styles.needleHub, { borderColor: color, backgroundColor: '#050605' }]} /></View>;
  }
  if (tabKey === 'map') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.pinHead, { borderColor: color }]} testID="senior-management-nav-pin-outline"><View style={[styles.pinCentre, { borderColor: color }]} /></View><View style={[styles.pinTail, { borderBottomColor: color, borderRightColor: color }]} /></View>;
  }
  return <View {...common} style={styles.iconFrame}><View style={[styles.bubble, { borderColor: color }]} testID="senior-management-nav-chat-outline" /><View style={[styles.bubbleTail, { backgroundColor: '#050605', borderBottomColor: color, borderRightColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  iconFrame: { alignItems: 'center', height: 27, justifyContent: 'center', position: 'relative', width: 30 },
  gridFrame: { alignContent: 'center', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', height: 27, justifyContent: 'center', padding: 1.5, width: 27 },
  hollowDot: { backgroundColor: 'transparent', borderRadius: 4, borderWidth: 1.65, height: 6, margin: 1.25, width: 6 },
  document: { borderRadius: 2, borderWidth: 1.7, height: 25, position: 'relative', width: 20 },
  fold: { borderBottomWidth: 1.7, borderLeftWidth: 1.7, height: 8, position: 'absolute', right: -1.7, top: -1.7, width: 8 },
  documentLine: { borderRadius: 1, height: 1.7, left: 4, position: 'absolute' },
  lineOne: { top: 10, width: 7 }, lineTwo: { top: 15, width: 11 }, lineThree: { top: 20, width: 8 },
  gaugeFrame: { height: 27, overflow: 'hidden', position: 'relative', width: 30 },
  gaugeArc: { borderRadius: 15, borderWidth: 1.7, height: 30, left: 0, position: 'absolute', top: 1, width: 30 },
  gaugeMask: { backgroundColor: '#050605', bottom: -1, height: 11, left: 0, position: 'absolute', width: 30 },
  tickAnchor: { height: 13, left: 14, position: 'absolute', top: 3, transformOrigin: '1px 12px', width: 2 },
  gaugeTick: { borderRadius: 1, height: 4, width: 1.7 },
  needle: { borderRadius: 1, bottom: 7, height: 1.7, left: 14, position: 'absolute', transform: [{ rotate: '-35deg' }], transformOrigin: '1px 1px', width: 10 },
  needleHub: { borderRadius: 3, borderWidth: 1.5, bottom: 5, height: 6, left: 12, position: 'absolute', width: 6 },
  pinHead: { alignItems: 'center', borderRadius: 9, borderWidth: 1.7, height: 18, justifyContent: 'center', position: 'absolute', top: 1, width: 18, zIndex: 2 },
  pinCentre: { borderRadius: 3, borderWidth: 1.6, height: 6, width: 6 },
  pinTail: { borderBottomWidth: 1.7, borderRightWidth: 1.7, height: 12, position: 'absolute', top: 11, transform: [{ rotate: '45deg' }], width: 12 },
  bubble: { borderRadius: 8, borderWidth: 1.7, height: 20, left: 2, position: 'absolute', top: 2, width: 26, zIndex: 2 },
  bubbleTail: { borderBottomWidth: 1.7, borderRightWidth: 1.7, bottom: 2, height: 8, left: 7, position: 'absolute', transform: [{ rotate: '38deg' }], width: 8 },
});
