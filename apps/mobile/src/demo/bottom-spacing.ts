/**
 * The bottom navigation participates in the shell's flex layout; it does not
 * overlay the content viewport. Consequently page content must reserve only a
 * small visual breathing space here. The navigation owns safe-area padding.
 */
export const PAGE_END_CLEARANCE = 12;
export const NAVIGATION_BASE_HEIGHT = 58;
export const NAVIGATION_SAFE_GUTTER = 5;

export function navigationBottomPadding(bottomSafeArea: number) {
  return NAVIGATION_SAFE_GUTTER + Math.max(0, bottomSafeArea);
}