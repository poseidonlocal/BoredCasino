// API endpoint for shop purchases - copy to casino-app/src/pages/api/shop/purchase.js
import { getTokenFromRequest, getUserById, updateUserCash, verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        message: 'Invalid or expired token' 
      });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { productId, productType } = req.body;

    // Define products and their effects
    const products = {
      // Chip packages
      1: { name: 'Starter Pack', price: 4.99, chips: 1000, type: 'chips' },
      2: { name: 'Player Pack', price: 19.99, chips: 5000, type: 'chips' },
      3: { name: 'High Roller Pack', price: 79.99, chips: 25000, type: 'chips' },
      4: { name: 'Mega Pack', price: 249.99, chips: 100000, type: 'chips' },
      
      // VIP memberships (in days)
      5: { name: 'Bronze VIP', price: 9.99, vipDays: 7, type: 'vip' },
      6: { name: 'Silver VIP', price: 29.99, vipDays: 30, type: 'vip' },
      7: { name: 'Gold VIP', price: 79.99, vipDays: 90, type: 'vip' },
      
      // Special items
      8: { name: 'Lucky Card Back', price: 2.99, item: 'lucky_card_back', type: 'item' },
      9: { name: 'Golden Table Theme', price: 4.99, item: 'golden_table', type: 'item' },
      10: { name: 'Double XP Boost', price: 1.99, item: 'double_xp_24h', type: 'item' }
    };

    const product = products[productId];
    if (!product) {
      return res.status(400).json({ message: 'Invalid product' });
    }

    // For demo purposes, we'll simulate payment success
    // In production, integrate with your payment processor here
    const paymentSuccess = true; // Replace with actual payment processing

    if (!paymentSuccess) {
      return res.status(400).json({ message: 'Payment failed' });
    }

    // Apply product effects
    let newCashBalance = user.cashBalance || 0;
    let vipExpiry = user.vip_expiry ? new Date(user.vip_expiry) : new Date();
    let purchaseResult = {};

    switch (product.type) {
      case 'chips':
        newCashBalance += product.chips;
        await updateUserCash(decoded.userId, newCashBalance);
        purchaseResult = {
          type: 'chips',
          amount: product.chips,
          newBalance: newCashBalance
        };
        break;

      case 'vip':
        // Extend VIP membership
        const now = new Date();
        if (vipExpiry < now) {
          vipExpiry = now;
        }
        vipExpiry.setDate(vipExpiry.getDate() + product.vipDays);
        
        // Update VIP status in database (you'll need to add this function)
        // await updateUserVIP(decoded.userId, vipExpiry);
        
        purchaseResult = {
          type: 'vip',
          days: product.vipDays,
          expiresAt: vipExpiry
        };
        break;

      case 'item':
        // Add item to user inventory (you'll need to implement inventory system)
        // await addUserItem(decoded.userId, product.item);
        
        purchaseResult = {
          type: 'item',
          item: product.item,
          name: product.name
        };
        break;
    }

    // Log the transaction
    try {
      await fetch('/api/logging/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: decoded.userId,
          type: 'purchase',
          amount: product.price,
          description: `Purchased ${product.name}`,
          metadata: { productId, productType: product.type }
        })
      });
    } catch (logError) {
      console.error('Transaction logging failed:', logError);
    }

    res.status(200).json({
      success: true,
      message: `Successfully purchased ${product.name}!`,
      product: product.name,
      result: purchaseResult
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
}