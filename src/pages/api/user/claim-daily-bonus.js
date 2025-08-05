import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    
    // Check if user has already claimed bonus today
    const [existingBonus] = await connection.execute(
      "SELECT * FROM daily_bonuses WHERE user_id = ? AND claimed_date = date('now')",
      [userId]
    );

    if (existingBonus.length > 0) {
      return res.status(400).json({ message: 'Daily bonus already claimed today' });
    }

    // Get bonus amount from settings
    const [settingsRows] = await connection.execute(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?',
      ['daily_bonus_amount']
    );
    
    const bonusAmount = settingsRows.length > 0 ? parseFloat(settingsRows[0].setting_value) : 100;

    // SQLite doesn't support beginTransaction() method, use execute('BEGIN') instead
    await connection.execute('BEGIN');

    try {
      // Add bonus to user's balance
      await connection.execute(
        'UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?',
        [bonusAmount, userId]
      );

      // Record the bonus claim
      await connection.execute(
        "INSERT INTO daily_bonuses (user_id, bonus_amount, claimed_date) VALUES (?, ?, date('now'))",
        [userId, bonusAmount]
      );

      // Log the transaction
      const balanceBefore = (await connection.execute('SELECT cash_balance FROM users WHERE id = ?', [userId]))[0][0].cash_balance - bonusAmount;
      const balanceAfter = balanceBefore + bonusAmount;
      
      await connection.execute(`
        INSERT INTO transaction_logs (user_id, transaction_type, amount, balance_before, balance_after, description, ip_address)
        VALUES (?, 'daily_bonus', ?, ?, ?, ?, ?)
      `, [userId, bonusAmount, balanceBefore, balanceAfter, `Daily bonus claimed: ${bonusAmount} MSP`, req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown']);

      await connection.execute('COMMIT');

      res.status(200).json({ 
        message: 'Daily bonus claimed successfully',
        bonusAmount 
      });
    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Claim daily bonus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}