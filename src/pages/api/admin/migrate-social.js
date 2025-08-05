import { verifyAdmin } from '../../../lib/adminAuth';
import { createSocialTables } from '../../../lib/migrations/add_social_features';

export default async function handler(req, res) {
  try {
    const admin = await verifyAdmin(req);

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    await createSocialTables();

    // Log the migration
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { getConnection } = require('../../../lib/db');
    const connection = await getConnection();
    
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.id, 'migrate_social_features', JSON.stringify({ tables: ['friendships', 'game_history', 'chat_messages', 'notifications'] }), clientIP]
    );

    return res.status(200).json({ 
      message: 'Social features migration completed successfully',
      tables: ['friendships', 'game_history', 'chat_messages', 'notifications']
    });
  } catch (error) {
    console.error('Social migration error:', error);
    if (error.message === 'Admin authentication failed') {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (error.message === 'Not authorized as admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return res.status(500).json({ message: 'Migration failed', error: error.message });
  }
}