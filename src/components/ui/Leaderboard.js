import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import LoadingSpinner from './LoadingSpinner';

export default function Leaderboard() {
  const { user } = useAuth();
  const { customSettings } = useTheme();
  
  const [activeTab, setActiveTab] = useState('balance');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  // Fetch leaderboard data
  const fetchLeaderboard = async (type = 'balance') => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/leaderboard?type=${type}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      } else {
        console.error('Failed to fetch leaderboard');
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  // Find user's position in current leaderboard
  const userPosition = leaderboardData.findIndex(player => player.username === user?.username) + 1;
  
  // Get position color based on rank
  const getPositionColor = (position) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-white';
    }
  };
  
  // Get position background based on rank
  const getPositionBg = (position) => {
    switch (position) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-400/30';
      default: return 'bg-gray-800/30 border-gray-700/30';
    }
  };
  
  // Get position icon
  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${position}`;
    }
  };
  
  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };
  
  // Get tab label
  const getTabLabel = (tab) => {
    switch (tab) {
      case 'balance': return 'Balance';
      case 'winnings': return 'Total Winnings';
      case 'games': return 'Games Played';
      case 'level': return 'Level/XP';
      case 'streak': return 'Best Streak';
      default: return tab;
    }
  };

  // Get avatar based on level or username
  const getPlayerAvatar = (player) => {
    if (player.level >= 50) return '👑';
    if (player.level >= 40) return '💎';
    if (player.level >= 30) return '⭐';
    if (player.level >= 20) return '🎯';
    if (player.level >= 10) return '🎮';
    return '🎲';
  };
  
  // Player row component
  const PlayerRow = ({ player, position, isCurrentUser = false }) => {
    const avatar = getPlayerAvatar(player);
    const displayValue = activeTab === 'balance' ? player.balance : 
                        activeTab === 'winnings' ? (player.totalWinnings || 0) :
                        activeTab === 'games' ? (player.gamesPlayed || 0) :
                        activeTab === 'level' ? player.xp :
                        activeTab === 'streak' ? (player.bestStreak || 0) : player.value;
    
    const displayLabel = activeTab === 'balance' ? 'Balance' :
                        activeTab === 'winnings' ? 'Total Winnings' :
                        activeTab === 'games' ? 'Games Played' :
                        activeTab === 'level' ? 'XP Points' :
                        activeTab === 'streak' ? 'Best Streak' : 'Value';

    return (
      <div className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${
        isCurrentUser 
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 shadow-lg' 
          : getPositionBg(position)
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              position <= 3 ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gray-700'
            }`}>
              {position <= 3 ? getPositionIcon(position) : `#${position}`}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{avatar}</div>
              <div>
                <div className={`font-bold text-lg ${getPositionColor(position)}`}>
                  {player.username}
                  {isCurrentUser && <span className="ml-2 text-purple-400">(You)</span>}
                  {player.isAdmin && <span className="ml-2 text-yellow-400">👑</span>}
                </div>
                <div className="text-gray-400 text-sm">
                  Level {player.level || 1} • {player.gamesPlayed || 0} games • {player.winRate || 0}% win rate
                  {player.isOnline && <span className="ml-2 text-green-400">🟢 Online</span>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-xl font-bold ${getPositionColor(position)}`}>
              {formatNumber(displayValue)} {activeTab !== 'games' && activeTab !== 'level' && activeTab !== 'streak' ? 'MSP' : ''}
            </div>
            <div className="text-gray-400 text-sm">
              {displayLabel}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              🏆 Leaderboard
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            See how you stack up against other players!
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center mb-8 space-x-2">
        {['balance', 'winnings', 'games', 'level', 'streak'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : leaderboardData.length > 0 ? (
        <div className="space-y-4">
          {leaderboardData.map((player, index) => {
            const position = player.rank || (index + 1);
            const isCurrentUser = player.username === user?.username;
            
            return (
              <PlayerRow 
                key={player.username} 
                player={player} 
                position={position}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-2">No players yet</h3>
          <p className="text-gray-400">
            Be the first to play games and appear on the leaderboard!
          </p>
        </div>
      )}
    </div>
  );
}