// XP and Level System for Casino App

export const XP_SOURCES = {
  GAME_PLAYED: 10,
  GAME_WON: 25,
  BIG_WIN: 50, // Win over 1000 MSP
  DAILY_BONUS: 15,
  FIRST_GAME: 100,
  STREAK_BONUS: 30, // Win 3 games in a row
  HIGH_ROLLER: 75, // Bet over 5000 MSP
  ACHIEVEMENT_UNLOCKED: 100
};

export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1350,  // Level 7
  1750,  // Level 8
  2200,  // Level 9
  2700,  // Level 10
  3250,  // Level 11
  3850,  // Level 12
  4500,  // Level 13
  5200,  // Level 14
  5950,  // Level 15
  6750,  // Level 16
  7600,  // Level 17
  8500,  // Level 18
  9450,  // Level 19
  10450, // Level 20
  // Continue exponential growth
];

// Generate levels beyond 20
for (let i = 21; i <= 100; i++) {
  const baseXP = LEVEL_THRESHOLDS[19]; // Level 20 XP
  const additionalXP = (i - 20) * 1200; // 1200 XP per level after 20
  LEVEL_THRESHOLDS.push(baseXP + additionalXP);
}

export function calculateLevel(totalXP) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXPForNextLevel(currentLevel) {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 1200;
  }
  return LEVEL_THRESHOLDS[currentLevel] || 0;
}

export function getXPProgress(totalXP) {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  
  const progressXP = totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min((progressXP / requiredXP) * 100, 100);
  
  return {
    currentLevel,
    totalXP,
    currentLevelXP,
    nextLevelXP,
    progressXP,
    requiredXP,
    progressPercentage,
    isMaxLevel: currentLevel >= 100
  };
}

export function awardXP(currentXP, source, multiplier = 1) {
  const baseXP = XP_SOURCES[source] || 0;
  const xpGained = Math.floor(baseXP * multiplier);
  const newTotalXP = currentXP + xpGained;
  
  const oldLevel = calculateLevel(currentXP);
  const newLevel = calculateLevel(newTotalXP);
  const leveledUp = newLevel > oldLevel;
  
  return {
    xpGained,
    newTotalXP,
    oldLevel,
    newLevel,
    leveledUp,
    progress: getXPProgress(newTotalXP)
  };
}

export function getAchievements(userStats) {
  const achievements = [];
  
  // Level-based achievements
  if (userStats.level >= 5) {
    achievements.push({
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reached level 5',
      icon: '⭐',
      unlocked: true
    });
  }
  
  if (userStats.level >= 10) {
    achievements.push({
      id: 'level_10',
      name: 'Experienced Player',
      description: 'Reached level 10',
      icon: '🌟',
      unlocked: true
    });
  }
  
  if (userStats.level >= 25) {
    achievements.push({
      id: 'level_25',
      name: 'Casino Veteran',
      description: 'Reached level 25',
      icon: '👑',
      unlocked: true
    });
  }
  
  // Game-based achievements
  if (userStats.gamesPlayed >= 10) {
    achievements.push({
      id: 'games_10',
      name: 'Getting Started',
      description: 'Played 10 games',
      icon: '🎮',
      unlocked: true
    });
  }
  
  if (userStats.gamesPlayed >= 100) {
    achievements.push({
      id: 'games_100',
      name: 'Dedicated Gamer',
      description: 'Played 100 games',
      icon: '🎯',
      unlocked: true
    });
  }
  
  // Winning achievements
  if (userStats.totalWinnings >= 10000) {
    achievements.push({
      id: 'winnings_10k',
      name: 'Big Winner',
      description: 'Won 10,000 MSP total',
      icon: '💰',
      unlocked: true
    });
  }
  
  if (userStats.totalWinnings >= 100000) {
    achievements.push({
      id: 'winnings_100k',
      name: 'High Roller',
      description: 'Won 100,000 MSP total',
      icon: '💎',
      unlocked: true
    });
  }
  
  // Win rate achievements
  if (userStats.winRate >= 60 && userStats.gamesPlayed >= 20) {
    achievements.push({
      id: 'win_rate_60',
      name: 'Lucky Streak',
      description: 'Maintain 60%+ win rate',
      icon: '🍀',
      unlocked: true
    });
  }
  
  return achievements;
}

export function checkForNewAchievements(oldStats, newStats) {
  const oldAchievements = getAchievements(oldStats);
  const newAchievements = getAchievements(newStats);
  
  const newlyUnlocked = newAchievements.filter(newAch => 
    !oldAchievements.some(oldAch => oldAch.id === newAch.id)
  );
  
  return newlyUnlocked;
}