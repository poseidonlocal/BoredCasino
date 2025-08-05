import { getConnection } from '../../../lib/db';
import { verifyToken, getTokenFromRequest } from '../../../lib/auth';
import { enterRaffle } from '../../../lib/dailyRaffle';

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
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { ticketCount = 1 } = req.body;

    if (ticketCount < 1 || ticketCount > 100) {
      return res.status(400).json({ message: 'Invalid ticket count' });
    }

    const connection = await getConnection();
    const result = await enterRaffle(connection, decoded.userId, ticketCount);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Raffle entry error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}