import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    await verifyAdmin(req);
    
    const connection = await getConnection();
    
    // Calculate total MSP in circulation
    const [totalMSPResult] = await connection.execute(`
      SELECT SUM(cash_balance) as total_msp
      FROM users
      WHERE is_active = 1
    `);
    
    const totalMSP = totalMSPResult[0]?.total_msp || 0;
    
    // Get top 3 users with most MSP
    const [topUsers] = await connection.execute(`
      SELECT username, cash_balance
      FROM users
      WHERE is_active = 1
      ORDER BY cash_balance DESC
      LIMIT 3
    `);
    
    // Get user count
    const [userCountResult] = await connection.execute(`
      SELECT COUNT(*) as user_count
      FROM users
      WHERE is_active = 1
    `);
    
    const userCount = userCountResult[0]?.user_count || 0;
    const averageMSP = userCount > 0 ? totalMSP / userCount : 0;
    
    // Get MSP distribution stats
    const [distributionStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN cash_balance >= 10000 THEN 1 END) as whales,
        COUNT(CASE WHEN cash_balance >= 5000 AND cash_balance < 10000 THEN 1 END) as high_rollers,
        COUNT(CASE WHEN cash_balance >= 1000 AND cash_balance < 5000 THEN 1 END) as regular_players,
        COUNT(CASE WHEN cash_balance < 1000 THEN 1 END) as low_balance
      FROM users
      WHERE is_active = 1
    `);
    
    const distribution = distributionStats[0] || {
      whales: 0,
      high_rollers: 0,
      regular_players: 0,
      low_balance: 0
    };
    
    res.status(200).json({
      totalMSP: Math.round(totalMSP * 100) / 100,
      userCount,
      averageMSP: Math.round(averageMSP * 100) / 100,
      topUsers: topUsers.map(user => ({
        username: user.username,
        balance: Math.round(user.cash_balance * 100) / 100
      })),
      distribution: {
        whales: distribution.whales, // 10k+ MSP
        highRollers: distribution.high_rollers, // 5k-10k MSP
        regularPlayers: distribution.regular_players, // 1k-5k MSP
        lowBalance: distribution.low_balance // <1k MSP
      }
    });
  } catch (error) {
    console.error('Failed to fetch MSP pool data:', error);
    res.status(500).json({ message: 'Failed to fetch MSP pool data' });
  }
}