import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { range = '7d' } = req.query;
    const connection = await getConnection();
    
    // Verify admin status
    const [adminCheck] = await connection.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!adminCheck.length || !adminCheck[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Calculate date range
    const days = parseInt(range.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Game statistics
    const [gameStats] = await connection.execute(`
      SELECT 
        game_type,
        COUNT(*) as total_games,
        SUM(bet_amount) as total_bets,
        SUM(win_amount) as total_winnings,
        AVG(bet_amount) as avg_bet
      FROM game_history 
      WHERE created_at >= ?
      GROUP BY game_type
    `, [startDateStr]);

    // Player statistics
    const [playerStats] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT user_id) as active_players,
        AVG(bet_amount) as avg_bet_size
      FROM game_history 
      WHERE created_at >= ?
    `, [startDateStr]);

    const [newPlayers] = await connection.execute(`
      SELECT COUNT(*) as new_players
      FROM users 
      WHERE created_at >= ?
    `, [startDateStr]);

    // Top players
    const [topPlayers] = await connection.execute(`
      SELECT 
        u.username,
        SUM(gh.bet_amount) as total_bets,
        COUNT(gh.id) as games_played,
        SUM(gh.win_amount) as total_winnings
      FROM users u
      JOIN game_history gh ON u.id = gh.user_id
      WHERE gh.created_at >= ?
      GROUP BY u.id, u.username
      ORDER BY total_bets DESC
      LIMIT 10
    `, [startDateStr]);

    // Revenue data (daily breakdown)
    const [revenueData] = await connection.execute(`
      SELECT 
        DATE(created_at) as date,
        SUM(bet_amount - win_amount) as revenue,
        COUNT(*) as games
      FROM game_history 
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDateStr]);

    const analytics = {
      gameStats: gameStats.map(stat => ({
        ...stat,
        total_bets: parseFloat(stat.total_bets) || 0,
        total_winnings: parseFloat(stat.total_winnings) || 0,
        avg_bet: parseFloat(stat.avg_bet) || 0
      })),
      playerStats: {
        activePlayers: playerStats[0]?.active_players || 0,
        newPlayers: newPlayers[0]?.new_players || 0,
        avgBetSize: parseFloat(playerStats[0]?.avg_bet_size) || 0,
        avgSessionTime: '15m' // Placeholder - would need session tracking
      },
      topPlayers: topPlayers.map(player => ({
        ...player,
        total_bets: parseFloat(player.total_bets) || 0,
        total_winnings: parseFloat(player.total_winnings) || 0
      })),
      revenueData: revenueData.map(data => ({
        ...data,
        revenue: parseFloat(data.revenue) || 0
      }))
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}