import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const admin = await verifyAdmin(req);
    
    const { limit = 50, offset = 0, type = null } = req.query;
    
    const connection = await getConnection();
    
    // Build query based on filters
    let query = `
      SELECT 
        tl.*,
        u.username,
        a.username as admin_username
      FROM transaction_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN users a ON tl.admin_id = a.id
    `;
    
    const params = [];
    
    if (type && type !== 'all') {
      query += ' WHERE tl.transaction_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY tl.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Get transaction logs
    const [logs] = await connection.execute(query, params);
    
    // Get statistics
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'game_bet' THEN ABS(amount) ELSE 0 END) as total_bets,
        SUM(CASE WHEN transaction_type = 'game_win' THEN amount ELSE 0 END) as total_wins,
        SUM(CASE WHEN transaction_type = 'daily_bonus' THEN amount ELSE 0 END) as total_bonuses,
        COUNT(CASE WHEN datetime(created_at) > datetime('now', '-24 hours') THEN 1 END) as last_24h_transactions
      FROM transaction_logs
    `);

    res.status(200).json({
      logs,
      stats: stats[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: logs.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Failed to fetch transaction logs:', error);
    res.status(500).json({ message: 'Failed to fetch transaction logs' });
  }
}