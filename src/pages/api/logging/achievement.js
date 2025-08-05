import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { achievementId, achievementTitle, reward } = req.body;

    if (!achievementId || !achievementTitle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await getConnection();
    
    // Log the achievement
    await connection.execute(`
      INSERT INTO achievement_logs (user_id, achievement_id, achievement_title, reward, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [user.id, achievementId, achievementTitle, reward || 0]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging achievement:', error);
    res.status(500).json({ error: 'Failed to log achievement' });
  }
}