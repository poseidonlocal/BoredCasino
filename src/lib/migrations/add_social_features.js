import { getConnection } from '../db';

export async function createSocialTables() {
  const connection = await getConnection();

  try {
    // Create friendships table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (user_id, friend_id)
      )
    `);

    // Create game_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS game_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        game_type VARCHAR(50) NOT NULL,
        bet_type VARCHAR(100),
        bet_amount DECIMAL(10,2) NOT NULL,
        result ENUM('win', 'loss') NOT NULL,
        payout DECIMAL(10,2) DEFAULT 0,
        profit DECIMAL(10,2) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_game (user_id, created_at),
        INDEX idx_game_type (game_type),
        INDEX idx_result (result)
      )
    `);

    // Create chat_messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_created_at (created_at)
      )
    `);

    // Create notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_unread (user_id, read_at),
        INDEX idx_type (type)
      )
    `);

    // Add online status columns to users table if they don't exist
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS isOnline BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('Social features tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating social tables:', error);
    throw error;
  }
}

export async function dropSocialTables() {
  const connection = await getConnection();

  try {
    await connection.execute('DROP TABLE IF EXISTS notifications');
    await connection.execute('DROP TABLE IF EXISTS chat_messages');
    await connection.execute('DROP TABLE IF EXISTS game_history');
    await connection.execute('DROP TABLE IF EXISTS friendships');
    
    // Remove added columns from users table
    await connection.execute('ALTER TABLE users DROP COLUMN IF EXISTS isOnline');
    await connection.execute('ALTER TABLE users DROP COLUMN IF EXISTS lastLogin');

    console.log('Social features tables dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping social tables:', error);
    throw error;
  }
}