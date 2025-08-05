import { getConnection } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type = 'balance', timeframe = 'all', limit = 50 } = req.query;

  try {
    const connection = await getConnection();
    let leaderboard = [];

    // Balance leaderboard (default)
    if (type === 'balance') {
      try {
        const [result] = await connection.execute(`
          SELECT 
            u.username,
            u.cash_balance,
            u.totalXP,
            u.created_at,
            u.isOnline,
            u.is_admin
          FROM users u
          WHERE (u.is_banned = 0 OR u.is_banned IS NULL)
          ORDER BY u.cash_balance DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.cash_balance || 0,
          balance: player.cash_balance || 0,
          level: calculateLevel(player.totalXP || 0),
          xp: player.totalXP || 0,
          title: getLevelTitle(calculateLevel(player.totalXP || 0)),
          joinDate: player.created_at,
          isOnline: player.isOnline || false,
          isAdmin: player.is_admin || false,
          change: Math.floor(Math.random() * 10) - 5
        }));
      } catch (error) {
        console.log('Balance leaderboard error:', error.message);
      }
    }

    // Level/XP leaderboard
    else if (type === 'level' || type === 'xp') {
      try {
        const [result] = await connection.execute(`
          SELECT 
            u.username,
            u.cash_balance,
            u.totalXP,
            u.created_at,
            u.isOnline,
            u.is_admin
          FROM users u
          WHERE (u.is_banned = 0 OR u.is_banned IS NULL)
          ORDER BY COALESCE(u.totalXP, 0) DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.totalXP || 0,
          balance: player.cash_balance || 0,
          level: calculateLevel(player.totalXP || 0),
          xp: player.totalXP || 0,
          title: getLevelTitle(calculateLevel(player.totalXP || 0)),
          joinDate: player.created_at,
          isOnline: player.isOnline || false,
          isAdmin: player.is_admin || false,
          change: Math.floor(Math.random() * 10) - 5
        }));
      } catch (error) {
        console.log('Level leaderboard error:', error.message);
      }
    }

    // Winnings leaderboard
    else if (type === 'winnings') {
      try {
        const [result] = await connection.execute(`
          SELECT 
            u.username,
            u.cash_balance,
            u.totalXP,
            u.created_at,
            u.isOnline,
            u.is_admin,
            COALESCE(SUM(CASE WHEN gh.result = 'win' THEN gh.profit ELSE 0 END), 0) as total_winnings,
            COUNT(gh.id) as games_played
          FROM users u
          LEFT JOIN game_history gh ON u.id = gh.user_id
          WHERE (u.is_banned = 0 OR u.is_banned IS NULL)
          GROUP BY u.id, u.username, u.cash_balance, u.totalXP, u.created_at, u.isOnline, u.is_admin
          ORDER BY total_winnings DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.total_winnings || 0,
          balance: player.cash_balance || 0,
          level: calculateLevel(player.totalXP || 0),
          xp: player.totalXP || 0,
          title: getLevelTitle(calculateLevel(player.totalXP || 0)),
          totalWinnings: player.total_winnings || 0,
          gamesPlayed: player.games_played || 0,
          joinDate: player.created_at,
          isOnline: player.isOnline || false,
          isAdmin: player.is_admin || false,
          change: Math.floor(Math.random() * 10) - 5
        }));
      } catch (error) {
        console.log('Winnings leaderboard error:', error.message);
      }
    }

    // Games played leaderboard
    else if (type === 'games') {
      try {
        const [result] = await connection.execute(`
          SELECT 
            u.username,
            u.cash_balance,
            u.totalXP,
            u.created_at,
            u.isOnline,
            u.is_admin,
            COUNT(gh.id) as games_played,
            SUM(CASE WHEN gh.result = 'win' THEN 1 ELSE 0 END) as games_won
          FROM users u
          LEFT JOIN game_history gh ON u.id = gh.user_id
          WHERE (u.is_banned = 0 OR u.is_banned IS NULL)
          GROUP BY u.id, u.username, u.cash_balance, u.totalXP, u.created_at, u.isOnline, u.is_admin
          ORDER BY games_played DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.games_played || 0,
          balance: player.cash_balance || 0,
          level: calculateLevel(player.totalXP || 0),
          xp: player.totalXP || 0,
          title: getLevelTitle(calculateLevel(player.totalXP || 0)),
          gamesPlayed: player.games_played || 0,
          gamesWon: player.games_won || 0,
          winRate: player.games_played > 0 ? 
            ((player.games_won / player.games_played) * 100).toFixed(1) : 0,
          joinDate: player.created_at,
          isOnline: player.isOnline || false,
          isAdmin: player.is_admin || false,
          change: Math.floor(Math.random() * 10) - 5
        }));
      } catch (error) {
        console.log('Games leaderboard error:', error.message);
      }
    }

    // Streak leaderboard
    else if (type === 'streak') {
      try {
        const [result] = await connection.execute(`
          SELECT 
            u.username,
            u.cash_balance,
            u.totalXP,
            u.created_at,
            u.isOnline,
            u.is_admin,
            COALESCE(us.best_streak, 0) as best_streak,
            COALESCE(us.current_streak, 0) as current_streak
          FROM users u
          LEFT JOIN user_stats us ON u.id = us.user_id
          WHERE (u.is_banned = 0 OR u.is_banned IS NULL)
          ORDER BY COALESCE(us.best_streak, 0) DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.best_streak || 0,
          balance: player.cash_balance || 0,
          level: calculateLevel(player.totalXP || 0),
          xp: player.totalXP || 0,
          title: getLevelTitle(calculateLevel(player.totalXP || 0)),
          bestStreak: player.best_streak || 0,
          currentStreak: player.current_streak || 0,
          joinDate: player.created_at,
          isOnline: player.isOnline || false,
          isAdmin: player.is_admin || false,
          change: Math.floor(Math.random() * 10) - 5
        }));
      } catch (error) {
        console.log('Streak leaderboard error:', error.message);
      }
    }

    // Fallback to basic balance leaderboard if specific type fails
    if (leaderboard.length === 0) {
      try {
        const [result] = await connection.execute(`
          SELECT 
            username,
            cash_balance,
            created_at
          FROM users 
          ORDER BY cash_balance DESC 
          LIMIT ?
        `, [parseInt(limit)]);
        
        leaderboard = result.map((player, index) => ({
          rank: index + 1,
          username: player.username,
          value: player.cash_balance || 0,
          balance: player.cash_balance || 0,
          level: 1,
          xp: 0,
          title: 'Newcomer',
          joinDate: player.created_at,
          isOnline: false,
          isAdmin: false,
          change: 0
        }));
      } catch (error) {
        console.log('Fallback leaderboard error:', error.message);
      }
    }

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function calculateLevel(xp) {
  if (xp < 100) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getLevelTitle(level) {
  if (level >= 100) return 'Casino Legend';
  if (level >= 75) return 'Grandmaster';
  if (level >= 50) return 'Casino Master';
  if (level >= 40) return 'High Roller';
  if (level >= 30) return 'VIP Player';
  if (level >= 25) return 'Casino Veteran';
  if (level >= 20) return 'Skilled Gambler';
  if (level >= 15) return 'Regular Player';
  if (level >= 10) return 'Experienced Player';
  if (level >= 5) return 'Rising Star';
  return 'Newcomer';
}