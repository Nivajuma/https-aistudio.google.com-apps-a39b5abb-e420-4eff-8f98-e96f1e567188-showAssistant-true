/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, BarChart2, Shield, Award, TrendingUp, RefreshCw } from 'lucide-react';
import { Fixture, H2HRecord, getH2HStats } from '../api/footballApi';

interface H2HStatsModalProps {
  match: Fixture;
  onClose: () => void;
}

export const H2HStatsModal: React.FC<H2HStatsModalProps> = ({ match, onClose }) => {
  const [stats, setStats] = useState<H2HRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const data = await getH2HStats(match.homeId, match.awayId);
        if (isMounted) {
          // Update team names in stats to match fixture
          data.teamA = match.homeTeam;
          data.teamB = match.awayTeam;
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchStats();
    return () => { isMounted = false; };
  }, [match]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Head-to-Head & Form Guide</h3>
            <p className="text-xs text-slate-400">{match.homeTeam} vs {match.awayTeam}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-slate-300 text-sm font-semibold">Fetching historical H2H records from live database...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            
            {/* Overview / Wins breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">{stats.teamA} Wins</span>
                <span className="text-2xl font-black text-emerald-400">{stats.teamAWins}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">Draws</span>
                <span className="text-2xl font-black text-slate-300">{stats.draws}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">{stats.teamB} Wins</span>
                <span className="text-2xl font-black text-blue-400">{stats.teamBWins}</span>
              </div>
            </div>

            {/* Recent Form Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2">{stats.teamA} Form (Last 5)</span>
                <div className="flex space-x-2">
                  {stats.formA.map((res, i) => (
                    <span key={i} className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center ${
                      res === 'W' ? 'bg-emerald-500 text-slate-950' :
                      res === 'D' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 block mb-2">{stats.teamB} Form (Last 5)</span>
                <div className="flex space-x-2">
                  {stats.formB.map((res, i) => (
                    <span key={i} className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center ${
                      res === 'W' ? 'bg-emerald-500 text-slate-950' :
                      res === 'D' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Historical Meetings List */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-3">Recent Direct Encounters</h4>
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {stats.recentMatches.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 font-medium block">{m.date} • {m.competition}</span>
                      <span className="font-bold text-white mt-0.5 block">{m.homeTeam} vs {m.awayTeam}</span>
                    </div>
                    <span className="px-3 py-1 bg-slate-900 border border-slate-800 font-black text-emerald-400 rounded-lg">
                      {m.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-950/40 border border-blue-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-blue-300">
              <span className="font-semibold flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Average Match Goals:</span>
              </span>
              <span className="font-black text-white text-sm">{stats.avgGoals} Goals per game</span>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
