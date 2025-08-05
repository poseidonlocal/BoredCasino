// Player of the Day System
// Draws a random active player daily at 5:00 PM EST and awards 50 MSP

import { PLAYER_OF_DAY_BONUS } from './currency';

export const DRAW_TIME = {
  hour: 17, // 5 PM
  minute: 0,
  timezone: 'America/New_York' // EST
};

// Check if it's time for the daily draw
export const isDrawTime = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: DRAW_TIME.timezone}));
  
  return estTime.getHours() === DRAW_TIME.hour && estTime.getMinutes() === DRAW_TIME.minute;
};

// Get today's date string for database storage
export const getTodayDateString = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: DRAW_TIME.timezone}));
  return estTime.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Check if today's player has already been drawn
export const hasPlayerBeenDrawnToday = async (connection) => {
  const today = getTodayDateString();
  
  const [result] = await connection.execute(
    'SELECT COUNT(*) as count FROM player_of_day WHERE draw_date = ?',
    [today]
  );
  
  return result[0].count > 0;
};

// Get eligible players for the draw (active players who played in the last 7 days)
export const getEligiblePlayers = async (connection) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const [players] = await connection.execute(`
    SELECT DISTINCT u.id, u.username, u.email, u.cash_balance
    FROM users u
    INNER JOIN game_history gh ON u.id = gh.user_id
    WHERE u.is_active = 1 
      AND u.is_banned = 0 
      AND gh.created_at >= ?
    ORDER BY u.id
  `, [sevenDaysAgo.toISOString()]);
  
  return players;
};

// Draw a random player from eligible players
export const drawRandomPlayer = (eligiblePlayers) => {
  if (eligiblePlayers.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  return eligiblePlayers[randomIndex];
};

// Award the bonus to the selected player
export const awardPlayerOfDayBonus = async (connection, playerId) => {
  try {
    // Update player's balance
    await connection.execute(
      'UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?',
      [PLAYER_OF_DAY_BONUS, playerId]
    );
    
    // Record the award in player_of_day table
    const today = getTodayDateString();
    await connection.execute(
      'INSERT INTO player_of_day (user_id, bonus_amount, draw_date) VALUES (?, ?, ?)',
      [playerId, PLAYER_OF_DAY_BONUS, today]
    );
    
    // Log the admin action
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)',
      [1, 'player_of_day_bonus', playerId, JSON.stringify({ amount: PLAYER_OF_DAY_BONUS, date: today })]
    );
    
    return true;
  } catch (error) {
    console.error('Error awarding player of day bonus:', error);
    return false;
  }
};

// Main function to execute the daily draw
export const executePlayerOfDayDraw = async (connection) => {
  try {
    // Check if already drawn today
    if (await hasPlayerBeenDrawnToday(connection)) {
      return { success: false, message: 'Player of the day already drawn today' };
    }
    
    // Get eligible players
    const eligiblePlayers = await getEligiblePlayers(connection);
    
    if (eligiblePlayers.length === 0) {
      return { success: false, message: 'No eligible players found' };
    }
    
    // Draw random player
    const selectedPlayer = drawRandomPlayer(eligiblePlayers);
    
    if (!selectedPlayer) {
      return { success: false, message: 'Failed to select player' };
    }
    
    // Award bonus
    const awarded = await awardPlayerOfDayBonus(connection, selectedPlayer.id);
    
    if (awarded) {
      return {
        success: true,
        player: selectedPlayer,
        bonus: PLAYER_OF_DAY_BONUS,
        message: `${selectedPlayer.username} has been selected as Player of the Day!`
      };
    } else {
      return { success: false, message: 'Failed to award bonus' };
    }
    
  } catch (error) {
    console.error('Error executing player of day draw:', error);
    return { success: false, message: 'System error during draw' };
  }
};

// Get current player of the day
export const getCurrentPlayerOfDay = async (connection) => {
  const today = getTodayDateString();
  
  const [result] = await connection.execute(`
    SELECT pod.*, u.username, u.email
    FROM player_of_day pod
    INNER JOIN users u ON pod.user_id = u.id
    WHERE pod.draw_date = ?
  `, [today]);
  
  return result[0] || null;
};

// Get player of the day history
export const getPlayerOfDayHistory = async (connection, limit = 30) => {
  const [results] = await connection.execute(`
    SELECT pod.*, u.username, u.email
    FROM player_of_day pod
    INNER JOIN users u ON pod.user_id = u.id
    ORDER BY pod.draw_date DESC
    LIMIT ?
  `, [limit]);
  
  return results;
};

// Check if a specific user was player of the day recently
export const wasPlayerOfDayRecently = async (connection, userId, days = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const [result] = await connection.execute(
    'SELECT COUNT(*) as count FROM player_of_day WHERE user_id = ? AND draw_date >= ?',
    [userId, cutoffDate.toISOString().split('T')[0]]
  );
  
  return result[0].count > 0;
};

// Get time until next draw
export const getTimeUntilNextDraw = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: DRAW_TIME.timezone}));
  
  const nextDraw = new Date(estTime);
  nextDraw.setHours(DRAW_TIME.hour, DRAW_TIME.minute, 0, 0);
  
  // If we've passed today's draw time, set for tomorrow
  if (estTime.getTime() > nextDraw.getTime()) {
    nextDraw.setDate(nextDraw.getDate() + 1);
  }
  
  const timeDiff = nextDraw.getTime() - estTime.getTime();
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, nextDraw };
};

// Format time until next draw for display
export const formatTimeUntilDraw = () => {
  const { hours, minutes } = getTimeUntilNextDraw();
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default {
  DRAW_TIME,
  PLAYER_OF_DAY_BONUS,
  isDrawTime,
  executePlayerOfDayDraw,
  getCurrentPlayerOfDay,
  getPlayerOfDayHistory,
  getTimeUntilNextDraw,
  formatTimeUntilDraw
};