import { StyleSheet, View } from 'react-native';

/** Compact 22px line dashboard mark shared by every Dashboard tab. */
export function DashboardNavIcon({ color, testID }: { color: string; testID: string }) {
  return (
    <View accessible={false} style={styles.frame} testID={testID}>
      {[1, 2, 3, 4].map(tile => <View key={tile} style={[styles.dot, { borderColor: color }]} testID={`${testID}-tile-${tile}`} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignContent: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4, height: 22, justifyContent: 'center', width: 22 },
  dot: { borderRadius: 4, borderWidth: 1.6, height: 7, width: 7 },
});
