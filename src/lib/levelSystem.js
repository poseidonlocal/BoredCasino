// Comprehensive Level System for Casino App

export class LevelSystem {
  constructor() {
    // Level thresholds - exponential growth for balanced progression
    this.levelThresholds = this.generateLevelThresholds();
    this.maxLevel = 100;
  }

  // Generate level thresholds with exponential growth
  generateLevelThresholds() {
    const thresholds = [0]; // Level 1 starts at 0 XP
    let baseXP = 100;
    const multiplier = 1.15; // 15% increase per level
    
    for (let level = 2; level <= 100; level++) {
      baseXP = Math.floor(baseXP * multiplier);
      thresholds.push(thresholds[level - 2] + baseXP);
    }
    
    return thresholds;
  }

  // Calculate XP from various activities
  calculateExperiencePoints(stats) {
    let totalXP = 0;
    
    // Base XP from games played (10 XP per game)
    totalXP += (stats.games_played || 0) * 10;
    
    // Bonus XP from wins (20 XP per win)
    totalXP += (stats.games_won || 0) * 20;
    
    // XP from winnings (1 XP per 100 MSP won)
    totalXP += Math.floor((stats.total_winnings || 0) / 100);
    
    // Bonus XP for win streaks (calculated from win rate)
    const winRate = stats.win_rate || 0;
    if (winRate >= 70) totalXP += 1000; // Excellent player bonus
    else if (winRate >= 60) totalXP += 500; // Good player bonus
    else if (winRate >= 50) totalXP += 200; // Average player bonus
    
    // XP from daily bonuses (50 XP per bonus claimed)
    totalXP += (stats.daily_bonuses_claimed || 0) * 50;
    
    // Big win bonuses
    const biggestWin = stats.biggest_win || 0;
    if (biggestWin >= 100000) totalXP += 2000; // Massive win
    else if (biggestWin >= 50000) totalXP += 1000; // Big win
    else if (biggestWin >= 10000) totalXP += 500; // Good win
    
    // Loyalty bonus (XP for being active)
    const daysSinceJoined = stats.days_since_joined || 0;
    totalXP += Math.floor(daysSinceJoined / 7) * 100; // 100 XP per week
    
    return Math.max(0, totalXP);
  }

  // Get level from XP
  getLevelFromXP(xp) {
    for (let level = this.maxLevel; level >= 1; level--) {
      if (xp >= this.levelThresholds[level - 1]) {
        return level;
      }
    }
    return 1;
  }

  // Get XP required for next level
  getXPForNextLevel(currentXP) {
    const currentLevel = this.getLevelFromXP(currentXP);
    if (currentLevel >= this.maxLevel) {
      return 0; // Max level reached
    }
    
    return this.levelThresholds[currentLevel] - currentXP;
  }

  // Get XP progress in current level
  getCurrentLevelProgress(currentXP) {
    const currentLevel = this.getLevelFromXP(currentXP);
    if (currentLevel >= this.maxLevel) {
      return { current: 0, total: 0, percentage: 100 };
    }
    
    const currentLevelXP = this.levelThresholds[currentLevel - 1];
    const nextLevelXP = this.levelThresholds[currentLevel];
    const progressXP = currentXP - currentLevelXP;
    const totalXPNeeded = nextLevelXP - currentLevelXP;
    
    return {
      current: progressXP,
      total: totalXPNeeded,
      percentage: Math.floor((progressXP / totalXPNeeded) * 100)
    };
  }

  // Get level rewards and benefits
  getLevelRewards(level) {
    const rewards = {
      title: this.getLevelTitle(level),
      benefits: [],
      unlocks: []
    };

    // Daily bonus multiplier
    if (level >= 5) rewards.benefits.push(`Daily bonus: +${Math.floor(level / 5) * 10}%`);
    
    // VIP status
    if (level >= 25) rewards.benefits.push('VIP Status');
    if (level >= 50) rewards.benefits.push('Premium VIP Status');
    if (level >= 75) rewards.benefits.push('Elite VIP Status');
    
    // Game unlocks
    if (level >= 10) rewards.unlocks.push('High Stakes Tables');
    if (level >= 20) rewards.unlocks.push('Tournament Access');
    if (level >= 30) rewards.unlocks.push('Private Rooms');
    if (level >= 40) rewards.unlocks.push('Exclusive Games');
    
    // Special perks
    if (level >= 15) rewards.benefits.push('Faster Withdrawals');
    if (level >= 35) rewards.benefits.push('Personal Account Manager');
    if (level >= 60) rewards.benefits.push('Custom Avatar Frames');
    
    return rewards;
  }

  // Get level title/rank
  getLevelTitle(level) {
    if (level >= 90) return 'Legendary High Roller';
    if (level >= 80) return 'Casino Royalty';
    if (level >= 70) return 'Diamond Elite';
    if (level >= 60) return 'Platinum Master';
    if (level >= 50) return 'Gold Champion';
    if (level >= 40) return 'Silver Expert';
    if (level >= 30) return 'Bronze Veteran';
    if (level >= 20) return 'Skilled Player';
    if (level >= 10) return 'Regular Player';
    if (level >= 5) return 'Novice Gambler';
    return 'Newcomer';
  }

  // Check if player leveled up
  checkLevelUp(oldXP, newXP) {
    const oldLevel = this.getLevelFromXP(oldXP);
    const newLevel = this.getLevelFromXP(newXP);
    
    if (newLevel > oldLevel) {
      return {
        leveledUp: true,
        oldLevel,
        newLevel,
        rewards: this.getLevelRewards(newLevel)
      };
    }
    
    return { leveledUp: false };
  }

  // Get comprehensive level info
  getLevelInfo(stats) {
    const xp = this.calculateExperiencePoints(stats);
    const level = this.getLevelFromXP(xp);
    const progress = this.getCurrentLevelProgress(xp);
    const xpForNext = this.getXPForNextLevel(xp);
    const rewards = this.getLevelRewards(level);
    
    return {
      level,
      xp,
      progress,
      xpForNext,
      rewards,
      title: rewards.title,
      isMaxLevel: level >= this.maxLevel
    };
  }
}

// Export singleton instance
export const levelSystem = new LevelSystem();