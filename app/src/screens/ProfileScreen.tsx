import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { fetchMyLeagues } from '../api/leagues';
import { fetchMyPredictions } from '../api/predictions';
import { League, Prediction } from '../types';
import Avatar from '../components/ui/Avatar';
import { colors } from '../theme';

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

function Tag({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [league, setLeague] = useState<League | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    Promise.all([fetchMyLeagues(), fetchMyPredictions()])
      .then(([leagues, preds]) => {
        if (leagues.length > 0) setLeague(leagues[0]);
        setPredictions(preds);
      })
      .catch(() => {});
  }, []);

  const totalPoints = predictions.reduce((a, p) => a + (p.points ?? 0), 0);
  const exactCount = predictions.filter((p) => p.points !== null && p.points >= 10).length;

  const myRank = league
    ? (() => {
        const sorted = [...league.members].sort((a, b) => b.totalPoints - a.totalPoints);
        const idx = sorted.findIndex(
          (m) => (m.userId as any)?.id === user?.id || (m.userId as any)?._id === user?.id
        );
        return idx >= 0 ? idx + 1 : '—';
      })()
    : '—';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const sections = [
    {
      title: 'Pool',
      items: [
        { label: 'Pool Name', value: league?.name ?? '—' },
        { label: 'Players', value: league ? `${league.members.length} friends` : '—' },
        { label: 'Invite Code', value: league?.inviteCode ?? '—' },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { label: 'Match reminders', value: 'On' },
        { label: 'Result alerts', value: 'On' },
        { label: 'Leaderboard updates', value: 'Off' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Edit profile', value: '' },
        { label: 'Help & Support', value: '' },
        { label: 'Sign out', value: '', danger: true, onPress: handleSignOut },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Avatar name={user?.name ?? '?'} color="#494fdf" size={76} />
          )}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.tags}>
            <Tag color={colors.accent} bg={colors.accentDim}>🥇 Rank #{myRank}</Tag>
            <Tag color={colors.blue} bg={colors.blueDim}>{totalPoints} points</Tag>
            <Tag color={colors.muted} bg="rgba(255,255,255,0.06)">{predictions.length} matches</Tag>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Rank', value: `#${myRank}`, color: colors.accent },
            { label: 'Points', value: `${totalPoints}`, color: colors.text },
            { label: 'Exact Scores', value: `${exactCount}`, color: colors.blue },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.statCard}>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        {sections.map(({ title, items }) => (
          <View key={title}>
            <SectionLabel>{title}</SectionLabel>
            <View style={styles.card}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.settingsRow, i < items.length - 1 && styles.settingsRowBorder]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  <Text style={[styles.settingsLabel, item.danger && { color: colors.danger }]}>
                    {item.label}
                  </Text>
                  <View style={styles.settingsRight}>
                    {!!item.value && <Text style={styles.settingsValue}>{item.value}</Text>}
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 40, gap: 18 },

  avatarSection: { alignItems: 'center', gap: 12, paddingTop: 14 },
  avatarImg: { width: 76, height: 76, borderRadius: 38 },
  nameBlock: { alignItems: 'center' },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  tagText: { fontSize: 10, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.dim, fontSize: 10, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: colors.dim, letterSpacing: 1.2, marginBottom: 8,
  },

  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: 16,
  },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsLabel: { color: colors.text, fontSize: 14 },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsValue: { color: colors.muted, fontSize: 13 },
  chevron: { color: colors.dim, fontSize: 18 },
});
