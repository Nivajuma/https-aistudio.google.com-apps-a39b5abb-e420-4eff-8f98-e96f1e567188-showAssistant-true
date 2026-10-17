/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Award, Table } from 'lucide-react';
import { getLeagueStandings } from '../api/footballApi';

interface StandingRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

interface LeagueStandingsProps {
  leagueId: number;
  leagueName: string;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({ leagueId, leagueName }) => {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStandings() {
      setLoading(true);
      try {
        const data = await getLeagueStandings(leagueId);
        if (isMounted) {
          setStandings(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStandings();
    return () => { isMounted = false; };
  }, [leagueId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{leagueName} Standings</h3>
            <p className="text-xs text-slate-400">Live league table and rankings</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-semibold">Fetching real-time standings table...</p>
        </div>
      ) : standings.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          No standings available for this league.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Team</th>
                <th className="py-3 px-3 text-center">PL</th>
                <th className="py-3 px-3 text-center">W</th>
                <th className="py-3 px-3 text-center">D</th>
                <th className="py-3 px-3 text-center">L</th>
                <th className="py-3 px-3 text-center">GD</th>
                <th className="py-3 px-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {standings.map((row) => {
                const gd = row.gf - row.ga;
                return (
                  <tr key={row.rank} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3 font-bold text-slate-300">
                      <span className={`inline-flex w-6 h-6 rounded-lg items-center justify-center text-xs ${
                        row.rank <= 4 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black' :
                        row.rank <= 6 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white flex items-center space-x-2">
                      <span>{row.team}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{row.played}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{row.won}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{row.drawn}</td>
                    <td className="py-3.5 px-3 text-center text-slate-300">{row.lost}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-300">{gd > 0 ? `+${gd}` : gd}</td>
                    <td className="py-3.5 px-3 text-right font-black text-emerald-400 text-base">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
