import { getTokenFromRequest, getUserById, verifyToken } from '../../../lib/auth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = req.body;
    
    // Build dynamic update query based on provided fields
    const allowedFields = ['totalXP', 'level', 'gamesPlayed', 'totalWinnings', 'winRate'];
    const updateFields = [];
    const updateValues = [];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add user ID to values array
    updateValues.push(decoded.userId);
    
    const connection = await getConnection();
    
    // Update user profile
    await connection.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated user data
    const [rows] = await connection.execute(
      'SELECT id, username, email, cash_balance as cashBalance, totalXP, level, gamesPlayed, totalWinnings, winRate, is_admin, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    const updatedUser = rows[0];
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}