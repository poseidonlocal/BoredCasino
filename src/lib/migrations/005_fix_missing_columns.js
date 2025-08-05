import { getConnection } from '../sqlite.js';

export async function runMigration() {
  const connection = await getConnection();
  
  try {
    console.log('Running migration: Fix missing columns...');
    
    // Add missing columns to announcements table
    try {
      await connection.execute(`ALTER TABLE announcements ADD COLUMN expires_at DATETIME DEFAULT NULL`);
      console.log('Added expires_at column to announcements table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('expires_at column already exists or error:', error.message);
      }
    }
    
    // Add missing columns to game_history table
    try {
      await connection.execute(`ALTER TABLE game_history ADD COLUMN amount_bet REAL DEFAULT 0`);
      console.log('Added amount_bet column to game_history table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('amount_bet column already exists or error:', error.message);
      }
    }
    
    try {
      await connection.execute(`ALTER TABLE game_history ADD COLUMN amount_won REAL DEFAULT 0`);
      console.log('Added amount_won column to game_history table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('amount_won column already exists or error:', error.message);
      }
    }
    
    // Create achievement_logs table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS achievement_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        achievement_title TEXT NOT NULL,
        reward REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created achievement_logs table');
    
    // Create security_logs table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT NULL,
        action TEXT NOT NULL,
        ip_address TEXT DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        details TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Created security_logs table');
    
    // Create transaction_logs table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS transaction_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        game_type TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created transaction_logs table');
    
    console.log('Migration completed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}