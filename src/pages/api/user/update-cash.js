import { verifyToken, getUserById, updateUserCash, getTokenFromRequest } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No authentication token provided' 
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    const { cashBalance } = req.body;
    
    if (typeof cashBalance !== 'number' || cashBalance < 0) {
      return res.status(400).json({ 
        message: 'Invalid cash balance' 
      });
    }

    await updateUserCash(decoded.userId, cashBalance);

    res.status(200).json({
      message: 'Cash balance updated successfully',
      cashBalance
    });
  } catch (error) {
    console.error('Cash update error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
}

