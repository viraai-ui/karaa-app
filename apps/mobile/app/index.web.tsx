import { Redirect } from 'expo-router';

/**
 * The public mobile-web entry is the customer dashboard.
 * This file is web-only: Android continues to use index.tsx and its existing
 * authenticated/native routing behavior.
 */
export default function WebIndex() {
  return <Redirect href="/demo/customer" />;
}