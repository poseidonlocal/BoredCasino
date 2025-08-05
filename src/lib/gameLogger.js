import { getConnection } from './db';

// Comprehensive game logging system
export class GameLogger {
  static async logGameResult(userId, gameData) {
    try {
      const connection = await getConnection();
      
      // Insert into game_history
      const [gameResult] = await connection.execute(`
        INSERT INTO game_history 
        (user_id, game_type, bet_type, bet_amount, result, payout, profit, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        gameData.gameType,
        gameData.betType || 'Standard',
        gameData.betAmount,
        gameData.result,
        gameData.payout,
        gameData.profit,
        gameData.details || ''
      ]);

      // Update user stats
      await this.updateUserStats(userId, gameData);
      
      // Log transaction
      await this.logTransaction(userId, gameData);
      
      // Update user balance
      await this.updateUserBalance(userId, gameData.profit);
      
      // Award XP
      await this.awardXP(userId, gameData);
      
      return gameResult.insertId;
    } catch (error) {
      console.error('Error logging game result:', error);
      throw error;
    }
  }

  static async updateUserStats(userId, gameData) {
    const connection = await getConnection();
    
    try {
      // Get or create user stats
      const [existingStats] = await connection.execute(
        'SELECT * FROM user_stats WHERE user_id = ?',
        [userId]
      );

      if (existingStats.length === 0) {
        // Create new stats record
        await connection.execute(`
          INSERT INTO user_stats 
          (user_id, games_won, games_lost, total_wagered, total_winnings, total_losses, biggest_win, current_streak, best_streak, total_xp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          gameData.result === 'win' ? 1 : 0,
          gameData.result === 'loss' ? 1 : 0,
          gameData.betAmount,
          gameData.result === 'win' ? gameData.payout : 0,
          gameData.result === 'loss' ? gameData.betAmount : 0,
          gameData.result === 'win' ? gameData.profit : 0,
          gameData.result === 'win' ? 1 : -1,
          gameData.result === 'win' ? 1 : 1,
          0
        ]);
      } else {
        // Update existing stats
        const stats = existingStats[0];
        const newWins = (stats.games_won || 0) + (gameData.result === 'win' ? 1 : 0);
        const newLosses = (stats.games_lost || 0) + (gameData.result === 'loss' ? 1 : 0);
        const newWagered = (stats.total_wagered || 0) + gameData.betAmount;
        const newWinnings = (stats.total_winnings || 0) + (gameData.result === 'win' ? gameData.payout : 0);
        const newTotalLosses = (stats.total_losses || 0) + (gameData.result === 'loss' ? gameData.betAmount : 0);
        const newBiggestWin = Math.max((stats.biggest_win || 0), gameData.result === 'win' ? gameData.profit : 0);
        
        // Update streak
        let newStreak = stats.current_streak || 0;
        if (gameData.result === 'win') {
          newStreak = newStreak >= 0 ? newStreak + 1 : 1;
        } else {
          newStreak = newStreak <= 0 ? newStreak - 1 : -1;
        }
        const newBestStreak = Math.max((stats.best_streak || 0), Math.abs(newStreak));

        await connection.execute(`
          UPDATE user_stats SET
            games_won = ?,
            games_lost = ?,
            current_streak = ?,
            best_streak = ?,
            total_wagered = ?,
            total_winnings = ?,
            total_losses = ?,
            biggest_win = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [newWins, newLosses, newStreak, newBestStreak, newWagered, newWinnings, newTotalLosses, newBiggestWin, userId]);
      }
    } catch (error) {
      console.log('User stats update error (table may not exist):', error.message);
    }

    // Don't try to update non-existent columns in users table
    // The cash_balance update is handled separately in updateUserBalance
  }

  static async logTransaction(userId, gameData) {
    const connection = await getConnection();
    
    try {
      // Get current balance
      const [userResult] = await connection.execute(
        'SELECT cash_balance FROM users WHERE id = ?',
        [userId]
      );
      
      if (userResult.length === 0) return;
      
      const currentBalance = userResult[0].cash_balance || 0;
      const newBalance = currentBalance + gameData.profit;
      
      // Try to log the transaction (table may not exist)
      await connection.execute(`
        INSERT INTO transaction_logs 
        (user_id, transaction_type, amount, balance_before, balance_after, game_type, game_data, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        gameData.result === 'win' ? 'game_win' : 'game_bet',
        gameData.profit,
        currentBalance,
        newBalance,
        gameData.gameType,
        JSON.stringify(gameData),
        `${gameData.result === 'win' ? 'Won' : 'Lost'} ${Math.abs(gameData.profit)} MSP playing ${gameData.gameType}`
      ]);
    } catch (error) {
      console.log('Transaction logging error (table may not exist):', error.message);
    }
  }

  static async updateUserBalance(userId, profitAmount) {
    const connection = await getConnection();
    
    await connection.execute(
      'UPDATE users SET cash_balance = cash_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [profitAmount, userId]
    );
  }

  static async awardXP(userId, gameData) {
    const connection = await getConnection();
    
    // Calculate XP based on game result
    let xpGained = 10; // Base XP for playing
    
    if (gameData.result === 'win') {
      xpGained += 25; // Bonus for winning
      xpGained += Math.floor(gameData.profit / 100); // 1 XP per 100 MSP profit
    }
    
    // Bonus XP for big wins
    if (gameData.profit >= 1000) xpGained += 50;
    if (gameData.profit >= 5000) xpGained += 100;
    
    try {
      // Update user XP (handle missing totalXP column)
      await connection.execute(
        'UPDATE users SET totalXP = COALESCE(totalXP, 0) + ? WHERE id = ?',
        [xpGained, userId]
      );
    } catch (error) {
      console.log('User XP update error (column may not exist):', error.message);
    }
    
    try {
      // Update user_stats XP
      await connection.execute(
        'UPDATE user_stats SET total_xp = COALESCE(total_xp, 0) + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [xpGained, userId]
      );
    } catch (error) {
      console.log('User stats XP update error (table may not exist):', error.message);
    }
    
    return xpGained;
  }

  static async getUserGameStats(userId) {
    const connection = await getConnection();
    
    // Get comprehensive stats
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as totalWins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as totalLosses,
        SUM(bet_amount) as totalWagered,
        SUM(profit) as totalProfit,
        MAX(profit) as biggestWin,
        MIN(profit) as biggestLoss,
        AVG(bet_amount) as avgBet
      FROM game_history 
      WHERE user_id = ?
    `, [userId]);

    // Get game breakdown
    const [gameBreakdown] = await connection.execute(`
      SELECT 
        game_type,
        COUNT(*) as count,
        SUM(profit) as totalProfit,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        AVG(bet_amount) as avgBet
      FROM game_history 
      WHERE user_id = ?
      GROUP BY game_type
      ORDER BY count DESC
    `, [userId]);

    // Get user stats
    const [userStats] = await connection.execute(`
      SELECT * FROM user_stats WHERE user_id = ?
    `, [userId]);

    return {
      overall: stats[0] || {},
      gameBreakdown: gameBreakdown || [],
      userStats: userStats[0] || {}
    };
  }

  static async getRecentActivity(userId, limit = 10) {
    const connection = await getConnection();
    
    const [activity] = await connection.execute(`
      SELECT 
        game_type,
        result,
        profit,
        bet_amount,
        details,
        created_at
      FROM game_history 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    return activity.map(item => ({
      type: item.result,
      description: `${item.result === 'win' ? 'Won' : 'Lost'} ${Math.abs(item.profit)} MSP playing ${item.game_type}`,
      amount: item.profit,
      timestamp: this.formatTimeAgo(item.created_at),
      details: item.details
    }));
  }

  static formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }
}

// Helper functions for different game types
export const GameFormatters = {
  roulette: (betType, betAmount, result, payout, winningNumber) => ({
    gameType: 'roulette',
    betType: betType,
    betAmount: betAmount,
    result: result,
    payout: payout,
    profit: payout - betAmount,
    details: `Bet on ${betType}, winning number: ${winningNumber}`
  }),

  slots: (betAmount, result, payout, symbols) => ({
    gameType: 'slots',
    betType: 'Spin',
    betAmount: betAmount,
    result: result,
    payout: payout,
    profit: payout - betAmount,
    details: `Symbols: ${symbols.join(' | ')}`
  }),

  poker: (betAmount, result, payout, playerHand, dealerHand) => ({
    gameType: 'poker',
    betType: 'Texas Hold\'em',
    betAmount: betAmount,
    result: result,
    payout: payout,
    profit: payout - betAmount,
    details: `Player: ${playerHand} vs Dealer: ${dealerHand}`
  }),

  coinflip: (betSide, betAmount, result, payout, actualSide) => ({
    gameType: 'coinflip',
    betType: betSide,
    betAmount: betAmount,
    result: result,
    payout: payout,
    profit: payout - betAmount,
    details: `Bet ${betSide}, landed ${actualSide}`
  }),

  caseOpening: (caseType, betAmount, result, payout, itemName, rarity) => ({
    gameType: 'case_opening',
    betType: caseType,
    betAmount: betAmount,
    result: result,
    payout: payout,
    profit: payout - betAmount,
    details: `Unboxed: ${itemName} (${rarity})`
  })
};