import { levelSystem } from './levelSystem';

export class XPTracker {
  // Calculate XP gained from a game result
  static calculateGameXP(gameResult) {
    let xp = 0;
    
    // Base XP for playing a game
    xp += 10;
    
    // Bonus XP for winning
    if (gameResult.won) {
      xp += 20;
      
      // Bonus XP based on win amount
      const winAmount = gameResult.winAmount || 0;
      xp += Math.floor(winAmount / 100); // 1 XP per 100 MSP won
      
      // Big win bonuses
      if (winAmount >= 10000) xp += 100; // Big win bonus
      if (winAmount >= 50000) xp += 500; // Huge win bonus
      if (winAmount >= 100000) xp += 1000; // Massive win bonus
    }
    
    // Streak bonuses (if implemented)
    if (gameResult.streak && gameResult.streak >= 3) {
      xp += gameResult.streak * 5; // 5 XP per game in streak
    }
    
    return Math.max(0, xp);
  }
  
  // Check for level up and return notification data
  static async checkLevelUp(userId, oldStats, newStats) {
    try {
      const oldXP = levelSystem.calculateExperiencePoints(oldStats);
      const newXP = levelSystem.calculateExperiencePoints(newStats);
      
      const levelUpResult = levelSystem.checkLevelUp(oldXP, newXP);
      
      if (levelUpResult.leveledUp) {
        // Log level up event (you can store this in database)
        console.log(`User ${userId} leveled up from ${levelUpResult.oldLevel} to ${levelUpResult.newLevel}`);
        
        return {
          leveledUp: true,
          oldLevel: levelUpResult.oldLevel,
          newLevel: levelUpResult.newLevel,
          rewards: levelUpResult.rewards,
          xpGained: newXP - oldXP
        };
      }
      
      return {
        leveledUp: false,
        xpGained: newXP - oldXP
      };
    } catch (error) {
      console.error('Error checking level up:', error);
      return { leveledUp: false, xpGained: 0 };
    }
  }
  
  // Get user's current level info
  static async getUserLevelInfo(userId, stats) {
    try {
      return levelSystem.getLevelInfo(stats);
    } catch (error) {
      console.error('Error getting user level info:', error);
      return {
        level: 1,
        xp: 0,
        progress: { current: 0, total: 100, percentage: 0 },
        xpForNext: 100,
        title: 'Newcomer',
        rewards: { benefits: [], unlocks: [] },
        isMaxLevel: false
      };
    }
  }
  
  // Calculate daily bonus XP
  static calculateDailyBonusXP(bonusAmount, streak = 1) {
    let xp = 50; // Base daily bonus XP
    
    // Streak bonuses
    if (streak >= 7) xp += 100; // Weekly streak
    if (streak >= 30) xp += 500; // Monthly streak
    
    // Bonus amount XP
    xp += Math.floor(bonusAmount / 100);
    
    return xp;
  }
  
  // Get XP breakdown for display
  static getXPBreakdown(stats) {
    const breakdown = [];
    
    // Games played XP
    const gamesXP = (stats.games_played || 0) * 10;
    if (gamesXP > 0) {
      breakdown.push({
        source: 'Games Played',
        amount: gamesXP,
        description: `${stats.games_played} games × 10 XP`
      });
    }
    
    // Wins XP
    const winsXP = (stats.games_won || 0) * 20;
    if (winsXP > 0) {
      breakdown.push({
        source: 'Game Wins',
        amount: winsXP,
        description: `${stats.games_won} wins × 20 XP`
      });
    }
    
    // Winnings XP
    const winningsXP = Math.floor((stats.total_winnings || 0) / 100);
    if (winningsXP > 0) {
      breakdown.push({
        source: 'Total Winnings',
        amount: winningsXP,
        description: `${stats.total_winnings?.toLocaleString()} MSP ÷ 100`
      });
    }
    
    // Daily bonuses XP
    const dailyXP = (stats.daily_bonuses_claimed || 0) * 50;
    if (dailyXP > 0) {
      breakdown.push({
        source: 'Daily Bonuses',
        amount: dailyXP,
        description: `${stats.daily_bonuses_claimed} bonuses × 50 XP`
      });
    }
    
    // Win rate bonuses
    const winRate = stats.win_rate || 0;
    let winRateXP = 0;
    if (winRate >= 70) winRateXP = 1000;
    else if (winRate >= 60) winRateXP = 500;
    else if (winRate >= 50) winRateXP = 200;
    
    if (winRateXP > 0) {
      breakdown.push({
        source: 'Win Rate Bonus',
        amount: winRateXP,
        description: `${winRate}% win rate bonus`
      });
    }
    
    return breakdown;
  }
}

export const xpTracker = XPTracker;