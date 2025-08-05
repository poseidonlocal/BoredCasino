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
    const connection = await getConnection();
    
    // Verify admin status
    const [adminCheck] = await connection.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!adminCheck.length || !adminCheck[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    const offset = page * limit;
    
    // Get total count for pagination
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = countResult[0].total;
    
    // Get users with pagination
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.cash_balance,
        u.is_admin,
        u.is_active,
        u.is_banned,
        u.ban_reason,
        u.last_daily_bonus,
        u.total_winnings,
        u.total_losses,
        u.games_played,
        u.last_login,
        u.created_at,
        u.updated_at,
        COUNT(gh.id) as total_games_played,
        SUM(gh.bet_amount) as total_bet_amount,
        SUM(gh.win_amount) as total_win_amount
      FROM users u
      LEFT JOIN game_history gh ON u.id = gh.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        hasMore: offset + users.length < totalUsers
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}