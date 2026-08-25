import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '../src/theme/tokens';
import { ApiError, login } from '../src/lib/api';
import { demoVisualAssets } from '../src/demo/demo-visual-assets';
import { demoAccounts, offlineDemoModeEnabled, type OfflineDemoAccount } from '../src/demo/offline-demo';
import { loadSession, saveSession, selectRoleRoute } from '../src/lib/session';
import { KaraaBrand } from '../src/components/KaraaBrand';

export default function LoginScreen() {
  const router = useRouter();
  const demoMode = offlineDemoModeEnabled({ EXPO_PUBLIC_KARAA_DEMO_MODE: process.env.EXPO_PUBLIC_KARAA_DEMO_MODE });

  if (demoMode) {
    return <OfflineAccountSelector onSelect={(account) => router.replace(`/demo/${account.role}` as never)} />;
  }

  return <ServerLoginForm onRoute={(pathname) => router.replace(pathname as never)} />;
}

function OfflineAccountSelector({ onSelect }: { onSelect: (account: OfflineDemoAccount) => void }) {
  const employee = demoAccounts.find((account) => account.role === 'employee')!;
  const alternatives = demoAccounts.filter((account) => account.role !== 'employee');

  return (
    <View style={styles.demoPage}>
      <View style={styles.demoMasthead}>
        <KaraaBrand height={32} variant="crown" />
        <View style={styles.demoBrandBlock}><KaraaBrand height={14} variant="wordmark" /><Text style={styles.demoBrandRule}>PROJECT INTELLIGENCE</Text></View>
      </View>
      <View style={styles.demoHero}>
        <Text style={styles.demoEyebrow}>SECURE PROJECT ACCESS</Text>
        <Text style={styles.demoTitle}>Welcome back.</Text>
        <Text style={styles.demoCopy}>Follow the project evidence, milestones and decisions around Amaravati Solar Commons.</Text>
      </View>
      <View style={styles.demoImageFrame}>
        <Image accessibilityLabel="Demo visual: Amaravati solar campus" resizeMode="cover" source={demoVisualAssets.hero.source} style={styles.demoImage} />
        <View style={styles.demoImageScrim} />
        <View style={styles.demoImageCopy}><Text style={styles.demoImageLabel}>AMARAVATI SOLAR COMMONS</Text><Text style={styles.demoImageDetail}>Energy & Utilities · commissioning review</Text></View>
        <Text style={styles.demoVisualCaption}>Demo visual</Text>
      </View>
      <View style={styles.accountSection}>
        <View style={styles.accountSectionHeading}><Text style={styles.accountSectionLabel}>PRESENTATION ACCESS</Text><Text style={styles.accountSectionTitle}>Choose a workspace</Text></View>
        <Pressable accessibilityLabel="Open Field Employee workspace" accessibilityRole="button" onPress={() => onSelect(employee)} style={styles.primaryWorkspace}>
          <View style={styles.primaryWorkspaceCopy}><Text style={styles.primaryWorkspaceLabel}>START GUIDED WORKSPACE</Text><Text style={styles.primaryWorkspaceTitle}>Continue as Field Employee</Text><Text style={styles.primaryWorkspaceDetail}>Amaravati commissioning review</Text></View>
          <View style={styles.primaryWorkspaceBadge}><Text style={styles.primaryWorkspaceBadgeText}>{employee.initials}</Text></View>
        </Pressable>
        <View style={styles.alternativeList}>
          {alternatives.map((account) => (
            <Pressable accessibilityLabel={`Open ${account.role[0].toUpperCase()}${account.role.slice(1)} workspace`} accessibilityRole="button" key={account.role} onPress={() => onSelect(account)} style={styles.alternativeRow}>
              <Text style={styles.alternativeRole}>{account.role === 'customer' ? 'CUSTOMER / INVESTOR' : 'SENIOR MANAGEMENT'}</Text>
              <Text style={styles.alternativeName}>{account.displayName}</Text>
              <Text style={styles.accountChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.demoFooter} testID="demo-entry-footer"><KaraaBrand height={9} variant="wordmark" /><Text style={styles.demoFooterText}>· AMARAVATI SOLAR COMMONS</Text></View>
    </View>
  );
}

function ServerLoginForm({ onRoute }: { onRoute: (pathname: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadSession()
      .then((session) => {
        if (session) onRoute(selectRoleRoute(session).pathname);
      })
      .catch(() => undefined);
  }, [onRoute]);

  async function signIn() {
    setSubmitting(true);
    setError(undefined);
    try {
      const session = await login({ email, password });
      await saveSession(session);
      onRoute(selectRoleRoute(session).pathname);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Connection unavailable — try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.page}>
      <KaraaBrand height={24} variant="wordmark" />
      <Text style={styles.title}>Sign in to your workspace</Text>
      <Text style={styles.copy}>Your role is assigned by the server. There is no role selector here.</Text>
      <View style={styles.field}>
        <Text nativeID="email-label" style={styles.label}>Email</Text>
        <TextInput accessibilityLabel="Email address" accessibilityLabelledBy="email-label" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.muted} style={styles.input} value={email} />
      </View>
      <View style={styles.field}>
        <Text nativeID="password-label" style={styles.label}>Password</Text>
        <TextInput accessibilityLabel="Password" accessibilityLabelledBy="password-label" autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry style={styles.input} value={password} />
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void signIn()} style={[styles.button, submitting && styles.disabled]}>
        {submitting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Continue</Text>}
      </Pressable>
      <Text style={styles.hint}>Karaa is online-only. Project data and actions require a secure connection to Karaa. This device stores only an encrypted sign-in session.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', gap: 14, padding: spacing.lg, backgroundColor: colors.canvas },
  eyebrow: { color: colors.brass, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 23, marginBottom: spacing.sm },
  field: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: { borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, color: colors.ink, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13 },
  button: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.md, minHeight: 50, justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.paper, fontSize: 16, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  demoPage: { backgroundColor: '#070807', flex: 1, gap: 12, paddingBottom: 72, paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  demoMasthead: { alignItems: 'center', borderBottomColor: '#383934', borderBottomWidth: 1, flexDirection: 'row', gap: 10, paddingBottom: 10 },
  demoMark: { alignItems: 'center', borderColor: colors.brass, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  demoMarkText: { color: colors.brass, fontSize: 20, fontWeight: '900' },
  demoBrandBlock: { gap: 1 },
  demoBrand: { color: colors.paper, fontSize: 15, fontWeight: '800', letterSpacing: .3 },
  demoBrandRule: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05 },
  demoHero: { gap: 4, marginTop: 2 },
  demoEyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  demoTitle: { color: colors.paper, fontSize: 28, fontWeight: '800', letterSpacing: -.5, lineHeight: 32 },
  demoCopy: { color: '#D6D3CD', fontSize: 13, lineHeight: 18, maxWidth: 340 },
  demoImageFrame: { aspectRatio: 2.15, borderColor: '#564A31', borderRadius: radii.sm, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  demoImage: { height: '100%', width: '100%' },
  demoImageScrim: { backgroundColor: 'rgba(6, 7, 6, 0.34)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  demoImageCopy: { bottom: 9, gap: 2, left: 10, position: 'absolute', right: 10 },
  demoImageLabel: { color: colors.paper, fontSize: 10, fontWeight: '900', letterSpacing: .65 },
  demoImageDetail: { color: '#E8E1D3', fontSize: 10, fontWeight: '700' },
  demoVisualCaption: { backgroundColor: 'rgba(7, 8, 7, 0.78)', bottom: 6, color: '#E7E0D4', fontSize: 10, fontWeight: '800', letterSpacing: .45, paddingHorizontal: 5, paddingVertical: 2, position: 'absolute', right: 6 },
  accountSection: { backgroundColor: '#141714', borderColor: '#3E403A', borderRadius: radii.sm, borderWidth: 1, gap: 8, padding: 12 },
  accountSectionHeading: { gap: 1 },
  accountSectionLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  accountSectionTitle: { color: colors.paper, fontSize: 18, fontWeight: '800' },
  primaryWorkspace: { alignItems: 'center', backgroundColor: colors.brass, borderRadius: radii.sm, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 12 },
  primaryWorkspaceCopy: { flex: 1, gap: 2 },
  primaryWorkspaceLabel: { color: '#FFF7E8', fontSize: 10, fontWeight: '900', letterSpacing: .9 },
  primaryWorkspaceTitle: { color: colors.paper, fontSize: 16, fontWeight: '900' },
  primaryWorkspaceDetail: { color: '#F1E0BD', fontSize: 10, fontWeight: '700' },
  primaryWorkspaceBadge: { alignItems: 'center', backgroundColor: 'rgba(7, 8, 7, .3)', borderRadius: radii.pill, height: 34, justifyContent: 'center', width: 34 },
  primaryWorkspaceBadgeText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  alternativeList: { borderTopColor: '#3D413B', borderTopWidth: 1 },
  alternativeRow: { alignItems: 'center', borderBottomColor: '#3D413B', borderBottomWidth: 1, flexDirection: 'row', gap: 8, minHeight: 39 },
  alternativeRole: { color: '#B7B6AF', fontSize: 10, fontWeight: '900', letterSpacing: .55, width: 118 },
  alternativeName: { color: colors.paper, flex: 1, fontSize: 11, fontWeight: '800' },
  accountChevron: { color: colors.brass, fontSize: 20, fontWeight: '500' },
  demoFooter: { alignItems: 'center', borderTopColor: '#383934', borderTopWidth: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', marginTop: 'auto', paddingVertical: 8 },
  demoFooterText: { color: '#AAA69E', fontSize: 10, fontWeight: '800', letterSpacing: .7, textAlign: 'center' },
});
