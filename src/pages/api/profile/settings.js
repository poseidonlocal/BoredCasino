import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connection = await getConnection();
    const db = {
      get: async (query, params) => {
        const [rows] = await connection.execute(query, params);
        return rows[0];
      },
      run: async (query, params) => {
        await connection.execute(query, params);
      }
    };

    if (req.method === 'GET') {
      // Get user profile settings
      const settings = await db.get(`
        SELECT 
          bio,
          is_public,
          show_stats,
          show_activity,
          email_notifications
        FROM users 
        WHERE id = ?
      `, [user.id]);

      if (!settings) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        bio: settings.bio || '',
        isPublic: Boolean(settings.is_public),
        showStats: Boolean(settings.show_stats),
        showActivity: Boolean(settings.show_activity),
        emailNotifications: Boolean(settings.email_notifications)
      });

    } else if (req.method === 'POST') {
      // Update user profile settings
      const { bio, isPublic, showStats, showActivity, emailNotifications } = req.body;

      // Validate bio length
      if (bio && bio.length > 200) {
        return res.status(400).json({ error: 'Bio must be 200 characters or less' });
      }

      await db.run(`
        UPDATE users 
        SET 
          bio = ?,
          is_public = ?,
          show_stats = ?,
          show_activity = ?,
          email_notifications = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        bio || null,
        isPublic ? 1 : 0,
        showStats ? 1 : 0,
        showActivity ? 1 : 0,
        emailNotifications ? 1 : 0,
        user.id
      ]);

      res.status(200).json({ message: 'Settings updated successfully' });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling profile settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}