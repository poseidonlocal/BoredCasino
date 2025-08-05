// Migration to add XP and level columns to users table
import { getConnection } from '../db';

export async function addXPLevelColumns() {
  try {
    const connection = await getConnection();
    
    // Add totalXP column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totalXP INTEGER DEFAULT 0
      `);
      console.log('Added totalXP column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding totalXP column:', error);
      }
    }
    
    // Add level column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1
      `);
      console.log('Added level column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding level column:', error);
      }
    }
    
    // Add gamesPlayed column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN gamesPlayed INTEGER DEFAULT 0
      `);
      console.log('Added gamesPlayed column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding gamesPlayed column:', error);
      }
    }
    
    // Add totalWinnings column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN totalWinnings INTEGER DEFAULT 0
      `);
      console.log('Added totalWinnings column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding totalWinnings column:', error);
      }
    }
    
    // Add winRate column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN winRate REAL DEFAULT 0
      `);
      console.log('Added winRate column to users table');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.error('Error adding winRate column:', error);
      }
    }
    
    console.log('XP and level columns migration completed successfully');
    return true;
    
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Run migration if called directly
if (require.main === module) {
  addXPLevelColumns().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}