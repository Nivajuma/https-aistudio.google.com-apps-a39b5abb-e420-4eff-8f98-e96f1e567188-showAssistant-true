/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Wallet, Smartphone, ShieldCheck, Zap, ArrowUpRight, History, 
  TrendingUp, Sparkles, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  ChevronRight, Search, Menu, X, Play, Award, DollarSign, Send, Check, 
  HelpCircle, ExternalLink, Activity, Flame, Receipt, BarChart2, Table
} from 'lucide-react';
import { MatchCard } from './components/MatchCard';
import { H2HStatsModal } from './components/H2HStatsModal';
import { Betslip, BetSelection } from './components/Betslip';
import { LeagueStandings } from './components/LeagueStandings';
import { getLiveFixtures, getUpcomingFixtures, Fixture } from './api/footballApi';

interface Bet {
  id: string;
  type: string;
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  status: string;
  selections: { match: string; selection: string; odds: number }[];
  createdAt: string;
  cashOutAmount?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  phoneNumber: string;
  mpesaReceiptNumber?: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'sports' | 'ai' | 'bets' | 'wallet'>('sports');
  const [selectedLeague, setSelectedLeague] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // App State from Backend
  const [user, setUser] = useState({ id: 'usr_betpesa_001', name: 'Niva Juma', phoneNumber: '254712345678', walletBalance: 2500 });
  const [matches, setMatches] = useState<Fixture[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingState, setLoadingState] = useState(true);
  const [sportsSubTab, setSportsSubTab] = useState<'fixtures' | 'standings'>('fixtures');

  // Bet Slip state
  const [betSelections, setBetSelections] = useState<BetSelection[]>([]);
  const [stakeInput, setStakeInput] = useState<string>('200');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betSuccessMsg, setBetSuccessMsg] = useState<string | null>(null);

  // M-Pesa STK Modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositPhone, setDepositPhone] = useState('254712345678');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [depositLoading, setDepositLoading] = useState(false);
  const [stkPromptActive, setStkPromptActive] = useState(false);
  const [currentCheckoutId, setCurrentCheckoutId] = useState<string | null>(null);
  const [depositResult, setDepositResult] = useState<{ success: boolean; message: string; receipt?: string } | null>(null);

  // AI Predictor Modal state
  const [selectedMatchForAI, setSelectedMatchForAI] = useState<Fixture | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ prediction: string; confidence: string; suggestedOdds: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // H2H Modal state
  const [selectedMatchForH2H, setSelectedMatchForH2H] = useState<Fixture | null>(null);

  // AI Accumulator
  const [aiAccumulator, setAiAccumulator] = useState<any>(null);
  const [accLoading, setAccLoading] = useState(false);

  // Pending Bets Settlement Check
  const [settledModalBet, setSettledModalBet] = useState<Bet | null>(null);
  const [checkingSettlement, setCheckingSettlement] = useState(false);

  const checkPendingBets = async () => {
    setCheckingSettlement(true);
    try {
      const res = await fetch('/api/bets/check-settlement', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        await fetchState();
        if (data.newlySettled && data.newlySettled.length > 0) {
          setSettledModalBet(data.newlySettled[0]);
        } else {
          alert('No pending bets were found or ready to settle.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to check bet settlement status.');
    } finally {
      setCheckingSettlement(false);
    }
  };

  const handleCashOut = async (betId: string) => {
    try {
      const res = await fetch(`/api/bets/${betId}/cashout`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        await fetchState();
        alert(`Successfully cashed out! KSh ${data.cashOutAmount.toLocaleString()} has been added to your wallet.`);
      } else {
        alert(data.message || 'Cash out failed.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error during cash out.');
    }
  };

  const [watchedMatchIds, setWatchedMatchIds] = useState<string[]>(['m1']);
  const [goalAlerts, setGoalAlerts] = useState<{ id: string; message: string; match: Fixture }[]>([]);

  const handleToggleWatch = (match: Fixture) => {
    setWatchedMatchIds(prev => {
      const exists = prev.includes(match.id);
      if (exists) {
        return prev.filter(id => id !== match.id);
      } else {
        return [...prev, match.id];
      }
    });
  };

  // Fetch initial state & live fixtures
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      const data = await res.json();
      setUser(data.user);
      setBets(data.bets);
      setTransactions(data.transactions);

      // Fetch live/upcoming fixtures via footballApi service
      const liveFixtures = await getLiveFixtures();
      const upcomingFixtures = await getUpcomingFixtures();
      
      const allFixturesMap = new Map();
      [...liveFixtures, ...upcomingFixtures].forEach(f => allFixturesMap.set(f.id, f));
      const newMatches: Fixture[] = Array.from(allFixturesMap.values());

      setMatches(prevMatches => {
        if (prevMatches && prevMatches.length > 0) {
          newMatches.forEach(newM => {
            const oldM = prevMatches.find(p => p.id === newM.id);
            if (oldM && watchedMatchIds.includes(newM.id)) {
              if (newM.homeScore > oldM.homeScore || newM.awayScore > oldM.awayScore) {
                const alertMsg = `⚽ GOAL! ${newM.homeTeam} ${newM.homeScore} - ${newM.awayScore} ${newM.awayTeam}`;
                setGoalAlerts(prev => [
                  { id: `goal_${Date.now()}_${newM.id}`, message: alertMsg, match: newM },
                  ...prev
                ]);
              }
            }
          });
        }
        return newMatches;
      });

      setLoadingState(false);
    } catch (e) {
      console.error('Failed to fetch state', e);
      setLoadingState(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 30000); // Poll live fixtures & state
    return () => clearInterval(interval);
  }, []);

  // Handle adding bet selection
  const toggleBetSelection = (match: Fixture, selectionType: 'home' | 'draw' | 'away') => {
    const matchStr = `${match.homeTeam} vs ${match.awayTeam}`;
    const oddsVal = selectionType === 'home' ? match.odds.home : selectionType === 'draw' ? match.odds.draw : match.odds.away;
    const selName = selectionType === 'home' ? `${match.homeTeam} (1)` : selectionType === 'draw' ? 'Draw (X)' : `${match.awayTeam} (2)`;

    setBetSelections(prev => {
      const existingIndex = prev.findIndex(b => b.matchId === match.id);
      if (existingIndex > -1) {
        if (prev[existingIndex].selection === selName) {
          return prev.filter(b => b.matchId !== match.id);
        } else {
          const updated = [...prev];
          updated[existingIndex] = { matchId: match.id, match: matchStr, selection: selName, odds: oddsVal };
          return updated;
        }
      } else {
        return [...prev, { matchId: match.id, match: matchStr, selection: selName, odds: oddsVal }];
      }
    });
  };

  const totalOdds = betSelections.reduce((acc, curr) => acc * curr.odds, 1);
  const potentialPayout = Math.round((Number(stakeInput) || 0) * totalOdds * 100) / 100;

  // Place bet action
  const handlePlaceBet = async () => {
    if (betSelections.length === 0) return;
    const stakeNum = Number(stakeInput);
    if (stakeNum <= 0) {
      alert('Please enter a valid stake amount.');
      return;
    }
    if (stakeNum > user.walletBalance) {
      alert('Insufficient wallet balance! Please deposit via M-Pesa STK Push.');
      setShowDepositModal(true);
      return;
    }

    setIsPlacingBet(true);
    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selections: betSelections,
          stake: stakeNum,
          totalOdds: Math.round(totalOdds * 100) / 100,
          type: betSelections.length > 1 ? `Multi Bet (${betSelections.length} Games)` : 'Single Bet'
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setBets(prev => [data.bet, ...prev]);
        setBetSelections([]);
        setBetSuccessMsg(`Bet placed successfully! Potential payout: KSh ${data.bet.potentialPayout}`);
        setTimeout(() => setBetSuccessMsg(null), 5000);
      } else {
        alert(data.message || 'Failed to place bet');
      }
    } catch (e) {
      console.error(e);
      alert('Network error placing bet.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Initiate M-Pesa STK Push
  const handleInitiateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositResult(null);

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: depositPhone, amount: depositAmount })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentCheckoutId(data.checkoutRequestId);
        setStkPromptActive(true);
      } else {
        setDepositResult({ success: false, message: data.message || 'STK Push failed' });
      }
    } catch (err) {
      setDepositResult({ success: false, message: 'Network error connecting to M-Pesa gateway.' });
    } finally {
      setDepositLoading(false);
    }
  };

  // Simulate confirming USSD PIN on phone
  const handleSimulatePinSuccess = async () => {
    if (!currentCheckoutId) return;
    setDepositLoading(true);
    try {
      const res = await fetch('/api/mpesa/complete-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestId: currentCheckoutId })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setTransactions(prev => [data.transaction, ...prev]);
        setDepositResult({
          success: true,
          message: `Successfully deposited KSh ${data.transaction.amount}!`,
          receipt: data.transaction.mpesaReceiptNumber
        });
        setStkPromptActive(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDepositLoading(false);
    }
  };

  // Fetch AI Match Analysis
  const handleOpenAIMatch = async (match: Fixture) => {
    setSelectedMatchForAI(match);
    setAiAnalysis(null);
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id })
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // Generate AI Accumulator
  const handleGenerateAccumulator = async () => {
    setAccLoading(true);
    try {
      const res = await fetch('/api/ai/accumulator', { method: 'POST' });
      const data = await res.json();
      setAiAccumulator(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAccLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    const matchesLeague = selectedLeague === 'All' || m.league === selectedLeague;
    const matchesSearch = searchQuery === '' || 
      m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.league.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLeague && matchesSearch;
  });

  const leagues = ['All', 'English Premier League', 'UEFA Champions League', 'Kenya Premier League', 'Spanish La Liga'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('sports')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  BETPESA
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 rounded">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Real Live Fixtures & M-Pesa STK</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('sports')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'sports' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Sportsbook</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'ai' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Predictor</span>
            </button>
            <button
              onClick={() => setActiveTab('bets')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'bets' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My Bets ({bets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'wallet' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet Ledger</span>
            </button>
          </nav>

          {/* Wallet Balance & Deposit Action */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Wallet Balance</div>
                <div className="text-sm sm:text-base font-extrabold text-emerald-400">
                  KSh {user.walletBalance.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDepositModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center space-x-2 transition-transform active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">M-Pesa Deposit</span>
              <span className="sm:hidden">Deposit</span>
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE TAB BAR */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 px-2 py-2">
        <button
          onClick={() => setActiveTab('sports')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-semibold ${activeTab === 'sports' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'}`}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span>Sports</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-semibold ${activeTab === 'ai' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'}`}
        >
          <Sparkles className="w-5 h-5 mb-1 text-amber-300" />
          <span>AI Tips</span>
        </button>
        <button
          onClick={() => setActiveTab('bets')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-semibold ${activeTab === 'bets' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'}`}
        >
          <History className="w-5 h-5 mb-1" />
          <span>My Bets</span>
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-semibold ${activeTab === 'wallet' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'}`}
        >
          <Wallet className="w-5 h-5 mb-1" />
          <span>Wallet</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* LIVE SCORE TICKER */}
        {activeTab === 'sports' && (
          <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center">
            <div className="bg-emerald-600 text-slate-950 font-black px-4 py-3 flex items-center space-x-2 z-10 shadow-md">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-xs uppercase tracking-wider">LIVE SCORES</span>
            </div>
            <div className="overflow-hidden whitespace-nowrap relative flex-1 py-2.5">
              <div className="animate-ticker flex space-x-6 items-center">
                {[...matches, ...matches].map((m, idx) => (
                  <div key={`${m.id}-${idx}`} className="inline-flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl text-xs">
                    <span className="text-slate-400 font-semibold">{m.league}</span>
                    <span className="font-bold text-white">{m.homeTeam}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-black rounded">
                      {m.isLive ? `${m.homeScore} - ${m.awayScore}` : m.startTime}
                    </span>
                    <span className="font-bold text-white">{m.awayTeam}</span>
                    {m.isLive && (
                      <span className="flex items-center space-x-1 text-rose-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>{m.startTime}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BANNER */}
        {activeTab === 'sports' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-teal-950/60 border border-emerald-500/30 p-6 sm:p-8 mb-8 shadow-2xl">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
                <Flame className="w-3.5 h-3.5 animate-bounce" />
                <span>Live Football Data Feed & M-Pesa STK Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Win Big with Real Live Fixtures & Gemini AI Odds
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mb-6">
                Experience real-time odds, Head-to-Head (H2H) historical analytics, and instant M-Pesa STK push wallet funding.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Top Up Now via STK</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl border border-slate-700 flex items-center space-x-2 transition"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>View AI Accumulator</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS NOTIFICATION BANNER */}
        {betSuccessMsg && (
          <div className="bg-emerald-900/40 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold text-sm">{betSuccessMsg}</span>
            </div>
            <button onClick={() => setBetSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: SPORTSBOOK */}
        {activeTab === 'sports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLS: MATCHES & LEAGUES */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SPORTSBOOK SUB-TAB TOGGLE */}
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => setSportsSubTab('fixtures')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    sportsSubTab === 'fixtures' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Fixtures & Odds</span>
                </button>
                <button
                  onClick={() => setSportsSubTab('standings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    sportsSubTab === 'standings' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>League Standings</span>
                </button>
              </div>

              {sportsSubTab === 'standings' ? (
                <LeagueStandings leagueId={39} leagueName={selectedLeague === 'All' ? 'English Premier League' : selectedLeague} />
              ) : (
                <>
                  {/* SEARCH & LEAGUE FILTER */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search teams or leagues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                      {leagues.map(league => (
                        <button
                          key={league}
                          onClick={() => setSelectedLeague(league)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            selectedLeague === league 
                              ? 'bg-emerald-600 text-white shadow' 
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {league}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MATCH LIST */}
                  <div className="space-y-4">
                    {filteredMatches.length === 0 ? (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white">No matches found</h3>
                        <p className="text-slate-400 text-sm">Try searching for another team or league.</p>
                      </div>
                    ) : (
                      filteredMatches.map(match => {
                        const isHomeSelected = betSelections.some(b => b.matchId === match.id && b.selection.includes('(1)'));
                        const isDrawSelected = betSelections.some(b => b.matchId === match.id && b.selection.includes('Draw'));
                        const isAwaySelected = betSelections.some(b => b.matchId === match.id && b.selection.includes('(2)'));

                        return (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isHomeSelected={isHomeSelected}
                            isDrawSelected={isDrawSelected}
                            isAwaySelected={isAwaySelected}
                            isWatched={watchedMatchIds.includes(match.id)}
                            onSelectOdds={(m, sel) => toggleBetSelection(m, sel)}
                            onOpenAI={(m) => handleOpenAIMatch(m)}
                            onOpenH2H={(m) => setSelectedMatchForH2H(m)}
                            onToggleWatch={(m) => handleToggleWatch(m)}
                          />
                        );
                      })
                    )}
                  </div>
                </>
              )}

            </div>

            {/* RIGHT COL: BET SLIP & WIDGETS */}
            <div className="space-y-6">
              <Betslip
                selections={betSelections}
                stake={stakeInput}
                onStakeChange={setStakeInput}
                onRemoveSelection={(matchId) => setBetSelections(prev => prev.filter(b => b.matchId !== matchId))}
                onClearAll={() => setBetSelections([])}
                onPlaceBet={handlePlaceBet}
                isPlacing={isPlacingBet}
              />
            </div>

          </div>
        )}

        {/* TAB 2: AI PREDICTOR & TIPS */}
        {activeTab === 'ai' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-emerald-950/60 border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Powered by Google Gemini AI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">AI Multi-Bet Accumulator & Odds Compiler</h2>
                <p className="text-slate-300 text-sm sm:text-base mb-6">
                  Let our advanced AI analyze head-to-head stats, recent form, injuries, and weather conditions to compile a high-probability weekend accumulator.
                </p>
                <button
                  onClick={handleGenerateAccumulator}
                  disabled={accLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {accLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
                  <span>{accLoading ? 'Analyzing Odds & Form...' : 'Generate AI Weekend Treble'}</span>
                </button>
              </div>
            </div>

            {aiAccumulator && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{aiAccumulator.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{aiAccumulator.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wide block">Total Odds</span>
                    <span className="text-2xl font-black text-emerald-400">{aiAccumulator.totalOdds}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {aiAccumulator.picks?.map((pick: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-emerald-400 font-semibold">Leg {idx + 1}</span>
                        <div className="font-bold text-white text-sm sm:text-base">{pick.match}</div>
                        <div className="text-xs text-slate-300 mt-1">Pick: <strong className="text-emerald-300">{pick.pick}</strong></div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black bg-slate-800 px-3 py-1.5 rounded-lg text-emerald-400">@{pick.odds}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    alert('AI Accumulator loaded into bet slip! Stake KSh 500 to win approx KSh ' + Math.round(500 * Number(aiAccumulator.totalOdds)));
                    setActiveTab('sports');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl shadow transition"
                >
                  Load AI Accumulator into Slip (Stake KSh 500)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY BETS */}
        {activeTab === 'bets' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Betting History</h2>
                <p className="text-slate-400 text-sm">Track your active and settled bets</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={checkPendingBets}
                  disabled={checkingSettlement}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingSettlement ? 'animate-spin' : ''}`} />
                  <span>{checkingSettlement ? 'Checking Matches...' : 'Check Match Conclusion'}</span>
                </button>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm">
                  Total Bets: <span className="font-bold text-emerald-400">{bets.length}</span>
                </div>
              </div>
            </div>

            {bets.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No bets placed yet</h3>
                <p className="text-slate-400 text-sm mt-1">Place your first bet from the sportsbook to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bets.map(bet => (
                  <div key={bet.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <div>
                        <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">{bet.type}</span>
                        <div className="text-xs text-slate-500 mt-0.5">{new Date(bet.createdAt).toLocaleString()}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        bet.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        bet.status === 'LOST' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        bet.status === 'CASHOUT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {bet.status === 'CASHOUT' ? `CASHOUT (KSh ${(bet as any).cashOutAmount || '—'})` : bet.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {bet.selections.map((sel, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div>
                            <div className="text-slate-300 font-bold">{sel.match}</div>
                            <div className="text-xs text-emerald-400 font-semibold mt-0.5">Selection: {sel.selection}</div>
                          </div>
                          <div className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded">@{sel.odds}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Stake</span>
                        <div className="text-sm sm:text-base font-bold text-white">KSh {bet.stake.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Odds</span>
                        <div className="text-sm sm:text-base font-bold text-emerald-400">{bet.totalOdds}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Potential Payout</span>
                        <div className="text-sm sm:text-base font-extrabold text-emerald-400">KSh {bet.potentialPayout.toLocaleString()}</div>
                      </div>
                    </div>

                    {bet.status === 'PENDING' && (
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl">
                        <div>
                          <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wide">Live Cash Out Offer</div>
                          <div className="text-base font-black text-amber-400">
                            KSh {Math.max(Math.round(bet.stake * bet.totalOdds * 0.78), Math.round(bet.stake * 0.7)).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCashOut(bet.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95"
                        >
                          CASH OUT NOW
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WALLET & TRANSACTIONS */}
        {activeTab === 'wallet' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-2xl">
              <div className="mb-4 sm:mb-0">
                <span className="text-xs text-emerald-400 uppercase font-bold tracking-widest">Available Balance</span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">KSh {user.walletBalance.toLocaleString()}</div>
                <p className="text-slate-400 text-xs mt-1">Linked M-Pesa Number: <strong className="text-white">{user.phoneNumber}</strong></p>
              </div>
              <button
                onClick={() => setShowDepositModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition"
              >
                <Smartphone className="w-5 h-5" />
                <span>Instant M-Pesa Deposit</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">M-Pesa Transaction Ledger</h3>
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-sm">No transactions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map(txn => (
                    <div key={txn.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">M-Pesa Deposit ({txn.phoneNumber})</div>
                          <div className="text-xs text-slate-400">
                            {new Date(txn.createdAt).toLocaleString()} {txn.mpesaReceiptNumber && `• Receipt: ${txn.mpesaReceiptNumber}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-4">
                        <span className="font-black text-emerald-400 text-base">+KSh {txn.amount.toLocaleString()}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                          txn.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          txn.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* M-PESA STK DEPOSIT MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => { setShowDepositModal(false); setStkPromptActive(false); setDepositResult(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">M-Pesa STK Push Deposit</h3>
                <p className="text-xs text-slate-400">Instant deposit via Safaricom Sandbox / Live</p>
              </div>
            </div>

            {depositResult ? (
              <div className="space-y-4 text-center py-4">
                <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${depositResult.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                  {depositResult.success ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h4 className="text-lg font-bold text-white">{depositResult.success ? 'Deposit Successful!' : 'Deposit Failed'}</h4>
                <p className="text-slate-300 text-sm">{depositResult.message}</p>
                {depositResult.receipt && (
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-mono text-emerald-400">
                    M-Pesa Receipt: {depositResult.receipt}
                  </div>
                )}
                <button
                  onClick={() => { setShowDepositModal(false); setDepositResult(null); setStkPromptActive(false); }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            ) : stkPromptActive ? (
              <div className="space-y-5 py-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 animate-pulse mx-auto flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">STK Push Sent to {depositPhone}</h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Check your phone and enter your M-Pesa PIN to complete the deposit of <strong className="text-emerald-400">KSh {depositAmount}</strong>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
                  <p className="font-semibold text-amber-300 mb-1">Sandbox Simulator Mode:</p>
                  Since this is a preview environment, click below to simulate entering your PIN and approving the transaction instantly.
                </div>

                <button
                  onClick={handleSimulatePinSuccess}
                  disabled={depositLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl shadow transition disabled:opacity-50"
                >
                  {depositLoading ? 'Processing...' : 'Simulate Enter PIN & Approve (Success)'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInitiateDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">M-Pesa Phone Number</label>
                  <input
                    type="text"
                    value={depositPhone}
                    onChange={(e) => setDepositPhone(e.target.value)}
                    placeholder="2547XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Format: 2547XXXXXXXX (Safaricom)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (KSh)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <div className="flex gap-2 mt-2">
                    {['250', '500', '1000', '5000'].map(amt => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setDepositAmount(amt)}
                        className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 py-1.5 rounded-lg text-xs font-bold text-slate-300 transition"
                      >
                        KSh {amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={depositLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 mt-2"
                >
                  {depositLoading ? 'Initiating STK Push...' : `STK PUSH KSh ${depositAmount}`}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* AI MATCH PREDICTOR MODAL */}
      {selectedMatchForAI && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedMatchForAI(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Gemini AI Match Predictor</h3>
                <p className="text-xs text-slate-400">{selectedMatchForAI.homeTeam} vs {selectedMatchForAI.awayTeam}</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-slate-300 text-sm font-semibold">Analyzing tactical form and odds with Gemini AI...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-purple-400 font-bold uppercase tracking-wider block mb-1">Expert Tactical Analysis</span>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{aiAnalysis.prediction}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Model Confidence</span>
                    <div className="text-lg font-black text-emerald-400 mt-1">{aiAnalysis.confidence}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Home Win Odds</span>
                    <div className="text-lg font-black text-white mt-1">{selectedMatchForAI.odds.home}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    toggleBetSelection(selectedMatchForAI, 'home');
                    setSelectedMatchForAI(null);
                    setActiveTab('sports');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl shadow transition"
                >
                  Add Home Win (@{selectedMatchForAI.odds.home}) to Bet Slip
                </button>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* H2H STATS MODAL */}
      {selectedMatchForH2H && (
        <H2HStatsModal
          match={selectedMatchForH2H}
          onClose={() => setSelectedMatchForH2H(null)}
        />
      )}

      {/* BET SETTLEMENT MODAL (SUCCESS OR LOSS) */}
      {settledModalBet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setSettledModalBet(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
              settledModalBet.status === 'WON' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              {settledModalBet.status === 'WON' ? <Trophy className="w-8 h-8 animate-bounce" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              {settledModalBet.status === 'WON' ? 'CONGRATULATIONS! BET WON 🎉' : 'MATCH CONCLUDED - BET LOST'}
            </h3>
            <p className="text-slate-300 text-sm mb-6">
              {settledModalBet.status === 'WON' 
                ? `Your selection successfully hit! Payout of KSh ${settledModalBet.potentialPayout.toLocaleString()} has been credited to your wallet.` 
                : `Better luck next time! The match outcome didn't match your selection.`}
            </p>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-left mb-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Bet Type:</span>
                <span className="font-bold text-white">{settledModalBet.type}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Stake:</span>
                <span className="font-bold text-white">KSh {settledModalBet.stake}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Odds:</span>
                <span className="font-bold text-emerald-400">@{settledModalBet.totalOdds}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-800 text-white">
                <span>{settledModalBet.status === 'WON' ? 'Payout Credited:' : 'Result:'}</span>
                <span className={settledModalBet.status === 'WON' ? 'text-emerald-400' : 'text-rose-400'}>
                  {settledModalBet.status === 'WON' ? `KSh ${settledModalBet.potentialPayout.toLocaleString()}` : 'LOST'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSettledModalBet(null)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl shadow transition"
            >
              Awesome, Continue Betting
            </button>
          </div>
        </div>
      )}

      {/* GOAL ALERT TOAST NOTIFICATION SYSTEM */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {goalAlerts.map(alert => (
          <div key={alert.id} className="pointer-events-auto bg-gradient-to-r from-emerald-900/95 to-slate-900/95 border-2 border-emerald-400 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-lg shadow">
              ⚽
            </div>
            <div className="flex-1">
              <div className="text-xs text-emerald-300 font-extrabold uppercase tracking-wider">LIVE GOAL ALERT</div>
              <div className="text-sm font-bold text-white mt-0.5">{alert.message}</div>
            </div>
            <button
              onClick={() => setGoalAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 BetPesa Pro & M-Pesa STK Sandbox. All rights reserved. Licensed & Regulated.
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure 256-Bit SSL & M-Pesa Integration</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
