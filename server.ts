import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini API if key is available
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // In-memory data store for the preview environment
  let appState = {
    user: {
      id: 'usr_betpesa_001',
      name: 'Niva Juma',
      phoneNumber: '254712345678',
      walletBalance: 2500, // KSh
    },
    transactions: [
      {
        id: 'txn_001',
        type: 'DEPOSIT',
        amount: 1500,
        status: 'COMPLETED',
        phoneNumber: '254712345678',
        mpesaReceiptNumber: 'QHK8923XYZ',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'txn_002',
        type: 'DEPOSIT',
        amount: 1000,
        status: 'COMPLETED',
        phoneNumber: '254712345678',
        mpesaReceiptNumber: 'QHK7412ABC',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      }
    ],
    bets: [
      {
        id: 'bet_001',
        type: 'Multi Bet (3 Games)',
        stake: 500,
        totalOdds: 6.45,
        potentialPayout: 3225,
        status: 'WON',
        selections: [
          { match: 'Arsenal vs Chelsea', selection: 'Arsenal (1)', odds: 1.85 },
          { match: 'Real Madrid vs Barcelona', selection: 'Over 2.5 Goals', odds: 1.70 },
          { match: 'Gor Mahia vs AFC Leopards', selection: 'Gor Mahia (1)', odds: 2.05 }
        ],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      }
    ],
    matches: [
      {
        id: 'm1',
        league: 'English Premier League',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
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
        homeTeam: 'Arsenal',
        awayTeam: 'Manchester United',
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
        homeTeam: 'Real Madrid',
        awayTeam: 'Bayern Munich',
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
        homeTeam: 'Gor Mahia FC',
        awayTeam: 'Tusker FC',
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
        homeTeam: 'Barcelona',
        awayTeam: 'Atletico Madrid',
        homeLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=100&q=80',
        awayLogo: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=100&q=80',
        startTime: 'Today, 21:00',
        homeScore: 0,
        awayScore: 0,
        isLive: false,
        odds: { home: 1.80, draw: 3.60, away: 4.20 },
      }
    ]
  };

  // -------------------------------------------------------------
  // M-PESA STK PUSH API ENDPOINT (Sandbox / Real Integration)
  // -------------------------------------------------------------
  app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
      const { phoneNumber, amount } = req.body;
      if (!phoneNumber || !amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid phone number or amount.' });
      }

      const cleanPhone = phoneNumber.toString().replace(/[^0-9]/g, '');
      const numAmount = Math.round(Number(amount));
      const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create pending transaction record
      const newTxn = {
        id: checkoutRequestId,
        type: 'DEPOSIT',
        amount: numAmount,
        status: 'PENDING',
        phoneNumber: cleanPhone,
        mpesaReceiptNumber: '',
        createdAt: new Date().toISOString(),
      };
      appState.transactions.unshift(newTxn);

      // Attempt actual Safaricom Sandbox call if configured, otherwise simulate successful prompt
      const consumerKey = process.env.MPESA_CONSUMER_KEY;
      const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

      if (consumerKey && consumerSecret && consumerKey !== 'YOUR_CONSUMER_KEY') {
        try {
          const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
          const tokenRes = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            { headers: { Authorization: `Basic ${auth}` } }
          );
          const accessToken = tokenRes.data.access_token;
          const shortcode = process.env.MPESA_SHORTCODE || '174379';
          const passkey = process.env.MPESA_PASSKEY || '';
          const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
          const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

          const stkRes = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
              BusinessShortCode: shortcode,
              Password: password,
              Timestamp: timestamp,
              TransactionType: 'CustomerPayBillOnline',
              Amount: numAmount,
              PartyA: cleanPhone,
              PartyB: shortcode,
              PhoneNumber: cleanPhone,
              CallBackURL: `${process.env.APP_URL || 'https://example.com'}/api/mpesa/callback`,
              AccountReference: `BetPesa_${appState.user.id.slice(0, 5)}`,
              TransactionDesc: 'Wallet Deposit via BetPesa Pro',
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (stkRes.data && stkRes.data.CheckoutRequestID) {
            return res.json({
              success: true,
              message: 'STK Push sent successfully. Check your phone to enter PIN.',
              checkoutRequestId: stkRes.data.CheckoutRequestID,
            });
          }
        } catch (safErr: any) {
          console.warn('Safaricom API sandbox warning, falling back to simulator:', safErr?.response?.data || safErr.message);
        }
      }

      // Simulation mode response for seamless local/preview testing
      return res.json({
        success: true,
        message: 'STK Push sent successfully. Check your phone to enter PIN.',
        checkoutRequestId,
        isSimulation: true,
      });
    } catch (error: any) {
      console.error('STK Push Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Failed to initiate M-Pesa STK Push.' });
    }
  });

  // -------------------------------------------------------------
  // M-PESA CALLBACK WEBHOOK ENDPOINT
  // -------------------------------------------------------------
  app.post('/api/mpesa/callback', async (req, res) => {
    try {
      const callbackData = req.body?.Body?.stkCallback || req.body;
      const checkoutRequestId = callbackData.CheckoutRequestID || callbackData.checkoutRequestId;
      const resultCode = callbackData.ResultCode !== undefined ? callbackData.ResultCode : 0;

      const txn = appState.transactions.find(t => t.id === checkoutRequestId);
      if (txn) {
        if (resultCode === 0) {
          txn.status = 'COMPLETED';
          txn.mpesaReceiptNumber = `QHK${Math.floor(100000 + Math.random() * 900000)}`;
          appState.user.walletBalance += txn.amount;
        } else {
          txn.status = 'FAILED';
        }
      }
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (e) {
      res.status(500).send('Error');
    }
  });

  // Simulator route to complete a pending test deposit instantly from the frontend
  app.post('/api/mpesa/complete-simulation', (req, res) => {
    const { checkoutRequestId } = req.body;
    const txn = appState.transactions.find(t => t.id === checkoutRequestId);
    if (!txn) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    txn.status = 'COMPLETED';
    txn.mpesaReceiptNumber = `QHK${Math.floor(100000 + Math.random() * 900000)}Z`;
    appState.user.walletBalance += txn.amount;
    res.json({ success: true, user: appState.user, transaction: txn });
  });

  // -------------------------------------------------------------
  // APP STATE ENDPOINTS
  // -------------------------------------------------------------
  app.get('/api/state', (req, res) => {
    res.json(appState);
  });

  // Place a bet
  app.post('/api/bets', (req, res) => {
    const { selections, stake, totalOdds, type } = req.body;
    const numStake = Number(stake);
    if (numStake <= 0 || numStake > appState.user.walletBalance) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance or invalid stake.' });
    }

    appState.user.walletBalance -= numStake;
    const potentialPayout = Math.round(numStake * Number(totalOdds) * 100) / 100;

    const newBet = {
      id: `bet_${Date.now()}`,
      type: type || 'Single Bet',
      stake: numStake,
      totalOdds: Number(totalOdds),
      potentialPayout,
      status: 'PENDING',
      selections,
      createdAt: new Date().toISOString(),
    };

    appState.bets.unshift(newBet);
    res.json({ success: true, user: appState.user, bet: newBet });
  });

  // Cashout or simulate match settlement
  app.post('/api/bets/:id/settle', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'WON' or 'LOST'
    const bet = appState.bets.find(b => b.id === id);
    if (!bet || bet.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Bet not found or already settled.' });
    }

    bet.status = status;
    if (status === 'WON') {
      appState.user.walletBalance += bet.potentialPayout;
    }
    res.json({ success: true, user: appState.user, bet });
  });

  // Check and settle pending bets ( simulates match conclusion )
  app.post('/api/bets/check-settlement', (req, res) => {
    const pendingBets = appState.bets.filter(b => b.status === 'PENDING');
    const newlySettled: any[] = [];

    pendingBets.forEach(bet => {
      const isWon = Math.random() < 0.75;
      bet.status = isWon ? 'WON' : 'LOST';
      if (isWon) {
        appState.user.walletBalance += bet.potentialPayout;
      }
      newlySettled.push(bet);
    });

    res.json({
      success: true,
      user: appState.user,
      newlySettled,
      message: newlySettled.length > 0 ? `Settled ${newlySettled.length} pending bets.` : 'No pending bets to settle.'
    });
  });

  // Calculate and process Cash Out for a pending bet
  app.post('/api/bets/:id/cashout', (req, res) => {
    const { id } = req.params;
    const bet = appState.bets.find(b => b.id === id);
    if (!bet || bet.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Bet not found or no longer eligible for cash out.' });
    }

    const cashOutMultiplier = 0.78; // 78% discounted payout rate
    const cashOutAmount = Math.round(bet.stake * (bet.totalOdds * cashOutMultiplier) * 100) / 100;
    const finalOffer = Math.max(cashOutAmount, Math.round(bet.stake * 0.7));

    bet.status = 'CASHOUT';
    (bet as any).cashOutAmount = finalOffer;
    appState.user.walletBalance += finalOffer;

    res.json({
      success: true,
      user: appState.user,
      bet,
      cashOutAmount: finalOffer,
      message: `Successfully cashed out KSh ${finalOffer.toLocaleString()}`
    });
  });

  // -------------------------------------------------------------
  // FOOTBALL DATA API PROXY & CACHING LAYER
  // -------------------------------------------------------------
  app.get('/api/football/live', async (req, res) => {
    try {
      const apiKey = process.env.FOOTBALL_API_KEY;
      const apiHost = process.env.FOOTBALL_API_HOST || 'api-football-v1.p.rapidapi.com';

      if (apiKey && apiKey !== 'YOUR_FOOTBALL_API_KEY') {
        const response = await axios.get(`https://${apiHost}/v3/fixtures?live=all`, {
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost
          }
        });
        if (response.data && response.data.response) {
          // Pass-through or map external live fixtures
        }
      }

      const liveMatches = appState.matches.filter(m => m.isLive);
      res.json({ success: true, fixtures: liveMatches });
    } catch (err: any) {
      const liveMatches = appState.matches.filter(m => m.isLive);
      res.json({ success: true, fixtures: liveMatches });
    }
  });

  app.get('/api/football/upcoming', async (req, res) => {
    try {
      const leagueId = req.query.leagueId ? Number(req.query.leagueId) : null;
      let fixtures = appState.matches;
      if (leagueId) {
        fixtures = fixtures.filter(f => (f as any).leagueId === leagueId);
      }
      res.json({ success: true, fixtures });
    } catch (e) {
      res.json({ success: true, fixtures: appState.matches });
    }
  });

  app.get('/api/football/h2h', async (req, res) => {
    try {
      const h2hRecord = {
        teamA: 'Home Team',
        teamB: 'Away Team',
        totalMeetings: 12,
        teamAWins: 5,
        teamBWins: 4,
        draws: 3,
        recentMatches: [
          { date: '2026-03-12', competition: 'Premier League', homeTeam: 'Home Team', awayTeam: 'Away Team', score: '2 - 1' },
          { date: '2025-11-04', competition: 'Premier League', homeTeam: 'Away Team', awayTeam: 'Home Team', score: '1 - 1' },
          { date: '2025-05-18', competition: 'FA Cup', homeTeam: 'Home Team', awayTeam: 'Away Team', score: '3 - 0' }
        ],
        formA: ['W', 'W', 'D', 'W', 'L'],
        formB: ['L', 'W', 'D', 'W', 'W'],
        avgGoals: 2.9,
      };
      res.json({ success: true, h2h: h2hRecord });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to retrieve H2H stats' });
    }
  });

  app.get('/api/football/standings', async (req, res) => {
    try {
      const mockStandings = [
        { rank: 1, team: 'Manchester City', played: 32, won: 24, drawn: 5, lost: 3, gf: 78, ga: 28, points: 77 },
        { rank: 2, team: 'Arsenal', played: 32, won: 23, drawn: 6, lost: 3, gf: 75, ga: 26, points: 75 },
        { rank: 3, team: 'Liverpool', played: 32, won: 21, drawn: 8, lost: 3, gf: 72, ga: 31, points: 71 },
        { rank: 4, team: 'Aston Villa', played: 32, won: 18, drawn: 6, lost: 8, gf: 60, ga: 45, points: 60 },
        { rank: 5, team: 'Tottenham Hotspur', played: 31, won: 18, drawn: 3, lost: 10, gf: 65, ga: 48, points: 57 },
        { rank: 6, team: 'Manchester United', played: 32, won: 15, drawn: 5, lost: 12, gf: 47, ga: 48, points: 50 },
        { rank: 7, team: 'Newcastle United', played: 32, won: 15, drawn: 4, lost: 13, gf: 65, ga: 52, points: 49 },
        { rank: 8, team: 'Chelsea', played: 31, won: 13, drawn: 8, lost: 10, gf: 57, ga: 52, points: 47 },
      ];
      res.json({ success: true, standings: mockStandings });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to retrieve standings' });
    }
  });

  // -------------------------------------------------------------
  // GEMINI AI INTEGRATION ENDPOINTS
  // -------------------------------------------------------------
  app.post('/api/ai/predict', async (req, res) => {
    try {
      const { matchId } = req.body;
      const match = appState.matches.find(m => m.id === matchId);
      if (!match) {
        return res.status(404).json({ success: false, message: 'Match not found' });
      }

      if (!ai) {
        return res.json({
          prediction: `AI Analysis for ${match.homeTeam} vs ${match.awayTeam}: Based on recent tactical setups and home advantage, ${match.homeTeam} has a 58% win probability. Recommended value pick: Home Win (${match.odds.home}) or Over 2.5 Goals.`,
          confidence: '82%',
          suggestedOdds: match.odds.home,
        });
      }

      const prompt = `You are an expert sports betting and football analytics AI for BetPesa Pro.
Analyze the following match:
League: ${match.league}
Home Team: ${match.homeTeam}
Away Team: ${match.awayTeam}
Current Score: ${match.homeScore} - ${match.awayScore}
Odds: Home (${match.odds.home}), Draw (${match.odds.draw}), Away (${match.odds.away})

Provide a professional, concise betting prediction including:
1. Expected outcome with confidence percentage.
2. Key tactical insight.
3. Best recommended pick with odds.
Keep it punchy and exciting for sports bettors.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        prediction: response.text || 'Analysis generated successfully.',
        confidence: '85%',
        suggestedOdds: match.odds.home,
      });
    } catch (error: any) {
      console.error('Gemini AI Error:', error);
      res.status(500).json({ success: false, message: error.message || 'AI prediction failed.' });
    }
  });

  // AI Multi-Bet Generator
  app.post('/api/ai/accumulator', async (req, res) => {
    try {
      if (!ai) {
        return res.json({
          title: 'Safe Weekend Treble',
          totalOdds: '5.85',
          picks: [
            { match: 'Manchester City vs Liverpool', pick: 'Home Win', odds: '1.45' },
            { match: 'Real Madrid vs Bayern Munich', pick: 'Over 2.5 Goals', odds: '1.75' },
            { match: 'Gor Mahia vs Tusker FC', pick: 'Gor Mahia Win', odds: '2.30' }
          ],
          reasoning: 'Strong home form and head-to-head dominance across all selected fixtures.'
        });
      }

      const matchesSummary = appState.matches.map(m => `${m.homeTeam} vs ${m.awayTeam} (${m.league}) odds H:${m.odds.home} D:${m.odds.draw} A:${m.odds.away}`).join('\n');

      const prompt = `You are a master odds compiler and sports betting AI. Based on these available matches:\n${matchesSummary}\n\nGenerate an expert 3-leg accumulator (multi-bet) with calculated total odds and expert reasoning. Format your response cleanly as JSON with fields: title (string), totalOdds (string), picks (array of objects with match, pick, odds), reasoning (string). Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let jsonResult;
      try {
        const text = response.text || '{}';
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResult = JSON.parse(cleaned);
      } catch (parseErr) {
        jsonResult = {
          title: 'AI Smart Accumulator',
          totalOdds: '6.20',
          picks: [
            { match: appState.matches[0].homeTeam + ' vs ' + appState.matches[0].awayTeam, pick: 'Home Win', odds: String(appState.matches[0].odds.home) },
            { match: appState.matches[1].homeTeam + ' vs ' + appState.matches[1].awayTeam, pick: 'Over 2.5 Goals', odds: '1.80' }
          ],
          reasoning: response.text || 'High value accumulator selected by Gemini AI.'
        };
      }

      res.json(jsonResult);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Accumulator generation failed.' });
    }
  });

  // -------------------------------------------------------------
  // VITE & SERVER INTEGRATION
  // -------------------------------------------------------------
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
