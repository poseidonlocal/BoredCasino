import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

const DAILY_BONUS_AMOUNT = 100;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from cookie
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const connection = await getConnection();

    // Check if user already claimed bonus today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const [existingBonus] = await connection.execute(
      'SELECT * FROM daily_bonuses WHERE user_id = ? AND DATE(claimed_at) = ?',
      [userId, today]
    );

    if (existingBonus.length > 0) {
      return res.status(400).json({ message: 'Daily bonus already claimed today' });
    }

    // Get current user balance
    const [userRows] = await connection.execute(
      'SELECT cash_balance FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = userRows[0].cash_balance;
    const newBalance = parseFloat(currentBalance) + DAILY_BONUS_AMOUNT;

    // Update user balance
    await connection.execute(
      'UPDATE users SET cash_balance = ? WHERE id = ?',
      [newBalance, userId]
    );

    // Record the bonus claim
    await connection.execute(
      'INSERT INTO daily_bonuses (user_id, amount, claimed_at) VALUES (?, ?, NOW())',
      [userId, DAILY_BONUS_AMOUNT]
    );

    res.status(200).json({ 
      success: true, 
      bonusAmount: DAILY_BONUS_AMOUNT,
      newBalance: newBalance
    });

  } catch (error) {
    console.error('Daily bonus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}