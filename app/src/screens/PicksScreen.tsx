import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMatches } from '../api/matches';
import { fetchMyPredictions, submitPrediction } from '../api/predictions';
import { Match, Prediction } from '../types';
import PredictionSheet from '../components/PredictionSheet';
import MatchCard, { hasTbdTeam } from '../components/MatchCard';
import LoadingView from '../components/ui/LoadingView';
import { colors, fonts } from '../theme';

function getResult(pred: Prediction, match: Match): 'exact' | 'correct' | 'wrong' | null {
  if (!match.result) return null;
  const { homeGoals, awayGoals } = match.result;
  if (pred.homeGoals === homeGoals && pred.awayGoals === awayGoals) return 'exact';
  const pOut = pred.homeGoals > pred.awayGoals ? 'h' : pred.homeGoals < pred.awayGoals ? 'a' : 'd';
  const aOut = homeGoals > awayGoals ? 'h' : homeGoals < awayGoals ? 'a' : 'd';
  return pOut === aOut ? 'correct' : 'wrong';
}

function getDayKey(utcDate: string) {
  const date = new Date(utcDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDayLabel(utcDate: string) {
  return new Date(utcDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function groupMatchesByDay(matches: Match[]) {
  const groups = new Map<string, Match[]>();

  matches.forEach((match) => {
    const key = getDayKey(match.utcDate);
    groups.set(key, [...(groups.get(key) ?? []), match]);
  });

  return Array.from(groups.entries()).map(([day, dayMatches]) => ({
    day,
    label: formatDayLabel(dayMatches[0].utcDate),
    matches: dayMatches,
  }));
}

export default function PicksScreen() {
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const predMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]));

  const load = async () => {
    try {
      const [m, p] = await Promise.all([fetchMatches({}), fetchMyPredictions()]);
      setMatches(m);
      setPredictions(p);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const upcoming = useMemo(
    () => matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'LIVE'),
    [matches],
  );
  const finished = useMemo(
    () => matches.filter((m) => m.status === 'FINISHED'),
    [matches],
  );
  const shown = useMemo(
    () =>
      [...(tab === 'upcoming' ? upcoming : finished)].sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
      ),
    [finished, tab, upcoming],
  );
  const matchGroups = useMemo(() => groupMatchesByDay(shown), [shown]);

  const handleSave = async (matchId: string, score: [number, number]) => {
    try {
      const pred = await submitPrediction(matchId, score[0], score[1]);
      setPredictions((prev) => [...prev.filter((p) => p.matchId !== matchId), pred]);
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Picks</Text>
          <Text style={styles.subtitle}>2026 FIFA World Cup · Group Stage</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['upcoming', 'results'] as const).map((t) => {
            const active = tab === t;
            const count = t === 'upcoming' ? upcoming.length : finished.length;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t === 'upcoming' ? `Upcoming (${count})` : `Results (${count})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Match list */}
        <View style={styles.matchGroups}>
          {matchGroups.map((group) => (
            <View key={group.day} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{group.label}</Text>
              <View style={styles.matchList}>
                {group.matches.map((m) => {
                  const pred = predMap[m._id];
                  const result = m.status === 'FINISHED' && pred ? getResult(pred, m) : null;
                  const canPredict = (m.status === 'SCHEDULED' || m.status === 'LIVE') && !hasTbdTeam(m);

                  return (
                    <MatchCard
                      key={m._id}
                      match={m}
                      prediction={pred}
                      result={result}
                      onPress={canPredict ? () => setSelectedMatch(m) : undefined}
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {shown.length === 0 && !refreshing && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? 'No upcoming matches.' : 'No results yet.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <PredictionSheet
        match={selectedMatch}
        existing={
          selectedMatch && predMap[selectedMatch._id]
            ? [predMap[selectedMatch._id].homeGoals, predMap[selectedMatch._id].awayGoals]
            : undefined
        }
        onSave={handleSave}
        onClose={() => setSelectedMatch(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 16, gap: 16 },

  titleRow: { marginTop: 4 },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.display },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, fontFamily: fonts.body },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '600', fontFamily: fonts.bodyMedium },
  tabTextActive: { color: '#fff' },

  matchGroups: { gap: 18 },
  dayGroup: { gap: 8 },
  dayLabel: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: fonts.bodyMedium,
  },
  matchList: { gap: 10 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: colors.muted, fontSize: 14 },
});
