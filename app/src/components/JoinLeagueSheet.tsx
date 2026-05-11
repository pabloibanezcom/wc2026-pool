import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts } from '../theme';
import { useI18n } from '../i18n';
import { joinLeague } from '../api/leagues';
import { League } from '../types';

const INVITE_CODE_MIN_LENGTH = 6;
const INVITE_CODE_MAX_LENGTH = 8;

interface Props {
  visible: boolean;
  onClose: () => void;
  onJoined: (league: League) => void;
}

export default function JoinLeagueSheet({ visible, onClose, onJoined }: Props) {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const canJoin = code.trim().length >= INVITE_CODE_MIN_LENGTH;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 240, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCode('');
      setError('');
      onClose();
    });
  };

  const handleJoin = async () => {
    const inviteCode = code.trim().toUpperCase();
    if (inviteCode.length < INVITE_CODE_MIN_LENGTH || inviteCode.length > INVITE_CODE_MAX_LENGTH) {
      setError(t('joinLeague.invalidCode'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const league = await joinLeague(inviteCode);
      close();
      onJoined(league);
    } catch (err: any) {
      setError(err.response?.data?.error || t('joinLeague.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <Text style={styles.heading}>{t('leagues.joinLeague')}</Text>

          <Text style={styles.label}>{t('joinLeague.inviteCode').toUpperCase()}</Text>
          <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={code}
            onChangeText={(text) => {
              setError('');
              setCode(text.replace(/[^a-z0-9]/gi, '').toUpperCase());
            }}
            placeholder="K7M9Q2RX"
            placeholderTextColor={colors.dim}
            maxLength={INVITE_CODE_MAX_LENGTH}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.joinBtn, !canJoin && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={!canJoin || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>{t('leagues.joinLeague')}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 24,
    paddingBottom: 44,
    gap: 12,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  heading: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    marginBottom: 4,
  },
  label: {
    color: colors.dim,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.displayBold,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: -4,
  },
  joinBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnDisabled: {
    opacity: 0.4,
  },
  joinBtnText: {
    color: '#fff',
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    fontWeight: '600',
  },
});
