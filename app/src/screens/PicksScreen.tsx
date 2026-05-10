import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollTriggerProvider } from '../contexts/ScrollTrigger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Match, Prediction } from '../types';
import PredictionSheet from '../components/PredictionSheet';
import ResultSheet from '../components/ResultSheet';
import MatchCard, { hasTbdTeam } from '../components/MatchCard';
import LoadingView from '../components/ui/LoadingView';
import TournamentPicksSection from '../components/TournamentPicksSection';
import PicksTabs, { PicksTab } from '../components/PicksTabs';
import GroupPredictionCard from '../components/GroupPredictionCard';
import { colors, fonts } from '../theme';
import { useI18n } from '../i18n';
import { isPredictionLocked } from '../utils/prediction';
import { usePicksData } from '../hooks/usePicksData';

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

function formatDayLabel(utcDate: string, locale: string) {
  return new Date(utcDate).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function groupMatchesByDay(matches: Match[], locale: string) {
  const groups = new Map<string, Match[]>();

  matches.forEach((match) => {
    const key = getDayKey(match.utcDate);
    groups.set(key, [...(groups.get(key) ?? []), match]);
  });

  return Array.from(groups.entries()).map(([day, dayMatches]) => ({
    day,
    label: formatDayLabel(dayMatches[0].utcDate, locale),
    matches: dayMatches,
  }));
}

export default function PicksScreen() {
  const { t, locale } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const triggerRef = useRef<() => void>(() => {});
  const [tab, setTab] = useState<PicksTab>('upcoming');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedResult, setSelectedResult] = useState<Match | null>(null);
  const [isDraggingGroupTeam, setIsDraggingGroupTeam] = useState(false);
  const {
    groupPredMap,
    groupPredictionsLocked,
    groupStandings,
    handleGroupOrder,
    handleSave,
    handleTournamentPick,
    loading,
    matches,
    onRefresh,
    predMap,
    refreshing,
    tournamentPicks,
    tournamentPredictionsLocked,
    tournamentTeams,
  } = usePicksData();

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

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
  const matchGroups = useMemo(() => groupMatchesByDay(shown, locale), [locale, shown]);
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.fixedHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('picks.title')}</Text>
          <Text style={styles.subtitle}>{t('picks.subtitle')}</Text>
        </View>

        <PicksTabs tab={tab} onChange={setTab} />
      </View>

      <ScrollTriggerProvider triggerRef={triggerRef}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        scrollEnabled={!isDraggingGroupTeam}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        onScroll={() => triggerRef.current()}
        scrollEventThrottle={200}
      >
        {tab === 'finals' ? (
          <TournamentPicksSection
            picks={tournamentPicks}
            teams={tournamentTeams}
            onPickChange={tournamentPredictionsLocked ? undefined : handleTournamentPick}
          />
        ) : tab === 'groups' ? (
          <View style={styles.groupCards}>
            {groupStandings.map((group) => (
              <GroupPredictionCard
                key={group.id}
                group={group}
                order={groupPredMap[group.id]?.orderedTeams ?? group.teams}
                progress={groupPredMap[group.id]?.progress}
                onOrderChange={groupPredictionsLocked ? undefined : handleGroupOrder}
                onDragStateChange={setIsDraggingGroupTeam}
              />
            ))}

            {groupStandings.length === 0 && !refreshing && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('picks.groupsPending')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.matchGroups}>
            {matchGroups.map((group) => (
              <View key={group.day} style={styles.dayGroup}>
                <Text style={styles.dayLabel}>{group.label}</Text>
                <View style={styles.matchList}>
                  {group.matches.map((m) => {
                    const pred = predMap[m._id];
                    const result = m.status === 'FINISHED' && pred ? getResult(pred, m) : null;
                    const canPredict = !isPredictionLocked(m) && !hasTbdTeam(m);
                    const onPress = canPredict
                      ? () => setSelectedMatch(m)
                      : m.status === 'FINISHED'
                      ? () => setSelectedResult(m)
                      : undefined;

                    return (
                      <MatchCard
                        key={m._id}
                        match={m}
                        prediction={pred}
                        result={result}
                        onPress={onPress}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {tab !== 'groups' && tab !== 'finals' && shown.length === 0 && !refreshing && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === 'upcoming' ? t('picks.noUpcoming') : t('picks.noResults')}
            </Text>
          </View>
        )}
      </ScrollView>
      </ScrollTriggerProvider>

      <PredictionSheet
        match={selectedMatch}
        existing={
          selectedMatch && predMap[selectedMatch._id]
            ? {
                score: [predMap[selectedMatch._id].homeGoals, predMap[selectedMatch._id].awayGoals],
                qualifier: predMap[selectedMatch._id].qualifier,
              }
            : undefined
        }
        onSave={handleSave}
        onClose={() => setSelectedMatch(null)}
      />
      <ResultSheet
        match={selectedResult}
        prediction={selectedResult ? predMap[selectedResult._id] : null}
        onClose={() => setSelectedResult(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  fixedHeader: {
    backgroundColor: colors.bg,
    gap: 16,
    padding: 18,
    paddingBottom: 14,
  },
  scroll: { padding: 18, paddingBottom: 16, paddingTop: 14, gap: 16 },

  titleRow: { marginTop: 4 },
  title: { color: colors.text, fontSize: 30, fontFamily: fonts.display },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2, fontFamily: fonts.body },

  matchGroups: { gap: 18 },
  groupCards: { gap: 12 },
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
