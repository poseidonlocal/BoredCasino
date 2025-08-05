import { runMigration } from '../lib/migrations/005_fix_missing_columns.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { migrationKey } = req.body;
    
    // Simple migration key check
    if (migrationKey !== 'fix-database-2024') {
      return res.status(403).json({ error: 'Invalid migration key' });
    }

    await runMigration();
    res.status(200).json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message 
    });
  }
}