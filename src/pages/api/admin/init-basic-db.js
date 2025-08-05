import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const admin = await verifyAdmin(req);

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    const connection = await getConnection();

    // Ensure basic users table exists and has required columns
    try {
      // Check if totalXP column exists, if not add it
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totalXP INTEGER DEFAULT 0
      `);
      console.log('Added totalXP column to users table');
    } catch (error) {
      console.log('totalXP column already exists or error:', error.message);
    }

    // Ensure game_history table has the right structure
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS game_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          game_type TEXT NOT NULL,
          bet_type TEXT DEFAULT 'Standard',
          bet_amount REAL NOT NULL,
          result TEXT DEFAULT 'loss',
          payout REAL DEFAULT 0.00,
          profit REAL DEFAULT 0.00,
          details TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('Ensured game_history table exists');
    } catch (error) {
      console.log('Game history table error:', error.message);
    }

    // Ensure user_stats table exists
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
      console.log('Ensured user_stats table exists');
    } catch (error) {
      console.log('User stats table error:', error.message);
    }

    // Initialize user_stats for existing users who don't have records
    try {
      await connection.execute(`
        INSERT INTO user_stats (user_id, total_xp, current_level)
        SELECT id, COALESCE(totalXP, 0), 1
        FROM users 
        WHERE id NOT IN (SELECT user_id FROM user_stats)
      `);
      console.log('Initialized user_stats for existing users');
    } catch (error) {
      console.log('User stats initialization error:', error.message);
    }

    // Create some sample game history for testing if none exists
    try {
      const [existingGames] = await connection.execute('SELECT COUNT(*) as count FROM game_history');
      if (existingGames[0].count === 0) {
        // Get first user ID
        const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
          const userId = users[0].id;
          
          // Add some sample games
          await connection.execute(`
            INSERT INTO game_history (user_id, game_type, bet_amount, result, payout, profit, details)
            VALUES 
            (?, 'roulette', 100, 'win', 200, 100, 'Bet on Red, won'),
            (?, 'slots', 50, 'loss', 0, -50, 'No matching symbols'),
            (?, 'poker', 200, 'win', 400, 200, 'Full House beats Two Pair')
          `, [userId, userId, userId]);
          
          console.log('Added sample game history');
        }
      }
    } catch (error) {
      console.log('Sample data creation error:', error.message);
    }

    // Log the initialization
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    try {
      await connection.execute(
        'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
        [admin.id, 'init_basic_db', JSON.stringify({ 
          action: 'basic_database_initialization',
          timestamp: new Date().toISOString()
        }), clientIP]
      );
    } catch (error) {
      console.log('Admin action logging error:', error.message);
    }

    return res.status(200).json({ 
      message: 'Basic database initialization completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Basic DB initialization error:', error);
    if (error.message === 'Admin authentication failed') {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (error.message === 'Not authorized as admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return res.status(500).json({ message: 'Initialization failed', error: error.message });
  }
}