import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.join(process.cwd(), 'casino_app.db');
let db = null;

// Initialize SQLite database
function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database:', dbPath);
        resolve(db);
      }
    });
  });
}

// Get database connection
export async function getConnection() {
  if (!db) {
    await initDB();
  }
  
  // Return a connection object with execute method similar to MySQL
  return {
    execute: async (query, params = []) => {
      return new Promise((resolve, reject) => {
        // Handle SELECT queries
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          db.all(query, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              // Return in MySQL format [rows]
              resolve([rows]);
            }
          });
        }
        // Handle INSERT queries
        else if (query.trim().toUpperCase().startsWith('INSERT')) {
          db.run(query, params, function(err) {
            if (err) {
              reject(err);
            } else {
              // Return in MySQL format with insertId
              resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
            }
          });
        }
        // Handle UPDATE/DELETE queries
        else {
          db.run(query, params, function(err) {
            if (err) {
              reject(err);
            } else {
              // Return in MySQL format
              resolve([{ affectedRows: this.changes }]);
            }
          });
        }
      });
    }
  };
}

// Initialize database tables
export async function initializeDatabase() {
  const connection = await getConnection();
  
  try {
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        cash_balance REAL DEFAULT 1000.00,
        is_admin INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        is_banned INTEGER DEFAULT 0,
        ban_reason TEXT DEFAULT NULL,
        last_daily_bonus DATE DEFAULT NULL,
        total_winnings REAL DEFAULT 0.00,
        total_losses REAL DEFAULT 0.00,
        games_played INTEGER DEFAULT 0,
        last_login DATETIME DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        is_public INTEGER DEFAULT 1,
        show_stats INTEGER DEFAULT 1,
        show_activity INTEGER DEFAULT 1,
        email_notifications INTEGER DEFAULT 1,
        totalXP INTEGER DEFAULT 0,
        isOnline INTEGER DEFAULT 0,
        lastLogin DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create game_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL CHECK(game_type IN ('roulette', 'slots', 'coinflip', 'poker', 'blackjack', 'case_opening')),
        bet_type TEXT DEFAULT 'Standard',
        bet_amount REAL NOT NULL,
        result TEXT NOT NULL CHECK(result IN ('win', 'loss')),
        payout REAL DEFAULT 0.00,
        profit REAL NOT NULL,
        details TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create daily_bonuses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS daily_bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        bonus_amount REAL DEFAULT 100.00,
        claimed_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, claimed_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create transactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('game_win', 'game_loss', 'daily_bonus', 'admin_adjustment')),
        game_type TEXT DEFAULT NULL,
        amount REAL NOT NULL,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create system_settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        setting_type TEXT DEFAULT 'string' CHECK(setting_type IN ('string', 'number', 'boolean', 'json')),
        description TEXT DEFAULT NULL,
        updated_by INTEGER DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create announcements table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'success', 'error')),
        is_active INTEGER DEFAULT 1,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create admin_actions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        target_user_id INTEGER DEFAULT NULL,
        details TEXT DEFAULT NULL,
        ip_address TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create user_stats table for ranking system
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

    // Create player_of_day table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS player_of_day (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        bonus_amount REAL NOT NULL,
        draw_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(draw_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create raffle_entries table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        raffle_date DATE NOT NULL,
        entry_fee REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create raffle_winners table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS raffle_winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        raffle_date DATE NOT NULL,
        winning_amount REAL NOT NULL,
        total_entries INTEGER NOT NULL,
        admin_fee REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(raffle_date),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create friendships table
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

    // Create chat_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create notifications table
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

    // Create leaderboard_cache table for performance
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS leaderboard_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        value REAL NOT NULL,
        rank_position INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add transaction_logs table for comprehensive transaction logging
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS transaction_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('game_bet', 'game_win', 'daily_bonus', 'admin_adjustment', 'purchase', 'refund')),
        amount REAL NOT NULL,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        game_type TEXT CHECK (game_type IN ('roulette', 'slots', 'texas_holdem', 'coinflip')),
        game_data TEXT, -- JSON string
        description TEXT NOT NULL,
        ip_address TEXT,
        admin_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);

    // Create indexes for better performance
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_transaction_logs_type ON transaction_logs(transaction_type)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_transaction_logs_game_type ON transaction_logs(game_type)`);
    await connection.execute(`CREATE INDEX IF NOT EXISTS idx_transaction_logs_admin_id ON transaction_logs(admin_id)`);

    console.log('SQLite database tables created successfully');
    
    // Insert default data if tables are empty
    await insertDefaultData(connection);
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Insert default data
async function insertDefaultData(connection) {
  try {
    // Check if admin user exists
    const [adminCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE username = ?',
      ['admin']
    );

    if (adminCheck[0].count === 0) {
      // Insert default users
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, cash_balance, is_admin) VALUES
        ('admin', 'admin@boredcasino.com', '$2b$10$lx1H6mmzLoZ3nhTHVeGIl.dcPV3QSeS2tD/jExpvLe4HhZcxboCCq', 50000.00, 1),
        ('testuser', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1500.00, 0),
        ('player1', 'player1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2000.00, 0),
        ('highroller', 'highroller@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 10000.00, 0)
      `);

      // Insert sample game history
      await connection.execute(`
        INSERT INTO game_history (user_id, game_type, bet_amount, win_amount, game_data) VALUES
        (2, 'roulette', 50.00, 100.00, '{"bet_type": "red", "winning_number": 7, "result": "win"}'),
        (2, 'slots', 25.00, 0.00, '{"reels": ["穀", "豪", "濠"], "result": "lose"}'),
        (3, 'roulette', 100.00, 0.00, '{"bet_type": "number", "bet_number": 13, "winning_number": 7, "result": "lose"}'),
        (4, 'slots', 500.00, 2500.00, '{"reels": ["穀", "穀", "穀"], "result": "jackpot"}')
      `);

      // Insert default system settings
      await connection.execute(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
        ('daily_bonus_amount', '100', 'number', 'Daily bonus amount in dollars'),
        ('max_bet_amount', '1000', 'number', 'Maximum bet amount allowed'),
        ('min_bet_amount', '1', 'number', 'Minimum bet amount allowed'),
        ('maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
        ('registration_enabled', 'true', 'boolean', 'Enable/disable new user registration'),
        ('casino_name', 'BoredCasino', 'string', 'Casino name displayed to users'),
        ('welcome_bonus', '1000', 'number', 'Welcome bonus for new users')
      `);

      // Insert sample announcement
      await connection.execute(`
        INSERT INTO announcements (title, message, type, created_by) VALUES
        ('Welcome to BoredCasino!', 'Enjoy our games and claim your daily bonus!', 'info', 1)
      `);

      console.log('Default data inserted successfully');
    }
  } catch (error) {
    console.error('Error inserting default data:', error);
  }
}

export default { getConnection, initializeDatabase };