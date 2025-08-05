import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = await verifyAdmin(req);
    const connection = await getConnection();

    const { page = 1, limit = 50, adminId = '', actionType = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (adminId) {
      whereClause += ' AND aa.admin_id = ?';
      params.push(adminId);
    }

    if (actionType) {
      whereClause += ' AND aa.action_type = ?';
      params.push(actionType);
    }

    const [activities] = await connection.execute(`
      SELECT 
        aa.id,
        aa.action_type,
        aa.details,
        aa.ip_address,
        aa.created_at,
        admin.username as admin_username,
        target.username as target_username
      FROM admin_actions aa
      JOIN users admin ON aa.admin_id = admin.id
      LEFT JOIN users target ON aa.target_user_id = target.id
      ${whereClause}
      ORDER BY aa.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [totalCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM admin_actions aa
      ${whereClause}
    `, params);

    res.status(200).json({
      activities,
      totalCount: totalCount[0].count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount[0].count / limit)
    });

  } catch (error) {
    console.error('Admin activity error:', error);
    res.status(403).json({ message: error.message });
  }
}