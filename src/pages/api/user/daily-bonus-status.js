import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const connection = await getConnection();
    
    // Check if user has claimed bonus today
    const [bonusRows] = await connection.execute(
      "SELECT * FROM daily_bonuses WHERE user_id = ? AND claimed_date = date('now')",
      [userId]
    );

    const canClaim = bonusRows.length === 0;

    res.status(200).json({ canClaim });
  } catch (error) {
    console.error('Daily bonus status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}