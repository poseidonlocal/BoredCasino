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
    const conn = await getConnection();

    // Check if user is admin
    const [adminCheck] = await conn.execute(
      'SELECT au.*, u.username FROM admin_users au JOIN users u ON au.user_id = u.id WHERE au.user_id = ?',
      [decoded.userId]
    );

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get dashboard statistics
    const [userStats] = await conn.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week,
        COUNT(CASE WHEN is_banned = 1 THEN 1 END) as banned_users
      FROM users
    `);

    const [gameStats] = await conn.execute(`
      SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as games_today,
        SUM(bet_amount) as total_bets,
        SUM(win_amount) as total_winnings,
        AVG(bet_amount) as avg_bet
      FROM game_history
    `);

    const [bonusStats] = await conn.execute(`
      SELECT 
        COUNT(*) as total_bonuses_claimed,
        COUNT(CASE WHEN claimed_date = CURDATE() THEN 1 END) as bonuses_today,
        SUM(bonus_amount) as total_bonus_amount
      FROM daily_bonuses
    `);

    const [recentActivity] = await conn.execute(`
      SELECT 
        'game' as type,
        u.username,
        gh.game_type as action,
        gh.bet_amount as amount,
        gh.created_at
      FROM game_history gh
      JOIN users u ON gh.user_id = u.id
      ORDER BY gh.created_at DESC
      LIMIT 10
    `);

    const [topPlayers] = await conn.execute(`
      SELECT 
        u.username,
        u.cash_balance,
        COUNT(gh.id) as games_played,
        SUM(gh.win_amount) as total_winnings
      FROM users u
      LEFT JOIN game_history gh ON u.id = gh.user_id
      WHERE u.id NOT IN (SELECT user_id FROM admin_users)
      GROUP BY u.id
      ORDER BY u.cash_balance DESC
      LIMIT 10
    `);

    res.status(200).json({
      admin: adminCheck[0],
      stats: {
        users: userStats[0],
        games: gameStats[0],
        bonuses: bonusStats[0]
      },
      recentActivity,
      topPlayers
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}