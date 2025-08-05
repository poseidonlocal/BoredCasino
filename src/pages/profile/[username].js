import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import MetricCard from '../../components/ui/MetricCard';
import LevelProgressBar from '../../components/ui/LevelProgressBar';

export default function UserProfile() {
  const router = useRouter();
  const { username } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        // Try simple profile API as fallback
        console.log('Main profile API failed, trying simple version');
        const fallbackResponse = await fetch(`/api/profile/${username}-simple`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setProfile(fallbackData);
        } else {
          setError('User not found');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Try simple profile API as final fallback
      try {
        const fallbackResponse = await fetch(`/api/profile/${username}-simple`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setProfile(fallbackData);
        } else {
          setError('Failed to load profile');
        }
      } catch (fallbackError) {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Loading profile..." />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const getRankColor = (rank) => {
    if (rank <= 3) return 'success';
    if (rank <= 10) return 'warning';
    return 'info';
  };

  const getAchievementIcon = (achievement) => {
    const icons = {
      'first_win': '🎉',
      'big_winner': '💰',
      'lucky_streak': '🍀',
      'high_roller': '👑',
      'veteran': '🏆',
      'social_butterfly': '🦋',
      'daily_player': '📅'
    };
    return icons[achievement] || '🏅';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-6xl font-bold text-white mx-auto mb-4">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            {profile.isOnline && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900"></div>
            )}
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            {profile.username}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge variant={getRankColor(profile.rank)} size="lg">
              Rank #{profile.rank}
            </Badge>
            <Badge variant="primary" size="lg">
              Level {profile.level}
            </Badge>
            {profile.isVip && (
              <Badge variant="warning" size="lg">
                👑 VIP
              </Badge>
            )}
          </div>
          
          {/* Level Progress Bar */}
          {profile.levelInfo && (
            <div className="max-w-md mx-auto mb-6">
              <LevelProgressBar
                level={profile.levelInfo.level}
                progress={profile.levelInfo.progress}
                xpForNext={profile.levelInfo.xpForNext}
                title={profile.levelInfo.title}
                size="lg"
              />
            </div>
          )}
          
          <p className="text-gray-400 max-w-md mx-auto">
            {profile.bio || `${profile.username} is a BoredCasino enthusiast who loves the thrill of the game!`}
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Last seen {profile.lastSeen}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Lifetime Earnings"
            value={`${profile.stats.lifetimeEarnings.toLocaleString()} MSP`}
            icon="💰"
            color="green"
            subtitle="Total MSP won"
            change={profile.stats.netProfit > 0 ? `+${profile.stats.netProfit.toLocaleString()} MSP` : `${profile.stats.netProfit.toLocaleString()} MSP`}
            changeType={profile.stats.netProfit > 0 ? 'positive' : 'negative'}
          />
          <MetricCard
            title="Games Played"
            value={profile.stats.gamesPlayed.toLocaleString()}
            icon="🎮"
            color="blue"
            subtitle={`${profile.stats.gamesWon}W / ${profile.stats.gamesLost}L`}
          />
          <MetricCard
            title="Win Rate"
            value={`${profile.stats.winRate}%`}
            icon="🏆"
            color="yellow"
            subtitle="Success rate"
            change={profile.stats.winRate >= 50 ? 'Above average' : 'Below average'}
            changeType={profile.stats.winRate >= 50 ? 'positive' : 'neutral'}
          />
          <MetricCard
            title="Biggest Win"
            value={`${profile.stats.biggestWin.toLocaleString()} MSP`}
            icon="🎯"
            color="purple"
            subtitle="Single game record"
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Current Balance"
            value={`${profile.stats.currentBalance.toLocaleString()} MSP`}
            icon="💳"
            color="indigo"
            subtitle="Available funds"
          />
          <MetricCard
            title="Level Progress"
            value={`Level ${profile.level}`}
            icon="⭐"
            color="yellow"
            subtitle={profile.levelInfo?.title || 'Player'}
            change={profile.levelInfo?.xpForNext > 0 ? `${profile.levelInfo.xpForNext.toLocaleString()} XP to next` : 'Max Level!'}
            changeType={profile.levelInfo?.xpForNext > 0 ? 'neutral' : 'positive'}
          />
          <MetricCard
            title="Daily Bonuses"
            value={profile.stats.dailyBonusesClaimed}
            icon="🎁"
            color="green"
            subtitle="Bonuses claimed"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Statistics */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Game Statistics" icon="📊" headerClassName="bg-gray-900">
              <div className="space-y-4">
                {profile.gameStats.map((game, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {game.game_type === 'coinflip' ? '🪙' :
                         game.game_type === 'roulette' ? '🎰' :
                         game.game_type === 'slots' ? '🎰' :
                         game.game_type === 'poker' ? '🃏' : '🎲'}
                      </span>
                      <div>
                        <h4 className="text-white font-semibold capitalize">{game.game_type}</h4>
                        <p className="text-sm text-gray-400">{game.games_played} games played</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        +{game.total_winnings.toLocaleString()} MSP
                      </div>
                      <div className="text-sm text-gray-400">
                        {game.win_rate}% win rate
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Level Benefits, Achievements & Activity */}
          <div className="space-y-6">
            {/* Level Benefits */}
            {profile.levelInfo && (profile.levelInfo.rewards.benefits.length > 0 || profile.levelInfo.rewards.unlocks.length > 0) && (
              <Card title="Level Benefits" icon="🎁" headerClassName="bg-gray-900">
                <div className="space-y-4">
                  {profile.levelInfo.rewards.benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Active Benefits</h4>
                      <ul className="space-y-1">
                        {profile.levelInfo.rewards.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-300">
                            <span className="text-green-400 mr-2">✓</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {profile.levelInfo.rewards.unlocks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">Unlocked Features</h4>
                      <ul className="space-y-1">
                        {profile.levelInfo.rewards.unlocks.map((unlock, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-300">
                            <span className="text-blue-400 mr-2">🔓</span>
                            {unlock}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
            <Card title="Achievements" icon="🏅" headerClassName="bg-gray-900">
              <div className="grid grid-cols-2 gap-3">
                {profile.achievements.map((achievement, index) => (
                  <div key={index} className="text-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                    <div className="text-2xl mb-1">{getAchievementIcon(achievement.type)}</div>
                    <div className="text-xs text-gray-300 font-medium">{achievement.name}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                ))}
                {profile.achievements.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>No achievements yet</p>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Recent Activity" icon="📈" headerClassName="bg-gray-900">
              <div className="space-y-3">
                {profile.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {activity.type === 'win' ? '🎉' :
                         activity.type === 'loss' ? '😔' :
                         activity.type === 'achievement' ? '🏅' : '🎮'}
                      </span>
                      <span className="text-gray-300">{activity.description}</span>
                    </div>
                    <span className="text-gray-500">{activity.timeAgo}</span>
                  </div>
                ))}
                {profile.recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📱</div>
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Leaderboard Position */}
        <Card title="Leaderboard Rankings" icon="🏆" headerClassName="bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-yellow-400 mb-2">#{profile.rankings.overall}</div>
              <div className="text-gray-300">Overall Rank</div>
            </div>
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">#{profile.rankings.winnings}</div>
              <div className="text-gray-300">Winnings Rank</div>
            </div>
            <div className="text-center p-6 bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-2">#{profile.rankings.games}</div>
              <div className="text-gray-300">Games Played Rank</div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}