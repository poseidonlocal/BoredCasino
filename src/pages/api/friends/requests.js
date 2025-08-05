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
      // Get pending friend requests with fallback for missing tables
      let requests = [];
      try {
        const [result] = await connection.execute(`
          SELECT 
            f.id as requestId,
            u.id,
            u.username,
            u.totalXP,
            f.created_at as sentAt
          FROM friendships f
          JOIN users u ON u.id = f.user_id
          WHERE f.friend_id = ? AND f.status = 'pending'
          ORDER BY f.created_at DESC
        `, [user.id]);
        
        requests = result || [];
      } catch (error) {
        console.log('Friend requests table not found or error:', error.message);
        requests = [];
      }

      const requestsWithLevels = requests.map(request => ({
        ...request,
        level: Math.floor(Math.sqrt((request.totalXP || 0) / 100)) + 1
      }));

      return res.status(200).json(requestsWithLevels);
    }

    if (req.method === 'POST') {
      // Accept or reject friend request
      const { requestId, action } = req.body;

      if (!requestId || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      try {
        // Verify the request belongs to this user
        const [requests] = await connection.execute(
          'SELECT id FROM friendships WHERE id = ? AND friend_id = ? AND status = ?',
          [requestId, user.id, 'pending']
        );

        if (requests.length === 0) {
          return res.status(404).json({ message: 'Friend request not found' });
        }

        if (action === 'accept') {
          await connection.execute(
            'UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['accepted', requestId]
          );
          return res.status(200).json({ message: 'Friend request accepted' });
        } else {
          await connection.execute(
            'DELETE FROM friendships WHERE id = ?',
            [requestId]
          );
          return res.status(200).json({ message: 'Friend request rejected' });
        }
      } catch (error) {
        console.log('Friend request action error:', error.message);
        return res.status(500).json({ message: 'Failed to process friend request' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Friend requests API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}