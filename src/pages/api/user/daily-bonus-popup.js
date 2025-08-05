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

    // Check if user has seen the popup today (to prevent showing multiple times per session)
    const sessionKey = `daily_bonus_shown_${userId}_${new Date().toISOString().split('T')[0]}`;
    
    // For now, we'll use a simple approach - the frontend will handle session storage
    // In a production app, you'd want to track this in the database or Redis
    
    res.status(200).json({ 
      canClaim,
      shouldShowPopup: canClaim, // Show popup if they can claim
      bonusAmount: 100
    });
  } catch (error) {
    console.error('Daily bonus popup check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}