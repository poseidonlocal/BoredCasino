import { addXPLevelColumns } from '../../../lib/migrations/add_xp_level_columns';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const success = await addXPLevelColumns();
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'XP and level columns added successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Migration failed' 
      });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}