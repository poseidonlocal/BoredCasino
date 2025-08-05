import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { userId, action, value, reason } = req.body;
    const connection = await getConnection();
    
    // Verify admin status
    const [adminCheck] = await connection.execute(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!adminCheck.length || !adminCheck[0].is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get client IP
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let actionDetails = {};
    let actionType = action;

    switch (action) {
      case 'updateBalance':
        await connection.execute(
          'UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?',
          [parseFloat(value), userId]
        );
        actionDetails = { amountChanged: value };
        break;

      case 'ban':
        const banReason = reason || 'Banned by administrator';
        await connection.execute(
          'UPDATE users SET is_banned = 1, ban_reason = ?, updated_at = datetime("now") WHERE id = ?',
          [banReason, userId]
        );
        actionDetails = { reason: banReason };
        break;

      case 'unban':
        await connection.execute(
          'UPDATE users SET is_banned = 0, ban_reason = NULL, updated_at = datetime("now") WHERE id = ?',
          [userId]
        );
        break;

      case 'makeAdmin':
        await connection.execute(
          'UPDATE users SET is_admin = 1, updated_at = datetime("now") WHERE id = ?',
          [userId]
        );
        actionDetails = { newAdminStatus: true };
        break;

      case 'deactivate':
        await connection.execute(
          'UPDATE users SET is_active = 0 WHERE id = ?',
          [userId]
        );
        break;

      case 'activate':
        await connection.execute(
          'UPDATE users SET is_active = 1 WHERE id = ?',
          [userId]
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    // Log admin action
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [decoded.userId, actionType, userId, JSON.stringify(actionDetails), clientIP]
    );

    res.status(200).json({ message: 'Action completed successfully' });
  } catch (error) {
    console.error('Admin user action error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}