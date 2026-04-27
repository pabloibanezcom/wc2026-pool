import axios from 'axios';
import { Match } from '../models/Match';
import { CountryTeam } from '../models/CountryTeam';
import { env } from '../config/env';
import { logger } from '../config/logger';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function averageOdds(events: OddsApiEvent): { home: number | null; draw: number | null; away: number | null } {
  const homePrices: number[] = [];
  const drawPrices: number[] = [];
  const awayPrices: number[] = [];

  for (const bookmaker of events.bookmakers) {
    const h2h = bookmaker.markets.find((m) => m.key === 'h2h');
    if (!h2h) continue;

    const homeOutcome = h2h.outcomes.find((o) => normalizeName(o.name) === normalizeName(events.home_team));
    const awayOutcome = h2h.outcomes.find((o) => normalizeName(o.name) === normalizeName(events.away_team));
    const drawOutcome = h2h.outcomes.find((o) => normalizeName(o.name) === 'draw');

    if (homeOutcome) homePrices.push(homeOutcome.price);
    if (awayOutcome) awayPrices.push(awayOutcome.price);
    if (drawOutcome) drawPrices.push(drawOutcome.price);
  }

  const avg = (prices: number[]) =>
    prices.length > 0 ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : null;

  return { home: avg(homePrices), draw: avg(drawPrices), away: avg(awayPrices) };
}

export async function syncOdds(): Promise<{ matchesUpdated: number; requestsRemaining: number | null }> {
  if (!env.ODDS_API_KEY) {
    logger.warn('ODDS_API_KEY not configured — skipping odds sync');
    return { matchesUpdated: 0, requestsRemaining: null };
  }

  // Only fetch odds for SCHEDULED matches without odds, or with stale odds (>12h old)
  const staleCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const matches = await Match.find({
    status: { $in: ['SCHEDULED', 'LIVE'] },
    $or: [{ odds: null }, { 'odds.fetchedAt': { $lt: staleCutoff } }],
  });

  if (matches.length === 0) {
    logger.info('No matches need odds refresh');
    return { matchesUpdated: 0, requestsRemaining: null };
  }

  // Build name→code lookup from CountryTeam catalog
  const teams = await CountryTeam.find({});
  const nameToCode = new Map<string, string>();
  for (const team of teams) {
    const names = team.names instanceof Map ? team.names : new Map(Object.entries(team.names as Record<string, string>));
    for (const name of names.values()) {
      if (name) nameToCode.set(normalizeName(name), team.code);
    }
  }

  // Fetch all odds in a single API call
  let events: OddsApiEvent[] = [];
  let requestsRemaining: number | null = null;

  try {
    const response = await axios.get<OddsApiEvent[]>(`${ODDS_API_BASE}/sports/${env.ODDS_API_SPORT_KEY}/odds`, {
      params: { apiKey: env.ODDS_API_KEY, regions: 'eu', markets: 'h2h', oddsFormat: 'decimal' },
    });
    events = response.data;
    requestsRemaining = Number(response.headers['x-requests-remaining'] ?? null) || null;
    logger.info({ count: events.length, requestsRemaining }, 'Fetched odds from API');
  } catch (err) {
    logger.error({ err }, 'Failed to fetch odds from The Odds API');
    return { matchesUpdated: 0, requestsRemaining: null };
  }

  // Index our matches by homeCode+awayCode for quick lookup
  const matchIndex = new Map<string, (typeof matches)[number]>();
  for (const match of matches) {
    matchIndex.set(`${match.homeTeamCode}:${match.awayTeamCode}`, match);
  }

  let matchesUpdated = 0;

  for (const event of events) {
    const homeCode = nameToCode.get(normalizeName(event.home_team));
    const awayCode = nameToCode.get(normalizeName(event.away_team));

    if (!homeCode || !awayCode) {
      // Fall back to date-proximity match when team names aren't in catalog yet
      const eventDate = new Date(event.commence_time);
      const candidate = matches.find((m) => Math.abs(m.utcDate.getTime() - eventDate.getTime()) < 2 * 60 * 60 * 1000);
      if (!candidate) continue;

      const computed = averageOdds(event);
      candidate.odds = { ...computed, fetchedAt: new Date() };
      await candidate.save();
      matchesUpdated++;
      continue;
    }

    const match = matchIndex.get(`${homeCode}:${awayCode}`);
    if (!match) continue;

    // Verify date proximity (within 2 hours) to avoid false matches
    const eventDate = new Date(event.commence_time);
    if (Math.abs(match.utcDate.getTime() - eventDate.getTime()) > 2 * 60 * 60 * 1000) continue;

    const computed = averageOdds(event);
    match.odds = { ...computed, fetchedAt: new Date() };
    await match.save();
    matchesUpdated++;
  }

  logger.info({ matchesUpdated, requestsRemaining }, 'Odds sync complete');
  return { matchesUpdated, requestsRemaining };
}
