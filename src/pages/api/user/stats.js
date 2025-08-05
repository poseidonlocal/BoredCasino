import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

// Simple fallback functions
const calculateLevel = (xp) => Math.floor((xp || 0) / 100) + 1;
const getXPProgress = (xp) => ({
  progressXP: (xp || 0) % 100,
  requiredXP: 100,
  progressPercentage: ((xp || 0) % 100),
  isMaxLevel: false
});

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

    const connection = await getConnection();

    // Get user's game statistics with safe queries
    let gameStats = { totalGames: 0, totalWins: 0, totalLosses: 0, totalWagered: 0, totalProfit: 0, biggestWin: 0, biggestLoss: 0, avgBet: 0 };
    let gameBreakdown = [];
    let recentActivity = [];

    try {
      // Try to get game history stats
      const [gameStatsResult] = await connection.execute(`
        SELECT 
          COUNT(*) as totalGames,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as totalWins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as totalLosses,
          SUM(bet_amount) as totalWagered,
          SUM(profit) as totalProfit,
          MAX(profit) as biggestWin,
          MIN(profit) as biggestLoss,
          AVG(bet_amount) as avgBet
        FROM game_history 
        WHERE user_id = ?
      `, [user.id]);

      if (gameStatsResult && gameStatsResult.length > 0) {
        gameStats = gameStatsResult[0];
      }
    } catch (error) {
      console.log('Game history table not found or error:', error.message);
    }

    try {
      // Try to get game breakdown
      const [gameBreakdownResult] = await connection.execute(`
        SELECT 
          game_type,
          COUNT(*) as count,
          SUM(profit) as totalProfit,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins
        FROM game_history 
        WHERE user_id = ?
        GROUP BY game_type
        ORDER BY count DESC
      `, [user.id]);

      gameBreakdown = gameBreakdownResult || [];
    } catch (error) {
      console.log('Game breakdown query error:', error.message);
    }

    try {
      // Try to get recent activity
      const [recentActivityResult] = await connection.execute(`
        SELECT 
          game_type,
          result,
          profit,
          created_at,
          details
        FROM game_history 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [user.id]);

      recentActivity = (recentActivityResult || []).map(activity => ({
        type: activity.result,
        description: `${activity.result === 'win' ? 'Won' : 'Lost'} ${Math.abs(activity.profit)} MSP playing ${activity.game_type}`,
        amount: activity.profit,
        timestamp: formatTimeAgo(activity.created_at),
        details: activity.details
      }));
    } catch (error) {
      console.log('Recent activity query error:', error.message);
    }

    // Get user stats from user_stats table
    let userStatData = { current_streak: 0, best_streak: 0, badges: '[]' };
    try {
      const [userStatsResult] = await connection.execute(`
        SELECT 
          current_streak,
          best_streak,
          badges
        FROM user_stats 
        WHERE user_id = ?
      `, [user.id]);

      if (userStatsResult && userStatsResult.length > 0) {
        userStatData = userStatsResult[0];
      }
    } catch (error) {
      console.log('User stats table not found or error:', error.message);
    }

    const winRate = gameStats.totalGames > 0 ? (gameStats.totalWins / gameStats.totalGames * 100) : 0;
    const level = calculateLevel(user.totalXP || 0);
    const xpProgress = getXPProgress(user.totalXP || 0);

    // Format game data for charts
    const gamesData = gameBreakdown.map(game => ({
      label: game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1),
      value: game.count
    }));

    // Calculate additional progress metrics
    const totalProfit = gameStats.totalProfit || 0;
    const profitability = gameStats.totalWagered > 0 ? 
      ((totalProfit / gameStats.totalWagered) * 100).toFixed(1) : 0;
    
    // Calculate level progress
    const currentLevelXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const xpInCurrentLevel = (user.totalXP || 0) - currentLevelXP;
    const xpNeededForNext = nextLevelXP - (user.totalXP || 0);

    // Calculate lifetime earnings (total payouts from wins)
    let lifetimeEarnings = 0;
    try {
      const [earningsResult] = await connection.execute(`
        SELECT COALESCE(SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END), 0) as lifetime_earnings
        FROM game_history 
        WHERE user_id = ?
      `, [user.id]);
      
      if (earningsResult && earningsResult.length > 0) {
        lifetimeEarnings = earningsResult[0].lifetime_earnings || 0;
      }
    } catch (error) {
      console.log('Lifetime earnings calculation error:', error.message);
    }

    const responseData = {
      // Basic game stats
      totalGames: gameStats.totalGames || 0,
      totalWins: gameStats.totalWins || 0,
      totalLosses: gameStats.totalLosses || 0,
      winRate: parseFloat(winRate.toFixed(1)),
      biggestWin: gameStats.biggestWin || 0,
      biggestLoss: Math.abs(gameStats.biggestLoss || 0),
      
      // Financial metrics
      lifetimeEarnings: lifetimeEarnings,
      totalWinnings: Math.max(0, totalProfit),
      totalLosses: Math.abs(Math.min(0, totalProfit)),
      netProfit: totalProfit,
      totalWagered: gameStats.totalWagered || 0,
      avgBet: parseFloat((gameStats.avgBet || 0).toFixed(2)),
      profitability: parseFloat(profitability),
      
      // Game preferences
      favoriteGame: gameBreakdown.length > 0 ? gameBreakdown[0].game_type : 'None',
      gamesData: gamesData,
      gameBreakdown: gameBreakdown,
      
      // Streaks and achievements
      currentStreak: userStatData.current_streak || 0,
      bestStreak: userStatData.best_streak || 0,
      achievements: JSON.parse(userStatData.badges || '[]').length,
      
      // Level and XP progress
      level: level,
      totalXP: user.totalXP || 0,
      xpProgress: xpProgress.progressPercentage,
      xpInCurrentLevel: Math.max(0, xpInCurrentLevel),
      xpNeededForNext: Math.max(0, xpNeededForNext),
      levelTitle: getLevelTitle(level),
      
      // Time-based stats
      daysSinceJoined: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      accountAge: getAccountAge(user.created_at),
      
      // Activity and engagement
      recentActivity: recentActivity,
      isActive: recentActivity.length > 0,
      lastGamePlayed: recentActivity.length > 0 ? recentActivity[0].timeAgo : 'Never',
      
      // Rankings (mock data for now)
      rankings: {
        overall: Math.floor(Math.random() * 100) + 1,
        winnings: Math.floor(Math.random() * 100) + 1,
        level: Math.floor(Math.random() * 100) + 1,
        games: Math.floor(Math.random() * 100) + 1
      }
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('User stats API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function getLevelTitle(level) {
  if (level >= 100) return 'BoredCasino Legend';
  if (level >= 75) return 'Grandmaster';
  if (level >= 50) return 'BoredCasino Master';
  if (level >= 40) return 'High Roller';
  if (level >= 30) return 'VIP Player';
  if (level >= 25) return 'BoredCasino Veteran';
  if (level >= 20) return 'Skilled Gambler';
  if (level >= 15) return 'Regular Player';
  if (level >= 10) return 'Experienced Player';
  if (level >= 5) return 'Rising Star';
  return 'Newcomer';
}

function getAccountAge(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 30) return `${diffInDays} days`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`;
  return `${Math.floor(diffInDays / 365)} years`;
}