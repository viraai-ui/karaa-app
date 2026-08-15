import { Redirect } from 'expo-router';

/**
 * The public mobile-web entry is the senior-management Power of 9 view.
 * This file is web-only: Android continues to use index.tsx and its existing
 * authenticated/native routing behavior.
 */
export default function WebIndex() {
  return <Redirect href="/demo/management" />;
}