export const colors = {
  canvas: '#FCFBF8',
  paper: '#FFFFFF',
  ink: '#050605',
  muted: '#625F58',
  line: '#E3E1DC',
  brass: '#B58A29',
  brassDark: '#80672F',
  shell: '#050605',
  secondarySurface: '#F7F5F0',
  cardShadow: '#000000',
  moss: '#2F6546',
  amber: '#A76509',
  danger: '#A4362B',
  statusAssuredSurface: '#E2EEE5',
  statusAttentionSurface: '#F4E7D0',
  statusBlockedSurface: '#F3DEDB',
  statusStructuralSurface: '#F7F5F0',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 52,
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const layout = {
  contentMaxWidth: 640,
  gutter: 16,
  minimumTarget: 44,
  bottomNavigationRadius: 16,
} as const;

export const typography = {
  editorial: 'serif',
  utility: 'System',
  pageTitle: 32,
  sectionTitle: 21,
  body: 14,
  minimumReadable: 10,
} as const;

export const cardShadow = {
  shadowColor: colors.cardShadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 5,
  elevation: 2,
} as const;
