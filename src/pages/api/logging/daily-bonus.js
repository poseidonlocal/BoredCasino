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

    const { bonusAmount, balanceBefore, balanceAfter } = req.body;
    
    const connection = await getConnection();
    
    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    
    // Log the daily bonus
    await connection.execute(
      `INSERT INTO transaction_logs 
       (user_id, transaction_type, amount, balance_before, balance_after, description, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'daily_bonus',
        bonusAmount,
        balanceBefore,
        balanceAfter,
        `Daily bonus claimed: ${bonusAmount} MSP`,
        ip
      ]
    );

    res.status(200).json({ message: 'Daily bonus logged successfully' });
  } catch (error) {
    console.error('Daily bonus logging error:', error);
    res.status(500).json({ message: 'Failed to log daily bonus' });
  }
}