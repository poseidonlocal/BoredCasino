import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, adminKey } = req.body;
    
    // Simple admin key check (you can change this)
    if (adminKey !== 'make-me-admin-2024') {
      return res.status(403).json({ error: 'Invalid admin key' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const connection = await getConnection();
    
    // Update user to admin
    const [result] = await connection.execute(
      'UPDATE users SET is_admin = 1 WHERE username = ?',
      [username]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `User ${username} is now an admin` 
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    res.status(500).json({ error: 'Failed to make user admin' });
  }
}