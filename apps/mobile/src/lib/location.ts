import * as Location from 'expo-location';

import type { EmployeeLocation } from '../features/employee/EmployeeWorkScreen';

/** PC-only audience-demo coordinates. They are never presented as device GPS. */
export function resolvePresentationLocation(): EmployeeLocation {
  return { state: 'simulated', latitude: 16.5062, longitude: 80.648 };
}

/** Resolves foreground device location without background tracking or cached project data. */
export async function resolveDeviceLocation(): Promise<EmployeeLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return { state: 'denied' };

  try {
    const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = result.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { state: 'unavailable' };
    return { state: 'active', latitude, longitude };
  } catch {
    return { state: 'unavailable' };
  }
}
