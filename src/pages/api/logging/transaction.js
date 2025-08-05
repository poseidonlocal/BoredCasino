import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, amount, description, gameType } = req.body;

    if (!type || amount === undefined) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    const connection = await getConnection();

    // Map transaction types to database format
    const transactionTypeMap = {
      'deposit': 'admin_adjustment',
      'withdrawal': 'admin_adjustment',
      'game_win': 'game_win',
      'game_loss': 'game_loss',
      'daily_bonus': 'daily_bonus'
    };

    const dbTransactionType = transactionTypeMap[type] || 'admin_adjustment';

    // Get current balance for balance tracking
    const [userRows] = await connection.execute(
      'SELECT cash_balance FROM users WHERE id = ?',
      [user.id]
    );

    const currentBalance = userRows[0]?.cash_balance || 0;
    const balanceBefore = currentBalance;
    const balanceAfter = type === 'withdrawal' ? currentBalance : currentBalance; // Balance already updated in wallet modal

    try {
      // Insert transaction record
      await connection.execute(`
        INSERT INTO transactions (
          user_id, 
          transaction_type, 
          game_type, 
          amount, 
          balance_before, 
          balance_after, 
          description, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        user.id,
        dbTransactionType,
        gameType || null,
        amount,
        balanceBefore,
        balanceAfter,
        description || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
      ]);

      res.status(200).json({ 
        success: true, 
        message: 'Transaction logged successfully' 
      });

    } catch (dbError) {
      // If transactions table doesn't exist, create a simple log
      console.log('Transaction logging failed (table may not exist):', dbError.message);
      
      // Still return success so the wallet functionality works
      res.status(200).json({ 
        success: true, 
        message: 'Transaction completed (logging unavailable)' 
      });
    }

  } catch (error) {
    console.error('Transaction logging error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}