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
    const { filter = 'all', range = '7d' } = req.query;
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

    let whereClause = 'WHERE aa.created_at >= ?';
    let params = [startDateStr];

    // Apply filters
    switch (filter) {
      case 'admin':
        whereClause += ' AND aa.action_type IN ("updateBalance", "ban", "unban", "makeAdmin", "removeAdmin", "update_setting")';
        break;
      case 'user':
        whereClause += ' AND aa.action_type IN ("login", "logout", "register", "game_play", "daily_bonus")';
        break;
      case 'security':
        whereClause += ' AND aa.action_type IN ("ban", "unban", "security_alert", "failed_login")';
        break;
      case 'financial':
        whereClause += ' AND aa.action_type IN ("updateBalance", "daily_bonus", "game_play")';
        break;
    }

    const [logs] = await connection.execute(`
      SELECT 
        aa.*,
        admin.username as admin_username,
        target.username as target_username
      FROM admin_actions aa
      LEFT JOIN users admin ON aa.admin_id = admin.id
      LEFT JOIN users target ON aa.target_user_id = target.id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT 100
    `, params);

    // Parse JSON details
    const processedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    res.status(200).json(processedLogs);
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}