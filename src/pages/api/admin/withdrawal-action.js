import { getConnection } from '../../../lib/db';
import { verifyAdmin } from '../../../lib/adminAuth';
import { SecurityLogger } from '../../../lib/securityLogger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { withdrawalId, action, adminNotes } = req.body;

    if (!withdrawalId || !action) {
      return res.status(400).json({ error: 'Withdrawal ID and action are required' });
    }

    const validActions = ['approve', 'reject', 'process', 'cancel'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const connection = await getConnection();

    // Get withdrawal details
    const [withdrawals] = await connection.execute(`
      SELECT w.*, u.username, u.cash_balance
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE w.id = ?
    `, [withdrawalId]);

    if (withdrawals.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const withdrawal = withdrawals[0];

    // Check if action is valid for current status
    const validTransitions = {
      pending: ['approve', 'reject', 'cancel'],
      approved: ['process', 'cancel'],
      processed: [],
      rejected: [],
      cancelled: []
    };

    if (!validTransitions[withdrawal.status].includes(action)) {
      return res.status(400).json({ 
        error: `Cannot ${action} withdrawal with status ${withdrawal.status}` 
      });
    }

    let newStatus;
    let shouldRefundUser = false;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        shouldRefundUser = true;
        break;
      case 'process':
        newStatus = 'processed';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        shouldRefundUser = true;
        break;
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Update withdrawal status
      await connection.execute(`
        UPDATE withdrawals 
        SET status = ?, admin_notes = ?, processed_by = ?, processed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, adminNotes || null, admin.id, withdrawalId]);

      // If rejecting or cancelling, refund the user
      if (shouldRefundUser) {
        const newBalance = withdrawal.cash_balance + withdrawal.amount;
        
        await connection.execute(
          'UPDATE users SET cash_balance = ? WHERE id = ?',
          [newBalance, withdrawal.user_id]
        );

        // Log the refund transaction
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
          withdrawal.user_id,
          'refund',
          withdrawal.amount,
          withdrawal.cash_balance,
          newBalance,
          `Withdrawal ${action} refund - ${withdrawal.transaction_id}`
        ]);
      }

      await connection.commit();

      // Log security event
      await SecurityLogger.logAdmin(
        `Withdrawal ${action}`,
        { 
          withdrawalId,
          transactionId: withdrawal.transaction_id,
          amount: withdrawal.amount,
          username: withdrawal.username,
          action,
          adminNotes,
          refunded: shouldRefundUser
        },
        admin.id,
        admin.username,
        req,
        'warning'
      );

      res.status(200).json({
        success: true,
        message: `Withdrawal ${action} successfully`
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error processing withdrawal action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}