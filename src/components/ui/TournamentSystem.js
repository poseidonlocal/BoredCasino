import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import useSound from '../../hooks/useSound';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

// Tournament status constants
const STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

// Tournament types
const TOURNAMENT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  SPECIAL: 'special'
};

// Game types
const GAME_TYPES = {
  ALL: 'all',
  ROULETTE: 'roulette',
  SLOTS: 'slots',
  POKER: 'poker',
  COINFLIP: 'coinflip',
  CRASH: 'crash'
};

// Mock tournament data (in a real app, this would come from an API)
const MOCK_TOURNAMENTS = [
  {
    id: 't1',
    name: 'Daily High Roller',
    description: 'Daily tournament for the biggest winners across all games',
    gameType: GAME_TYPES.ALL,
    startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    entryFee: 100,
    prizePool: 5000,
    maxParticipants: 100,
    currentParticipants: 42,
    status: STATUS.UPCOMING,
    type: TOURNAMENT_TYPES.DAILY,
    prizes: [
      { position: 1, reward: 2500, label: '1st Place' },
      { position: 2, reward: 1500, label: '2nd Place' },
      { position: 3, reward: 1000, label: '3rd Place' }
    ],
    leaderboard: []
  },
  {
    id: 't2',
    name: 'Crash Masters',
    description: 'Compete for the highest multiplier in the Crash game',
    gameType: GAME_TYPES.CRASH,
    startTime: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
    endTime: new Date(Date.now() + 82800000).toISOString(), // Ends in 23 hours
    entryFee: 50,
    prizePool: 2500,
    maxParticipants: 50,
    currentParticipants: 28,
    status: STATUS.ACTIVE,
    type: TOURNAMENT_TYPES.DAILY,
    prizes: [
      { position: 1, reward: 1250, label: '1st Place' },
      { position: 2, reward: 750, label: '2nd Place' },
      { position: 3, reward: 500, label: '3rd Place' }
    ],
    leaderboard: [
      { username: 'player1', score: 8.75, position: 1 },
      { username: 'highroller99', score: 7.50, position: 2 },
      { username: 'luckystar', score: 6.25, position: 3 },
      { username: 'gambler42', score: 5.80, position: 4 },
      { username: 'casinopro', score: 5.25, position: 5 }
    ]
  },
  {
    id: 't3',
    name: 'Weekly Poker Championship',
    description: 'The ultimate test of poker skills with massive prizes',
    gameType: GAME_TYPES.POKER,
    startTime: new Date(Date.now() - 259200000).toISOString(), // Started 3 days ago
    endTime: new Date(Date.now() - 86400000).toISOString(), // Ended yesterday
    entryFee: 200,
    prizePool: 10000,
    maxParticipants: 200,
    currentParticipants: 156,
    status: STATUS.COMPLETED,
    type: TOURNAMENT_TYPES.WEEKLY,
    prizes: [
      { position: 1, reward: 5000, label: '1st Place' },
      { position: 2, reward: 3000, label: '2nd Place' },
      { position: 3, reward: 2000, label: '3rd Place' }
    ],
    leaderboard: [
      { username: 'pokerking', score: 15420, position: 1 },
      { username: 'cardshark', score: 12850, position: 2 },
      { username: 'bluffmaster', score: 11200, position: 3 }
    ]
  }
];

export default function TournamentSystem() {
  const { user, updateUserCash } = useAuth();
  const { customSettings } = useTheme();
  const { playSound } = useSound();
  
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [userTournaments, setUserTournaments] = useState(['t2']); // Mock user participation
  
  // Filter tournaments by status
  const filteredTournaments = tournaments.filter(tournament => {
    switch (activeTab) {
      case 'active':
        return tournament.status === STATUS.ACTIVE;
      case 'upcoming':
        return tournament.status === STATUS.UPCOMING;
      case 'completed':
        return tournament.status === STATUS.COMPLETED;
      case 'my':
        return userTournaments.includes(tournament.id);
      default:
        return true;
    }
  });
  
  // Format time remaining
  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };
  
  // Format start time
  const formatStartTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = start - now;
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Starts in ${days}d ${hours % 24}h`;
    }
    
    return `Starts in ${hours}h ${minutes}m`;
  };
  
  // Get game type icon
  const getGameIcon = (gameType) => {
    switch (gameType) {
      case GAME_TYPES.ROULETTE: return '🎰';
      case GAME_TYPES.SLOTS: return '🎲';
      case GAME_TYPES.POKER: return '🎮';
      case GAME_TYPES.COINFLIP: return '🪙';
      case GAME_TYPES.CRASH: return '📈';
      default: return '🏆';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case STATUS.ACTIVE: return 'text-green-400';
      case STATUS.UPCOMING: return 'text-yellow-400';
      case STATUS.COMPLETED: return 'text-gray-400';
      default: return 'text-white';
    }
  };
  
  // Join tournament
  const joinTournament = async (tournamentId) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    // Check if user has enough cash
    if (user.cashBalance < tournament.entryFee) {
      playSound('error');
      alert('Insufficient funds to join this tournament');
      return;
    }
    
    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      playSound('error');
      alert('Tournament is full');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Deduct entry fee
      await updateUserCash(user.cashBalance - tournament.entryFee);
      
      // Add user to tournament
      setUserTournaments(prev => [...prev, tournamentId]);
      
      // Update tournament participant count
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId 
          ? { ...t, currentParticipants: t.currentParticipants + 1 }
          : t
      ));
      
      playSound('success');
      alert(`Successfully joined ${tournament.name}!`);
      
    } catch (error) {
      console.error('Failed to join tournament:', error);
      playSound('error');
      alert('Failed to join tournament. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Tournament card component
  const TournamentCard = ({ tournament }) => {
    const isParticipating = userTournaments.includes(tournament.id);
    const canJoin = tournament.status === STATUS.UPCOMING && !isParticipating;
    
    return (
      <div className="modern-card hover:scale-105 transition-all duration-300 cursor-pointer"
           onClick={() => setSelectedTournament(tournament)}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getGameIcon(tournament.gameType)}</div>
            <div>
              <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
              <p className="text-gray-400 text-sm">{tournament.description}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(tournament.status)}`}>
            {tournament.status.toUpperCase()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-sm">Prize Pool</div>
            <div className="text-yellow-400 font-bold">{tournament.prizePool} MSP</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Entry Fee</div>
            <div className="text-white font-bold">{tournament.entryFee} MSP</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Participants</div>
            <div className="text-blue-400 font-bold">
              {tournament.currentParticipants}/{tournament.maxParticipants}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">
              {tournament.status === STATUS.ACTIVE ? 'Ends' : 
               tournament.status === STATUS.UPCOMING ? 'Starts' : 'Ended'}
            </div>
            <div className="text-white font-bold text-sm">
              {tournament.status === STATUS.ACTIVE ? formatTimeRemaining(tournament.endTime) :
               tournament.status === STATUS.UPCOMING ? formatStartTime(tournament.startTime) :
               'Completed'}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {isParticipating && (
            <div className="flex items-center space-x-2 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="text-sm font-bold">Participating</span>
            </div>
          )}
          
          {canJoin && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                joinTournament(tournament.id);
              }}
              disabled={isLoading}
              className="btn-gaming ml-auto"
            >
              Join Tournament
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Tournament details modal
  const TournamentModal = ({ tournament, onClose }) => {
    if (!tournament) return null;
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="modern-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getGameIcon(tournament.gameType)}</div>
              <div>
                <h2 className="text-3xl font-bold text-white">{tournament.name}</h2>
                <p className="text-gray-400">{tournament.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tournament Info */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Tournament Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-bold ${getStatusColor(tournament.status)}`}>
                    {tournament.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-yellow-400 font-bold">{tournament.prizePool} MSP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-white font-bold">{tournament.entryFee} MSP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-blue-400 font-bold">
                    {tournament.currentParticipants}/{tournament.maxParticipants}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Game Type:</span>
                  <span className="text-white font-bold capitalize">
                    {tournament.gameType === 'all' ? 'All Games' : tournament.gameType}
                  </span>
                </div>
              </div>
              
              {/* Prize Structure */}
              <h4 className="text-lg font-bold text-white mt-6 mb-3">Prize Structure</h4>
              <div className="space-y-2">
                {tournament.prizes.map((prize, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">{prize.label}</span>
                    <span className="text-yellow-400 font-bold">{prize.reward} MSP</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Leaderboard */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Leaderboard</h3>
              {tournament.leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {tournament.leaderboard.map((player, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          player.position === 1 ? 'bg-yellow-500 text-black' :
                          player.position === 2 ? 'bg-gray-400 text-black' :
                          player.position === 3 ? 'bg-orange-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {player.position}
                        </div>
                        <span className="text-white font-medium">{player.username}</span>
                      </div>
                      <span className="text-blue-400 font-bold">{player.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No participants yet. Be the first to join!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              🏆 Tournaments
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Compete with other players for massive prizes!
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex flex-wrap justify-center mb-8 space-x-2">
        {[
          { key: 'active', label: 'Active', icon: '🔥' },
          { key: 'upcoming', label: 'Upcoming', icon: '⏰' },
          { key: 'completed', label: 'Completed', icon: '✅' },
          { key: 'my', label: 'My Tournaments', icon: '👤' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tournament Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-2xl font-bold text-white mb-2">No tournaments found</h3>
          <p className="text-gray-400">
            {activeTab === 'my' 
              ? "You haven't joined any tournaments yet. Join one to get started!"
              : `No ${activeTab} tournaments at the moment. Check back later!`
            }
          </p>
        </div>
      )}
      
      {/* Tournament Details Modal */}
      {selectedTournament && (
        <TournamentModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
        />
      )}
    </div>
  );
}