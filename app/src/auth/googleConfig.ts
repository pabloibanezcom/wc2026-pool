import { Platform } from 'react-native';

type PlatformName = typeof Platform.OS;

export interface GoogleClientIds {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function getGoogleClientIds(): GoogleClientIds {
  return {
    webClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID),
    iosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
    androidClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  };
}

export function hasGoogleClientIdForPlatform(
  clientIds: GoogleClientIds = getGoogleClientIds(),
  platform: PlatformName = Platform.OS
): boolean {
  if (platform === 'ios') return !!clientIds.iosClientId;
  if (platform === 'android') return !!clientIds.androidClientId;
  return !!clientIds.webClientId;
}

export function getGoogleIdToken(response: unknown): string | null {
  if (!response || typeof response !== 'object') return null;

  const authResponse = response as { type?: string; params?: { id_token?: unknown } };
  if (authResponse.type !== 'success') return null;

  return typeof authResponse.params?.id_token === 'string' && authResponse.params.id_token
    ? authResponse.params.id_token
    : null;
}
