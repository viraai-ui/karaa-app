import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/tokens';
import { MotionReveal } from '../components/Motion';
import { OfflineCustomerViews } from './OfflineCustomerViews';
import { DemoAppBar, DemoBottomNavigation, DemoUtilitySheet, DemoWorkspaceSheet } from './OfflineDemoPrimitives';
import { OfflineEmployeeViews } from './OfflineEmployeeViews';
import { OfflineManagementViews } from './OfflineManagementViews';
import { offlineDemoStore, offlineRoleTabs, type OfflineDemoRole } from './offline-demo';
import { PAGE_END_CLEARANCE } from './bottom-spacing';

export function OfflineAppShell({ role, onSwitchRole }: { role: OfflineDemoRole; onSwitchRole: (role: OfflineDemoRole) => void }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState<'search' | 'notifications' | null>(null);
  const [state, setState] = useState(offlineDemoStore.getState);
  const insets = useSafeAreaInsets();

  useEffect(() => offlineDemoStore.subscribe(() => setState(offlineDemoStore.getState())), []);
  useEffect(() => {
    if (state.activeRole !== role) offlineDemoStore.dispatch({ type: 'set-active-role', role });
  }, [role, state.activeRole]);
  useEffect(() => {
    if (!offlineRoleTabs[role].some((tab) => tab.key === state.selectedTab)) {
      offlineDemoStore.dispatch({ type: 'select-tab', tab: offlineRoleTabs[role][0].key });
    }
  }, [role, state.selectedTab]);

  const roleContent = role === 'customer'
    ? <OfflineCustomerViews onAction={offlineDemoStore.dispatch} state={state} />
    : role === 'employee'
      ? <OfflineEmployeeViews onAction={offlineDemoStore.dispatch} state={state} />
      : <OfflineManagementViews onAction={offlineDemoStore.dispatch} state={state} />;
  const chatThreadOpen = state.surface === 'chat-thread';

  return (
    <View style={styles.screen}>
      <DemoAppBar
        healthcareBack={role === 'customer' && state.surface === 'vertical' ? () => offlineDemoStore.dispatch({ type: 'back-to-root' }) : undefined}
        onSwitchWorkspace={() => setWorkspaceOpen(true)}
        onOpenSearch={() => setUtilityOpen('search')}
        onOpenNotifications={() => setUtilityOpen('notifications')}
        role={role}
      />
      <View style={styles.contentViewport} testID="demo-content-viewport">
        {chatThreadOpen ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[
              styles.chatKeyboardSurface,
              {
                paddingBottom: PAGE_END_CLEARANCE,
                paddingLeft: spacing.md + insets.left,
                paddingRight: spacing.md + insets.right,
              },
            ]}
            testID="demo-chat-keyboard-surface"
          >
            <MotionReveal key={`${role}-${state.selectedTab}-${state.surface}`}>{roleContent}</MotionReveal>
          </KeyboardAvoidingView>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: PAGE_END_CLEARANCE,
                paddingLeft: spacing.md + insets.left,
                paddingRight: spacing.md + insets.right,
              },
            ]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            testID="demo-scroll-surface"
          >
            <MotionReveal key={`${role}-${state.selectedTab}-${state.surface}`} testID="screen-motion-reveal">{roleContent}</MotionReveal>
          </ScrollView>
        )}
      </View>
      <DemoBottomNavigation onSelect={(tab) => offlineDemoStore.dispatch({ type: 'select-tab', tab })} role={role} selectedTab={state.selectedTab} tabs={offlineRoleTabs[role]} />
      {workspaceOpen ? <DemoWorkspaceSheet onDismiss={() => setWorkspaceOpen(false)} onSelect={(nextRole) => { setWorkspaceOpen(false); onSwitchRole(nextRole); }} /> : null}
      {utilityOpen ? <DemoUtilitySheet mode={utilityOpen} onDismiss={() => setUtilityOpen(null)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  contentViewport: { flex: 1, overflow: 'hidden' },
  chatKeyboardSurface: { flex: 1, paddingTop: spacing.md },
  scrollView: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md },
});
