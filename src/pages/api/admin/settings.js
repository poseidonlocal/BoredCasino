import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
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

  if (req.method === 'GET') {
    try {
      const [settings] = await connection.execute(
        'SELECT setting_key, setting_value FROM system_settings'
      );

      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      res.status(200).json(settingsObj);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value } = req.body;

      await connection.execute(
        'UPDATE system_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
        [value, decoded.userId, key]
      );

      // Log admin action
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      await connection.execute(
        'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
        [decoded.userId, 'update_setting', JSON.stringify({ key, value }), clientIP]
      );

      res.status(200).json({ message: 'Setting updated successfully' });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}