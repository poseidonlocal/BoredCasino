import { verifyAdmin } from '../../../lib/adminAuth';
import { SecurityLogger } from '../../../lib/securityLogger';
import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const {
        limit = 50,
        offset = 0,
        severity,
        category,
        userId,
        startDate,
        endDate,
        search,
        timeRange = '24h'
      } = req.query;

      // Get security logs
      const logsResult = await SecurityLogger.getLogs({
        limit: parseInt(limit),
        offset: parseInt(offset),
        severity,
        category,
        userId: userId ? parseInt(userId) : null,
        startDate,
        endDate,
        search
      });

      // Get security statistics
      const stats = await SecurityLogger.getStats(timeRange);

      // Log admin access to security logs
      await SecurityLogger.logAdmin(
        'Security logs accessed',
        { 
          filters: { severity, category, userId, startDate, endDate, search },
          resultsCount: logsResult.logs.length 
        },
        admin.id,
        admin.username,
        req
      );

      res.status(200).json({
        ...logsResult,
        stats
      });

    } else if (req.method === 'DELETE') {
      // Clear old logs (admin action)
      const { olderThan = '30d' } = req.body;
      
      let dateCondition = '';
      switch (olderThan) {
        case '7d':
          dateCondition = "datetime('now', '-7 days')";
          break;
        case '30d':
          dateCondition = "datetime('now', '-30 days')";
          break;
        case '90d':
          dateCondition = "datetime('now', '-90 days')";
          break;
        default:
          dateCondition = "datetime('now', '-30 days')";
      }

      try {
        const connection = await getConnection();
        const [result] = await connection.execute(`
          DELETE FROM security_logs 
          WHERE created_at < ${dateCondition}
        `);

        // Log the cleanup action
        await SecurityLogger.logAdmin(
          'Security logs cleanup',
          { 
            olderThan,
            deletedCount: result.affectedRows || 0
          },
          admin.id,
          admin.username,
          req,
          'warning'
        );

        res.status(200).json({
          success: true,
          deletedCount: result.affectedRows || 0,
          message: `Deleted logs older than ${olderThan}`
        });

      } catch (error) {
        await SecurityLogger.logAdmin(
          'Security logs cleanup failed',
          { error: error.message, olderThan },
          admin.id,
          admin.username,
          req,
          'error'
        );

        res.status(500).json({ error: 'Failed to cleanup logs' });
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Security logs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}