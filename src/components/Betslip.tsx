/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, X, Receipt } from 'lucide-react';

export interface BetSelection {
  matchId: string;
  match: string;
  selection: string;
  odds: number;
}

interface BetslipProps {
  selections: BetSelection[];
  stake: string;
  onStakeChange: (val: string) => void;
  onRemoveSelection: (matchId: string) => void;
  onClearAll: () => void;
  onPlaceBet: () => void;
  isPlacing: boolean;
}

export const Betslip: React.FC<BetslipProps> = ({
  selections,
  stake,
  onStakeChange,
  onRemoveSelection,
  onClearAll,
  onPlaceBet,
  isPlacing,
}) => {
  const totalOdds = selections.reduce((acc, curr) => acc * curr.odds, 1);
  const potentialPayout = Math.round((Number(stake) || 0) * totalOdds * 100) / 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-24">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <h2 className="font-extrabold text-white text-base">Bet Slip</h2>
        </div>
        {selections.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            Clear All
          </button>
        )}
      </div>

      {selections.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Your bet slip is empty</p>
          <p className="text-slate-500 text-xs mt-1">Tap on any odds from the live fixtures to add selections.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
            {selections.map(sel => (
              <div key={sel.matchId} className="bg-slate-950 border border-slate-800 rounded-xl p-3 relative">
                <button
                  onClick={() => onRemoveSelection(sel.matchId)}
                  className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-xs text-slate-400 mb-1 font-medium">{sel.match}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">{sel.selection}</span>
                  <span className="font-extrabold text-white text-sm bg-slate-800 px-2.5 py-0.5 rounded">@{sel.odds.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Selections:</span>
              <span className="font-bold text-white">{selections.length}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Odds:</span>
              <span className="font-bold text-emerald-400">{totalOdds.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Stake (KSh)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">KSh</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => onStakeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {['100', '500', '1000', '2500'].map(amt => (
                  <button
                    key={amt}
                    onClick={() => onStakeChange(amt)}
                    className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 py-1 rounded-lg text-xs font-bold text-slate-300 transition"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex justify-between items-center">
              <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Potential Payout</span>
              <span className="text-lg font-black text-emerald-400">KSh {potentialPayout.toLocaleString()}</span>
            </div>

            <button
              onClick={onPlaceBet}
              disabled={isPlacing}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isPlacing ? 'Placing Bet...' : 'PLACE BET NOW'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
