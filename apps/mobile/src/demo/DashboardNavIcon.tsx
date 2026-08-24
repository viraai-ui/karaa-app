import { StyleSheet, View } from 'react-native';

/** Compact 22px line dashboard mark shared by every Dashboard tab. */
export function DashboardNavIcon({ color, testID }: { color: string; testID: string }) {
  return (
    <View accessible={false} style={styles.frame} testID={testID}>
      <View style={styles.column}>
        <View style={[styles.tile, styles.tileTall, { borderColor: color }]} testID={`${testID}-tile-1`} />
        <View style={[styles.tile, styles.tileShort, { borderColor: color }]} testID={`${testID}-tile-2`} />
      </View>
      <View style={styles.column}>
        <View style={[styles.tile, styles.tileShort, { borderColor: color }]} testID={`${testID}-tile-3`} />
        <View style={[styles.tile, styles.tileTall, { borderColor: color }]} testID={`${testID}-tile-4`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flexDirection: 'row', gap: 3, height: 22, justifyContent: 'center', width: 22 },
  column: { gap: 3, width: 8.5 },
  tile: { borderRadius: 2.25, borderWidth: 1.6, width: 8.5 },
  tileTall: { height: 12 },
  tileShort: { height: 7 },
});
