import * as ImagePicker from 'expo-image-picker';

import type { EmployeePhoto } from '../features/employee/EmployeeWorkScreen';
import { ApiError } from './api';

const supportedMimeTypes = new Set<EmployeePhoto['mimeType']>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function inferredMimeType(uri: string): EmployeePhoto['mimeType'] | undefined {
  const normalized = uri.toLowerCase();
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.png')) return 'image/png';
  if (normalized.endsWith('.webp')) return 'image/webp';
  return undefined;
}

/** Opens the image library only after an explicit evidence-selection action. */
export async function chooseEvidencePhoto(): Promise<EmployeePhoto | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new ApiError('REQUEST_FAILED', 'Photo-library permission is required to add evidence.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled) return undefined;

  const asset = result.assets[0];
  const mimeType = asset.mimeType && supportedMimeTypes.has(asset.mimeType as EmployeePhoto['mimeType'])
    ? asset.mimeType as EmployeePhoto['mimeType']
    : inferredMimeType(asset.uri);
  if (!mimeType) {
    throw new ApiError('REQUEST_FAILED', 'Choose a JPEG, PNG, or WebP evidence image.');
  }

  return {
    uri: asset.uri,
    fileName: asset.fileName?.trim() || `karaa-evidence.${mimeType.split('/')[1]}`,
    mimeType,
  };
}
