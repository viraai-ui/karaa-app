import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, colors, radii, spacing } from '../theme/tokens';
import { MotionImage, MotionModalEntrance, MotionPressable, MotionProgressFill } from '../components/Motion';
import { KaraaBrand } from '../components/KaraaBrand';
import { CustomerNavIcon, CUSTOMER_NAV_INACTIVE } from './CustomerNavIcons';
import { SeniorManagementNavIcon, SENIOR_MANAGEMENT_NAV_INACTIVE } from './SeniorManagementNavIcons';
import { demoAccounts, offlineRoleTabs, type OfflineDemoAccount, type OfflineDemoIcon, type OfflineDemoRole, type OfflineDemoTab, type OfflineDemoTabKey } from './offline-demo';
import { NAVIGATION_BASE_HEIGHT, navigationBottomPadding } from './bottom-spacing';
import { ShellLineIcon } from './ShellLineIcons';


export function DemoAppBar({ role, onSwitchWorkspace, onOpenSearch, onOpenNotifications, healthcareBack }: { role: OfflineDemoRole; onSwitchWorkspace: () => void; onOpenSearch: () => void; onOpenNotifications: () => void; healthcareBack?: () => void }) {
  const account = demoAccounts.find((item) => item.role === role)!;
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.appBar, healthcareBack && styles.healthcareAppBar, { paddingTop: insets.top }]} testID="demo-app-bar">
      <View style={styles.brandGroup}>
        {healthcareBack ? <Pressable accessibilityLabel="Back to Power of 9" accessibilityRole="button" onPress={healthcareBack} style={styles.headerBack}><Text style={styles.headerBackArrow}>←</Text></Pressable> : null}
        <KaraaBrand height={healthcareBack ? 28 : 26} variant={healthcareBack ? 'crown' : 'lockup'} />
      </View>
      <View style={styles.topActions}>
        <Pressable accessibilityLabel="Search" accessibilityRole="button" onPress={onOpenSearch} style={styles.iconButton}><ShellLineIcon name="search" testID="header-search-icon" /></Pressable>
        <Pressable accessibilityHint="One unread notification" accessibilityLabel="Notifications, unread" accessibilityRole="button" onPress={onOpenNotifications} style={styles.iconButton}><ShellLineIcon name="bell" testID="header-bell-icon" /><View accessibilityElementsHidden style={styles.notificationDot} /></Pressable>
        <Pressable accessibilityLabel="Switch workspace" accessibilityRole="button" onPress={onSwitchWorkspace} style={styles.avatarTarget}><View accessibilityElementsHidden style={styles.avatar}><Text style={styles.avatarText}>{account.initials}</Text></View></Pressable>
      </View>
    </View>
  );
}

export function DemoUtilitySheet({ mode, onDismiss }: { mode: 'search' | 'notifications'; onDismiss: () => void }) {
  const [query, setQuery] = useState('');
  const search = mode === 'search';
  return <View accessibilityLabel={search ? 'Search panel' : 'Notifications panel'} accessibilityViewIsModal style={styles.sheetBackdrop}>
    <MotionModalEntrance style={styles.utilitySheet}>
      <View style={styles.sheetHeader}><View style={styles.utilityHeading}><Text style={styles.sheetLabel}>{search ? 'GLOBAL SEARCH' : 'NOTIFICATIONS'}</Text><Text style={styles.sheetTitle}>{search ? 'Search Karaa' : 'Recent activity'}</Text></View><Pressable accessibilityLabel={`Close ${search ? 'search' : 'notifications'}`} accessibilityRole="button" onPress={onDismiss} style={styles.closeButton}><Text style={styles.close}>×</Text></Pressable></View>
      {search ? <><DemoSearchField accessibilityLabel="Search projects and tenders" onChangeText={setQuery} placeholder="Search projects and tenders" value={query} />{query.trim() ? <Text accessibilityLiveRegion="polite" style={styles.utilityCopy}>No results for “{query.trim()}”.</Text> : null}</> : <View accessible accessibilityLabel="Unread: Aarohan Medical City field update is ready for review" style={styles.noticeCard}><Text style={styles.noticeUnread}>UNREAD</Text><Text style={styles.noticeTitle}>Field update ready for review</Text><Text style={styles.utilityCopy}>Aarohan Medical City</Text></View>}
    </MotionModalEntrance>
  </View>;
}

export function DemoWorkspaceSheet({ onSelect, onDismiss }: { onSelect: (role: OfflineDemoRole) => void; onDismiss: () => void }) {
  return (
    <View accessibilityLabel="Switch workspace" accessibilityViewIsModal style={styles.sheetBackdrop}>
      <MotionModalEntrance style={styles.sheet}>
        <View style={styles.sheetHeader}><View><Text style={styles.sheetLabel}>KARAA WORKSPACES</Text><Text style={styles.sheetTitle}>Switch workspace</Text></View><Pressable accessibilityLabel="Close workspace switcher" accessibilityRole="button" onPress={onDismiss} style={styles.closeButton}><Text style={styles.close}>×</Text></Pressable></View>
        {demoAccounts.map((account) => <WorkspaceRow account={account} key={account.role} onPress={() => onSelect(account.role)} />)}
      </MotionModalEntrance>
    </View>
  );
}

function WorkspaceRow({ account, onPress }: { account: OfflineDemoAccount; onPress: () => void }) {
  const workspaceName = account.role === 'customer' ? 'Customer / Investor' : account.role === 'employee' ? 'Field Employee' : 'Senior Management';
  return <MotionPressable accessibilityLabel={`Open ${workspaceName} workspace`} accessibilityRole="button" onPress={onPress} style={styles.workspaceRow}><View style={styles.workspaceAvatar}><Text style={styles.workspaceAvatarText}>{account.initials}</Text></View><View style={styles.workspaceCopy}><Text style={styles.workspaceName}>{account.displayName}</Text><Text style={styles.workspaceRole}>{account.roleLabel}</Text></View><Text style={styles.chevron}>›</Text></MotionPressable>;
}

export function DemoBottomNavigation({ tabs, selectedTab, onSelect, role }: { tabs: readonly OfflineDemoTab[]; selectedTab: OfflineDemoTabKey; onSelect: (tab: OfflineDemoTabKey) => void; role?: OfflineDemoRole }) {
  const insets = useSafeAreaInsets();
  return <View accessibilityRole="tablist" style={[styles.bottomNavigation, role === 'customer' && styles.customerBottomNavigation, { paddingBottom: navigationBottomPadding(insets.bottom) }]} testID="demo-bottom-navigation">{tabs.map((tab) => { const selected = selectedTab === tab.key; const inactive = role === 'management' ? SENIOR_MANAGEMENT_NAV_INACTIVE : CUSTOMER_NAV_INACTIVE; const color = selected ? colors.brass : inactive; return <MotionPressable accessibilityLabel={tab.label} accessibilityRole="tab" accessibilityState={{ selected }} key={tab.key} onPress={() => onSelect(tab.key)} style={styles.tab} suppressFocusRing wrapperStyle={styles.tabWrapper}>{role === 'customer' && selected ? <View style={styles.activeRail} /> : null}<View style={styles.navIconBox}>{role === 'customer' ? <CustomerNavIcon color={color} tabKey={tab.key} /> : role === 'management' ? <SeniorManagementNavIcon color={color} tabKey={tab.key} /> : <ShellLineIcon color={color} name={tab.icon} testID={`role-nav-icon-${tab.key}`} />}</View><Text numberOfLines={1} style={[styles.tabLabel, (role === 'customer' || role === 'management') && styles.referenceTabLabel, role === 'customer' && styles.customerTabLabel, selected && styles.tabActive]}>{tab.label}</Text></MotionPressable>; })}</View>;
}

export function DemoImageFrame({ source, accessibilityLabel, ratio = 16 / 9, height, width }: { source: number; accessibilityLabel: string; ratio?: number; height?: number; width?: number }) {
  const frameSize: ViewStyle = height ? { height, width: width ?? '100%' } : { aspectRatio: ratio, width: width ?? '100%' };
  return <View style={styles.imageBlock}><View accessible accessibilityLabel={accessibilityLabel} accessibilityRole="image" style={[styles.imageFrame, frameSize]}><MotionImage resizeMode="cover" source={source} style={styles.image} /></View></View>;
}

export function DemoProgressRail({ progress, valueLabel, label = 'PROJECT DELIVERY', detail, labelColor, labelTestID, detailColor }: { progress: number; valueLabel?: string; label?: string; detail?: string; labelColor?: string; labelTestID?: string; detailColor?: string }) {
  const normalizedProgress = Math.min(100, Math.max(0, Number.isFinite(progress) ? Math.round(progress) : 0));
  const displayedValue = valueLabel ?? `${normalizedProgress}%`;
  return <View style={styles.progressBlock}><View style={styles.progressHeading}><Text numberOfLines={1} testID={labelTestID} style={[styles.progressLabel, labelColor ? { color: labelColor } : undefined]}>{label}</Text><Text style={styles.progressValue}>{displayedValue}</Text></View><View accessible accessibilityLabel={`${label}: ${displayedValue}`} accessibilityRole="progressbar" accessibilityValue={{ max: 100, min: 0, now: normalizedProgress }} style={styles.progressTrack}><MotionProgressFill progress={normalizedProgress} style={styles.progressFill} /></View>{detail ? <Text style={[styles.progressDetail, detailColor ? { color: detailColor } : undefined]}>{detail}</Text> : null}</View>;
}

export function DemoStatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'attention' | 'danger' }) {
  return <View style={[styles.status, tone === 'positive' && styles.statusPositive, tone === 'attention' && styles.statusAttention, tone === 'danger' && styles.statusDanger]}><Text style={[styles.statusText, tone === 'positive' && styles.statusTextPositive, tone === 'attention' && styles.statusTextAttention, tone === 'danger' && styles.statusTextDanger]}>{label}</Text></View>;
}

export function DemoSectionTitle({ eyebrow, title, trailing }: { eyebrow?: string; title: string; trailing?: string }) {
  return <View style={styles.sectionTitleRow}><View>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.sectionTitle}>{title}</Text></View>{trailing ? <Text style={styles.trailing}>{trailing} ›</Text> : null}</View>;
}

export function DemoAction({ label, onPress, variant = 'dark' }: { label: string; onPress: () => void; variant?: 'dark' | 'outline' }) {
  return <MotionPressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={[styles.action, variant === 'outline' && styles.actionOutline]}><Text numberOfLines={1} style={[styles.actionText, variant === 'outline' && styles.actionTextOutline]}>{label}</Text><Text style={[styles.actionArrow, variant === 'outline' && styles.actionTextOutline]}>→</Text></MotionPressable>;
}

export function DemoSearchField({ accessibilityLabel, onChangeText, placeholder, value }: { accessibilityLabel: string; onChangeText: (value: string) => void; placeholder: string; value: string }) {
  return <View style={styles.searchField}><Text style={styles.searchGlyph}>⌕</Text><TextInput accessibilityLabel={accessibilityLabel} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} value={value} /></View>;
}

export function DemoFilterChip({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return <MotionPressable accessibilityLabel={`Filter ${label}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.filterChip, selected && styles.filterChipSelected]}><Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text></MotionPressable>;
}

export function DemoSurfaceBackButton({ onPress, label = 'Back to Power of 9' }: { onPress: () => void; label?: string }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.surfaceBackButton}><Text style={styles.surfaceBackArrow}>←</Text><Text style={styles.surfaceBackText}>{label}</Text></Pressable>;
}

export function DemoListRow({ title, detail, meta, onPress, imageSource }: { title: string; detail: string; meta?: string; onPress?: () => void; imageSource?: number }) {
  const contents = <><View style={styles.listLeading}>{imageSource ? <View style={styles.listVisual}><Image accessibilityLabel="Demo visual" source={imageSource} style={styles.listImage} /></View> : <Text style={styles.listGlyph}>▤</Text>}</View><View style={styles.listCopy}><Text style={styles.listTitle}>{title}</Text><Text style={styles.listDetail}>{detail}</Text>{meta ? <Text style={styles.listMeta}>{meta}</Text> : null}</View>{onPress ? <Text style={styles.chevron}>›</Text> : null}</>;
  return onPress ? <MotionPressable accessibilityLabel={title} accessibilityRole="button" onPress={onPress} style={styles.listRow}>{contents}</MotionPressable> : <View style={styles.listRow}>{contents}</View>;
}

export function DemoMetricPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.metricPanel}><Text style={styles.metricPanelTitle}>{title}</Text>{children}</View>;
}

export function OfflineDemoPrimitivesPreview() {
  return <View><DemoAppBar role="employee" onOpenNotifications={() => undefined} onOpenSearch={() => undefined} onSwitchWorkspace={() => undefined} /><DemoBottomNavigation onSelect={() => undefined} role="employee" selectedTab="power" tabs={offlineRoleTabs.employee} /></View>;
}

const styles = StyleSheet.create({
  appBar: { alignItems: 'center', backgroundColor: '#050605', borderBottomColor: colors.brass, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 12 },
  healthcareAppBar: { minHeight: 44, paddingHorizontal: 8 },
  headerBack: { alignItems: 'center', height: 44, justifyContent: 'center', marginLeft: -12, width: 44 }, headerBackArrow: { color: colors.brass, fontSize: 19 },
  brandGroup: { alignItems: 'center', flexDirection: 'row', flexShrink:1, gap: 6, minWidth:0 }, mark: { borderColor: colors.brass, borderWidth: 1, color: colors.brass, fontSize: 22, fontWeight: '900', height: 32, lineHeight: 29, textAlign: 'center', width: 32 }, brand: { color: colors.paper, fontSize: 15, fontWeight: '800', letterSpacing: 2.1 }, role: { color: colors.brass, fontSize: 10, fontWeight: '800', letterSpacing: 1.05, marginTop: 1 },
  portfolioMark: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 }, portfolioMarkText: { color: colors.brass, fontFamily: 'serif', fontSize: 28, fontStyle: 'italic', fontWeight: '900', lineHeight: 30 },
  topActions: { alignItems: 'center', flexDirection: 'row', flexShrink:0 }, iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', position: 'relative', width: 44 }, topIcon: { color: colors.paper, fontSize: 24, fontWeight: '300' }, notificationDot: { backgroundColor: '#E89A0A', borderColor: '#050605', borderRadius: 4, borderWidth: 1.5, height: 7, position: 'absolute', right: 8, top: 8, width: 7 }, avatarTarget: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, avatar: { alignItems: 'center', backgroundColor: '#474845', borderColor: '#686963', borderRadius: radii.pill, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 }, avatarText: { color: colors.paper, fontSize: 10, fontWeight: '900' },
  sheetBackdrop: { backgroundColor: 'rgba(5, 6, 5, 0.52)', bottom: 0, justifyContent: 'flex-end', left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20 }, sheet: { backgroundColor: colors.paper, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xl }, sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }, sheetLabel: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, sheetTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', lineHeight: 33 }, closeButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 }, close: { color: colors.ink, fontSize: 30, lineHeight: 30 }, workspaceRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 66, paddingVertical: spacing.sm }, workspaceAvatar: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.pill, height: 38, justifyContent: 'center', width: 38 }, workspaceAvatarText: { color: colors.brass, fontSize: 11, fontWeight: '900' }, workspaceCopy: { flex: 1 }, workspaceName: { color: colors.ink, fontSize: 16, fontWeight: '800' }, workspaceRole: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: .7, marginTop: 2 }, chevron: { color: colors.brass, fontSize: 28, fontWeight: '300' },
  utilitySheet: { backgroundColor: colors.paper, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl }, utilityHeading: { flex: 1 }, utilityCopy: { color: colors.muted, fontSize: 12, lineHeight: 18 }, noticeCard: { backgroundColor: colors.canvas, borderColor: colors.line, borderRadius: radii.md, borderWidth: 1, gap: 4, padding: spacing.md }, noticeUnread: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, noticeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  bottomNavigation: { ...cardShadow, backgroundColor: '#FFFFFF', borderColor: '#E3E1DC', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, flexDirection: 'row', marginHorizontal: 8, minHeight: NAVIGATION_BASE_HEIGHT, paddingHorizontal: 2, paddingTop: 7 }, tabWrapper: { flex: 1, minWidth: 0 }, tab: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 44, minWidth: 44 }, navIconBox: { alignItems: 'center', height: 22, justifyContent: 'center', width: 22 }, tabSelected: { backgroundColor: 'rgba(181, 138, 58, 0.10)', borderRadius: radii.sm }, tabIcon: { color: '#D6D3CD', fontSize: 21, fontWeight: '500', lineHeight: 23 }, tabLabel: { color: '#171717', fontSize: 10, fontWeight: '600', textAlign: 'center' },referenceTabLabel: { color: CUSTOMER_NAV_INACTIVE, marginTop: 1 }, tabActive: { color: colors.brass },
  customerBottomNavigation: { minHeight: 67 }, customerTabLabel: { color: '#171717', fontSize: 10, fontWeight: '500' }, activeRail: { backgroundColor: '#B58A29', height: 2, left: 8, position: 'absolute', right: 8, top: -7 },
  imageBlock: { gap: 4 }, imageFrame: { backgroundColor: colors.statusStructuralSurface, borderRadius: radii.sm, overflow: 'hidden', width: '100%' }, image: { height: '100%', width: '100%' }, imageCaption: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: .35 },
  progressBlock: { gap: 5 }, progressHeading: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' }, progressLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .8 }, progressValue: { color: colors.ink, fontSize: 16, fontWeight: '900' }, progressTrack: { backgroundColor: '#E5E1D9', borderRadius: radii.pill, height: 5, overflow: 'hidden' }, progressFill: { backgroundColor: colors.brass, borderRadius: radii.pill, height: '100%' }, progressDetail: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  status: { alignSelf: 'flex-start', backgroundColor: colors.statusStructuralSurface, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 }, statusPositive: { backgroundColor: colors.statusAssuredSurface }, statusAttention: { backgroundColor: colors.statusAttentionSurface }, statusDanger: { backgroundColor: colors.statusBlockedSurface }, statusText: { color: colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: .55 }, statusTextPositive: { color: colors.moss }, statusTextAttention: { color: colors.amber }, statusTextDanger: { color: colors.danger },
  sectionTitleRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, eyebrow: { color: colors.brass, fontSize: 10, fontWeight: '900', letterSpacing: 1.05, marginBottom: 2 }, sectionTitle: { color: colors.ink, fontFamily: 'serif', fontSize: 21, fontWeight: '800', lineHeight: 25 },trailing: { color: colors.brass, fontSize: 11, fontWeight: '800', paddingBottom: 2 },
  action: { alignItems: 'center', backgroundColor: colors.ink, borderRadius: radii.sm, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: spacing.md }, actionOutline: { backgroundColor: 'transparent', borderColor: colors.brass, borderWidth: 1 }, actionText: { color: colors.paper, fontSize: 14, fontWeight: '900' }, actionTextOutline: { color: colors.brass }, actionArrow: { color: colors.brass, fontSize: 19, fontWeight: '800' },
  searchField: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', minHeight: 44, paddingHorizontal: spacing.sm }, searchGlyph: { color: colors.muted, fontSize: 21, marginRight: 6 }, searchInput: { color: colors.ink, flex: 1, fontSize: 14, minHeight: 44, paddingVertical: 0 },
  filterChip: { alignItems: 'center', borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 }, filterChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink }, filterChipText: { color: colors.muted, fontSize: 11, fontWeight: '900' }, filterChipTextSelected: { color: colors.paper },
  surfaceBackButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 44, paddingRight: spacing.sm }, surfaceBackArrow: { color: colors.brass, fontSize: 20, fontWeight: '800' }, surfaceBackText: { color: colors.brass, fontSize: 12, fontWeight: '900' },
  listRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 62, paddingVertical: 8 }, listLeading: { alignItems: 'center', height: 48, justifyContent: 'center', width: 60 }, listVisual: { gap: 2, width: 60 }, listImage: { borderRadius: 4, height: 38, width: 60 }, listVisualCaption: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: .2 }, listGlyph: { color: colors.brass, fontSize: 20 }, listCopy: { flex: 1, gap: 1 }, listTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', lineHeight: 16 }, listDetail: { color: colors.muted, fontSize: 11, lineHeight: 15 }, listMeta: { color: colors.brass, fontSize: 10, fontWeight: '800', letterSpacing: .35 },
  metricPanel: { backgroundColor: '#161817', borderRadius: radii.md, gap: spacing.md, padding: spacing.md }, metricPanelTitle: { color: colors.paper, fontSize: 16, fontWeight: '800' },
});
