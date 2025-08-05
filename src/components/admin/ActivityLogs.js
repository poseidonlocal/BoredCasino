import React, { useState, useEffect } from 'react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchLogs();
  }, [filter, dateRange]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/admin/logs?filter=${filter}&range=${dateRange}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'register': return '📝';
      case 'updateBalance': return '💰';
      case 'ban': return '🚫';
      case 'unban': return '✅';
      case 'makeAdmin': return '👑';
      case 'removeAdmin': return '👤';
      case 'game_play': return '🎮';
      case 'daily_bonus': return '🎁';
      default: return '📋';
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'login': return 'text-green-400';
      case 'logout': return 'text-gray-400';
      case 'register': return 'text-blue-400';
      case 'updateBalance': return 'text-yellow-400';
      case 'ban': return 'text-red-400';
      case 'unban': return 'text-green-400';
      case 'makeAdmin': return 'text-purple-400';
      case 'removeAdmin': return 'text-orange-400';
      case 'game_play': return 'text-casino-gold';
      case 'daily_bonus': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.admin_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-casino-gold text-xl">Loading activity logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="casino-card">
        <h2 className="text-2xl font-bold text-casino-gold mb-6">Activity Logs</h2>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-casino-gold"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-casino-gold"
          >
            <option value="all">All Actions</option>
            <option value="admin">Admin Actions</option>
            <option value="user">User Actions</option>
            <option value="security">Security Events</option>
            <option value="financial">Financial Actions</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-casino-gold"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-bold ${getActionColor(log.action_type)}`}>
                        {log.action_type.replace('_', ' ').toUpperCase()}
                      </span>
                      {log.admin_username && (
                        <span className="text-gray-400 text-sm">
                          by {log.admin_username}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-white mb-2">
                      {log.target_username && (
                        <span>Target: <strong>{log.target_username}</strong></span>
                      )}
                      {log.details && (
                        <div className="text-sm text-gray-300 mt-1">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        📅 {new Date(log.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        🕒 {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                      {log.ip_address && (
                        <span>
                          🌐 {log.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    ID: {log.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No activity logs found matching your criteria.
          </div>
        )}

        {/* Pagination would go here */}
        {filteredLogs.length > 0 && (
          <div className="mt-6 text-center text-gray-400 text-sm">
            Showing {filteredLogs.length} logs
          </div>
        )}
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="casino-card text-center">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-xl font-bold text-white">{logs.length}</div>
          <div className="text-sm text-gray-400">Total Logs</div>
        </div>
        <div className="casino-card text-center">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-xl font-bold text-white">
            {new Set(logs.map(log => log.admin_id)).size}
          </div>
          <div className="text-sm text-gray-400">Active Admins</div>
        </div>
        <div className="casino-card text-center">
          <div className="text-2xl mb-2">🚨</div>
          <div className="text-xl font-bold text-red-400">
            {logs.filter(log => ['ban', 'security_alert'].includes(log.action_type)).length}
          </div>
          <div className="text-sm text-gray-400">Security Events</div>
        </div>
        <div className="casino-card text-center">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-xl font-bold text-green-400">
            {logs.filter(log => log.action_type === 'updateBalance').length}
          </div>
          <div className="text-sm text-gray-400">Balance Changes</div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;