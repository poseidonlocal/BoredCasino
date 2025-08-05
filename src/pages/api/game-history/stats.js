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

    const connection = await getConnection();

    // Get overall stats
    const [overallStats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(bet_amount) as totalWagered,
        SUM(profit) as totalProfit,
        MAX(profit) as biggestWin,
        MIN(profit) as biggestLoss,
        AVG(bet_amount) as avgBet
      FROM game_history 
      WHERE user_id = ?
    `, [user.id]);

    // Get game breakdown
    const [gameBreakdown] = await connection.execute(`
      SELECT 
        game_type,
        COUNT(*) as count,
        SUM(profit) as totalProfit,
        AVG(profit) as avgProfit
      FROM game_history 
      WHERE user_id = ?
      GROUP BY game_type
      ORDER BY count DESC
    `, [user.id]);

    // Get recent performance (last 30 days)
    const [recentStats] = await connection.execute(`
      SELECT 
        COUNT(*) as recentGames,
        SUM(profit) as recentProfit,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as recentWins
      FROM game_history 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [user.id]);

    const stats = overallStats[0];
    const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100) : 0;
    const recentWinRate = recentStats[0].recentGames > 0 ? 
      (recentStats[0].recentWins / recentStats[0].recentGames * 100) : 0;

    return res.status(200).json({
      overall: {
        ...stats,
        winRate: parseFloat(winRate.toFixed(1)),
        avgBet: parseFloat(stats.avgBet || 0)
      },
      recent: {
        ...recentStats[0],
        recentWinRate: parseFloat(recentWinRate.toFixed(1))
      },
      gameBreakdown
    });
  } catch (error) {
    console.error('Game stats API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}