import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadGoogleConfig(platform: string) {
  vi.resetModules();
  vi.doMock('react-native', () => ({
    Platform: { OS: platform },
  }));
  return import('./googleConfig');
}

describe('Google login config', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('react-native');
    delete process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  });

  it('uses the explicit web client id and falls back to the legacy shared env name', async () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = ' web-client ';
    const { getGoogleClientIds } = await loadGoogleConfig('web');
    expect(getGoogleClientIds().webClientId).toBe('web-client');

    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'legacy-web-client';
    expect(getGoogleClientIds().webClientId).toBe('legacy-web-client');
  });

  it('checks the client id required by the current platform', async () => {
    const { hasGoogleClientIdForPlatform } = await loadGoogleConfig('ios');

    expect(hasGoogleClientIdForPlatform({ webClientId: 'web' }, 'web')).toBe(true);
    expect(hasGoogleClientIdForPlatform({ iosClientId: 'ios' }, 'ios')).toBe(true);
    expect(hasGoogleClientIdForPlatform({ androidClientId: 'android' }, 'android')).toBe(true);
    expect(hasGoogleClientIdForPlatform({ webClientId: 'web' }, 'ios')).toBe(false);
    expect(hasGoogleClientIdForPlatform({ webClientId: 'web' }, 'android')).toBe(false);
  });

  it('extracts an id token only from successful Google responses', async () => {
    const { getGoogleIdToken } = await loadGoogleConfig('web');

    expect(getGoogleIdToken({ type: 'success', params: { id_token: 'id-token' } })).toBe('id-token');
    expect(getGoogleIdToken({ type: 'success', params: {} })).toBeNull();
    expect(getGoogleIdToken({ type: 'cancel' })).toBeNull();
    expect(getGoogleIdToken(null)).toBeNull();
  });
});
