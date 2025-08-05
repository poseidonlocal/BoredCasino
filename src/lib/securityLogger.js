import { getConnection } from './db';

export class SecurityLogger {
  static async log(event) {
    try {
      const connection = await getConnection();
      
      const {
        userId = null,
        username = null,
        action,
        details = null,
        ipAddress = null,
        userAgent = null,
        severity = 'info', // info, warning, error, critical
        category = 'general' // auth, admin, game, transaction, system
      } = event;

      // Try to insert into security_logs table
      try {
        await connection.execute(`
          INSERT INTO security_logs (
            user_id,
            username,
            action,
            details,
            ip_address,
            user_agent,
            severity,
            category,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          userId,
          username,
          action,
          JSON.stringify(details),
          ipAddress,
          userAgent,
          severity,
          category
        ]);
      } catch (dbError) {
        // If table doesn't exist, create it
        if (dbError.message.includes('no such table')) {
          await this.createSecurityLogsTable(connection);
          // Retry the insert
          await connection.execute(`
            INSERT INTO security_logs (
              user_id,
              username,
              action,
              details,
              ip_address,
              user_agent,
              severity,
              category,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            userId,
            username,
            action,
            JSON.stringify(details),
            ipAddress,
            userAgent,
            severity,
            category
          ]);
        } else {
          throw dbError;
        }
      }

      // Also log to console for immediate visibility
      console.log(`[SECURITY] ${severity.toUpperCase()}: ${action}`, {
        userId,
        username,
        details,
        ipAddress,
        category
      });

    } catch (error) {
      console.error('Security logging failed:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  static async createSecurityLogsTable(connection) {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
        category TEXT DEFAULT 'general' CHECK(category IN ('auth', 'admin', 'game', 'transaction', 'system')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  }

  // Convenience methods for different severity levels
  static async logInfo(action, details = null, userId = null, username = null, req = null) {
    await this.log({
      userId,
      username,
      action,
      details,
      severity: 'info',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logWarning(action, details = null, userId = null, username = null, req = null) {
    await this.log({
      userId,
      username,
      action,
      details,
      severity: 'warning',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logError(action, details = null, userId = null, username = null, req = null) {
    await this.log({
      userId,
      username,
      action,
      details,
      severity: 'error',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logCritical(action, details = null, userId = null, username = null, req = null) {
    await this.log({
      userId,
      username,
      action,
      details,
      severity: 'critical',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  // Category-specific logging methods
  static async logAuth(action, details = null, userId = null, username = null, req = null, severity = 'info') {
    await this.log({
      userId,
      username,
      action,
      details,
      severity,
      category: 'auth',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logAdmin(action, details = null, userId = null, username = null, req = null, severity = 'info') {
    await this.log({
      userId,
      username,
      action,
      details,
      severity,
      category: 'admin',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logGame(action, details = null, userId = null, username = null, req = null, severity = 'info') {
    await this.log({
      userId,
      username,
      action,
      details,
      severity,
      category: 'game',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  static async logTransaction(action, details = null, userId = null, username = null, req = null, severity = 'info') {
    await this.log({
      userId,
      username,
      action,
      details,
      severity,
      category: 'transaction',
      ipAddress: this.getClientIP(req),
      userAgent: req?.headers['user-agent']
    });
  }

  // Utility method to get client IP
  static getClientIP(req) {
    if (!req) return null;
    
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.connection?.socket?.remoteAddress ||
           null;
  }

  // Get security logs with filtering
  static async getLogs(filters = {}) {
    try {
      const connection = await getConnection();
      
      const {
        limit = 100,
        offset = 0,
        severity = null,
        category = null,
        userId = null,
        startDate = null,
        endDate = null,
        search = null
      } = filters;

      let query = 'SELECT * FROM security_logs WHERE 1=1';
      const params = [];

      if (severity) {
        query += ' AND severity = ?';
        params.push(severity);
      }

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(endDate);
      }

      if (search) {
        query += ' AND (action LIKE ? OR username LIKE ? OR details LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [logs] = await connection.execute(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM security_logs WHERE 1=1';
      const countParams = [];

      if (severity) {
        countQuery += ' AND severity = ?';
        countParams.push(severity);
      }

      if (category) {
        countQuery += ' AND category = ?';
        countParams.push(category);
      }

      if (userId) {
        countQuery += ' AND user_id = ?';
        countParams.push(userId);
      }

      if (startDate) {
        countQuery += ' AND created_at >= ?';
        countParams.push(startDate);
      }

      if (endDate) {
        countQuery += ' AND created_at <= ?';
        countParams.push(endDate);
      }

      if (search) {
        countQuery += ' AND (action LIKE ? OR username LIKE ? OR details LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const [countResult] = await connection.execute(countQuery, countParams);
      const total = countResult[0]?.total || 0;

      return {
        logs: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + logs.length) < total
        }
      };

    } catch (error) {
      console.error('Error fetching security logs:', error);
      return {
        logs: [],
        pagination: { total: 0, limit: 100, offset: 0, hasMore: false }
      };
    }
  }

  // Get security statistics
  static async getStats(timeRange = '24h') {
    try {
      const connection = await getConnection();
      
      let timeCondition = '';
      switch (timeRange) {
        case '1h':
          timeCondition = "AND created_at >= datetime('now', '-1 hour')";
          break;
        case '24h':
          timeCondition = "AND created_at >= datetime('now', '-1 day')";
          break;
        case '7d':
          timeCondition = "AND created_at >= datetime('now', '-7 days')";
          break;
        case '30d':
          timeCondition = "AND created_at >= datetime('now', '-30 days')";
          break;
        default:
          timeCondition = "AND created_at >= datetime('now', '-1 day')";
      }

      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_events,
          SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) as error_events,
          SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_events,
          SUM(CASE WHEN category = 'auth' THEN 1 ELSE 0 END) as auth_events,
          SUM(CASE WHEN category = 'admin' THEN 1 ELSE 0 END) as admin_events,
          SUM(CASE WHEN category = 'game' THEN 1 ELSE 0 END) as game_events,
          SUM(CASE WHEN category = 'transaction' THEN 1 ELSE 0 END) as transaction_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT ip_address) as unique_ips
        FROM security_logs 
        WHERE 1=1 ${timeCondition}
      `);

      return stats[0] || {
        total_events: 0,
        critical_events: 0,
        error_events: 0,
        warning_events: 0,
        auth_events: 0,
        admin_events: 0,
        game_events: 0,
        transaction_events: 0,
        unique_users: 0,
        unique_ips: 0
      };

    } catch (error) {
      console.error('Error fetching security stats:', error);
      return {
        total_events: 0,
        critical_events: 0,
        error_events: 0,
        warning_events: 0,
        auth_events: 0,
        admin_events: 0,
        game_events: 0,
        transaction_events: 0,
        unique_users: 0,
        unique_ips: 0
      };
    }
  }
}

export const securityLogger = SecurityLogger;