import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, borderRadius } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const hasGoogleConfig = !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const POOL_NAME = 'Mundialines de Rivas';

const FRIENDS = [
  { initials: 'M', color: '#00a87e' },
  { initials: 'S', color: '#e61e49' },
  { initials: 'T', color: '#ec7e00' },
];

export default function LoginScreen() {
  const signInDev = useAuthStore((s) => s.signInDev);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleDevLogin = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInDev();
    } catch {
      setError('Dev login failed. Is the API running?');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Decorative glow */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacerTop} />

        {/* Logo + title */}
        <View style={styles.logoSection}>
          <Image
            source={{ uri: 'https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleBox}>
            <Text style={styles.title}>World Cup Pool</Text>
            <Text style={styles.subtitle}>2026 FIFA · USA · Canada · Mexico</Text>
          </View>
        </View>

        {/* Pool card */}
        <View style={styles.poolCard}>
          <View style={styles.poolCardHeader}>
            <View style={styles.poolIcon}>
              <Text style={{ fontSize: 20 }}>👥</Text>
            </View>
            <View>
              <Text style={styles.poolName}>{POOL_NAME}</Text>
              <Text style={styles.poolSub}>Private pool · 8 friends</Text>
            </View>
          </View>
          <View style={styles.poolStats}>
            {[{ v: '48', l: 'Matches' }, { v: '8', l: 'Players' }, { v: 'Jun 11', l: 'Starts' }].map(({ v, l }) => (
              <View key={l} style={styles.poolStat}>
                <Text style={styles.poolStatValue}>{v}</Text>
                <Text style={styles.poolStatLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Friend avatars */}
        <View style={styles.friendsRow}>
          <View style={styles.avatarStack}>
            {FRIENDS.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.miniAvatar,
                  { backgroundColor: f.color, marginLeft: i > 0 ? -6 : 0 },
                ]}
              >
                <Text style={styles.miniAvatarText}>{f.initials}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.friendsText}>
            Marco, Sofía, Tomás{' '}
            <Text style={{ color: colors.dim }}>+ 4 others joined</Text>
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* CTA */}
        <View style={styles.ctaSection}>
          {hasGoogleConfig ? (
            <GoogleLoginButton isSigningIn={isSigningIn} setIsSigningIn={setIsSigningIn} setError={setError} />
          ) : (
            <TouchableOpacity style={[styles.googleBtn, styles.googleBtnDisabled]} disabled>
              <Text style={[styles.googleBtnText, { color: '#666' }]}>Sign in with Google (not configured)</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.fine}>
            By continuing you agree to the pool rules.{'\n'}Your picks are visible to other members.
          </Text>
        </View>

        {__DEV__ && (
          <TouchableOpacity style={styles.devBtn} onPress={handleDevLogin} disabled={isSigningIn}>
            <Text style={styles.devBtnText}>Dev Login (skip Google)</Text>
          </TouchableOpacity>
        )}

        <View style={styles.spacerBottom} />
      </ScrollView>
    </Animated.View>
  );
}

function GoogleLoginButton({
  isSigningIn,
  setIsSigningIn,
  setError,
}: {
  isSigningIn: boolean;
  setIsSigningIn: (v: boolean) => void;
  setError: (v: string | null) => void;
}) {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      setIsSigningIn(true);
      setError(null);
      signInWithGoogle(id_token)
        .catch(() => setError('Sign in failed. Please try again.'))
        .finally(() => setIsSigningIn(false));
    }
  }, [response]);

  return (
    <TouchableOpacity
      style={[styles.googleBtn, (!request || isSigningIn) && styles.googleBtnDisabled]}
      onPress={() => promptAsync()}
      disabled={!request || isSigningIn}
    >
      {isSigningIn ? (
        <ActivityIndicator color="#444" />
      ) : (
        <Image
          source={{ uri: 'https://www.google.com/favicon.ico' }}
          style={{ width: 20, height: 20 }}
        />
      )}
      <Text style={[styles.googleBtnText, isSigningIn && { color: '#666' }]}>
        {isSigningIn ? 'Signing in…' : 'Continue with Google'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,168,126,0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(73,79,223,0.06)',
  },
  scroll: {
    paddingHorizontal: 28,
  },
  spacerTop: { height: 80 },
  spacerBottom: { height: 40 },

  logoSection: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  logo: {
    width: 110,
    height: 110,
  },
  titleBox: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 6,
  },

  poolCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 12,
  },
  poolCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  poolIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poolName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  poolSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  poolStats: {
    flexDirection: 'row',
    gap: 8,
  },
  poolStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  poolStatValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  poolStatLabel: {
    color: colors.dim,
    fontSize: 10,
    marginTop: 1,
  },

  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    paddingLeft: 4,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  friendsText: {
    color: colors.muted,
    fontSize: 12,
  },

  error: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
  },

  ctaSection: {
    gap: 12,
  },
  googleBtn: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  googleBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
  fine: {
    color: colors.dim,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },

  devBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  devBtnText: {
    color: colors.muted,
    fontSize: 13,
  },
});
