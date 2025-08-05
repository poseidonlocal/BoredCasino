import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import SimplePokerGame from '../components/SimplePokerGame';
import { useAuth } from '../context/AuthContext';

export default function PokerPage() {
  const { user } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [tableSize, setTableSize] = useState(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [players, setPlayers] = useState([]);
  const [matchmakingInterval, setMatchmakingInterval] = useState(null);

  // Start matchmaking for a specific table size
  const startMatchmaking = (size) => {
    setTableSize(size);
    setIsMatchmaking(true);
    setMatchmakingTime(0);
    
    // Add the current user as the first player
    setPlayers([
      {
        id: 'user',
        name: user?.username || 'Player',
        isBot: false,
        chips: user?.cashBalance || 1000,
        avatar: '👤'
      }
    ]);
    
    // For Head2Head, try to find a real player first, then fall back to bot
    if (size === 2) {
      // Simulate looking for real players for 10 seconds
      let timeElapsed = 0;
      const interval = setInterval(() => {
        timeElapsed += 1000;
        setMatchmakingTime(timeElapsed / 1000);
        
        // 30% chance of finding a "real" player each second after 3 seconds
        if (timeElapsed >= 3000 && Math.random() < 0.3) {
          clearInterval(interval);
          setMatchmakingInterval(null);
          addRandomPlayer();
          setIsMatchmaking(false);
          setGameStarted(true);
          return;
        }
        
        // After 10 seconds, connect with a bot
        if (timeElapsed >= 10000) {
          clearInterval(interval);
          setMatchmakingInterval(null);
          fillWithBots(size);
          setIsMatchmaking(false);
          setGameStarted(true);
        }
      }, 1000);
      setMatchmakingInterval(interval);
    } else {
      // For larger tables, fill with bots after a shorter delay
      setTimeout(() => {
        fillWithBots(size);
        setIsMatchmaking(false);
        setGameStarted(true);
      }, 3000);
    }
  };
  
  // Add a random "player" (simulated real player)
  const addRandomPlayer = () => {
    const realisticNames = [
      'Michael_Chen', 'Sarah_Johnson', 'David_Rodriguez', 'Emily_Davis', 'James_Wilson',
      'Jessica_Brown', 'Christopher_Lee', 'Amanda_Taylor', 'Matthew_Anderson', 'Ashley_Thomas',
      'Daniel_Jackson', 'Stephanie_White', 'Ryan_Harris', 'Michelle_Martin', 'Kevin_Thompson',
      'Lauren_Garcia', 'Brandon_Martinez', 'Samantha_Robinson', 'Tyler_Clark', 'Nicole_Lewis',
      'Justin_Walker', 'Megan_Hall', 'Aaron_Allen', 'Brittany_Young', 'Jonathan_King',
      'Danielle_Wright', 'Nathan_Lopez', 'Courtney_Hill', 'Zachary_Scott', 'Vanessa_Green'
    ];
    
    const professionalAvatars = ['👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️'];
    
    const newPlayer = {
      id: `player_${Date.now()}`,
      name: realisticNames[Math.floor(Math.random() * realisticNames.length)],
      isBot: false, // Simulated as real player
      chips: 800 + Math.floor(Math.random() * 2400), // 800-3200 range
      avatar: professionalAvatars[Math.floor(Math.random() * professionalAvatars.length)]
    };
    
    setPlayers(prev => [...prev, newPlayer]);
  };
  
  // Fill remaining seats with bots
  const fillWithBots = (size) => {
    setPlayers(prev => {
      const currentCount = prev.length;
      const botsNeeded = size - currentCount;
      
      if (botsNeeded <= 0) return prev;
      
      const realisticBotNames = [
        'Alex_Thompson', 'Jordan_Miller', 'Taylor_Davis', 'Morgan_Wilson', 'Casey_Moore',
        'Riley_Anderson', 'Jamie_Jackson', 'Avery_White', 'Quinn_Harris', 'Dakota_Martin',
        'Cameron_Garcia', 'Sage_Rodriguez', 'River_Lewis', 'Phoenix_Walker', 'Skyler_Hall',
        'Rowan_Allen', 'Blake_Young', 'Finley_King', 'Hayden_Wright', 'Peyton_Lopez',
        'Emery_Hill', 'Reese_Scott', 'Parker_Green', 'Kendall_Adams', 'Tanner_Baker',
        'Aubrey_Gonzalez', 'Logan_Nelson', 'Sydney_Carter', 'Mason_Mitchell', 'Brooke_Perez'
      ];
      
      const botPersonalities = [
        { style: 'aggressive', aggression: 0.8, bluffRate: 0.3 },
        { style: 'tight', aggression: 0.3, bluffRate: 0.1 },
        { style: 'loose', aggression: 0.6, bluffRate: 0.4 },
        { style: 'balanced', aggression: 0.5, bluffRate: 0.2 },
        { style: 'conservative', aggression: 0.2, bluffRate: 0.05 },
        { style: 'unpredictable', aggression: 0.7, bluffRate: 0.5 }
      ];
      
      const professionalAvatars = ['👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫'];
      
      // Shuffle the names to avoid repetition
      const shuffledNames = [...realisticBotNames].sort(() => Math.random() - 0.5);
      
      const newBots = [];
      for (let i = 0; i < botsNeeded; i++) {
        const personality = botPersonalities[Math.floor(Math.random() * botPersonalities.length)];
        newBots.push({
          id: `bot_${Date.now()}_${i}`,
          name: shuffledNames[i % shuffledNames.length],
          isBot: true,
          chips: 600 + Math.floor(Math.random() * 2800), // 600-3400 range
          avatar: professionalAvatars[Math.floor(Math.random() * professionalAvatars.length)],
          personality
        });
      }
      
      return [...prev, ...newBots];
    });
  };
  
  // Cancel matchmaking
  const cancelMatchmaking = () => {
    if (matchmakingInterval) {
      clearInterval(matchmakingInterval);
      setMatchmakingInterval(null);
    }
    setIsMatchmaking(false);
    setTableSize(null);
    setPlayers([]);
    setMatchmakingTime(0);
  };
  
  // Return to lobby
  const returnToLobby = () => {
    setGameStarted(false);
    setTableSize(null);
    setPlayers([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (matchmakingInterval) {
        clearInterval(matchmakingInterval);
      }
    };
  }, [matchmakingInterval]);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8 poker-font">
            <h1 className="text-4xl md:text-6xl poker-title mb-4">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                🎮 BoredCasino Poker
              </span>
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto poker-body">
              Play Texas Hold'em poker against other players or bots. Choose your table size and start playing!
            </p>
          </div>

          {!gameStarted && !isMatchmaking && (
            <div className="glow-card mb-8 p-8 poker-font">
              <h2 className="text-2xl poker-subtitle text-white mb-6 text-center">Select Table Size</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { size: 2, name: "Head2Head", description: "1v1 Poker" },
                  { size: 4, name: "4-Seat Table", description: "Small table" },
                  { size: 8, name: "8-Seat Table", description: "Medium table" },
                  { size: 12, name: "12-Seat Table", description: "Large table" }
                ].map((option) => (
                  <div 
                    key={option.size}
                    className="modern-card hover:border-green-500 cursor-pointer transition-all hover:transform hover:scale-105"
                    onClick={() => startMatchmaking(option.size)}
                  >
                    <div className="text-center p-6">
                      <div className="text-4xl mb-4">
                        {option.size === 2 ? '🎯' : option.size === 4 ? '🎲' : option.size === 8 ? '🎮' : '🎰'}
                      </div>
                      <h3 className="text-xl poker-font-bold text-white mb-2">{option.name}</h3>
                      <p className="text-gray-400 poker-body">{option.description}</p>
                      <div className="mt-4 text-sm text-gray-500 poker-caption">
                        {option.size} players max
                      </div>
                      <button className="mt-4 btn-primary w-full poker-button">
                        Join Table
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isMatchmaking && (
            <div className="glow-card mb-8 p-8 poker-font">
              <h2 className="text-2xl poker-subtitle text-white mb-6 text-center">
                {tableSize === 2 ? 'Finding Opponent...' : 'Finding Players...'}
              </h2>
              
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full border-4 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-xl text-white poker-body">
                  {tableSize === 2 
                    ? matchmakingTime < 10 
                      ? 'Looking for real players...' 
                      : 'Connecting with AI opponent...'
                    : 'Setting up your table...'
                  }
                </p>
                <p className="text-gray-400 mt-2 poker-caption">
                  Players found: {players.length} / {tableSize}
                </p>
                {tableSize === 2 && (
                  <p className="text-blue-400 mt-1 poker-numbers">
                    {matchmakingTime}s elapsed
                  </p>
                )}
              </div>
              
              <div className="text-center">
                <button 
                  className="btn-danger px-6 py-2 poker-button"
                  onClick={cancelMatchmaking}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {gameStarted && (
            <>
              <SimplePokerGame 
                players={players}
                tableSize={tableSize}
                onExit={returnToLobby}
              />
              
              <div className="mt-6 text-center">
                <button 
                  className="btn-secondary px-6 py-2 poker-button"
                  onClick={returnToLobby}
                >
                  Leave Table
                </button>
              </div>
            </>
          )}

          {/* Game Rules */}
          {!gameStarted && !isMatchmaking && (
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="glow-card poker-font">
                <h3 className="text-2xl poker-subtitle text-center mb-6">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    How to Play Texas Hold'em
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="modern-card">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm mr-3">1</span>
                      Game Setup
                    </h4>
                    <ul className="text-dark-300 space-y-2 text-sm">
                      <li>• Each player gets 2 hole cards</li>
                      <li>• 5 community cards are dealt face up</li>
                      <li>• Make the best 5-card hand possible</li>
                      <li>• Win by having the best hand or making others fold</li>
                    </ul>
                  </div>

                  <div className="modern-card">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm mr-3">2</span>
                      Hand Rankings
                    </h4>
                    <ul className="text-dark-300 space-y-1 text-sm">
                      <li>• <strong className="text-white">Royal Flush:</strong> A, K, Q, J, 10 same suit</li>
                      <li>• <strong className="text-white">Straight Flush:</strong> 5 consecutive same suit</li>
                      <li>• <strong className="text-white">Four of a Kind:</strong> 4 cards same rank</li>
                      <li>• <strong className="text-white">Full House:</strong> 3 of a kind + pair</li>
                      <li>• <strong className="text-white">Flush:</strong> 5 cards same suit</li>
                    </ul>
                  </div>

                  <div className="modern-card">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm mr-3">3</span>
                      Betting Rounds
                    </h4>
                    <ul className="text-dark-300 space-y-2 text-sm">
                      <li>• <strong className="text-white">Pre-flop:</strong> After hole cards</li>
                      <li>• <strong className="text-white">Flop:</strong> After first 3 community cards</li>
                      <li>• <strong className="text-white">Turn:</strong> After 4th community card</li>
                      <li>• <strong className="text-white">River:</strong> After 5th community card</li>
                    </ul>
                  </div>

                  <div className="modern-card">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                      <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm mr-3">4</span>
                      Player vs Bots
                    </h4>
                    <ul className="text-dark-300 space-y-1 text-sm">
                      <li>• Play against other players or AI bots</li>
                      <li>• Bots have different playing styles</li>
                      <li>• Some bots play tight, others aggressive</li>
                      <li>• Learn to read their patterns to win</li>
                      <li>• Bots fill empty seats after 2 minutes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}