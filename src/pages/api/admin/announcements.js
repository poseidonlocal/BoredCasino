import { getConnection } from '../../../lib/db';
import { verifyAdmin } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  try {
    const admin = await verifyAdmin(req);
    const connection = await getConnection();

    if (req.method === 'GET') {
      let announcements = [];
      try {
        const [result] = await connection.execute(`
          SELECT a.*, u.username as created_by_username
          FROM announcements a
          JOIN users u ON a.created_by = u.id
          ORDER BY a.created_at DESC
        `);
        announcements = result || [];
      } catch (error) {
        console.log('Announcements table not found or error:', error.message);
        announcements = [];
      }
      return res.status(200).json(announcements);
    }

    if (req.method === 'POST') {
      const { title, message, type } = req.body;

      if (!title || !message || !type) {
        return res.status(400).json({ message: 'Title, message, and type are required' });
      }

      try {
        await connection.execute(
          'INSERT INTO announcements (title, message, type, created_by) VALUES (?, ?, ?, ?)',
          [title, message, type, admin.id]
        );

        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
          await connection.execute(
            'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
            [admin.id, 'create_announcement', JSON.stringify({ title, type }), clientIP]
          );
        } catch (error) {
          console.log('Admin actions table not found:', error.message);
        }

        return res.status(201).json({ message: 'Announcement created successfully' });
      } catch (error) {
        console.log('Announcement creation error:', error.message);
        return res.status(500).json({ message: 'Failed to create announcement' });
      }
    }

    if (req.method === 'PUT') {
      const { id, isActive } = req.body;

      if (typeof id !== 'number' || typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'Invalid announcement data' });
      }

      try {
        await connection.execute(
          'UPDATE announcements SET is_active = ? WHERE id = ?',
          [isActive, id]
        );

        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
          await connection.execute(
            'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
            [admin.id, 'toggle_announcement', JSON.stringify({ id, isActive }), clientIP]
          );
        } catch (error) {
          console.log('Admin actions table not found:', error.message);
        }

        return res.status(200).json({ message: 'Announcement updated successfully' });
      } catch (error) {
        console.log('Announcement update error:', error.message);
        return res.status(500).json({ message: 'Failed to update announcement' });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (typeof id !== 'number') {
        return res.status(400).json({ message: 'Invalid announcement ID' });
      }

      try {
        await connection.execute('DELETE FROM announcements WHERE id = ?', [id]);

        const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
          await connection.execute(
            'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
            [admin.id, 'delete_announcement', JSON.stringify({ id }), clientIP]
          );
        } catch (error) {
          console.log('Admin actions table not found:', error.message);
        }

        return res.status(200).json({ message: 'Announcement deleted successfully' });
      } catch (error) {
        console.log('Announcement deletion error:', error.message);
        return res.status(500).json({ message: 'Failed to delete announcement' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Announcements API error:', error);
    if (error.message === 'Admin authentication failed') {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (error.message === 'Not authorized as admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}