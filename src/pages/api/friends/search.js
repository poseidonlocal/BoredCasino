import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const { q } = req.query;

    if (!q || q.length < 3) {
      return res.status(400).json({ message: 'Search query must be at least 3 characters' });
    }

    const connection = await getConnection();

    // Search for users excluding current user and existing friends
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.totalXP,
        u.isOnline,
        u.lastLogin
      FROM users u
      WHERE u.username LIKE ? 
      AND u.id != ?
      AND u.id NOT IN (
        SELECT CASE 
          WHEN f.user_id = ? THEN f.friend_id
          ELSE f.user_id
        END
        FROM friendships f
        WHERE (f.user_id = ? OR f.friend_id = ?)
      )
      LIMIT 10
    `, [`%${q}%`, user.id, user.id, user.id, user.id]);

    const usersWithLevels = users.map(foundUser => ({
      ...foundUser,
      level: Math.floor(Math.sqrt(foundUser.totalXP / 100)) + 1,
      status: foundUser.isOnline ? 'online' : 'offline'
    }));

    return res.status(200).json(usersWithLevels);
  } catch (error) {
    console.error('Friend search API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}