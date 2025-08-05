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

    // Update users table with new columns
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totalXP INTEGER DEFAULT 0
      `);
    } catch (error) {
      // Column might already exist
      console.log('totalXP column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN isOnline INTEGER DEFAULT 0
      `);
    } catch (error) {
      console.log('isOnline column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN lastLogin DATETIME DEFAULT CURRENT_TIMESTAMP
      `);
    } catch (error) {
      console.log('lastLogin column already exists or error:', error.message);
    }

    // Update game_history table structure
    try {
      await connection.execute(`
        ALTER TABLE game_history ADD COLUMN bet_type TEXT DEFAULT 'Standard'
      `);
    } catch (error) {
      console.log('bet_type column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE game_history ADD COLUMN result TEXT CHECK(result IN ('win', 'loss'))
      `);
    } catch (error) {
      console.log('result column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE game_history ADD COLUMN payout REAL DEFAULT 0.00
      `);
    } catch (error) {
      console.log('payout column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE game_history ADD COLUMN profit REAL DEFAULT 0.00
      `);
    } catch (error) {
      console.log('profit column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE game_history ADD COLUMN details TEXT DEFAULT NULL
      `);
    } catch (error) {
      console.log('details column already exists or error:', error.message);
    }

    // Update user_stats table with new columns
    try {
      await connection.execute(`
        ALTER TABLE user_stats ADD COLUMN games_lost INTEGER DEFAULT 0
      `);
    } catch (error) {
      console.log('games_lost column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE user_stats ADD COLUMN total_winnings REAL DEFAULT 0.00
      `);
    } catch (error) {
      console.log('total_winnings column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE user_stats ADD COLUMN total_losses REAL DEFAULT 0.00
      `);
    } catch (error) {
      console.log('total_losses column already exists or error:', error.message);
    }

    try {
      await connection.execute(`
        ALTER TABLE user_stats ADD COLUMN biggest_win REAL DEFAULT 0.00
      `);
    } catch (error) {
      console.log('biggest_win column already exists or error:', error.message);
    }

    // Create missing tables
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        read_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Initialize user_stats for existing users who don't have records
    await connection.execute(`
      INSERT INTO user_stats (user_id, total_xp, current_level)
      SELECT id, COALESCE(totalXP, 0), 1
      FROM users 
      WHERE id NOT IN (SELECT user_id FROM user_stats)
    `);

    // Update existing game_history records to have proper result values
    await connection.execute(`
      UPDATE game_history 
      SET result = CASE 
        WHEN win_amount > bet_amount THEN 'win'
        ELSE 'loss'
      END,
      payout = COALESCE(win_amount, 0),
      profit = COALESCE(win_amount, 0) - bet_amount
      WHERE result IS NULL
    `);

    // Log the migration
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
      [admin.id, 'complete_migration', JSON.stringify({ 
        tables: ['users', 'game_history', 'user_stats', 'friendships', 'chat_messages', 'notifications'],
        timestamp: new Date().toISOString()
      }), clientIP]
    );

    return res.status(200).json({ 
      message: 'Complete database migration successful',
      tables: ['users', 'game_history', 'user_stats', 'friendships', 'chat_messages', 'notifications'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Complete migration error:', error);
    if (error.message === 'Admin authentication failed') {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (error.message === 'Not authorized as admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return res.status(500).json({ message: 'Migration failed', error: error.message });
  }
}