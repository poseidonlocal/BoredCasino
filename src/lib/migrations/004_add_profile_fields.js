export const up = async (db) => {
  // Add profile-related columns to users table
  await db.exec(`
    ALTER TABLE users ADD COLUMN bio TEXT;
    ALTER TABLE users ADD COLUMN is_public INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN show_stats INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN show_activity INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN email_notifications INTEGER DEFAULT 1;
    ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
  `);
  
  console.log('Added profile fields to users table');
};

export const down = async (db) => {
  // Note: SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
  // For now, we'll just log that this migration can't be easily reversed
  console.log('Cannot easily reverse profile fields migration in SQLite');
};