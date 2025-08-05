import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function BotProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    if (!username) return;

    const fetchBotProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bots/profile?username=${encodeURIComponent(username)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bot profile');
        }
        
        const data = await response.json();
        setBot(data.bot);
        setRecentGames(data.recentGames || []);
      } catch (err) {
        console.error('Error fetching bot profile:', err);
        setError('Failed to load bot profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBotProfile();
  }, [username]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner text="Loading bot profile..." />
        </div>
      </Layout>
    );
  }

  if (error || !bot) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">😢</div>
              <h2 className="text-2xl font-bold text-white mb-2">Bot Not Found</h2>
              <p className="text-gray-400 mb-6">
                {error || "We couldn't find this bot profile. It may have been removed or doesn't exist."}
              </p>
              <Button onClick={() => router.push('/profiles')} variant="primary">
                View All Players
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate win rate
  const winRate = bot.hands_played > 0 
    ? Math.round((bot.hands_won / bot.hands_played) * 100) 
    : 0;

  // Get personality description
  const getPersonalityDescription = (type) => {
    const descriptions = {
      aggressive: "Plays aggressively with frequent raises and bluffs",
      tight: "Plays conservatively, only betting with strong hands",
      loose: "Plays many hands and calls frequently",
      balanced: "Plays a balanced strategy with mixed aggression",
      calling_station: "Calls often but rarely raises",
      bluffer: "Bluffs frequently, even with weak hands",
      rock: "Extremely tight player who only plays premium hands",
      wild: "Unpredictable player with wild betting patterns",
      professional: "Skilled player with solid fundamentals",
      maniac: "Extremely aggressive player who raises constantly"
    };
    
    return descriptions[type] || "A poker player with a unique style";
  };

  // Get skill level based on win rate and hands played
  const getSkillLevel = () => {
    if (bot.hands_played < 10) return "Novice";
    if (bot.hands_played < 50) return "Beginner";
    if (bot.hands_played < 100) return "Amateur";
    
    if (winRate > 60) return "Expert";
    if (winRate > 50) return "Advanced";
    if (winRate > 40) return "Intermediate";
    return "Casual";
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bot Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-5xl shadow-lg">
              {bot.avatar}
            </div>
            
            {/* Bot Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center md:text-left">
                {bot.username}
              </h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  {bot.personality_type.charAt(0).toUpperCase() + bot.personality_type.slice(1)} Bot
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  {getSkillLevel()}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                  {bot.chips.toLocaleString()} MSP
                </span>
              </div>
              <p className="text-gray-400 mb-4 text-center md:text-left">
                {bot.description || getPersonalityDescription(bot.personality_type)}
              </p>
              <div className="text-sm text-gray-500 text-center md:text-left">
                Bot created: {new Date(bot.created_at).toLocaleDateString()}
                <span className="mx-2">•</span>
                Last active: {new Date(bot.last_active).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{bot.hands_played}</div>
              <div className="text-sm text-gray-400">Hands Played</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{bot.hands_won}</div>
              <div className="text-sm text-gray-400">Hands Won</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-green-400 mb-1">{bot.total_winnings.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Winnings</div>
            </div>
          </Card>
        </div>

        {/* Bot Personality */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Bot Personality</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Playing Style</h3>
              <p className="text-gray-400 mb-4">{getPersonalityDescription(bot.personality_type)}</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Aggression</span>
                    <span className="text-sm text-white">{Math.round(bot.aggression * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${bot.aggression * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">Bluff Rate</span>
                    <span className="text-sm text-white">{Math.round(bot.bluff_rate * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${bot.bluff_rate * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Notable Achievements</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Biggest Win:</span>
                  <span className="text-green-400 font-bold">{bot.biggest_win.toLocaleString()} MSP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Biggest Loss:</span>
                  <span className="text-red-400 font-bold">{bot.biggest_loss.toLocaleString()} MSP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Balance:</span>
                  <span className="text-white font-bold">{bot.chips.toLocaleString()} MSP</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Games */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Recent Games</h2>
          
          {recentGames.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Game</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Result</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(game.played_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {game.game_type}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          game.result === 'win' ? 'bg-green-500/20 text-green-400' : 
                          game.result === 'loss' ? 'bg-red-500/20 text-red-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {game.result.charAt(0).toUpperCase() + game.result.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={game.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                          {game.amount > 0 ? '+' : ''}{game.amount.toLocaleString()} MSP
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🃏</div>
              <p>No recent games found for this bot.</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}