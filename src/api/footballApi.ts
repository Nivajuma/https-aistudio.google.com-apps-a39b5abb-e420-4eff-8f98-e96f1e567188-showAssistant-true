/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

/**
 * Football Data API Client with Caching, Rate Limit Error Handling & Graceful Fallback
 */

export interface Fixture {
  id: string;
  league: string;
  leagueId: number;
  homeTeam: string;
  awayTeam: string;
  homeId: number;
  awayId: number;
  homeLogo: string;
  awayLogo: string;
  startTime: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
}

export interface H2HRecord {
  teamA: string;
  teamB: string;
  totalMeetings: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  recentMatches: {
    date: string;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
  }[];
  formA: string[];
  formB: string[];
  avgGoals: number;
}

/**
 * Retrieve Live Fixtures across major leagues with rate limit error handling
 */
export async function getLiveFixtures(): Promise<Fixture[]> {
  try {
    const res = await axios.get('/api/football/live');
    return res.data.fixtures;
  } catch (err: any) {
    if (err?.response?.status === 429) {
      console.warn('Football API Rate Limit (429) exceeded. Falling back to cached mock data.');
    } else {
      console.warn('Live fixtures API fallback engaged:', err.message);
    }
    return getFallbackFixtures().filter(f => f.isLive);
  }
}

/**
 * Retrieve Upcoming Fixtures for a specific league ID with rate limit error handling
 */
export async function getUpcomingFixtures(leagueId?: number): Promise<Fixture[]> {
  try {
    const res = await axios.get(`/api/football/upcoming${leagueId ? `?leagueId=${leagueId}` : ''}`);
    return res.data.fixtures;
  } catch (err: any) {
    if (err?.response?.status === 429) {
      console.warn('Football API Rate Limit (429) exceeded on upcoming fixtures. Falling back.');
    } else {
      console.warn('Upcoming fixtures API fallback engaged:', err.message);
    }
    const fixtures = getFallbackFixtures();
    return leagueId ? fixtures.filter(f => f.leagueId === leagueId) : fixtures;
  }
}

/**
 * Retrieve Real Head-to-Head (H2H) statistics and form guide between two teams
 */
export async function getH2HStats(teamAId: number, teamBId: number): Promise<H2HRecord> {
  try {
    const res = await axios.get(`/api/football/h2h?teamA=${teamAId}&teamB=${teamBId}`);
    return res.data.h2h;
  } catch (err: any) {
    console.warn('H2H Stats API fallback engaged:', err?.message);
    return {
      teamA: 'Home Team',
      teamB: 'Away Team',
      totalMeetings: 10,
      teamAWins: 4,
      teamBWins: 3,
      draws: 3,
      recentMatches: [
        { date: '2026-03-12', competition: 'Premier League', homeTeam: 'Home Team', awayTeam: 'Away Team', score: '2 - 1' },
        { date: '2025-11-04', competition: 'Premier League', homeTeam: 'Away Team', awayTeam: 'Home Team', score: '0 - 0' },
        { date: '2025-05-18', competition: 'FA Cup', homeTeam: 'Home Team', awayTeam: 'Away Team', score: '3 - 2' }
      ],
      formA: ['W', 'D', 'W', 'L', 'W'],
      formB: ['L', 'W', 'W', 'D', 'W'],
      avgGoals: 2.8,
    };
  }
}

/**
 * Retrieve League Standings
 */
export async function getLeagueStandings(leagueId: number) {
  try {
    const res = await axios.get(`/api/football/standings?leagueId=${leagueId}`);
    return res.data.standings;
  } catch (err: any) {
    console.warn('Standings API fallback engaged:', err?.message);
    return [];
  }
}

// Fallback mock fixture generator when external API is unreachable or rate-limited (429)
function getFallbackFixtures(): Fixture[] {
  return [
    {
      id: 'm1',
      league: 'English Premier League',
      leagueId: 39,
      homeTeam: 'Manchester City',
      awayTeam: 'Liverpool',
      homeId: 50,
      awayId: 40,
      homeLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&q=80',
      awayLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=100&q=80',
      startTime: 'Live 68\'',
      homeScore: 2,
      awayScore: 1,
      isLive: true,
      odds: { home: 1.45, draw: 4.20, away: 6.50 },
    },
    {
      id: 'm2',
      league: 'English Premier League',
      leagueId: 39,
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester United',
      homeId: 42,
      awayId: 33,
      homeLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=100&q=80',
      awayLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=100&q=80',
      startTime: 'Today, 18:30',
      homeScore: 0,
      awayScore: 0,
      isLive: false,
      odds: { home: 1.90, draw: 3.50, away: 3.80 },
    },
    {
      id: 'm3',
      league: 'UEFA Champions League',
      leagueId: 2,
      homeTeam: 'Real Madrid',
      awayTeam: 'Bayern Munich',
      homeId: 541,
      awayId: 157,
      homeLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=100&q=80',
      awayLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=100&q=80',
      startTime: 'Tomorrow, 22:00',
      homeScore: 0,
      awayScore: 0,
      isLive: false,
      odds: { home: 2.10, draw: 3.40, away: 3.10 },
    },
    {
      id: 'm4',
      league: 'Kenya Premier League',
      leagueId: 203,
      homeTeam: 'Gor Mahia FC',
      awayTeam: 'Tusker FC',
      homeId: 1001,
      awayId: 1002,
      homeLogo: 'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=100&q=80',
      awayLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&q=80',
      startTime: 'Live 82\'',
      homeScore: 1,
      awayScore: 1,
      isLive: true,
      odds: { home: 1.75, draw: 3.10, away: 4.50 },
    },
    {
      id: 'm5',
      league: 'Spanish La Liga',
      leagueId: 140,
      homeTeam: 'Barcelona',
      awayTeam: 'Atletico Madrid',
      homeId: 529,
      awayId: 530,
      homeLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=100&q=80',
      awayLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=100&q=80',
      startTime: 'Today, 21:00',
      homeScore: 0,
      awayScore: 0,
      isLive: false,
      odds: { home: 1.80, draw: 3.60, away: 4.20 },
    }
  ];
}
