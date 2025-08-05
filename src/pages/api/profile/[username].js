import { getConnection } from '../../../lib/db';

// Enhanced level calculation with proper XP scaling
const calculateLevel = (xp) => {
  if (xp < 100) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const getXPProgress = (xp) => {
  const level = calculateLevel(xp);
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return {
    progressXP,
    requiredXP,
    progressPercentage: Math.floor((progressXP / requiredXP) * 100),
    isMaxLevel: level >= 100
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const connection = await getConnection();

    // Get user basic info with comprehensive data
    let userResult;
    try {
      [userResult] = await connection.execute(
        'SELECT id, username, cash_balance, created_at, totalXP, isOnline, lastLogin, bio, is_admin FROM users WHERE username = ?',
        [username]
      );
    } catch (error) {
      console.log('Extended user query failed, trying basic:', error.message);
      [userResult] = await connection.execute(
        'SELECT id, username, cash_balance, created_at FROM users WHERE username = ?',
        [username]
      );
    }

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    const totalXP = user.totalXP || 0;
    const level = calculateLevel(totalXP);
    const progress = getXPProgress(totalXP);

    // Get comprehensive game statistics
    let gameStats = [];
    let overallGameStats = {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalWagered: 0,
      totalProfit: 0,
      biggestWin: 0,
      biggestLoss: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    try {
      // Get detailed game statistics by type
      const [gameStatsResult] = await connection.execute(`
        SELECT 
          game_type,
          COUNT(*) as games_played,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as games_won,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as games_lost,
          SUM(bet_amount) as total_wagered,
          SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END) as total_winnings,
          SUM(profit) as net_profit,
          MAX(CASE WHEN result = 'win' THEN profit ELSE 0 END) as biggest_win,
          MIN(CASE WHEN result = 'loss' THEN profit ELSE 0 END) as biggest_loss,
          ROUND(
            (COUNT(CASE WHEN result = 'win' THEN 1 END) * 100.0 / COUNT(*)), 1
          ) as win_rate,
          AVG(bet_amount) as avg_bet
        FROM game_history 
        WHERE user_id = ?
        GROUP BY game_type
        ORDER BY games_played DESC
      `, [user.id]);

      gameStats = gameStatsResult || [];

      // Calculate overall stats
      const [overallResult] = await connection.execute(`
        SELECT 
          COUNT(*) as totalGames,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as totalWins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as totalLosses,
          SUM(bet_amount) as totalWagered,
          SUM(profit) as totalProfit,
          MAX(profit) as biggestWin,
          MIN(profit) as biggestLoss,
          AVG(bet_amount) as avgBet
        FROM game_history 
        WHERE user_id = ?
      `, [user.id]);

      if (overallResult && overallResult.length > 0) {
        overallGameStats = { ...overallGameStats, ...overallResult[0] };
      }
    } catch (error) {
      console.log('Game stats query error:', error.message);
    }

    // Get recent activity with more details
    let recentActivity = [];
    try {
      const [activityResult] = await connection.execute(`
        SELECT 
          game_type,
          result,
          profit,
          bet_amount,
          payout,
          created_at,
          details
        FROM game_history 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [user.id]);

      recentActivity = (activityResult || []).map(activity => ({
        type: activity.result,
        description: formatActivityDescription(activity),
        amount: activity.profit,
        timeAgo: getTimeAgo(new Date(activity.created_at)),
        game: activity.game_type,
        details: activity.details
      }));
    } catch (error) {
      console.log('Recent activity query error:', error.message);
    }

    // Get user rankings
    let rankings = { overall: 1, winnings: 1, games: 1, level: 1 };
    try {
      // Overall ranking by balance
      const [overallRank] = await connection.execute(`
        SELECT COUNT(*) + 1 as rank
        FROM users 
        WHERE cash_balance > ? AND (is_banned = 0 OR is_banned IS NULL)
      `, [user.cash_balance || 0]);

      // Winnings ranking
      const [winningsRank] = await connection.execute(`
        SELECT COUNT(DISTINCT gh.user_id) + 1 as rank
        FROM game_history gh
        JOIN users u ON u.id = gh.user_id
        WHERE (
          SELECT SUM(profit) FROM game_history WHERE user_id = gh.user_id
        ) > (
          SELECT COALESCE(SUM(profit), 0) FROM game_history WHERE user_id = ?
        ) AND (u.is_banned = 0 OR u.is_banned IS NULL)
      `, [user.id]);

      // Level ranking
      const [levelRank] = await connection.execute(`
        SELECT COUNT(*) + 1 as rank
        FROM users 
        WHERE COALESCE(totalXP, 0) > ? AND (is_banned = 0 OR is_banned IS NULL)
      `, [totalXP]);

      rankings = {
        overall: overallRank[0]?.rank || 1,
        winnings: winningsRank[0]?.rank || 1,
        games: Math.ceil(overallGameStats.totalGames / 10) || 1,
        level: levelRank[0]?.rank || 1
      };
    } catch (error) {
      console.log('Rankings query error:', error.message);
    }

    // Generate achievements based on user stats
    const achievements = generateAchievements(overallGameStats, gameStats, user, level);

    // Get level benefits and rewards
    const levelRewards = getLevelRewards(level);

    // Calculate win rate
    const winRate = overallGameStats.totalGames > 0 ?
      ((overallGameStats.totalWins / overallGameStats.totalGames) * 100).toFixed(1) : 0;

    // Create comprehensive profile
    const profile = {
      username: user.username,
      cash: user.cash_balance || 0,
      created_at: user.created_at,
      rank: rankings.overall,
      level,
      isVip: (user.cash_balance || 0) > 100000 || level >= 25,
      isAdmin: user.is_admin || false,
      isOnline: user.isOnline || false,
      lastSeen: user.lastLogin ? getTimeAgo(new Date(user.lastLogin)) : 'Recently',
      bio: user.bio || null,

      stats: {
        // Calculate proper lifetime earnings (total payouts received from wins)
        lifetimeEarnings: await calculateLifetimeEarnings(connection, user.id) || 0,
        totalWagered: overallGameStats.totalWagered || 0,
        netProfit: overallGameStats.totalProfit || 0,
        totalWinnings: Math.max(0, overallGameStats.totalProfit || 0),
        totalLosses: Math.abs(Math.min(0, overallGameStats.totalProfit || 0)),

        // Game performance
        gamesPlayed: overallGameStats.totalGames || 0,
        gamesWon: overallGameStats.totalWins || 0,
        gamesLost: overallGameStats.totalLosses || 0,
        winRate: parseFloat(winRate),

        // Records
        biggestWin: overallGameStats.biggestWin || 0,
        biggestLoss: Math.abs(overallGameStats.biggestLoss || 0),
        avgBet: overallGameStats.avgBet || 0,

        // Profile info
        favoriteGame: gameStats.length > 0 ? gameStats[0].game_type : 'None',
        experiencePoints: totalXP,
        currentBalance: user.cash_balance || 0,
        daysSinceJoined: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        dailyBonusesClaimed: Math.floor(Math.random() * 50) // Mock data for now
      },

      levelInfo: {
        level,
        xp: totalXP,
        progress: progress.progressPercentage,
        xpForNext: Math.max(0, progress.requiredXP - progress.progressXP),
        title: getLevelTitle(level),
        isMaxLevel: progress.isMaxLevel,
        rewards: levelRewards
      },

      gameStats: gameStats.map(stat => ({
        game_type: stat.game_type,
        games_played: stat.games_played,
        games_won: stat.games_won,
        games_lost: stat.games_lost,
        total_winnings: stat.total_winnings,
        net_profit: stat.net_profit,
        win_rate: stat.win_rate,
        biggest_win: stat.biggest_win,
        avg_bet: stat.avg_bet,
        total_wagered: stat.total_wagered
      })),

      achievements,
      recentActivity,
      rankings
    };

    res.status(200).json(profile);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function formatActivityDescription(activity) {
  const gameEmoji = {
    coinflip: '🪙',
    roulette: '🎰',
    slots: '🎰',
    poker: '🃏',
    blackjack: '🃏'
  };

  const emoji = gameEmoji[activity.game_type] || '🎲';
  const action = activity.result === 'win' ? 'Won' : 'Lost';
  const amount = Math.abs(activity.profit);

  return `${emoji} ${action} ${amount.toLocaleString()} MSP playing ${activity.game_type}`;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getLevelTitle(level) {
  if (level >= 100) return 'BoredCasino Legend';
  if (level >= 75) return 'Grandmaster';
  if (level >= 50) return 'BoredCasino Master';
  if (level >= 40) return 'High Roller';
  if (level >= 30) return 'VIP Player';
  if (level >= 25) return 'BoredCasino Veteran';
  if (level >= 20) return 'Skilled Gambler';
  if (level >= 15) return 'Regular Player';
  if (level >= 10) return 'Experienced Player';
  if (level >= 5) return 'Rising Star';
  return 'Newcomer';
}

function getLevelRewards(level) {
  const benefits = [];
  const unlocks = [];

  // Add benefits based on level
  if (level >= 5) benefits.push('+5% daily bonus');
  if (level >= 10) benefits.push('+10% XP gain');
  if (level >= 15) benefits.push('Access to VIP games');
  if (level >= 20) benefits.push('+15% daily bonus');
  if (level >= 25) benefits.push('VIP status');
  if (level >= 30) benefits.push('Priority support');
  if (level >= 40) benefits.push('Exclusive tournaments');
  if (level >= 50) benefits.push('Custom profile badge');

  // Add unlocks based on level
  if (level >= 3) unlocks.push('Friend system');
  if (level >= 5) unlocks.push('Chat privileges');
  if (level >= 10) unlocks.push('Tournament access');
  if (level >= 15) unlocks.push('Advanced statistics');
  if (level >= 20) unlocks.push('Profile customization');
  if (level >= 25) unlocks.push('VIP lounge access');
  if (level >= 30) unlocks.push('Private games');
  if (level >= 50) unlocks.push('Leaderboard hall of fame');

  return { benefits, unlocks };
}

function generateAchievements(overallStats, gameStats, user, level) {
  const achievements = [];

  // Level-based achievements
  if (level >= 5) achievements.push({
    type: 'level_5',
    name: 'Rising Star',
    description: 'Reached level 5',
    icon: '⭐',
    rarity: 'common'
  });

  if (level >= 10) achievements.push({
    type: 'level_10',
    name: 'Experienced',
    description: 'Reached level 10',
    icon: '🎯',
    rarity: 'common'
  });

  if (level >= 25) achievements.push({
    type: 'level_25',
    name: 'Veteran',
    description: 'Reached level 25',
    icon: '🏆',
    rarity: 'rare'
  });

  if (level >= 50) achievements.push({
    type: 'level_50',
    name: 'Master',
    description: 'Reached level 50',
    icon: '👑',
    rarity: 'epic'
  });

  // Game-based achievements
  if (overallStats.totalGames >= 1) achievements.push({
    type: 'first_game',
    name: 'First Steps',
    description: 'Played your first game',
    icon: '🎮',
    rarity: 'common'
  });

  if (overallStats.totalGames >= 100) achievements.push({
    type: 'games_100',
    name: 'Century Player',
    description: 'Played 100 games',
    icon: '💯',
    rarity: 'uncommon'
  });

  if (overallStats.totalGames >= 1000) achievements.push({
    type: 'games_1000',
    name: 'Dedicated Gamer',
    description: 'Played 1000 games',
    icon: '🎲',
    rarity: 'rare'
  });

  // Win-based achievements
  if (overallStats.totalWins >= 1) achievements.push({
    type: 'first_win',
    name: 'First Victory',
    description: 'Won your first game',
    icon: '🎉',
    rarity: 'common'
  });

  if (overallStats.totalWins >= 50) achievements.push({
    type: 'wins_50',
    name: 'Winner',
    description: 'Won 50 games',
    icon: '🏅',
    rarity: 'uncommon'
  });

  if (overallStats.totalWins >= 500) achievements.push({
    type: 'wins_500',
    name: 'Champion',
    description: 'Won 500 games',
    icon: '🏆',
    rarity: 'epic'
  });

  // Profit-based achievements
  if (overallStats.biggestWin >= 1000) achievements.push({
    type: 'big_win_1k',
    name: 'Big Winner',
    description: 'Won 1,000+ MSP in a single game',
    icon: '💰',
    rarity: 'uncommon'
  });

  if (overallStats.biggestWin >= 10000) achievements.push({
    type: 'big_win_10k',
    name: 'Jackpot',
    description: 'Won 10,000+ MSP in a single game',
    icon: '💎',
    rarity: 'rare'
  });

  if (overallStats.biggestWin >= 100000) achievements.push({
    type: 'big_win_100k',
    name: 'Mega Jackpot',
    description: 'Won 100,000+ MSP in a single game',
    icon: '🌟',
    rarity: 'legendary'
  });

  // Balance-based achievements
  const balance = user.cash_balance || 0;
  if (balance >= 10000) achievements.push({
    type: 'balance_10k',
    name: 'Well Off',
    description: 'Accumulated 10,000+ MSP',
    icon: '💳',
    rarity: 'uncommon'
  });

  if (balance >= 100000) achievements.push({
    type: 'balance_100k',
    name: 'Rich',
    description: 'Accumulated 100,000+ MSP',
    icon: '💰',
    rarity: 'rare'
  });

  if (balance >= 1000000) achievements.push({
    type: 'balance_1m',
    name: 'Millionaire',
    description: 'Accumulated 1,000,000+ MSP',
    icon: '🏦',
    rarity: 'legendary'
  });

  // Game-specific achievements
  gameStats.forEach(game => {
    if (game.games_played >= 50) {
      achievements.push({
        type: `${game.game_type}_specialist`,
        name: `${game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)} Specialist`,
        description: `Played 50+ ${game.game_type} games`,
        icon: getGameIcon(game.game_type),
        rarity: 'uncommon'
      });
    }

    if (game.win_rate >= 70 && game.games_played >= 20) {
      achievements.push({
        type: `${game.game_type}_master`,
        name: `${game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)} Master`,
        description: `70%+ win rate in ${game.game_type}`,
        icon: '🎯',
        rarity: 'rare'
      });
    }
  });

  // Time-based achievements
  const daysSinceJoined = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceJoined >= 30) achievements.push({
    type: 'member_30d',
    name: 'Loyal Member',
    description: 'Member for 30+ days',
    icon: '📅',
    rarity: 'common'
  });

  if (daysSinceJoined >= 365) achievements.push({
    type: 'member_1y',
    name: 'Veteran Member',
    description: 'Member for 1+ year',
    icon: '🗓️',
    rarity: 'rare'
  });

  return achievements;
}

function getGameIcon(gameType) {
  const icons = {
    coinflip: '🪙',
    roulette: '🎰',
    slots: '🎰',
    poker: '🃏',
    blackjack: '🃏'
  };
  return icons[gameType] || '🎲';
}

async function calculateLifetimeEarnings(connection, userId) {
  try {
    const [result] = await connection.execute(`
      SELECT COALESCE(SUM(CASE WHEN result = 'win' THEN payout ELSE 0 END), 0) as lifetime_earnings
      FROM game_history 
      WHERE user_id = ?
    `, [userId]);

    return result && result.length > 0 ? result[0].lifetime_earnings : 0;
  } catch (error) {
    console.log('Lifetime earnings calculation error:', error.message);
    return 0;
  }
}