import { getConnection } from '../../lib/db';
import { verifyToken } from '../../lib/auth';

export default async function handler(req, res) {
    try {
        const user = await verifyToken(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.method === 'GET') {
            const { filter = 'all', sortBy = 'date', limit = 50 } = req.query;
            const connection = await getConnection();

            let whereClause = 'WHERE user_id = ?';
            let params = [user.id];

            if (filter !== 'all') {
                whereClause += ' AND game_type = ?';
                params.push(filter);
            }

            let orderClause = 'ORDER BY created_at DESC';
            if (sortBy === 'amount') {
                orderClause = 'ORDER BY amount_won DESC';
            } else if (sortBy === 'game') {
                orderClause = 'ORDER BY game_type ASC, created_at DESC';
            }

            const [games] = await connection.execute(`
        SELECT id, game_type, bet_amount as amount_bet, payout as amount_won, result, created_at
        FROM game_history 
        ${whereClause}
        ${orderClause}
        LIMIT ?
      `, [...params, parseInt(limit)]);

            res.status(200).json({ games });
        } else if (req.method === 'POST') {
            // Record a new game result
            const { gameType, amountBet, amountWon, result, details } = req.body;

            if (!gameType || amountBet === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const connection = await getConnection();

            await connection.execute(`
        INSERT INTO game_history (user_id, game_type, bet_amount, payout, result, details, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [user.id, gameType, amountBet, amountWon || 0, result || 'unknown', JSON.stringify(details || {})]);

            res.status(200).json({ success: true });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error handling game history:', error);
        res.status(500).json({ error: 'Failed to handle game history' });
    }
}