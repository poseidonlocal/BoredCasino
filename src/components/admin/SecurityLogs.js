import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import MetricCard from '../ui/MetricCard';

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    category: '',
    search: '',
    timeRange: '24h'
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchSecurityLogs();
  }, [filters, currentPage]);

  const fetchSecurityLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: (currentPage * 50).toString(),
        timeRange: filters.timeRange,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/security-logs?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setStats(data.stats || {});
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const clearLogs = async (olderThan = '30d') => {
    if (!confirm(`Are you sure you want to delete logs older than ${olderThan}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/security-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ olderThan })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully deleted ${data.deletedCount} log entries`);
        fetchSecurityLogs();
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      alert('Failed to clear logs');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'auth': return 'warning';
      case 'admin': return 'danger';
      case 'game': return 'success';
      case 'transaction': return 'info';
      case 'system': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'auth': return '🔐';
      case 'admin': return '👑';
      case 'game': return '🎮';
      case 'transaction': return '💰';
      case 'system': return '⚙️';
      default: return '📋';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Logs</h2>
          <p className="text-gray-400">Monitor system security events and user activities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSecurityLogs}
            variant="secondary"
            size="sm"
            icon="🔄"
          >
            Refresh
          </Button>
          <div className="relative">
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Events"
          value={stats.total_events?.toLocaleString() || '0'}
          icon="📊"
          color="blue"
          subtitle={`In ${filters.timeRange}`}
        />
        <MetricCard
          title="Critical Events"
          value={stats.critical_events?.toLocaleString() || '0'}
          icon="🚨"
          color="red"
          subtitle="Requires attention"
        />
        <MetricCard
          title="Auth Events"
          value={stats.auth_events?.toLocaleString() || '0'}
          icon="🔐"
          color="yellow"
          subtitle="Login attempts"
        />
        <MetricCard
          title="Unique Users"
          value={stats.unique_users?.toLocaleString() || '0'}
          icon="👥"
          color="green"
          subtitle="Active users"
        />
      </div>

      {/* Filters */}
      <Card title="Filters" icon="🔍">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="admin">Admin Actions</option>
              <option value="game">Game Events</option>
              <option value="transaction">Transactions</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search logs..."
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ severity: '', category: '', search: '', timeRange: '24h' })}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Security Logs Table */}
      <Card title="Security Events" icon="🛡️">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner text="Loading security logs..." />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Severity & Category Icons */}
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-2xl">{getSeverityIcon(log.severity)}</span>
                      <span className="text-lg">{getCategoryIcon(log.category)}</span>
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-white font-medium">{log.action}</h4>
                        <Badge variant={getSeverityColor(log.severity)} size="xs">
                          {log.severity}
                        </Badge>
                        <Badge variant={getCategoryColor(log.category)} size="xs">
                          {log.category}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-300 space-y-1">
                        {log.username && (
                          <div>
                            <span className="text-gray-400">User:</span> {log.username}
                          </div>
                        )}
                        {log.ip_address && (
                          <div>
                            <span className="text-gray-400">IP:</span> {log.ip_address}
                          </div>
                        )}
                        {log.details && (
                          <div>
                            <span className="text-gray-400">Details:</span>
                            <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {formatTimeAgo(log.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              
              <span className="text-gray-400">
                Page {currentPage + 1}
              </span>
              
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasMore}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>No security logs found</p>
          </div>
        )}
      </Card>

      {/* Log Management */}
      <Card title="Log Management" icon="🗂️">
        <div className="space-y-4">
          <p className="text-gray-300">
            Manage security log retention and cleanup. Old logs can be automatically deleted to save storage space.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => clearLogs('7d')}
              variant="warning"
              size="sm"
              icon="🗑️"
            >
              Clear Logs &gt; 7 Days
            </Button>
            <Button
              onClick={() => clearLogs('30d')}
              variant="warning"
              size="sm"
              icon="🗑️"
            >
              Clear Logs &gt; 30 Days
            </Button>
            <Button
              onClick={() => clearLogs('90d')}
              variant="danger"
              size="sm"
              icon="🗑️"
            >
              Clear Logs &gt; 90 Days
            </Button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 text-lg">⚠️</span>
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">Warning</p>
                <p>Clearing logs is permanent and cannot be undone. Only clear logs you no longer need for security auditing.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}