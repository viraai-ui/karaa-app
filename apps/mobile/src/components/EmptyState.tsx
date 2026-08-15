import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';

type EmptyStateProps = {
  eyebrow?: string;
  title: string;
  copy: string;
  children?: ReactNode;
};

export function EmptyState({ eyebrow, title, copy, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.copy}>{copy}</Text>
      {children ? <View style={styles.action}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.brass,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  action: {
    marginTop: spacing.sm,
  },
});
