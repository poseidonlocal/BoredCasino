import { verifyToken } from '../../../lib/auth';
import { GameLogger } from '../../../lib/gameLogger';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const { gameType, betType, betAmount, result, payout, details } = req.body;

    // Validate required fields
    if (!gameType || !betAmount || !result || payout === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: gameType, betAmount, result, payout' 
      });
    }

    // Validate result
    if (!['win', 'loss'].includes(result)) {
      return res.status(400).json({ message: 'Result must be "win" or "loss"' });
    }

    // Validate amounts
    if (betAmount <= 0 || payout < 0) {
      return res.status(400).json({ message: 'Invalid bet amount or payout' });
    }

    // Calculate profit
    const profit = payout - betAmount;

    // Create game data object
    const gameData = {
      gameType,
      betType: betType || 'Standard',
      betAmount,
      result,
      payout,
      profit,
      details: details || ''
    };

    // Log the game result
    const gameId = await GameLogger.logGameResult(user.id, gameData);

    return res.status(200).json({
      message: 'Game result logged successfully',
      gameId,
      profit,
      xpGained: Math.max(10, result === 'win' ? 35 : 10) // Approximate XP
    });

  } catch (error) {
    console.error('Game logging error:', error);
    return res.status(500).json({ message: 'Failed to log game result' });
  }
}