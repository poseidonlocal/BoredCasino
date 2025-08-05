import { initializeDatabase } from '../../lib/sqlite';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await initializeDatabase();
    return res.status(200).json({ 
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      message: 'Database initialization failed',
      error: error.message
    });
  }
}