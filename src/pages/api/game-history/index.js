import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const connection = await getConnection();

    if (req.method === 'GET') {
      const { filter = 'all', sortBy = 'recent', limit = 50 } = req.query;

      let whereClause = 'WHERE user_id = ?';
      let params = [user.id];

      // Apply filters
      if (filter !== 'all') {
        if (filter === 'wins') {
          whereClause += ' AND result = ?';
          params.push('win');
        } else if (filter === 'losses') {
          whereClause += ' AND result = ?';
          params.push('loss');
        } else {
          whereClause += ' AND game_type = ?';
          params.push(filter);
        }
      }

      // Apply sorting
      let orderClause = 'ORDER BY created_at DESC';
      if (sortBy === 'oldest') orderClause = 'ORDER BY created_at ASC';
      else if (sortBy === 'profit') orderClause = 'ORDER BY profit DESC';
      else if (sortBy === 'bet') orderClause = 'ORDER BY bet_amount DESC';

      const [games] = await connection.execute(`
        SELECT 
          id,
          game_type,
          bet_type,
          bet_amount,
          result,
          payout,
          profit,
          details,
          created_at
        FROM game_history 
        ${whereClause}
        ${orderClause}
        LIMIT ?
      `, [...params, parseInt(limit)]);

      return res.status(200).json(games);
    }

    if (req.method === 'POST') {
      // Record a new game
      const { gameType, betType, betAmount, result, payout, details } = req.body;

      if (!gameType || !betAmount || !result) {
        return res.status(400).json({ message: 'Missing required game data' });
      }

      const profit = payout - betAmount;

      await connection.execute(`
        INSERT INTO game_history 
        (user_id, game_type, bet_type, bet_amount, result, payout, profit, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.id, gameType, betType, betAmount, result, payout, profit, details]);

      return res.status(201).json({ message: 'Game recorded successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Game history API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}