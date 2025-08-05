import { getConnection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, key } = req.body;
    
    // Simple security key
    if (key !== 'db-access-2024') {
      return res.status(403).json({ error: 'Invalid access key' });
    }

    const connection = await getConnection();
    
    if (query.toLowerCase().startsWith('select')) {
      const [rows] = await connection.execute(query);
      res.status(200).json({ success: true, data: rows });
    } else {
      const [result] = await connection.execute(query);
      res.status(200).json({ 
        success: true, 
        message: 'Query executed successfully',
        affectedRows: result.affectedRows || result.changes || 0
      });
    }
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      error: 'Query failed', 
      details: error.message 
    });
  }
}