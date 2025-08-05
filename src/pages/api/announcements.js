import { getConnection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connection = await getConnection();
    
    // Get active announcements
    const [announcements] = await connection.execute(`
      SELECT id, title, message, type, created_at
      FROM announcements 
      WHERE is_active = 1 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.status(200).json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
}