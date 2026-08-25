import { StyleSheet, View } from 'react-native';

import type { OfflineDemoIcon } from './offline-demo';
import { DashboardNavIcon } from './DashboardNavIcon';

type ShellIconName = OfflineDemoIcon | 'search' | 'bell';

/** Dependency-free, consistently stroked shell icons. Keeps navigation free of font/emoji glyph variance. */
export function ShellLineIcon({ name, color = '#F1EEE7', testID }: { name: ShellIconName; color?: string; testID?: string }) {
  if (name === 'search') return <View accessibilityElementsHidden style={styles.frame} testID={testID}><View style={[styles.searchRing, { borderColor: color }]} /><View style={[styles.searchHandle, { backgroundColor: color }]} /></View>;
  if (name === 'bell') return <View accessibilityElementsHidden style={styles.frame} testID={testID}><View style={[styles.bell, { borderColor: color }]} /><View style={[styles.bellBase, { backgroundColor: color }]} /><View style={[styles.clapper, { backgroundColor: color }]} /></View>;
  if (name === 'dashboard') return <DashboardNavIcon color={color} testID={testID ?? 'dashboard-nav-icon'} />;
  if (name === 'file') return <View style={styles.frame} testID={testID}><View style={[styles.file, { borderColor: color }]}><View style={[styles.fileLine, { backgroundColor: color }]} /><View style={[styles.fileLine, styles.fileLine2, { backgroundColor: color }]} /></View></View>;
  if (name === 'briefcase' || name === 'tool') return <View style={styles.frame} testID={testID}><View style={[styles.caseHandle, { borderColor: color }]} /><View style={[styles.case, { borderColor: color }]}><View style={[styles.caseLine, { backgroundColor: color }]} /></View></View>;
  if (name === 'chat') return <View style={styles.frame} testID={testID}><View style={[styles.chat, { borderColor: color }]}><View style={[styles.chatDot, { backgroundColor: color }]} /><View style={[styles.chatDot, { backgroundColor: color }]} /></View><View style={[styles.chatTail, { borderColor: color, backgroundColor: '#FFFFFF' }]} /></View>;
  if (name === 'pin') return <View style={styles.frame} testID={testID}><View style={[styles.pin, { borderColor: color }]}><View style={[styles.pinDot, { borderColor: color }]} /></View></View>;
  return <View style={styles.frame} testID={testID}><View style={[styles.gauge, { borderColor: color }]} /><View style={[styles.needle, { backgroundColor: color }]} /></View>;
}

const styles = StyleSheet.create({
  frame: { height: 20, position: 'relative', width: 20 },
  searchRing: { borderRadius: 7, borderWidth: 1.6, height: 13, left: 1, position: 'absolute', top: 1, width: 13 }, searchHandle: { borderRadius: 1, bottom: 2, height: 1.6, position: 'absolute', right: 1, transform: [{ rotate: '45deg' }], width: 7 },
  bell: { borderBottomWidth: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1.6, height: 13, left: 3, position: 'absolute', top: 2, width: 14 }, bellBase: { borderRadius: 1, height: 1.6, left: 1.5, position: 'absolute', top: 14, width: 17 }, clapper: { borderRadius: 2, height: 3, left: 8.5, position: 'absolute', top: 17, width: 3 },

  file: { borderRadius: 2, borderWidth: 1.5, height: 19, left: 3, position: 'absolute', width: 14 }, fileLine: { height: 1.3, left: 3, position: 'absolute', top: 7, width: 7 }, fileLine2: { top: 12, width: 6 },
  caseHandle: { borderBottomWidth: 0, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderWidth: 1.5, height: 5, left: 6, position: 'absolute', top: 1, width: 8 }, case: { borderRadius: 2, borderWidth: 1.5, height: 14, left: 1, position: 'absolute', top: 5, width: 18 }, caseLine: { height: 1.2, left: 0, position: 'absolute', top: 5, width: 15 },
  chat: { alignItems: 'center', borderRadius: 6, borderWidth: 1.5, flexDirection: 'row', gap: 3, height: 15, justifyContent: 'center', left: 1, position: 'absolute', top: 1, width: 18, zIndex: 2 }, chatDot: { borderRadius: 1.5, height: 3, width: 3 }, chatTail: { borderLeftWidth: 0, borderTopWidth: 0, borderWidth: 1.5, bottom: 1, height: 6, left: 4, position: 'absolute', transform: [{ rotate: '35deg' }], width: 6 },
  pin: { alignItems: 'center', borderRadius: 8, borderWidth: 1.5, height: 17, justifyContent: 'center', left: 3, position: 'absolute', top: 0, transform: [{ rotate: '45deg' }], width: 17 }, pinDot: { borderRadius: 3, borderWidth: 1.3, height: 5, transform: [{ rotate: '-45deg' }], width: 5 },
  gauge: { borderBottomColor: 'transparent', borderRadius: 10, borderWidth: 1.5, height: 20, left: 0, position: 'absolute', top: 2, width: 20 }, needle: { bottom: 4, height: 1.4, left: 9, position: 'absolute', transform: [{ rotate: '-40deg' }], width: 8 },
});
