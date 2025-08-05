import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import SimpleChart, { PieChart } from '../ui/SimpleChart';
import MetricCard from '../ui/MetricCard';

const GameAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    gameStats: [],
    revenueData: [],
    playerStats: {},
    topPlayers: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            📊 Game Analytics
          </h1>
          <p className="text-gray-400 mt-1">Monitor game performance and player statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-600"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={fetchAnalytics} variant="primary" icon="🔄" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Games"
          value={analytics.gameStats.reduce((sum, game) => sum + game.total_games, 0).toLocaleString()}
          icon="🎮"
          color="blue"
          subtitle="Games played this period"
          change={`${timeRange === '1d' ? '+12%' : timeRange === '7d' ? '+8%' : '+15%'}`}
          changeType="positive"
        />
        <MetricCard
          title="Total Bets"
          value={`${analytics.gameStats.reduce((sum, game) => sum + game.total_bets, 0).toLocaleString()} MSP`}
          icon="💰"
          color="green"
          subtitle="Total amount wagered"
          change={`${timeRange === '1d' ? '+5%' : timeRange === '7d' ? '+12%' : '+22%'}`}
          changeType="positive"
        />
        <MetricCard
          title="Player Winnings"
          value={`${analytics.gameStats.reduce((sum, game) => sum + game.total_winnings, 0).toLocaleString()} MSP`}
          icon="�"
          color="yellow"
          subtitle="Total paid to players"
          change={`${timeRange === '1d' ? '+3%' : timeRange === '7d' ? '+7%' : '+18%'}`}
          changeType="positive"
        />
        <MetricCard
          title="House Revenue"
          value={`${analytics.gameStats.reduce((sum, game) => sum + (game.total_bets - game.total_winnings), 0).toLocaleString()} MSP`}
          icon="🏛️"
          color="purple"
          subtitle="Net casino profit"
          change={`${timeRange === '1d' ? '+8%' : timeRange === '7d' ? '+15%' : '+28%'}`}
          changeType="positive"
        />
      </div>

      <Card title="Game Performance" icon="🎯" headerClassName="bg-gray-900">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {analytics.gameStats.map((game, index) => {
            const houseEdge = ((game.total_bets - game.total_winnings) / game.total_bets * 100).toFixed(2);
            const profitability = game.total_bets - game.total_winnings;

            return (
              <div key={index} className="bg-gray-700 rounded-lg p-6 border border-gray-600 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">
                      {game.game_type === 'coinflip' ? '🪙' :
                        game.game_type === 'roulette' ? '🎰' :
                          game.game_type === 'blackjack' ? '🃏' : '🎲'}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white capitalize">{game.game_type}</h3>
                      <Badge variant={profitability > 0 ? 'success' : 'danger'} size="xs">
                        {profitability > 0 ? 'Profitable' : 'Loss'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Total Games</span>
                    <span className="text-white font-bold">{game.total_games.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Total Bets</span>
                    <span className="text-green-400 font-bold">{game.total_bets.toLocaleString()} MSP</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Total Winnings</span>
                    <span className="text-red-400 font-bold">{game.total_winnings.toLocaleString()} MSP</span>
                  </div>

                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">House Edge</span>
                      <Badge variant={houseEdge > 0 ? 'success' : 'warning'} size="sm">
                        {houseEdge}%
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-300 text-sm">Net Profit</span>
                      <span className={`font-bold ${profitability > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profitability > 0 ? '+' : ''}{profitability.toLocaleString()} MSP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Player Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Player Statistics" icon="👥" headerClassName="bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{analytics.playerStats.activePlayers || 0}</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{analytics.playerStats.newPlayers || 0}</div>
              <div className="text-sm text-gray-400">New Players</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{analytics.playerStats.avgSessionTime || '0m'}</div>
              <div className="text-sm text-gray-400">Avg. Session</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{analytics.playerStats.avgBetSize || 0} MSP</div>
              <div className="text-sm text-gray-400">Avg. Bet Size</div>
            </div>
          </div>
        </Card>

        <Card title="Top Players" icon="🏆" headerClassName="bg-gray-900">
          <div className="space-y-4">
            {analytics.topPlayers.slice(0, 5).map((player, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">
                        {player.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{player.username}</div>
                    <div className="text-xs text-gray-400">{player.games_played} games played</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{player.total_bets.toLocaleString()} MSP</div>
                  <Badge variant="info" size="xs">
                    Rank #{index + 1}
                  </Badge>
                </div>
              </div>
            ))}
            {analytics.topPlayers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🎮</div>
                <p>No player data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Revenue Trends & Additional Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card title="Game Revenue Comparison" icon="📊" headerClassName="bg-gray-900">
            <SimpleChart
              data={analytics.gameStats.map(game => ({
                label: game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1),
                value: game.total_bets - game.total_winnings
              }))}
              type="bar"
              height={250}
            />
          </Card>

          <Card title="Games Distribution" icon="🎯" headerClassName="bg-gray-900">
            <PieChart
              data={analytics.gameStats.map(game => ({
                label: game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1),
                value: game.total_games
              }))}
              size={200}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Game Popularity" icon="🎯" headerClassName="bg-gray-900">
            <div className="space-y-3">
              {analytics.gameStats
                .sort((a, b) => b.total_games - a.total_games)
                .map((game, index) => {
                  const totalGames = analytics.gameStats.reduce((sum, g) => sum + g.total_games, 0);
                  const percentage = totalGames > 0 ? ((game.total_games / totalGames) * 100).toFixed(1) : 0;

                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">
                          {game.game_type === 'coinflip' ? '🪙' :
                            game.game_type === 'roulette' ? '🎰' :
                              game.game_type === 'blackjack' ? '🃏' : '🎲'}
                        </span>
                        <span className="text-white capitalize">{game.game_type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold">{percentage}%</div>
                        <div className="text-xs text-gray-400">{game.total_games} games</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card title="Performance Metrics" icon="⚡" headerClassName="bg-gray-900">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Games per Hour</span>
                <Badge variant="info" size="sm">
                  {Math.round(analytics.gameStats.reduce((sum, game) => sum + game.total_games, 0) / 24)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Revenue per Game</span>
                <Badge variant="success" size="sm">
                  {analytics.gameStats.reduce((sum, game) => sum + game.total_games, 0) > 0 ?
                    Math.round(analytics.gameStats.reduce((sum, game) => sum + (game.total_bets - game.total_winnings), 0) /
                      analytics.gameStats.reduce((sum, game) => sum + game.total_games, 0)) : 0} MSP
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Player Retention</span>
                <Badge variant="warning" size="sm">
                  {analytics.playerStats.activePlayers && analytics.playerStats.newPlayers ?
                    Math.round(((analytics.playerStats.activePlayers - analytics.playerStats.newPlayers) / analytics.playerStats.activePlayers) * 100) : 0}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameAnalytics;