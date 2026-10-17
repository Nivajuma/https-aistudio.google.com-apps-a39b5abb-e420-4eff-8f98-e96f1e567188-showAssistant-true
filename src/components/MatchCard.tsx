/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Sparkles, Activity, BarChart2, Bell, BellRing } from 'lucide-react';
import { Fixture } from '../api/footballApi';

interface MatchCardProps {
  match: Fixture;
  isHomeSelected: boolean;
  isDrawSelected: boolean;
  isAwaySelected: boolean;
  isWatched: boolean;
  onSelectOdds: (match: Fixture, selection: 'home' | 'draw' | 'away') => void;
  onOpenAI: (match: Fixture) => void;
  onOpenH2H: (match: Fixture) => void;
  onToggleWatch: (match: Fixture) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isHomeSelected,
  isDrawSelected,
  isAwaySelected,
  isWatched,
  onSelectOdds,
  onOpenAI,
  onOpenH2H,
  onToggleWatch,
}) => {
  return (
    <div className={`bg-slate-900/80 border rounded-2xl p-5 transition shadow-lg ${
      isWatched ? 'border-emerald-500/60 shadow-emerald-950/40' : 'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Match header */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
        <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>{match.league}</span>
        </span>
        <div className="flex items-center space-x-2">
          {match.isLive ? (
            <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full font-bold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>{match.startTime}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{match.startTime}</span>
            </span>
          )}

          {/* Watch / Goal Alert Button */}
          <button
            onClick={() => onToggleWatch(match)}
            title={isWatched ? 'Disable goal alerts' : 'Enable live goal alerts'}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 transition ${
              isWatched 
                ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isWatched ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isWatched ? 'Watching' : 'Watch'}</span>
          </button>

          <button
            onClick={() => onOpenH2H(match)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            <span>H2H</span>
          </button>
          
          <button
            onClick={() => onOpenAI(match)}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tips</span>
          </button>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-5">
        <div className="flex items-center space-x-3">
          <img src={match.homeLogo} alt={match.homeTeam} className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700" onError={(e)=>{(e.target as any).src='https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=100&q=80'}} />
          <span className="font-bold text-white text-sm sm:text-base">{match.homeTeam}</span>
        </div>

        <div className="text-center">
          {match.isLive ? (
            <div className="inline-block px-3.5 py-1 bg-slate-950 border border-slate-800 rounded-xl font-black text-emerald-400 text-lg shadow-inner">
              {match.homeScore} - {match.awayScore}
            </div>
          ) : (
            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">VS</span>
          )}
        </div>

        <div className="flex items-center justify-start sm:justify-end space-x-3">
          <span className="font-bold text-white text-sm sm:text-base text-left sm:text-right">{match.awayTeam}</span>
          <img src={match.awayLogo} alt={match.awayTeam} className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700" onError={(e)=>{(e.target as any).src='https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=100&q=80'}} />
        </div>
      </div>

      {/* Odds Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => onSelectOdds(match, 'home')}
          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
            isHomeSelected 
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' 
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <span className="text-[11px] opacity-75 mb-0.5">1 (Home)</span>
          <span className="font-black text-base">{match.odds.home.toFixed(2)}</span>
        </button>

        <button
          onClick={() => onSelectOdds(match, 'draw')}
          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
            isDrawSelected 
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' 
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <span className="text-[11px] opacity-75 mb-0.5">X (Draw)</span>
          <span className="font-black text-base">{match.odds.draw.toFixed(2)}</span>
        </button>

        <button
          onClick={() => onSelectOdds(match, 'away')}
          className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
            isAwaySelected 
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40' 
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}
        >
          <span className="text-[11px] opacity-75 mb-0.5">2 (Away)</span>
          <span className="font-black text-base">{match.odds.away.toFixed(2)}</span>
        </button>
      </div>

    </div>
  );
};
