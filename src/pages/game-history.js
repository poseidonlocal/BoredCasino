import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const GameHistoryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [gameHistory, setGameHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [stats, setStats] = useState({});

  // Load real data from API
  useEffect(() => {
    if (isAuthenticated) {
      loadGameHistory();
      loadStats();
    }
  }, [isAuthenticated, filter, sortBy]);

  const loadGameHistory = async () => {
    try {
      const response = await fetch(`/api/game-history?filter=${filter}&sortBy=${sortBy}&limit=100`);
      if (response.ok) {
        const historyData = await response.json();
        const formattedHistory = historyData.map(game => ({
          id: game.id,
          game: game.game_type,
          type: game.bet_type || 'Standard',
          bet: game.bet_amount,
          result: game.result,
          payout: game.payout,
          profit: game.profit,
          timestamp: new Date(game.created_at),
          details: game.details || 'No details available'
        }));
        setGameHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error loading game history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/game-history/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats({
          totalGames: statsData.overall.totalGames,
          wins: statsData.overall.wins,
          losses: statsData.overall.losses,
          totalWagered: statsData.overall.totalWagered,
          totalProfit: statsData.overall.totalProfit,
          winRate: statsData.overall.winRate,
          biggestWin: statsData.overall.biggestWin,
          biggestLoss: statsData.overall.biggestLoss
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredHistory = gameHistory.filter(game => {
    if (filter === 'all') return true;
    if (filter === 'wins') return game.result === 'win';
    if (filter === 'losses') return game.result === 'loss';
    return game.game.toLowerCase() === filter.toLowerCase();
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'recent') return b.timestamp - a.timestamp;
    if (sortBy === 'oldest') return a.timestamp - b.timestamp;
    if (sortBy === 'profit') return b.profit - a.profit;
    if (sortBy === 'bet') return b.bet - a.bet;
    return 0;
  });

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result) => {
    return result === 'win' ? 'text-green-400' : 'text-red-400';
  };

  const getResultIcon = (result) => {
    return result === 'win' ? '📈' : '📉';
  };

  const getGameIcon = (game) => {
    const icons = {
      'Roulette': '🎰',
      'Slots': '🎲',
      'Poker': '🃏',
      'Coinflip': '🪙',
      'Case Opening': '📦'
    };
    return icons[game] || '🎮';
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Game History</h1>
            <p className="text-gray-400 mb-8">Please log in to view your game history</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Game History
            </span>
          </h1>
          <p className="text-gray-300 text-xl">Track your gaming performance and statistics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Total Games</h3>
              <div className="text-2xl">🎮</div>
            </div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalGames}</div>
            <div className="text-sm text-gray-400 mt-2">
              {stats.wins}W / {stats.losses}L
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Win Rate</h3>
              <div className="text-2xl">📊</div>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.winRate}%</div>
            <div className="text-sm text-gray-400 mt-2">
              Success rate
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Total Wagered</h3>
              <div className="text-2xl">💰</div>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{stats.totalWagered?.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-2">
              MSP wagered
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Net Profit</h3>
              <div className="text-2xl">{stats.totalProfit >= 0 ? '📈' : '📉'}</div>
            </div>
            <div className={`text-3xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              MSP profit/loss
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['all', 'wins', 'losses', 'roulette', 'slots', 'poker', 'coinflip', 'case opening'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                  }`}
                >
                  {filterOption}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="profit">Highest Profit</option>
                <option value="bet">Highest Bet</option>
              </select>
            </div>
          </div>
        </div>

        {/* Game History Table */}
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-2xl font-bold text-white">Recent Games ({sortedHistory.length})</h2>
          </div>

          {sortedHistory.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">No games found</h3>
              <p className="text-gray-400">Try adjusting your filters or start playing some games!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/30">
                  <tr>
                    <th className="text-left p-4 text-gray-300 font-medium">Game</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Type</th>
                    <th className="text-right p-4 text-gray-300 font-medium">Bet</th>
                    <th className="text-center p-4 text-gray-300 font-medium">Result</th>
                    <th className="text-right p-4 text-gray-300 font-medium">Payout</th>
                    <th className="text-right p-4 text-gray-300 font-medium">Profit</th>
                    <th className="text-left p-4 text-gray-300 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((game, index) => (
                    <tr key={game.id} className={`border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors ${index % 2 === 0 ? 'bg-gray-800/10' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getGameIcon(game.game)}</div>
                          <div>
                            <div className="text-white font-medium">{game.game}</div>
                            <div className="text-xs text-gray-400">{game.details}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{game.type}</td>
                      <td className="p-4 text-right text-yellow-400 font-medium">{game.bet.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-lg">{getResultIcon(game.result)}</span>
                          <span className={`font-medium capitalize ${getResultColor(game.result)}`}>
                            {game.result}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-green-400 font-medium">{game.payout.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${game.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {game.profit >= 0 ? '+' : ''}{game.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{formatTime(game.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Biggest Wins & Losses</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Biggest Win:</span>
                <span className="text-green-400 font-bold text-lg">+{stats.biggestWin?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Biggest Loss:</span>
                <span className="text-red-400 font-bold text-lg">{stats.biggestLoss?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Game Breakdown</h3>
            <div className="space-y-2">
              {['Roulette', 'Slots', 'Poker', 'Coinflip', 'Case Opening'].map((game) => {
                const gameCount = gameHistory.filter(g => g.game === game).length;
                const percentage = gameHistory.length > 0 ? (gameCount / gameHistory.length * 100).toFixed(1) : 0;
                return (
                  <div key={game} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getGameIcon(game)}</span>
                      <span className="text-gray-300">{game}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{gameCount}</span>
                      <span className="text-gray-400 text-sm">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GameHistoryPage;