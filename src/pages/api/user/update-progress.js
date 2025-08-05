import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { 
      gameType, 
      result, 
      betAmount, 
      payout, 
      xpGained = 0,
      achievementUnlocked = null 
    } = req.body;

    if (!gameType || !result || !betAmount) {
      return res.status(400).json({ message: 'Missing required game data' });
    }

    const connection = await getConnection();
    const profit = (payout || 0) - betAmount;

    // Update user XP and balance
    try {
      await connection.execute(`
        UPDATE users 
        SET 
          totalXP = COALESCE(totalXP, 0) + ?,
          cash_balance = COALESCE(cash_balance, 0) + ?
        WHERE id = ?
      `, [xpGained, profit, user.id]);
    } catch (error) {
      console.log('User XP update error (column may not exist):', error.message);
      // Try updating just balance if totalXP column doesn't exist
      try {
        await connection.execute(`
          UPDATE users 
          SET cash_balance = COALESCE(cash_balance, 0) + ?
          WHERE id = ?
        `, [profit, user.id]);
      } catch (balanceError) {
        console.log('Balance update error:', balanceError.message);
      }
    }

    // Record game in history
    try {
      await connection.execute(`
        INSERT INTO game_history 
        (user_id, game_type, bet_amount, result, payout, profit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [user.id, gameType, betAmount, result, payout || 0, profit]);
    } catch (error) {
      console.log('Game history insert error:', error.message);
    }

    // Update user stats table
    try {
      // Check if user_stats record exists
      const [existingStats] = await connection.execute(
        'SELECT id FROM user_stats WHERE user_id = ?',
        [user.id]
      );

      if (existingStats.length === 0) {
        // Create new stats record
        await connection.execute(`
          INSERT INTO user_stats 
          (user_id, total_xp, games_won, games_lost, total_wagered, total_winnings, total_losses, biggest_win)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          xpGained,
          result === 'win' ? 1 : 0,
          result === 'loss' ? 1 : 0,
          betAmount,
          result === 'win' ? (payout || 0) : 0,
          result === 'loss' ? betAmount : 0,
          result === 'win' ? profit : 0
        ]);
      } else {
        // Update existing stats
        await connection.execute(`
          UPDATE user_stats 
          SET 
            total_xp = COALESCE(total_xp, 0) + ?,
            games_won = COALESCE(games_won, 0) + ?,
            games_lost = COALESCE(games_lost, 0) + ?,
            total_wagered = COALESCE(total_wagered, 0) + ?,
            total_winnings = COALESCE(total_winnings, 0) + ?,
            total_losses = COALESCE(total_losses, 0) + ?,
            biggest_win = CASE 
              WHEN ? > COALESCE(biggest_win, 0) THEN ? 
              ELSE COALESCE(biggest_win, 0) 
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [
          xpGained,
          result === 'win' ? 1 : 0,
          result === 'loss' ? 1 : 0,
          betAmount,
          result === 'win' ? (payout || 0) : 0,
          result === 'loss' ? betAmount : 0,
          result === 'win' ? profit : 0,
          result === 'win' ? profit : 0,
          user.id
        ]);
      }
    } catch (error) {
      console.log('User stats update error:', error.message);
    }

    // Handle achievement unlocking
    if (achievementUnlocked) {
      try {
        // Get current badges
        const [userBadges] = await connection.execute(
          'SELECT badges FROM user_stats WHERE user_id = ?',
          [user.id]
        );

        let badges = [];
        if (userBadges.length > 0 && userBadges[0].badges) {
          try {
            badges = JSON.parse(userBadges[0].badges);
          } catch (e) {
            badges = [];
          }
        }

        // Add new achievement if not already present
        if (!badges.some(badge => badge.type === achievementUnlocked.type)) {
          badges.push({
            ...achievementUnlocked,
            unlockedAt: new Date().toISOString()
          });

          await connection.execute(
            'UPDATE user_stats SET badges = ? WHERE user_id = ?',
            [JSON.stringify(badges), user.id]
          );
        }
      } catch (error) {
        console.log('Achievement update error:', error.message);
      }
    }

    // Calculate new level
    const newLevel = Math.floor(Math.sqrt((user.totalXP + xpGained) / 100)) + 1;
    const oldLevel = Math.floor(Math.sqrt((user.totalXP || 0) / 100)) + 1;
    const leveledUp = newLevel > oldLevel;

    return res.status(200).json({
      message: 'Progress updated successfully',
      xpGained,
      newBalance: (user.cash_balance || 0) + profit,
      profit,
      leveledUp,
      newLevel: leveledUp ? newLevel : null,
      achievementUnlocked
    });

  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}