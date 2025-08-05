import { getConnection } from '../../../lib/db';
import { verifyAdmin } from '../../../lib/adminAuth';
import { createWithdrawalsTable } from '../../../lib/createWithdrawalsTable';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status = 'pending', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const connection = await getConnection();
    
    // Ensure withdrawals table exists
    await createWithdrawalsTable();

    let whereClause = '';
    let queryParams = [];

    if (status !== 'all') {
      whereClause = 'WHERE w.status = ?';
      queryParams.push(status);
    }

    // Get withdrawals with user information
    const [withdrawals] = await connection.execute(`
      SELECT 
        w.*,
        u.username,
        u.email,
        admin.username as processed_by_username
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      LEFT JOIN users admin ON w.processed_by = admin.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await connection.execute(`
      SELECT COUNT(*) as total
      FROM withdrawals w
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;

    res.status(200).json({
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}