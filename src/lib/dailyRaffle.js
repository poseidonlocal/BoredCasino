// Daily Raffle System
// Players can enter for 5 MSP, winner gets the pot minus 20% admin fee

import { RAFFLE_CONFIG } from './currency';

export const RAFFLE_DRAW_TIME = {
  hour: 23, // 11 PM
  minute: 0,
  timezone: 'America/New_York' // EST
};

// Get today's raffle ID (date-based)
export const getTodayRaffleId = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: RAFFLE_DRAW_TIME.timezone}));
  return estTime.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Check if user can enter today's raffle
export const canUserEnterRaffle = async (connection, userId) => {
  const raffleId = getTodayRaffleId();
  
  const [result] = await connection.execute(
    'SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = ? AND raffle_date = ?',
    [userId, raffleId]
  );
  
  return result[0].count < RAFFLE_CONFIG.maxTicketsPerUser;
};

// Get user's current ticket count for today
export const getUserTicketCount = async (connection, userId) => {
  const raffleId = getTodayRaffleId();
  
  const [result] = await connection.execute(
    'SELECT COUNT(*) as count FROM raffle_entries WHERE user_id = ? AND raffle_date = ?',
    [userId, raffleId]
  );
  
  return result[0].count;
};

// Enter user into today's raffle
export const enterRaffle = async (connection, userId, ticketCount = 1) => {
  const raffleId = getTodayRaffleId();
  const totalCost = RAFFLE_CONFIG.entryFee * ticketCount;
  
  try {
    // Start transaction
    await connection.execute('START TRANSACTION');
    
    // Check user balance
    const [userResult] = await connection.execute(
      'SELECT cash_balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userResult[0] || userResult[0].cash_balance < totalCost) {
      await connection.execute('ROLLBACK');
      return { success: false, message: 'Insufficient balance' };
    }
    
    // Check if user can enter more tickets
    const currentTickets = await getUserTicketCount(connection, userId);
    if (currentTickets + ticketCount > RAFFLE_CONFIG.maxTicketsPerUser) {
      await connection.execute('ROLLBACK');
      return { success: false, message: 'Maximum tickets per user exceeded' };
    }
    
    // Deduct cost from user balance
    await connection.execute(
      'UPDATE users SET cash_balance = cash_balance - ? WHERE id = ?',
      [totalCost, userId]
    );
    
    // Add raffle entries
    for (let i = 0; i < ticketCount; i++) {
      await connection.execute(
        'INSERT INTO raffle_entries (user_id, raffle_date, entry_fee) VALUES (?, ?, ?)',
        [userId, raffleId, RAFFLE_CONFIG.entryFee]
      );
    }
    
    // Commit transaction
    await connection.execute('COMMIT');
    
    return {
      success: true,
      message: `Successfully entered ${ticketCount} ticket(s) into today's raffle`,
      ticketsEntered: ticketCount,
      totalCost: totalCost
    };
    
  } catch (error) {
    await connection.execute('ROLLBACK');
    console.error('Error entering raffle:', error);
    return { success: false, message: 'System error during entry' };
  }
};

// Get current raffle stats
export const getCurrentRaffleStats = async (connection) => {
  const raffleId = getTodayRaffleId();
  
  const [statsResult] = await connection.execute(`
    SELECT 
      COUNT(*) as totalEntries,
      COUNT(DISTINCT user_id) as uniqueParticipants,
      SUM(entry_fee) as totalPot
    FROM raffle_entries 
    WHERE raffle_date = ?
  `, [raffleId]);
  
  const stats = statsResult[0];
  const adminFee = Math.floor(stats.totalPot * RAFFLE_CONFIG.adminFee);
  const winnerPot = stats.totalPot - adminFee;
  
  return {
    raffleId,
    totalEntries: stats.totalEntries || 0,
    uniqueParticipants: stats.uniqueParticipants || 0,
    totalPot: stats.totalPot || 0,
    adminFee,
    winnerPot,
    isActive: true
  };
};

// Get raffle participants with their ticket counts
export const getRaffleParticipants = async (connection, raffleId = null) => {
  if (!raffleId) {
    raffleId = getTodayRaffleId();
  }
  
  const [participants] = await connection.execute(`
    SELECT 
      u.id,
      u.username,
      COUNT(re.id) as ticketCount,
      SUM(re.entry_fee) as totalSpent
    FROM raffle_entries re
    INNER JOIN users u ON re.user_id = u.id
    WHERE re.raffle_date = ?
    GROUP BY u.id, u.username
    ORDER BY ticketCount DESC, u.username
  `, [raffleId]);
  
  return participants;
};

// Draw raffle winner
export const drawRaffleWinner = async (connection, raffleId = null) => {
  if (!raffleId) {
    raffleId = getTodayRaffleId();
  }
  
  try {
    // Check if raffle has already been drawn
    const [existingWinner] = await connection.execute(
      'SELECT * FROM raffle_winners WHERE raffle_date = ?',
      [raffleId]
    );
    
    if (existingWinner.length > 0) {
      return { success: false, message: 'Raffle already drawn for this date' };
    }
    
    // Get all entries for the raffle
    const [entries] = await connection.execute(
      'SELECT id, user_id FROM raffle_entries WHERE raffle_date = ? ORDER BY id',
      [raffleId]
    );
    
    if (entries.length === 0) {
      return { success: false, message: 'No entries found for raffle' };
    }
    
    // Select random winner
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winningEntry = entries[randomIndex];
    
    // Get raffle stats
    const stats = await getCurrentRaffleStats(connection);
    
    // Start transaction
    await connection.execute('START TRANSACTION');
    
    // Award winnings to winner
    await connection.execute(
      'UPDATE users SET cash_balance = cash_balance + ? WHERE id = ?',
      [stats.winnerPot, winningEntry.user_id]
    );
    
    // Record the winner
    await connection.execute(
      'INSERT INTO raffle_winners (user_id, raffle_date, winning_amount, total_entries, admin_fee) VALUES (?, ?, ?, ?, ?)',
      [winningEntry.user_id, raffleId, stats.winnerPot, stats.totalEntries, stats.adminFee]
    );
    
    // Log admin action
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, target_user_id, details) VALUES (?, ?, ?, ?)',
      [1, 'raffle_winner', winningEntry.user_id, JSON.stringify({
        raffleDate: raffleId,
        winningAmount: stats.winnerPot,
        totalEntries: stats.totalEntries,
        adminFee: stats.adminFee
      })]
    );
    
    // Get winner details
    const [winnerDetails] = await connection.execute(
      'SELECT username, email FROM users WHERE id = ?',
      [winningEntry.user_id]
    );
    
    // Commit transaction
    await connection.execute('COMMIT');
    
    return {
      success: true,
      winner: {
        id: winningEntry.user_id,
        username: winnerDetails[0].username,
        email: winnerDetails[0].email
      },
      winningAmount: stats.winnerPot,
      totalEntries: stats.totalEntries,
      adminFee: stats.adminFee,
      raffleDate: raffleId
    };
    
  } catch (error) {
    await connection.execute('ROLLBACK');
    console.error('Error drawing raffle winner:', error);
    return { success: false, message: 'System error during draw' };
  }
};

// Get raffle winner for a specific date
export const getRaffleWinner = async (connection, raffleId = null) => {
  if (!raffleId) {
    raffleId = getTodayRaffleId();
  }
  
  const [result] = await connection.execute(`
    SELECT rw.*, u.username, u.email
    FROM raffle_winners rw
    INNER JOIN users u ON rw.user_id = u.id
    WHERE rw.raffle_date = ?
  `, [raffleId]);
  
  return result[0] || null;
};

// Get raffle history
export const getRaffleHistory = async (connection, limit = 30) => {
  const [results] = await connection.execute(`
    SELECT rw.*, u.username, u.email
    FROM raffle_winners rw
    INNER JOIN users u ON rw.user_id = u.id
    ORDER BY rw.raffle_date DESC
    LIMIT ?
  `, [limit]);
  
  return results;
};

// Check if it's time for raffle draw
export const isRaffleDrawTime = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: RAFFLE_DRAW_TIME.timezone}));
  
  return estTime.getHours() === RAFFLE_DRAW_TIME.hour && estTime.getMinutes() === RAFFLE_DRAW_TIME.minute;
};

// Get time until next raffle draw
export const getTimeUntilRaffleDraw = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: RAFFLE_DRAW_TIME.timezone}));
  
  const nextDraw = new Date(estTime);
  nextDraw.setHours(RAFFLE_DRAW_TIME.hour, RAFFLE_DRAW_TIME.minute, 0, 0);
  
  // If we've passed today's draw time, set for tomorrow
  if (estTime.getTime() > nextDraw.getTime()) {
    nextDraw.setDate(nextDraw.getDate() + 1);
  }
  
  const timeDiff = nextDraw.getTime() - estTime.getTime();
  
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, nextDraw };
};

// Format time until raffle draw
export const formatTimeUntilRaffleDraw = () => {
  const { hours, minutes } = getTimeUntilRaffleDraw();
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default {
  RAFFLE_CONFIG,
  RAFFLE_DRAW_TIME,
  enterRaffle,
  getCurrentRaffleStats,
  getRaffleParticipants,
  drawRaffleWinner,
  getRaffleWinner,
  getRaffleHistory,
  canUserEnterRaffle,
  getUserTicketCount,
  getTimeUntilRaffleDraw,
  formatTimeUntilRaffleDraw
};