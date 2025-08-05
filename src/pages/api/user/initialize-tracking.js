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

    const connection = await getConnection();
    const results = [];

    // 1. Ensure user has all required columns
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN totalXP INTEGER DEFAULT 0`);
      results.push('Added totalXP column to users table');
    } catch (error) {
      results.push('totalXP column already exists or error: ' + error.message);
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN isOnline INTEGER DEFAULT 0`);
      results.push('Added isOnline column to users table');
    } catch (error) {
      results.push('isOnline column already exists or error: ' + error.message);
    }

    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN lastLogin DATETIME DEFAULT CURRENT_TIMESTAMP`);
      results.push('Added lastLogin column to users table');
    } catch (error) {
      results.push('lastLogin column already exists or error: ' + error.message);
    }

    // 2. Create user_stats table if it doesn't exist
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          total_xp INTEGER DEFAULT 0,
          current_level INTEGER DEFAULT 1,
          games_won INTEGER DEFAULT 0,
          games_lost INTEGER DEFAULT 0,
          current_streak INTEGER DEFAULT 0,
          best_streak INTEGER DEFAULT 0,
          total_wagered REAL DEFAULT 0.00,
          total_winnings REAL DEFAULT 0.00,
          total_losses REAL DEFAULT 0.00,
          biggest_win REAL DEFAULT 0.00,
          badges TEXT DEFAULT '[]',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      results.push('Created/verified user_stats table');
    } catch (error) {
      results.push('User stats table error: ' + error.message);
    }

    // 3. Initialize user_stats for this user if not exists
    try {
      const [existingStats] = await connection.execute(
        'SELECT id FROM user_stats WHERE user_id = ?',
        [user.id]
      );

      if (existingStats.length === 0) {
        // Calculate initial stats from game_history if it exists
        let initialStats = {
          games_won: 0,
          games_lost: 0,
          total_wagered: 0,
          total_winnings: 0,
          total_losses: 0,
          biggest_win: 0,
          current_streak: 0,
          best_streak: 0
        };

        try {
          const [gameHistory] = await connection.execute(`
            SELECT 
              COUNT(*) as total_games,
              SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as games_won,
              SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as games_lost,
              SUM(bet_amount) as total_wagered,
              SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END) as total_winnings,
              SUM(CASE WHEN result = 'loss' THEN bet_amount ELSE 0 END) as total_losses,
              MAX(CASE WHEN result = 'win' THEN profit ELSE 0 END) as biggest_win
            FROM game_history 
            WHERE user_id = ?
          `, [user.id]);

          if (gameHistory.length > 0 && gameHistory[0].total_games > 0) {
            initialStats = {
              games_won: gameHistory[0].games_won || 0,
              games_lost: gameHistory[0].games_lost || 0,
              total_wagered: gameHistory[0].total_wagered || 0,
              total_winnings: gameHistory[0].total_winnings || 0,
              total_losses: gameHistory[0].total_losses || 0,
              biggest_win: gameHistory[0].biggest_win || 0,
              current_streak: 0,
              best_streak: 0
            };
          }
        } catch (error) {
          console.log('Game history calculation error:', error.message);
        }

        await connection.execute(`
          INSERT INTO user_stats 
          (user_id, total_xp, games_won, games_lost, total_wagered, total_winnings, total_losses, biggest_win, current_streak, best_streak)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.id,
          user.totalXP || 0,
          initialStats.games_won,
          initialStats.games_lost,
          initialStats.total_wagered,
          initialStats.total_winnings,
          initialStats.total_losses,
          initialStats.biggest_win,
          initialStats.current_streak,
          initialStats.best_streak
        ]);

        results.push('Initialized user_stats with calculated values');
      } else {
        results.push('User stats already exist');
      }
    } catch (error) {
      results.push('User stats initialization error: ' + error.message);
    }

    // 4. Update NULL values in users table
    try {
      await connection.execute(`UPDATE users SET totalXP = 0 WHERE totalXP IS NULL AND id = ?`, [user.id]);
      await connection.execute(`UPDATE users SET isOnline = 0 WHERE isOnline IS NULL AND id = ?`, [user.id]);
      results.push('Updated NULL values for user');
    } catch (error) {
      results.push('NULL value update error: ' + error.message);
    }

    // 5. Calculate current lifetime earnings
    let lifetimeEarnings = 0;
    try {
      const [earnings] = await connection.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END), 0) as total_payouts,
          COALESCE(SUM(bet_amount), 0) as total_wagered,
          COALESCE(SUM(profit), 0) as net_profit
        FROM game_history 
        WHERE user_id = ?
      `, [user.id]);

      if (earnings.length > 0) {
        lifetimeEarnings = earnings[0].total_payouts || 0;
        results.push(`Calculated lifetime earnings: ${lifetimeEarnings} MSP`);
      }
    } catch (error) {
      results.push('Lifetime earnings calculation error: ' + error.message);
    }

    // 6. Get current user stats
    let currentStats = {};
    try {
      const [stats] = await connection.execute(`
        SELECT * FROM user_stats WHERE user_id = ?
      `, [user.id]);

      if (stats.length > 0) {
        currentStats = stats[0];
      }
    } catch (error) {
      results.push('Current stats retrieval error: ' + error.message);
    }

    return res.status(200).json({
      message: 'User tracking initialized successfully',
      results,
      lifetimeEarnings,
      currentStats,
      userId: user.id
    });

  } catch (error) {
    console.error('Initialize tracking error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}