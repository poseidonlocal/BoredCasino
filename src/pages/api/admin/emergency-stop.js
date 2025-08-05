import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const admin = await verifyAdmin(req);
    
    const connection = await getConnection();
    
    // Update system settings to disable games
    await connection.execute(
      "INSERT OR REPLACE INTO system_settings (setting_key, setting_value, setting_type, description, updated_by) VALUES (?, ?, ?, ?, ?)",
      ['maintenance_mode', 'true', 'boolean', 'Emergency stop activated', admin.id]
    );
    
    // Log admin action
    await connection.execute(
      'INSERT INTO admin_actions (admin_id, action_type, details, ip_address) VALUES (?, ?, ?, ?)',
      [
        admin.id, 
        'emergency_stop', 
        JSON.stringify({ timestamp: new Date().toISOString() }), 
        req.headers['x-forwarded-for'] || req.connection.remoteAddress
      ]
    );

    res.status(200).json({ 
      message: 'Emergency stop activated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Emergency stop error:', error);
    res.status(500).json({ message: 'Failed to activate emergency stop' });
  }
}