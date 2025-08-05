import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const admin = await verifyAdmin(req);
    
    const connection = await getConnection();
    
    // Get recent transactions
    const [recentTransactions] = await connection.execute(`
      SELECT 
        tl.id,
        tl.user_id,
        u.username,
        tl.transaction_type,
        tl.amount,
        tl.game_type,
        tl.created_at,
        CASE
          WHEN tl.transaction_type = 'game_bet' THEN 'placed a bet'
          WHEN tl.transaction_type = 'game_win' THEN 'won a game'
          WHEN tl.transaction_type = 'daily_bonus' THEN 'claimed daily bonus'
          WHEN tl.transaction_type = 'admin_adjustment' THEN 'received admin adjustment'
          WHEN tl.transaction_type = 'purchase' THEN 'made a purchase'
          WHEN tl.transaction_type = 'refund' THEN 'received a refund'
          ELSE tl.transaction_type
        END as action
      FROM transaction_logs tl
      JOIN users u ON tl.user_id = u.id
      ORDER BY tl.created_at DESC
      LIMIT 20
    `);
    
    // Get recent logins
    const [recentLogins] = await connection.execute(`
      SELECT 
        u.id as user_id,
        u.username,
        u.last_login as created_at,
        'logged in' as action
      FROM users u
      WHERE u.last_login IS NOT NULL
      ORDER BY u.last_login DESC
      LIMIT 10
    `);
    
    // Get recent registrations
    const [recentRegistrations] = await connection.execute(`
      SELECT 
        u.id as user_id,
        u.username,
        u.created_at,
        'registered' as action
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 10
    `);
    
    // Combine and sort all activities
    const allActivities = [
      ...recentTransactions,
      ...recentLogins,
      ...recentRegistrations
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
    
    res.status(200).json(allActivities);
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
}