import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const admin = await verifyAdmin(req);
    
    const connection = await getConnection();
    
    // Get total users
    const [totalUsersResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0].count;
    
    // Get active users (logged in within the last 7 days)
    const [activeUsersResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE last_login > datetime('now', '-7 days')
    `);
    const activeUsers = activeUsersResult[0].count;
    
    // Get new users today
    const [newUsersTodayResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE date(created_at) = date('now')
    `);
    const newUsersToday = newUsersTodayResult[0].count;
    
    // Get daily active users (logged in today)
    const [dailyActiveUsersResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM users 
      WHERE date(last_login) = date('now')
    `);
    const dailyActiveUsers = dailyActiveUsersResult[0].count;
    
    // Get total games played with fallback
    let totalGames = 0;
    try {
      const [totalGamesResult] = await connection.execute('SELECT COUNT(*) as count FROM game_history');
      totalGames = totalGamesResult[0].count;
    } catch (error) {
      console.log('Game history table not available:', error.message);
    }
    
    // Get total revenue with fallback
    let totalRevenue = 0;
    try {
      const [totalRevenueResult] = await connection.execute(`
        SELECT 
          SUM(bet_amount) as total_bets,
          SUM(payout) as total_payouts,
          SUM(bet_amount) - SUM(payout) as house_edge
        FROM game_history
      `);
      totalRevenue = totalRevenueResult[0].house_edge || 0;
    } catch (error) {
      console.log('Revenue calculation failed:', error.message);
    }
    
    // Get game type distribution with fallback
    let gameDistributionResult = [];
    try {
      const [result] = await connection.execute(`
        SELECT game_type, COUNT(*) as count 
        FROM game_history 
        GROUP BY game_type
        ORDER BY count DESC
      `);
      gameDistributionResult = result;
    } catch (error) {
      console.log('Game distribution query failed:', error.message);
    }
    
    // Get win/loss ratio with fallback
    let wins = 0, losses = 0, winLossRatio = 0;
    try {
      const [winLossResult] = await connection.execute(`
        SELECT 
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses
        FROM game_history
      `);
      wins = winLossResult[0].wins || 0;
      losses = winLossResult[0].losses || 0;
      winLossRatio = losses > 0 ? (wins / losses).toFixed(2) : 0;
    } catch (error) {
      console.log('Win/loss ratio calculation failed:', error.message);
    }
    
    // Get recent statistics with fallback
    let recentStats = { games_today: 0, bets_today: 0, wins_today: 0 };
    try {
      const [recentStatsResult] = await connection.execute(`
        SELECT 
          COUNT(*) as games_today,
          SUM(bet_amount) as bets_today,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins_today
        FROM game_history 
        WHERE created_at >= datetime('now', '-1 day')
      `);
      recentStats = recentStatsResult[0] || recentStats;
    } catch (error) {
      console.log('Recent stats query failed:', error.message);
    }
    
    // Get top players with fallback
    let topPlayersResult = [];
    try {
      const [result] = await connection.execute(`
        SELECT 
          u.username,
          us.total_winnings,
          us.games_won,
          us.current_streak
        FROM user_stats us
        JOIN users u ON u.id = us.user_id
        ORDER BY us.total_winnings DESC
        LIMIT 5
      `);
      topPlayersResult = result;
    } catch (error) {
      console.log('Top players query failed:', error.message);
    }
    
    // Get most popular games with fallback
    let popularGamesResult = [];
    try {
      const [result] = await connection.execute(`
        SELECT 
          game_type,
          COUNT(*) as plays,
          SUM(bet_amount) as total_wagered,
          AVG(bet_amount) as avg_bet
        FROM game_history 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY game_type
        ORDER BY plays DESC
        LIMIT 5
      `);
      popularGamesResult = result;
    } catch (error) {
      console.log('Popular games query failed:', error.message);
    }
    
    res.status(200).json({
      totalUsers,
      activeUsers,
      newUsersToday,
      dailyActiveUsers,
      totalGames,
      totalRevenue: Math.max(0, totalRevenue), // Ensure positive revenue
      gameDistribution: gameDistributionResult,
      winLossRatio,
      recentStats,
      topPlayers: topPlayersResult,
      popularGames: popularGamesResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
}