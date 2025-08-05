import React, { useState, useEffect } from 'react';
import MSPPool from './MSPPool';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    totalRevenue: 0,
    dailyActiveUsers: 0,
    newUsersToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/recent-activity', { credentials: 'include' })
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-casino-gold text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-600',
      change: `+${stats.newUsersToday} today`
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: '🟢',
      color: 'bg-green-600',
      change: `${stats.dailyActiveUsers} today`
    },
    {
      title: 'Total Games',
      value: stats.totalGames,
      icon: '🎮',
      color: 'bg-purple-600',
      change: 'All time'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-casino-gold',
      change: 'House edge'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-casino-gold to-yellow-400 rounded-lg p-6 text-casino-dark">
        <h2 className="text-2xl font-bold mb-2">Welcome to the Admin Dashboard</h2>
        <p className="text-lg">Monitor your casino's performance and manage operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="casino-card">
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3 mr-4`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-gray-500">{card.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="casino-card">
          <h3 className="text-xl font-bold text-casino-gold mb-4">Recent User Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold">
                      {activity.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{activity.username}</p>
                    <p className="text-gray-400 text-xs">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="casino-card">
          <h3 className="text-xl font-bold text-casino-gold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/admin?tab=users'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <div className="text-2xl mb-1">👥</div>
              <div className="text-sm">Manage Users</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin?tab=analytics'}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm">View Analytics</div>
            </button>
            <button
              onClick={() => window.location.href = '/admin?tab=settings'}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-sm">System Settings</div>
            </button>
            <button
              onClick={() => {
                if (confirm('Run database migration to fix missing columns?')) {
                  fetch('/api/admin/migrate-fix-columns', {
                    method: 'POST',
                    credentials: 'include'
                  }).then(response => response.json()).then(data => {
                    if (data.success) {
                      alert('Database migration completed successfully!');
                      window.location.reload();
                    } else {
                      alert('Migration failed: ' + data.error);
                    }
                  }).catch(error => {
                    alert('Migration error: ' + error.message);
                  });
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <div className="text-2xl mb-1">🔧</div>
              <div className="text-sm">Fix DB Schema</div>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to activate emergency stop? This will disable all games.')) {
                  fetch('/api/admin/emergency-stop', {
                    method: 'POST',
                    credentials: 'include'
                  }).then(response => {
                    if (response.ok) {
                      alert('Emergency stop activated. All games have been disabled.');
                      window.location.reload();
                    }
                  });
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <div className="text-2xl mb-1">🚨</div>
              <div className="text-sm">Emergency Stop</div>
            </button>
          </div>
        </div>
      </div>

      {/* MSP Pool Information */}
      <MSPPool />

      {/* System Status */}
      <div className="casino-card">
        <h3 className="text-xl font-bold text-casino-gold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-white">Database: Online</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-white">Games: Operational</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-white">Payments: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;