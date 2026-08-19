import { StyleSheet, View } from 'react-native';

import type { OfflineDemoTabKey } from './offline-demo';

export const CUSTOMER_NAV_INACTIVE = '#F1EEE7';

const iconNames: Partial<Record<OfflineDemoTabKey, string>> = {
  power: 'Power of 9 grid',
  tenders: 'Tenders document',
  portfolio: 'My Portfolio briefcase',
  support: 'Support headset',
};

export function CustomerNavIcon({ tabKey, color }: { tabKey: OfflineDemoTabKey; color: string }) {
  const common = {
    accessible: true,
    accessibilityLabel: `${iconNames[tabKey]} icon`,
    accessibilityRole: 'image' as const,
    testID: `customer-nav-icon-${tabKey}`,
  };

  if (tabKey === 'power') {
    return <View {...common} style={styles.iconFrame}>{Array.from({ length: 9 }, (_, index) => <View key={index} style={[styles.dot, { backgroundColor: color }]} testID={`customer-nav-power-dot-${index + 1}`} />)}</View>;
  }
  if (tabKey === 'tenders') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.document, { borderColor: color }]}><View style={[styles.foldMask, { borderBottomColor: color, borderLeftColor: color }]} /><View style={[styles.documentLine, styles.documentLineOne, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.documentLineTwo, { backgroundColor: color }]} /><View style={[styles.documentLine, styles.documentLineThree, { backgroundColor: color }]} /></View></View>;
  }
  if (tabKey === 'portfolio') {
    return <View {...common} style={styles.iconFrame}><View style={[styles.handle, { borderColor: color }]} /><View style={[styles.case, { borderColor: color }]}><View style={[styles.caseSeam, { backgroundColor: color }]} /><View style={[styles.latch, { borderColor: color, backgroundColor: '#050605' }]} /></View></View>;
  }
  return <View {...common} style={styles.iconFrame}><View style={[styles.headband, { borderColor: color }]} /><View style={[styles.earpiece, styles.earpieceLeft, { borderColor: color }]} /><View style={[styles.earpiece, styles.earpieceRight, { borderColor: color }]} /><View style={[styles.boom, { backgroundColor: color }]} /><View style={[styles.mic, { backgroundColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  iconFrame: { alignContent: 'center', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', height: 24, justifyContent: 'center', position: 'relative', width: 24 },
  dot: { borderRadius: 2, height: 3.5, margin: 2, width: 3.5 },
  document: { borderRadius: 1.5, borderWidth: 1.7, height: 21, position: 'relative', width: 17 },
  foldMask: { backgroundColor: '#050605', borderBottomWidth: 1.7, borderLeftWidth: 1.7, height: 7, position: 'absolute', right: -1.7, top: -1.7, width: 7 },
  documentLine: { height: 1.5, left: 3, position: 'absolute' },
  documentLineOne: { top: 8, width: 6 }, documentLineTwo: { top: 12, width: 9 }, documentLineThree: { top: 16, width: 7 },
  handle: { borderBottomWidth: 0, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderWidth: 1.7, height: 5, position: 'absolute', top: 2, width: 9 },
  case: { borderRadius: 2, borderWidth: 1.7, height: 16, position: 'absolute', top: 6, width: 22 },
  caseSeam: { height: 1.5, left: 0, position: 'absolute', right: 0, top: 6 },
  latch: { borderRadius: 1, borderWidth: 1.4, height: 5, left: 8, position: 'absolute', top: 4, width: 4 },
  headband: { borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1.8, height: 13, position: 'absolute', top: 2, width: 19 },
  earpiece: { borderRadius: 2, borderWidth: 1.7, height: 8, position: 'absolute', top: 11, width: 4 },
  earpieceLeft: { left: 1.5 }, earpieceRight: { right: 1.5 },
  boom: { bottom: 3, height: 1.6, position: 'absolute', right: 3, transform: [{ rotate: '-18deg' }], width: 8 },
  mic: { borderRadius: 2, bottom: 1.5, height: 3.5, right: 10, width: 3.5 },
});
