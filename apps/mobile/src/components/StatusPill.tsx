import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';

type StatusTone = 'assured' | 'attention' | 'blocked' | 'structural';

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
};

const toneColors: Record<StatusTone, string> = {
  assured: colors.moss,
  attention: colors.amber,
  blocked: colors.danger,
  structural: colors.brass,
};

export function StatusPill({ label, tone = 'structural' }: StatusPillProps) {
  const toneColor = toneColors[tone];

  return (
    <View accessibilityLabel={label} style={[styles.pill, { borderColor: toneColor }]}>
      <Text style={[styles.label, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
