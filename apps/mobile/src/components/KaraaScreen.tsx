import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radii, spacing } from '../theme/tokens';
import { EmptyState } from './EmptyState';
import { StatusPill } from './StatusPill';

const operatingLoop = [
  {
    label: 'Evidence recorded',
    tone: 'assured' as const,
    title: 'Field evidence',
    copy: 'A clear project record begins with a complete update from the people doing the work.',
  },
  {
    label: 'Calculated from saved work',
    tone: 'structural' as const,
    title: 'Progress recalculated',
    copy: 'Karaa recalculates milestone and project progress from the persisted update instead of trusting a dashboard claim.',
  },
  {
    label: 'Customer view',
    tone: 'structural' as const,
    title: 'Customer assurance',
    copy: 'Customers see what was reported, what changed, and the next accountable step without chasing the team.',
  },
  {
    label: 'Attention needed',
    tone: 'attention' as const,
    title: 'Management intervention',
    copy: 'Management can focus a decision where an update signals risk, delay, or a missing follow-up.',
  },
];

export function KaraaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeArea} testID="tour-safe-area">
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: spacing.xxl + insets.bottom,
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
          },
        ]}
        style={[styles.page, { marginTop: insets.top }]}
        testID="tour-scroll"
      >
        <View style={styles.column} testID="tour-column">
      <View style={styles.header}>
        <Text style={styles.brand}>KARAA</Text>
        <StatusPill label="Public tour · read only" tone="structural" />
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>Field evidence. Clear decisions.</Text>
        <Text style={styles.intro}>
          Karaa turns a field update into a shared record for the people delivering, overseeing, and relying on a project.
        </Text>
        <View style={styles.heroVisual}>
          <View style={styles.heroMedia} testID="tour-hero-frame">
            <Image
              accessibilityLabel="Demo visual: Amaravati Solar Commons"
              accessibilityRole="image"
              resizeMode="cover"
              source={require('../../assets/demo/amaravati-hero.webp')}
              style={styles.heroImage}
              testID="tour-hero-image"
            />
          </View>
          <Text style={styles.caption}>Demo visual · fictional Amaravati Solar Commons</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>THE KARAA METHOD</Text>
        <Text style={styles.sectionTitle}>Explore the operating loop</Text>
        <View style={styles.trace}>
          {operatingLoop.map((step, index) => (
            <View key={step.title} style={styles.traceRow}>
              <View style={styles.rail}>
                <View style={styles.marker}><Text style={styles.markerText}>{index + 1}</Text></View>
                {index < operatingLoop.length - 1 ? <View style={styles.rule} /> : null}
              </View>
              <View style={styles.traceContent}>
                <StatusPill label={step.label} tone={step.tone} />
                <Text style={styles.traceTitle}>{step.title}</Text>
                <Text style={styles.traceCopy}>{step.copy}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <EmptyState
        eyebrow="YOUR WORKSPACE"
        title="Ready for the work behind the record?"
        copy="Sign in to view the workspace your Karaa role provides. This tour does not load project data or perform actions."
      >
        <Pressable
          accessibilityLabel="Sign in to try your workspace"
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign in to try your workspace</Text>
        </Pressable>
      </EmptyState>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  page: {
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  column: {
    alignSelf: 'center',
    gap: spacing.xl,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.brass,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    paddingTop: spacing.xs,
  },
  hero: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  heroVisual: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroMedia: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  caption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.7,
    lineHeight: 38,
    maxWidth: 330,
  },
  intro: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 460,
  },
  section: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    color: colors.brass,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 31,
  },
  trace: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  traceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rail: {
    alignItems: 'center',
    width: 28,
  },
  marker: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  markerText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: '800',
  },
  rule: {
    backgroundColor: colors.line,
    flex: 1,
    marginVertical: spacing.xs,
    width: 1,
  },
  traceContent: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  traceTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  traceCopy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: '800',
  },
});
