// Microsoft Points Currency System
// 1 USD = 1 MSP (Microsoft Points)

export const CURRENCY = {
  name: 'Microsoft Points',
  symbol: 'MSP',
  icon: '🎮',
  color: 'text-green-400'
};

// Convert USD to Microsoft Points (1:1 ratio)
export const usdToMSP = (usdAmount) => {
  return Math.floor(usdAmount); // 1 USD = 1 MSP
};

// Convert Microsoft Points to USD (1:1 ratio)
export const mspToUSD = (mspAmount) => {
  return mspAmount; // 1 MSP = 1 USD
};

// Format currency display
export const formatMSP = (amount, showIcon = true) => {
  const formattedAmount = new Intl.NumberFormat('en-US').format(amount);
  return showIcon ? `${formattedAmount} MSP 🎮` : `${formattedAmount} MSP`;
};

// Format large amounts with K, M suffixes
export const formatMSPCompact = (amount, showIcon = true) => {
  let formatted;
  
  if (amount >= 1000000) {
    formatted = `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    formatted = `${(amount / 1000).toFixed(1)}K`;
  } else {
    formatted = amount.toString();
  }
  
  return showIcon ? `${formatted} MSP 🎮` : `${formatted} MSP`;
};

// Get currency color based on amount
export const getCurrencyColor = (amount) => {
  if (amount >= 1000000) return 'text-purple-400'; // Millionaire
  if (amount >= 100000) return 'text-yellow-400';  // High roller
  if (amount >= 10000) return 'text-blue-400';     // VIP
  if (amount >= 1000) return 'text-green-400';     // Regular
  return 'text-gray-400'; // Low balance
};

// Currency animation classes
export const getCurrencyAnimation = (change) => {
  if (change > 0) return 'animate-bounce text-green-400';
  if (change < 0) return 'animate-pulse text-red-400';
  return '';
};

// Betting limits in MSP
export const BETTING_LIMITS = {
  min: 10,      // 10 MSP minimum bet
  max: 10000,   // 10,000 MSP maximum bet
  vip: 50000,   // 50,000 MSP for VIP players
  admin: 100000 // 100,000 MSP for admins
};

// Daily bonus amounts in MSP
export const DAILY_BONUSES = {
  rookie: 100,     // 100 MSP for new players
  regular: 200,    // 200 MSP for regular players
  vip: 500,        // 500 MSP for VIP players
  elite: 1000      // 1000 MSP for elite players
};

// Tournament entry fees in MSP
export const TOURNAMENT_FEES = {
  bronze: 100,     // 100 MSP entry
  silver: 500,     // 500 MSP entry
  gold: 1000,      // 1000 MSP entry
  platinum: 5000   // 5000 MSP entry
};

// Raffle system pricing in MSP
export const RAFFLE_CONFIG = {
  entryFee: 5,           // 5 MSP per ticket
  adminFee: 0.20,        // 20% admin fee
  maxTicketsPerUser: 100, // Maximum 100 tickets per user
  drawTime: '17:00'      // 5:00 PM EST daily draw
};

// Player of the day bonus in MSP
export const PLAYER_OF_DAY_BONUS = 50; // 50 MSP bonus

// Achievement rewards in MSP
export const ACHIEVEMENT_REWARDS = {
  FIRST_WIN: 50,
  LUCKY_SEVEN: 200,
  HIGH_ROLLER: 500,
  JACKPOT_WINNER: 1000,
  POKER_FACE: 300,
  ROULETTE_MASTER: 400,
  SLOT_MACHINE: 250,
  BETA_TESTER: 1000,
  EARLY_ADOPTER: 500,
  LOYAL_PLAYER: 300,
  BIG_SPENDER: 1000,
  TOURNAMENT_WINNER: 2000,
  LEADERBOARD_KING: 5000,
  MILLIONAIRE: 10000
};

// VIP level benefits
export const VIP_BENEFITS = {
  level1: {
    minBalance: 10000,   // 10K MSP
    dailyBonus: 300,     // 300 MSP daily
    betLimit: 20000,     // 20K MSP max bet
    withdrawLimit: 50000, // 50K MSP daily withdraw
    perks: ['Priority Support', 'Exclusive Games']
  },
  level2: {
    minBalance: 50000,   // 50K MSP
    dailyBonus: 500,     // 500 MSP daily
    betLimit: 50000,     // 50K MSP max bet
    withdrawLimit: 100000, // 100K MSP daily withdraw
    perks: ['Personal Manager', 'Custom Limits', 'Exclusive Tournaments']
  },
  level3: {
    minBalance: 200000,  // 200K MSP
    dailyBonus: 1000,    // 1K MSP daily
    betLimit: 100000,    // 100K MSP max bet
    withdrawLimit: 500000, // 500K MSP daily withdraw
    perks: ['Unlimited Access', 'Custom Games', 'Private Events']
  }
};

// Utility functions for currency operations
export const addMSP = (currentBalance, amount) => {
  return Math.max(0, currentBalance + amount);
};

export const subtractMSP = (currentBalance, amount) => {
  return Math.max(0, currentBalance - amount);
};

export const canAfford = (balance, cost) => {
  return balance >= cost;
};

export const calculateTax = (amount, taxRate = 0.05) => {
  return Math.floor(amount * taxRate);
};

export const calculateWinnings = (betAmount, multiplier, taxRate = 0) => {
  const grossWinnings = betAmount * multiplier;
  const tax = calculateTax(grossWinnings, taxRate);
  return {
    gross: grossWinnings,
    tax: tax,
    net: grossWinnings - tax
  };
};

// Export default currency configuration
export default {
  CURRENCY,
  formatMSP,
  formatMSPCompact,
  getCurrencyColor,
  getCurrencyAnimation,
  BETTING_LIMITS,
  DAILY_BONUSES,
  TOURNAMENT_FEES,
  RAFFLE_CONFIG,
  PLAYER_OF_DAY_BONUS,
  ACHIEVEMENT_REWARDS,
  VIP_BENEFITS,
  usdToMSP,
  mspToUSD,
  addMSP,
  subtractMSP,
  canAfford,
  calculateWinnings
};