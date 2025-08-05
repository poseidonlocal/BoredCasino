import jwt from 'jsonwebtoken';
import { getConnection } from './db';

export async function verifyAdmin(req) {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const connection = await getConnection();
    const [userRows] = await connection.execute(
      'SELECT id, username, email, is_admin FROM users WHERE id = ? AND is_admin = 1',
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error('Not authorized as admin');
    }

    return userRows[0];
  } catch (error) {
    throw new Error('Admin authentication failed');
  }
}

export async function logAdminAction(adminId, actionType, targetUserId = null, details = null, ipAddress = null) {
  try {
    const connection = await getConnection();
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [adminId, actionType, targetUserId, JSON.stringify(details), ipAddress]
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}