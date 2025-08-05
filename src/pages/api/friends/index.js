import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const connection = await getConnection();

    if (req.method === 'GET') {
      // Get user's friends list
      const [friends] = await connection.execute(`
        SELECT 
          u.id,
          u.username,
          u.totalXP,
          u.lastLogin,
          u.isOnline,
          f.created_at as friendsSince
        FROM friendships f
        JOIN users u ON (
          CASE 
            WHEN f.user_id = ? THEN u.id = f.friend_id
            ELSE u.id = f.user_id
          END
        )
        WHERE (f.user_id = ? OR f.friend_id = ?) 
        AND f.status = 'accepted'
        ORDER BY u.isOnline DESC, u.lastLogin DESC
      `, [user.id, user.id, user.id]);

      // Calculate levels and format response
      const friendsWithLevels = friends.map(friend => ({
        ...friend,
        level: Math.floor(Math.sqrt(friend.totalXP / 100)) + 1,
        status: friend.isOnline ? 'online' : 'offline',
        lastSeen: friend.lastLogin
      }));

      return res.status(200).json(friendsWithLevels);
    }

    if (req.method === 'POST') {
      // Send friend request
      const { friendUsername } = req.body;

      if (!friendUsername) {
        return res.status(400).json({ message: 'Friend username is required' });
      }

      // Find the friend user
      const [friendUsers] = await connection.execute(
        'SELECT id, username FROM users WHERE username = ?',
        [friendUsername]
      );

      if (friendUsers.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const friendUser = friendUsers[0];

      if (friendUser.id === user.id) {
        return res.status(400).json({ message: 'Cannot add yourself as friend' });
      }

      // Check if friendship already exists
      const [existing] = await connection.execute(`
        SELECT id FROM friendships 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [user.id, friendUser.id, friendUser.id, user.id]);

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Friendship already exists or pending' });
      }

      // Create friend request
      await connection.execute(
        'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)',
        [user.id, friendUser.id, 'pending']
      );

      return res.status(201).json({ message: 'Friend request sent successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Friends API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}