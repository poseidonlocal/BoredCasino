import { getConnection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page = 0, sort = 'rank', search = '', limit = 12 } = req.query;
  const offset = parseInt(page) * parseInt(limit);

  try {
    const connection = await getConnection();
    const db = {
      get: async (query, params) => {
        const [rows] = await connection.execute(query, params);
        return rows[0];
      },
      all: async (query, params) => {
        const [rows] = await connection.execute(query, params);
        return rows;
      }
    };

    // Build the base query
    let orderBy = '';
    switch (sort) {
      case 'winnings':
        orderBy = 'ORDER BY total_winnings DESC';
        break;
      case 'games':
        orderBy = 'ORDER BY games_played DESC';
        break;
      case 'recent':
        orderBy = 'ORDER BY last_activity DESC';
        break;
      case 'rank':
      default:
        orderBy = 'ORDER BY user_rank ASC';
        break;
    }

    // Search condition
    const searchCondition = search ? 'AND u.username LIKE ?' : '';
    const searchParam = search ? `%${search}%` : null;

    // Main query to get profiles with stats
    const query = `
      SELECT 
        u.id,
        u.username,
        u.bio,
        u.created_at,
        COALESCE(stats.total_winnings, 0) as total_winnings,
        COALESCE(stats.games_played, 0) as games_played,
        COALESCE(stats.win_rate, 0) as win_rate,
        COALESCE(ranks.user_rank, 999999) as user_rank,
        CASE WHEN u.cash_balance > 100000 THEN 1 ELSE 0 END as is_vip,
        CASE WHEN RANDOM() > 0.5 THEN 1 ELSE 0 END as is_online,
        CASE 
          WHEN stats.games_played < 10 THEN 1
          ELSE (stats.games_played / 10) + 1
        END as level
      FROM users u
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_winnings,
          COUNT(CASE WHEN transaction_type IN ('game_win', 'game_loss') THEN 1 END) as games_played,
          ROUND(
            (COUNT(CASE WHEN amount > 0 THEN 1 END) * 100.0 / 
             NULLIF(COUNT(CASE WHEN transaction_type IN ('game_win', 'game_loss') THEN 1 END), 0)), 1
          ) as win_rate
        FROM transactions 
        GROUP BY user_id
      ) stats ON u.id = stats.user_id
      LEFT JOIN (
        SELECT 
          u2.id,
          ROW_NUMBER() OVER (ORDER BY COALESCE(s2.total_winnings, 0) DESC) as user_rank
        FROM users u2
        LEFT JOIN (
          SELECT 
            user_id,
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_winnings
          FROM transactions 
          WHERE transaction_type = 'game_win'
          GROUP BY user_id
        ) s2 ON u2.id = s2.user_id
        WHERE u2.is_public = 1
      ) ranks ON u.id = ranks.id
      WHERE u.is_public = 1 ${searchCondition}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const params = searchParam 
      ? [searchParam, parseInt(limit), offset]
      : [parseInt(limit), offset];

    const profiles = await db.all(query, params);

    // Check if there are more profiles
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.is_public = 1 ${searchCondition}
    `;

    const countParams = searchParam ? [searchParam] : [];
    const countResult = await db.get(countQuery, countParams);
    const hasMore = (offset + profiles.length) < countResult.total;

    // Format the response
    const formattedProfiles = profiles.map(profile => ({
      username: profile.username,
      bio: profile.bio,
      rank: profile.user_rank,
      level: Math.floor(profile.level),
      totalWinnings: profile.total_winnings,
      gamesPlayed: profile.games_played,
      winRate: profile.win_rate,
      isVip: Boolean(profile.is_vip),
      isOnline: Boolean(profile.is_online),
      joinedDate: profile.created_at
    }));

    res.status(200).json({
      profiles: formattedProfiles,
      hasMore,
      total: countResult.total
    });

  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}