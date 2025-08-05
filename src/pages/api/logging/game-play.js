import { getConnection } from '../../../lib/db';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const { gameType, betAmount, winAmount, gameData, balanceBefore, balanceAfter } = req.body;
    
    const connection = await getConnection();
    
    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    // Log the bet
    await connection.execute(
      `INSERT INTO transaction_logs 
       (user_id, transaction_type, amount, balance_before, balance_after, game_type, game_data, description, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'game_bet',
        -betAmount,
        balanceBefore,
        balanceBefore - betAmount,
        gameType,
        JSON.stringify(gameData),
        `${gameType} bet: ${betAmount} MSP`,
        ip
      ]
    );
    
    // Log the win if any
    if (winAmount > 0) {
      await connection.execute(
        `INSERT INTO transaction_logs 
         (user_id, transaction_type, amount, balance_before, balance_after, game_type, game_data, description, ip_address) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'game_win',
          winAmount,
          balanceBefore - betAmount,
          balanceAfter,
          gameType,
          JSON.stringify(gameData),
          `${gameType} win: ${winAmount} MSP`,
          ip
        ]
      );
    }
    
    // Also log to game_history for compatibility
    await connection.execute(
      `INSERT INTO game_history (user_id, game_type, bet_amount, win_amount, game_data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, gameType, betAmount, winAmount, JSON.stringify(gameData)]
    );

    res.status(200).json({ message: 'Game play logged successfully' });
  } catch (error) {
    console.error('Game play logging error:', error);
    res.status(500).json({ message: 'Failed to log game play' });
  }
}