import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const connection = await getConnection();

    // Get basic user info with minimal requirements
    const [userResult] = await connection.execute(
      'SELECT id, username, cash_balance, created_at FROM users WHERE username = ?',
      [username]
    );

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Create a minimal but functional profile
    const profile = {
      username: user.username,
      cash: user.cash_balance || 0,
      created_at: user.created_at,
      rank: 1,
      level: 1,
      isVip: (user.cash_balance || 0) > 100000,
      isOnline: false,
      lastSeen: 'Recently',
      stats: {
        totalWinnings: 0,
        totalLosses: 0,
        lifetimeEarnings: 0,
        netProfit: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
        biggestWin: 0,
        dailyBonusesClaimed: 0,
        favoriteGame: 'None',
        experiencePoints: 0,
        currentBalance: user.cash_balance || 0,
        daysSinceJoined: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      },
      levelInfo: {
        level: 1,
        xp: 0,
        progress: {
          current: 0,
          total: 100,
          percentage: 0
        },
        xpForNext: 100,
        title: 'Newcomer',
        isMaxLevel: false,
        rewards: { benefits: [], unlocks: [] }
      },
      gameStats: [],
      achievements: [],
      recentActivity: [],
      rankings: {
        overall: 1,
        winnings: 1,
        games: 1,
        level: 1
      }
    };

    res.status(200).json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}