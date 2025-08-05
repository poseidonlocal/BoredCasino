// Ranking and XP System for Royal Casino

export const RANKS = [
  { level: 1, title: 'Rookie', minXP: 0, maxXP: 99, color: 'text-gray-400', badge: '🎲' },
  { level: 2, title: 'Novice', minXP: 100, maxXP: 249, color: 'text-green-400', badge: '🎯' },
  { level: 3, title: 'Player', minXP: 250, maxXP: 499, color: 'text-blue-400', badge: '🎮' },
  { level: 4, title: 'Gambler', minXP: 500, maxXP: 999, color: 'text-purple-400', badge: '🎰' },
  { level: 5, title: 'High Roller', minXP: 1000, maxXP: 1999, color: 'text-yellow-400', badge: '💰' },
  { level: 6, title: 'VIP', minXP: 2000, maxXP: 3999, color: 'text-orange-400', badge: '👑' },
  { level: 7, title: 'Elite', minXP: 4000, maxXP: 7999, color: 'text-red-400', badge: '💎' },
  { level: 8, title: 'Master', minXP: 8000, maxXP: 15999, color: 'text-pink-400', badge: '🏆' },
  { level: 9, title: 'Grandmaster', minXP: 16000, maxXP: 31999, color: 'text-indigo-400', badge: '⚡' },
  { level: 10, title: 'Legend', minXP: 32000, maxXP: 63999, color: 'text-cyan-400', badge: '🌟' },
  { level: 11, title: 'Mythic', minXP: 64000, maxXP: 127999, color: 'text-emerald-400', badge: '🔥' },
  { level: 12, title: 'Immortal', minXP: 128000, maxXP: 255999, color: 'text-violet-400', badge: '👹' },
  { level: 13, title: 'Divine', minXP: 256000, maxXP: 511999, color: 'text-amber-400', badge: '😇' },
  { level: 14, title: 'Ascended', minXP: 512000, maxXP: 1023999, color: 'text-rose-400', badge: '🚀' },
  { level: 15, title: 'Transcendent', minXP: 1024000, maxXP: Infinity, color: 'text-gradient-rainbow', badge: '🌈' }
];

export const BADGES = {
  // Achievement Badges
  FIRST_WIN: { name: 'First Victory', description: 'Won your first game', icon: '🎉', rarity: 'common' },
  LUCKY_SEVEN: { name: 'Lucky Seven', description: 'Won 7 games in a row', icon: '🍀', rarity: 'rare' },
  HIGH_ROLLER: { name: 'High Roller', description: 'Bet over 1000 MSP in a single game', icon: '💸', rarity: 'epic' },
  JACKPOT_WINNER: { name: 'Jackpot Winner', description: 'Hit a jackpot in slots', icon: '🎰', rarity: 'legendary' },
  POKER_FACE: { name: 'Poker Face', description: 'Won 50 poker games', icon: '🃏', rarity: 'rare' },
  ROULETTE_MASTER: { name: 'Roulette Master', description: 'Won 100 roulette games', icon: '🎡', rarity: 'epic' },
  SLOT_MACHINE: { name: 'Slot Machine', description: 'Played 500 slot games', icon: '🎲', rarity: 'rare' },
  
  // Special Badges
  BETA_TESTER: { name: 'Beta Tester', description: 'Played during beta period', icon: '🧪', rarity: 'legendary' },
  EARLY_ADOPTER: { name: 'Early Adopter', description: 'Joined in the first month', icon: '🌅', rarity: 'epic' },
  LOYAL_PLAYER: { name: 'Loyal Player', description: 'Played for 30 consecutive days', icon: '❤️', rarity: 'rare' },
  BIG_SPENDER: { name: 'Big Spender', description: 'Spent over 10,000 MSP', icon: '💳', rarity: 'epic' },
  
  // Daily/Weekly Badges
  DAILY_PLAYER: { name: 'Daily Player', description: 'Played every day this week', icon: '📅', rarity: 'common' },
  WEEKEND_WARRIOR: { name: 'Weekend Warrior', description: 'Active every weekend this month', icon: '⚔️', rarity: 'rare' },
  NIGHT_OWL: { name: 'Night Owl', description: 'Played between 12 AM - 6 AM', icon: '🦉', rarity: 'uncommon' },
  
  // Social Badges
  POPULAR: { name: 'Popular', description: 'Profile viewed 100+ times', icon: '👥', rarity: 'rare' },
  HELPFUL: { name: 'Helpful', description: 'Helped other players', icon: '🤝', rarity: 'uncommon' },
  
  // Competition Badges
  TOURNAMENT_WINNER: { name: 'Tournament Winner', description: 'Won a tournament', icon: '🏅', rarity: 'legendary' },
  TOP_10: { name: 'Top 10', description: 'Reached top 10 on leaderboard', icon: '🔟', rarity: 'epic' },
  LEADERBOARD_KING: { name: 'Leaderboard King', description: 'Held #1 spot for a week', icon: '👑', rarity: 'mythic' },
  
  // Milestone Badges
  MILLIONAIRE: { name: 'Millionaire', description: 'Earned 1,000,000 MSP total', icon: '💰', rarity: 'legendary' },
  GAME_MASTER: { name: 'Game Master', description: 'Played 1000+ games', icon: '🎮', rarity: 'epic' },
  STREAK_MASTER: { name: 'Streak Master', description: '20+ game win streak', icon: '🔥', rarity: 'legendary' }
};

export const BADGE_RARITIES = {
  common: { color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' },
  uncommon: { color: 'text-green-400', bgColor: 'bg-green-500/20', borderColor: 'border-green-500/30' },
  rare: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
  epic: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
  legendary: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/30' },
  mythic: { color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-500/30' }
};

// XP Calculation Functions
export const calculateXPGain = (gameType, betAmount, won, winAmount = 0) => {
  let baseXP = 0;
  
  // Base XP for playing
  switch (gameType) {
    case 'roulette':
      baseXP = 5;
      break;
    case 'slots':
      baseXP = 3;
      break;
    case 'poker':
      baseXP = 8;
      break;
    default:
      baseXP = 5;
  }
  
  // Bonus XP for winning
  if (won) {
    baseXP *= 2;
    
    // Extra XP for big wins
    if (winAmount > betAmount * 5) {
      baseXP += 10; // Big win bonus
    }
    if (winAmount > betAmount * 10) {
      baseXP += 20; // Huge win bonus
    }
  }
  
  // XP scales with bet amount (higher risk = more XP)
  const betMultiplier = Math.min(betAmount / 100, 3); // Cap at 3x multiplier
  baseXP = Math.floor(baseXP * (1 + betMultiplier));
  
  return Math.max(baseXP, 1); // Minimum 1 XP
};

export const getRankFromXP = (xp) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i];
    }
  }
  return RANKS[0]; // Default to Rookie
};

export const getXPToNextLevel = (currentXP) => {
  const currentRank = getRankFromXP(currentXP);
  const nextRank = RANKS.find(rank => rank.level === currentRank.level + 1);
  
  if (!nextRank) {
    return 0; // Max level reached
  }
  
  return nextRank.minXP - currentXP;
};

export const getXPProgress = (currentXP) => {
  const currentRank = getRankFromXP(currentXP);
  const nextRank = RANKS.find(rank => rank.level === currentRank.level + 1);
  
  if (!nextRank) {
    return 100; // Max level
  }
  
  const currentLevelXP = currentXP - currentRank.minXP;
  const totalLevelXP = nextRank.minXP - currentRank.minXP;
  
  return Math.floor((currentLevelXP / totalLevelXP) * 100);
};

// Badge checking functions
export const checkForNewBadges = (userStats, gameResult) => {
  const newBadges = [];
  
  // Check achievement badges based on game result and user stats
  if (gameResult.won && userStats.totalWins === 1) {
    newBadges.push('FIRST_WIN');
  }
  
  if (userStats.currentStreak === 7) {
    newBadges.push('LUCKY_SEVEN');
  }
  
  if (gameResult.betAmount >= 1000) {
    newBadges.push('HIGH_ROLLER');
  }
  
  if (gameResult.gameType === 'slots' && gameResult.winAmount >= gameResult.betAmount * 100) {
    newBadges.push('JACKPOT_WINNER');
  }
  
  // Check milestone badges
  if (userStats.totalEarnings >= 1000000) {
    newBadges.push('MILLIONAIRE');
  }
  
  if (userStats.gamesPlayed >= 1000) {
    newBadges.push('GAME_MASTER');
  }
  
  if (userStats.currentStreak >= 20) {
    newBadges.push('STREAK_MASTER');
  }
  
  return newBadges;
};

export const formatXP = (xp) => {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M XP`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K XP`;
  }
  return `${xp} XP`;
};

export default {
  RANKS,
  BADGES,
  BADGE_RARITIES,
  calculateXPGain,
  getRankFromXP,
  getXPToNextLevel,
  getXPProgress,
  checkForNewBadges,
  formatXP
};