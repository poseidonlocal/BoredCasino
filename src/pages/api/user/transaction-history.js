import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const { limit = 20, offset = 0 } = req.query;
    
    const connection = await getConnection();
    
    // Get user's transaction history - try both table names
    let transactions = [];
    let stats = [{ total_wins: 0, total_bets: 0, total_bonuses: 0 }];
    
    try {
      // Try transactions table first
      const [transactionRows] = await connection.execute(`
        SELECT 
          transaction_type,
          game_type,
          amount,
          description,
          created_at
        FROM transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)]);
      
      transactions = transactionRows;
      
      // Get transaction statistics
      const [statsRows] = await connection.execute(`
        SELECT 
          SUM(CASE WHEN transaction_type = 'game_win' THEN amount ELSE 0 END) as total_wins,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_bets,
          SUM(CASE WHEN transaction_type = 'daily_bonus' THEN amount ELSE 0 END) as total_bonuses
        FROM transactions
        WHERE user_id = ?
      `, [userId]);
      
      stats = statsRows;
      
    } catch (error) {
      // Try transaction_logs table as fallback
      try {
        const [logRows] = await connection.execute(`
          SELECT * FROM transaction_logs
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), parseInt(offset)]);
        
        transactions = logRows;
        
        const [logStats] = await connection.execute(`
          SELECT 
            SUM(CASE WHEN transaction_type = 'game_win' THEN amount ELSE 0 END) as total_wins,
            SUM(CASE WHEN transaction_type = 'game_bet' THEN ABS(amount) ELSE 0 END) as total_bets,
            SUM(CASE WHEN transaction_type = 'daily_bonus' THEN amount ELSE 0 END) as total_bonuses
          FROM transaction_logs
          WHERE user_id = ?
        `, [userId]);
        
        stats = logStats;
        
      } catch (fallbackError) {
        console.log('No transaction tables found:', fallbackError.message);
        // Return empty data
      }
    }

    res.status(200).json({
      transactions,
      stats: stats[0],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: transactions.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
}