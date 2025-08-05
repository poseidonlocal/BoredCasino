import { getConnection } from '../../lib/db';
import { verifyToken } from '../../lib/auth';
import { SecurityLogger } from '../../lib/securityLogger';
import { createWithdrawalsTable } from '../../lib/createWithdrawalsTable';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, method, accountDetails } = req.body;

    if (!amount || !method || !accountDetails) {
      return res.status(400).json({ error: 'Amount, method, and account details are required' });
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    // Minimum withdrawal check
    if (withdrawalAmount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is 100 MSP' });
    }

    const connection = await getConnection();

    // Ensure withdrawals table exists
    await createWithdrawalsTable();

    // Get current user balance
    const [users] = await connection.execute(
      'SELECT cash_balance FROM users WHERE id = ?',
      [user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = users[0].cash_balance || 0;

    // Check if user has sufficient funds
    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const newBalance = currentBalance - withdrawalAmount;

    // Update user balance
    await connection.execute(
      'UPDATE users SET cash_balance = ? WHERE id = ?',
      [newBalance, user.id]
    );

    // Generate transaction ID
    const transactionId = `WTH-${Date.now().toString().slice(-8)}`;

    // Create withdrawal record
    await connection.execute(`
      INSERT INTO withdrawals (
        user_id,
        amount,
        method,
        account_details,
        transaction_id,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [
      user.id,
      withdrawalAmount,
      method,
      accountDetails,
      transactionId
    ]);

    // Log the transaction
    await connection.execute(`
      INSERT INTO transactions (
        user_id, 
        transaction_type, 
        amount, 
        balance_before, 
        balance_after, 
        description, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      user.id,
      'withdrawal',
      -withdrawalAmount, // Negative for withdrawal
      currentBalance,
      newBalance,
      `Withdrawal via ${method} - ${transactionId}`
    ]);

    // Log security event
    await SecurityLogger.logTransaction(
      'Withdrawal request submitted',
      { 
        amount: withdrawalAmount, 
        method, 
        transactionId,
        previousBalance: currentBalance,
        newBalance
      },
      user.id,
      user.username,
      req,
      withdrawalAmount >= 5000 ? 'warning' : 'info' // High value withdrawals get warning level
    );

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      transactionId,
      newBalance
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}