import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, username, ipAddress, userAgent, attemptType = 'unauthorized_access' } = req.body;
    
    const connection = await getConnection();
    
    // Log the security incident
    await connection.execute(
      `INSERT INTO security_logs (user_id, username, ip_address, user_agent, attempt_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, username, ipAddress, userAgent, attemptType]
    );

    // Check how many attempts this user has made in the last 24 hours
    const [attempts] = await connection.execute(
      `SELECT COUNT(*) as attempt_count 
       FROM security_logs 
       WHERE user_id = ? AND attempt_type = 'unauthorized_access' 
       AND datetime(created_at) > datetime('now', '-24 hours')`,
      [userId]
    );

    const attemptCount = attempts.length > 0 ? attempts[0].attempt_count : 0;

    // Auto-ban if 5 or more attempts
    if (attemptCount >= 5) {
      await connection.execute(
        `UPDATE users 
         SET is_banned = 1, ban_reason = ?
         WHERE id = ?`,
        [`Auto-banned: ${attemptCount} unauthorized admin access attempts`, userId]
      );

      // Log the auto-ban action
      await connection.execute(
        `INSERT INTO security_logs (user_id, username, ip_address, user_agent, attempt_type, details) 
         VALUES (?, ?, ?, ?, 'auto_ban', ?)`,
        [userId, username, ipAddress, userAgent, JSON.stringify({ reason: 'Multiple unauthorized admin access attempts', attempt_count: attemptCount })]
      );

      return res.status(200).json({ 
        message: 'Security incident logged', 
        banned: true, 
        attemptCount 
      });
    }

    res.status(200).json({ 
      message: 'Security incident logged', 
      banned: false, 
      attemptCount 
    });

  } catch (error) {
    console.error('Security logging error:', error);
    res.status(500).json({ message: 'Failed to log security incident' });
  }
}