import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon, trend, color = 'purple' }) => {
  const colorClasses = {
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    red: 'from-red-500/20 to-pink-500/20 border-red-500/30'
  };

  return (
    <div className={`modern-card bg-gradient-to-br ${colorClasses[color]} border-2 hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-4xl">{icon}</div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            <span>{trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-300 text-sm">{title}</div>
    </div>
  );
};

const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = '#7c3aed' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

const GameChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="modern-card">
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-16 text-sm text-gray-300">{item.label}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-3 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
            <div className="w-16 text-sm text-white font-medium text-right">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      win: '🏆',
      loss: '😔',
      jackpot: '🎰',
      achievement: '🏅',
      bonus: '🎁',
      deposit: '💳',
      withdrawal: '🏦'
    };
    return icons[type] || '🎮';
  };

  const getActivityColor = (type) => {
    const colors = {
      win: 'text-green-400',
      loss: 'text-red-400',
      jackpot: 'text-yellow-400',
      achievement: 'text-purple-400',
      bonus: 'text-blue-400',
      deposit: 'text-green-400',
      withdrawal: 'text-orange-400'
    };
    return colors[type] || 'text-gray-400';
  };

  return (
    <div className="modern-card">
      <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="text-2xl">{getActivityIcon(activity.type)}</div>
            <div className="flex-1">
              <div className="text-white font-medium">{activity.description}</div>
              <div className="text-gray-400 text-sm">{activity.timestamp}</div>
            </div>
            <div className={`font-bold ${getActivityColor(activity.type)}`}>
              {activity.amount && `${activity.amount > 0 ? '+' : ''}${activity.amount} MSP`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/stats', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // Fallback to simple stats if main API fails
          console.log('Main stats API failed, using fallback');
          const fallbackResponse = await fetch('/api/user/stats-simple', {
            credentials: 'include'
          });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setStats(fallbackData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Use empty data as fallback
        setStats({
          totalGames: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          biggestWin: 0,
          totalWinnings: 0,
          favoriteGame: 'None',
          currentStreak: 0,
          achievements: 0,
          level: 1,
          xpProgress: 0,
          gamesData: [],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl font-bold text-white mb-2">No Statistics Available</div>
          <div className="text-gray-400">Start playing games to see your stats!</div>
        </div>
      </div>
    );
  }

  const currentStats = stats;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Games"
          value={currentStats.totalGames}
          icon="🎮"
          trend={5}
          color="blue"
        />
        <StatCard
          title="Win Rate"
          value={`${currentStats.winRate}%`}
          icon="🏆"
          trend={currentStats.winRate > 50 ? 2 : -1}
          color="green"
        />
        <StatCard
          title="Biggest Win"
          value={`${currentStats.biggestWin} MSP`}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Current Streak"
          value={currentStats.currentStreak}
          icon="🔥"
          trend={currentStats.currentStreak > 0 ? 10 : 0}
          color="red"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Level Progress */}
        <div className="modern-card text-center">
          <h3 className="text-xl font-bold text-white mb-6">Level Progress</h3>
          <ProgressRing progress={currentStats.xpProgress} />
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">Level {currentStats.level}</div>
            <div className="text-gray-400">Gaming Master</div>
          </div>
        </div>

        {/* Achievement Progress */}
        <div className="modern-card text-center">
          <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
          <ProgressRing 
            progress={(currentStats.achievements / 20) * 100} 
            color="#f59e0b"
          />
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{currentStats.achievements}/20</div>
            <div className="text-gray-400">Unlocked</div>
          </div>
        </div>

        {/* Win/Loss Ratio */}
        <div className="modern-card text-center">
          <h3 className="text-xl font-bold text-white mb-6">Win/Loss Ratio</h3>
          <ProgressRing 
            progress={currentStats.winRate} 
            color="#10b981"
          />
          <div className="mt-4">
            <div className="text-lg text-green-400 font-bold">{currentStats.totalWins}W</div>
            <div className="text-lg text-red-400 font-bold">{currentStats.totalLosses}L</div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GameChart data={currentStats.gamesData} title="Games Played" />
        <RecentActivity activities={currentStats.recentActivity} />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="modern-card text-center">
          <div className="text-4xl mb-4">💎</div>
          <div className="text-2xl font-bold text-white mb-2">{currentStats.totalWinnings} MSP</div>
          <div className="text-gray-400">Total Winnings</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-2xl font-bold text-white mb-2">{currentStats.favoriteGame}</div>
          <div className="text-gray-400">Favorite Game</div>
        </div>
        
        <div className="modern-card text-center">
          <div className="text-4xl mb-4">⏱️</div>
          <div className="text-2xl font-bold text-white mb-2">24h</div>
          <div className="text-gray-400">Play Time Today</div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;