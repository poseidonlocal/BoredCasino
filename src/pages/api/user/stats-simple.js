import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    // Return basic stats that will always work
    const responseData = {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      biggestWin: 0,
      biggestLoss: 0,
      totalWinnings: 0,
      totalWagered: 0,
      avgBet: 0,
      favoriteGame: 'None',
      currentStreak: 0,
      bestStreak: 0,
      achievements: 0,
      level: 1,
      xpProgress: 0,
      gamesData: [],
      gameBreakdown: [],
      recentActivity: []
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Simple user stats API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}