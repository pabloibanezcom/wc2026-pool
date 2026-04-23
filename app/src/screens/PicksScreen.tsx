import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { fetchMatches } from '../api/matches';
import { fetchMyPredictions, submitPrediction } from '../api/predictions';
import { Match, Prediction } from '../types';
import PredictionSheet from '../components/PredictionSheet';
import Flag from '../components/ui/Flag';
import Badge from '../components/ui/Badge';
import { colors } from '../theme';

function getResult(pred: Prediction, match: Match): 'exact' | 'correct' | 'wrong' | null {
  if (!match.result) return null;
  const { homeGoals, awayGoals } = match.result;
  if (pred.homeGoals === homeGoals && pred.awayGoals === awayGoals) return 'exact';
  const pOut = pred.homeGoals > pred.awayGoals ? 'h' : pred.homeGoals < pred.awayGoals ? 'a' : 'd';
  const aOut = homeGoals > awayGoals ? 'h' : homeGoals < awayGoals ? 'a' : 'd';
  return pOut === aOut ? 'correct' : 'wrong';
}

function formatDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatTime(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function PicksScreen() {
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const predMap = Object.fromEntries(predictions.map((p) => [p.matchId, p]));

  const load = async () => {
    try {
      const [m, p] = await Promise.all([fetchMatches({}), fetchMyPredictions()]);
      setMatches(m);
      setPredictions(p);
    } catch {
      // silently fail
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const upcoming = matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'LIVE');
  const finished = matches.filter((m) => m.status === 'FINISHED');
  const shown = tab === 'upcoming' ? upcoming : finished;

  const handleSave = async (matchId: string, score: [number, number]) => {
    try {
      const pred = await submitPrediction(matchId, score[0], score[1]);
      setPredictions((prev) => [...prev.filter((p) => p.matchId !== matchId), pred]);
    } catch {
      // silently fail
    }
  };

  return (
    <View style={styles.container}>
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
        <View style={{ gap: 10 }}>
          {shown.map((m) => {
            const pred = predMap[m._id];
            const result = m.status === 'FINISHED' && pred ? getResult(pred, m) : null;
            const borderColor =
              result === 'exact'
                ? 'rgba(0,168,126,0.35)'
                : result === 'correct'
                ? 'rgba(73,79,223,0.28)'
                : colors.border;
            const isUpcoming = m.status === 'SCHEDULED' || m.status === 'LIVE';

            return (
              <TouchableOpacity
                key={m._id}
                style={[styles.matchCard, { borderColor }]}
                onPress={() => isUpcoming && setSelectedMatch(m)}
                disabled={!isUpcoming}
              >
                <View style={styles.matchHeader}>
                  <Text style={styles.matchMeta}>
                    {m.group ? `Group ${m.group}` : m.stage} · {formatDate(m.utcDate)}
                    {isUpcoming ? ` · ${formatTime(m.utcDate)}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {result && <Badge result={result} />}
                    {isUpcoming && !pred && (
                      <Text style={styles.predictLink}>Predict →</Text>
                    )}
                    {isUpcoming && pred && (
                      <Text style={styles.editLink}>✓ Edit</Text>
                    )}
                  </View>
                </View>
                <View style={styles.matchRow}>
                  <View style={styles.teamSide}>
                    <Flag code={m.homeTeam.code} size={26} />
                    <Text style={styles.teamName}>{m.homeTeam.name}</Text>
                  </View>
                  <View style={styles.scoreCenter}>
                    {m.status === 'FINISHED' && (
                      <Text style={styles.scoreResult}>
                        {m.result!.homeGoals} – {m.result!.awayGoals}
                      </Text>
                    )}
                    {pred ? (
                      <Text
                        style={[
                          styles.predScore,
                          m.status === 'FINISHED' ? { color: colors.dim } : { color: colors.accent, fontWeight: '700' },
                        ]}
                      >
                        {m.status === 'FINISHED' ? `pick: ` : ''}
                        {pred.homeGoals}–{pred.awayGoals}
                      </Text>
                    ) : isUpcoming ? (
                      <Text style={styles.vsText}>vs</Text>
                    ) : null}
                  </View>
                  <View style={[styles.teamSide, styles.teamSideRight]}>
                    <Text style={styles.teamName}>{m.awayTeam.name}</Text>
                    <Flag code={m.awayTeam.code} size={26} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingBottom: 32, gap: 16 },

  titleRow: { marginTop: 4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  matchCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    paddingHorizontal: 16,
  },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  matchMeta: { color: colors.dim, fontSize: 10 },
  predictLink: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  editLink: { color: colors.accent, fontSize: 11, fontWeight: '500' },

  matchRow: { flexDirection: 'row', alignItems: 'center' },
  teamSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  teamSideRight: { justifyContent: 'flex-end' },
  teamName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  scoreCenter: { alignItems: 'center', minWidth: 76, paddingHorizontal: 8 },
  scoreResult: { color: colors.text, fontSize: 18, fontWeight: '700' },
  predScore: { fontSize: 11, marginTop: 2 },
  vsText: { color: colors.dim, fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: colors.muted, fontSize: 14 },
});
