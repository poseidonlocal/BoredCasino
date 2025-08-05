import { getConnection } from './db';

// Transaction types
export const TRANSACTION_TYPES = {
  GAME_BET: 'game_bet',
  GAME_WIN: 'game_win',
  DAILY_BONUS: 'daily_bonus',
  ADMIN_ADJUSTMENT: 'admin_adjustment',
  PURCHASE: 'purchase',
  REFUND: 'refund'
};

// Game types
export const GAME_TYPES = {
  ROULETTE: 'roulette',
  SLOTS: 'slots',
  TEXAS_HOLDEM: 'texas_holdem',
  COINFLIP: 'coinflip'
};

/**
 * Log a transaction to the database
 * @param {Object} params - Transaction parameters
 * @param {number} params.userId - User ID
 * @param {string} params.type - Transaction type from TRANSACTION_TYPES
 * @param {number} params.amount - Transaction amount (positive for credits, negative for debits)
 * @param {number} params.balanceBefore - User's balance before transaction
 * @param {number} params.balanceAfter - User's balance after transaction
 * @param {string} params.gameType - Game type from GAME_TYPES (optional)
 * @param {Object} params.gameData - Additional game data (optional)
 * @param {string} params.description - Human readable description
 * @param {string} params.ipAddress - User's IP address (optional)
 * @param {number} params.adminId - Admin ID if admin action (optional)
 */
export async function logTransaction({
  userId,
  type,
  amount,
  balanceBefore,
  balanceAfter,
  gameType = null,
  gameData = null,
  description,
  ipAddress = null,
  adminId = null
}) {
  try {
    const connection = await getConnection();
    
    await connection.execute(`
      INSERT INTO transaction_logs (
        user_id, 
        transaction_type, 
        amount, 
        balance_before, 
        balance_after, 
        game_type, 
        game_data, 
        description, 
        ip_address, 
        admin_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      gameType,
      gameData ? JSON.stringify(gameData) : null,
      description,
      ipAddress,
      adminId
    ]);

    console.log(`Transaction logged: ${type} - ${amount} MSP for user ${userId}`);
  } catch (error) {
    console.error('Failed to log transaction:', error);
    // Don't throw error to prevent breaking the main transaction
  }
}

/**
 * Log a game play event
 * @param {Object} params - Game parameters
 * @param {number} params.userId - User ID
 * @param {string} params.gameType - Game type from GAME_TYPES
 * @param {number} params.betAmount - Amount bet
 * @param {number} params.winAmount - Amount won (0 if lost)
 * @param {Object} params.gameData - Game specific data
 * @param {number} params.balanceBefore - Balance before game
 * @param {number} params.balanceAfter - Balance after game
 * @param {string} params.ipAddress - User's IP address (optional)
 */
export async function logGamePlay({
  userId,
  gameType,
  betAmount,
  winAmount,
  gameData,
  balanceBefore,
  balanceAfter,
  ipAddress = null
}) {
  try {
    const connection = await getConnection();
    
    // Log the bet
    await logTransaction({
      userId,
      type: TRANSACTION_TYPES.GAME_BET,
      amount: -betAmount,
      balanceBefore,
      balanceAfter: balanceBefore - betAmount,
      gameType,
      gameData,
      description: `${gameType} bet: ${betAmount} MSP`,
      ipAddress
    });

    // Log the win if any
    if (winAmount > 0) {
      await logTransaction({
        userId,
        type: TRANSACTION_TYPES.GAME_WIN,
        amount: winAmount,
        balanceBefore: balanceBefore - betAmount,
        balanceAfter,
        gameType,
        gameData,
        description: `${gameType} win: ${winAmount} MSP`,
        ipAddress
      });
    }

    // Also log to game_history table for compatibility
    await connection.execute(`
      INSERT INTO game_history (user_id, game_type, bet_amount, win_amount, game_data)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, gameType, betAmount, winAmount, JSON.stringify(gameData)]);

  } catch (error) {
    console.error('Failed to log game play:', error);
  }
}

/**
 * Log a daily bonus claim
 * @param {number} userId - User ID
 * @param {number} amount - Bonus amount
 * @param {number} balanceBefore - Balance before bonus
 * @param {number} balanceAfter - Balance after bonus
 * @param {string} ipAddress - User's IP address (optional)
 */
export async function logDailyBonus(userId, amount, balanceBefore, balanceAfter, ipAddress = null) {
  await logTransaction({
    userId,
    type: TRANSACTION_TYPES.DAILY_BONUS,
    amount,
    balanceBefore,
    balanceAfter,
    description: `Daily bonus claimed: ${amount} MSP`,
    ipAddress
  });
}

/**
 * Log an admin adjustment
 * @param {number} userId - Target user ID
 * @param {number} adminId - Admin user ID
 * @param {number} amount - Adjustment amount
 * @param {number} balanceBefore - Balance before adjustment
 * @param {number} balanceAfter - Balance after adjustment
 * @param {string} reason - Reason for adjustment
 * @param {string} ipAddress - Admin's IP address (optional)
 */
export async function logAdminAdjustment(userId, adminId, amount, balanceBefore, balanceAfter, reason, ipAddress = null) {
  await logTransaction({
    userId,
    type: TRANSACTION_TYPES.ADMIN_ADJUSTMENT,
    amount,
    balanceBefore,
    balanceAfter,
    description: `Admin adjustment: ${reason}`,
    ipAddress,
    adminId
  });
}

/**
 * Get transaction history for a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of records to return (default: 50)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Array} Transaction history
 */
export async function getUserTransactionHistory(userId, limit = 50, offset = 0) {
  try {
    const connection = await getConnection();
    
    const [transactions] = await connection.execute(`
      SELECT 
        tl.*,
        u.username,
        a.username as admin_username
      FROM transaction_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN users a ON tl.admin_id = a.id
      WHERE tl.user_id = ?
      ORDER BY tl.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    return transactions;
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
}

/**
 * Get all transaction logs for admin panel
 * @param {number} limit - Number of records to return (default: 100)
 * @param {number} offset - Offset for pagination (default: 0)
 * @param {string} filterType - Filter by transaction type (optional)
 * @returns {Array} All transaction logs
 */
export async function getAllTransactionLogs(limit = 100, offset = 0, filterType = null) {
  try {
    const connection = await getConnection();
    
    let query = `
      SELECT 
        tl.*,
        u.username,
        a.username as admin_username
      FROM transaction_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN users a ON tl.admin_id = a.id
    `;
    
    const params = [];
    
    if (filterType) {
      query += ' WHERE tl.transaction_type = ?';
      params.push(filterType);
    }
    
    query += ' ORDER BY tl.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [transactions] = await connection.execute(query, params);

    return transactions;
  } catch (error) {
    console.error('Failed to get all transaction logs:', error);
    return [];
  }
}

/**
 * Get transaction statistics
 * @returns {Object} Transaction statistics
 */
export async function getTransactionStats() {
  try {
    const connection = await getConnection();
    
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'game_bet' THEN ABS(amount) ELSE 0 END) as total_bets,
        SUM(CASE WHEN transaction_type = 'game_win' THEN amount ELSE 0 END) as total_wins,
        SUM(CASE WHEN transaction_type = 'daily_bonus' THEN amount ELSE 0 END) as total_bonuses,
        COUNT(CASE WHEN datetime(created_at) > datetime('now', '-24 hours') THEN 1 END) as last_24h_transactions
      FROM transaction_logs
    `);

    return stats[0] || {};
  } catch (error) {
    console.error('Failed to get transaction stats:', error);
    return {};
  }
}