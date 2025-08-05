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
      // Get recent chat messages
      const { limit = 50 } = req.query;

      const [messages] = await connection.execute(`
        SELECT 
          cm.id,
          cm.message,
          cm.created_at,
          u.username,
          u.totalXP,
          u.isAdmin
        FROM chat_messages cm
        JOIN users u ON u.id = cm.user_id
        ORDER BY cm.created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);

      const messagesWithLevels = messages.reverse().map(msg => ({
        ...msg,
        level: Math.floor(Math.sqrt(msg.totalXP / 100)) + 1,
        timestamp: msg.created_at
      }));

      return res.status(200).json(messagesWithLevels);
    }

    if (req.method === 'POST') {
      // Send a new message
      const { message } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: 'Message cannot be empty' });
      }

      if (message.length > 500) {
        return res.status(400).json({ message: 'Message too long (max 500 characters)' });
      }

      // Check for spam (max 5 messages per minute)
      const [recentMessages] = await connection.execute(`
        SELECT COUNT(*) as count
        FROM chat_messages 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
      `, [user.id]);

      if (recentMessages[0].count >= 5) {
        return res.status(429).json({ message: 'Too many messages. Please wait before sending another.' });
      }

      // Insert the message
      const [result] = await connection.execute(
        'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
        [user.id, message.trim()]
      );

      // Return the new message with user info
      const newMessage = {
        id: result.insertId,
        message: message.trim(),
        username: user.username,
        level: Math.floor(Math.sqrt(user.totalXP / 100)) + 1,
        timestamp: new Date(),
        isOwn: true
      };

      return res.status(201).json(newMessage);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Chat messages API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}