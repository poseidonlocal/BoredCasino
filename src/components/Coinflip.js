import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BettingControls from './BettingControls';
import { useXP } from './ui/XPTracker';
import useSound from '../hooks/useSound';
import { useAchievements } from './ui/AchievementSystem';
import ParticleSystem from './ui/ParticleSystem';
import { useTheme } from '../hooks/useTheme';

export default function Coinflip() {
  const { user, updateUserCash } = useAuth();
  const { awardXP } = useXP();
  const { playSound, playWinSequence } = useSound();
  const { checkAchievement } = useAchievements();
  const { customSettings } = useTheme();
  
  const [selectedSide, setSelectedSide] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [lastBetAmount, setLastBetAmount] = useState(0);

  const cash = user?.cashBalance || 0;

  const calculateWinRate = (wins, totalGames) => {
    return totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  };

  const handleBetPlaced = async (amount) => {
    if (isFlipping || !selectedSide) {
      setMessage('Please select heads or tails first!');
      playSound('error');
      return;
    }

    if (amount > cash) {
      setMessage('Insufficient MSP!');
      playSound('error');
      return;
    }

    // Deduct bet amount
    const newBalance = cash - amount;
    await updateUserCash(newBalance);
    setBetPlaced(true);
    setLastBetAmount(amount);
    playSound('bet');
    flipCoin(amount);
  };

  const flipCoin = async (betAmount) => {
    setIsFlipping(true);
    setMessage('Flipping coin...');
    setFlipAnimation('animate-flip');
    setFlipCount(prev => prev + 1);
    
    playSound('spin');

    // Enhanced coin flip with realistic timing
    setTimeout(async () => {
      const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(coinResult);
      setFlipAnimation('');

      const won = selectedSide === coinResult;
      const winAmount = won ? betAmount * 2 : 0;
      const balanceBefore = user.cashBalance;
      const balanceAfter = balanceBefore - betAmount + winAmount;

      // Update game history
      const gameResult = {
        id: Date.now(),
        selectedSide,
        result: coinResult,
        won,
        betAmount,
        winAmount,
        timestamp: new Date().toLocaleTimeString()
      };
      setGameHistory(prev => [gameResult, ...prev.slice(0, 9)]);

      if (won) {
        await updateUserCash(balanceAfter);
        setMessage(`🎉 ${coinResult.toUpperCase()}! You won ${winAmount} MSP!`);
        setStreak(prev => prev + 1);
        setShowCelebration(true);
        
        // Enhanced sound and visual feedback
        playWinSequence();
        
        // Check achievements
        checkAchievement('firstWin', flipCount === 1);
        checkAchievement('bigWin', winAmount >= 1000);
        checkAchievement('streakMaster', streak + 1 >= 5);
        checkAchievement('highRoller', betAmount >= 500);
        
        // Award XP for winning
        if (awardXP) {
          awardXP('GAME_WON', 1, {
            gamesPlayed: (user.gamesPlayed || 0) + 1,
            totalWinnings: (user.totalWinnings || 0) + winAmount,
            winRate: calculateWinRate(user.gamesWon + 1, user.gamesPlayed + 1)
          });
          
          // Big win bonus
          if (winAmount >= 1000) {
            awardXP('BIG_WIN');
          }
          
          // High roller bonus
          if (betAmount >= 500) {
            awardXP('HIGH_ROLLER');
          }
        }
        
        // Hide celebration after delay
        setTimeout(() => setShowCelebration(false), 3000);
      } else {
        setMessage(`💔 ${coinResult.toUpperCase()}! Better luck next time!`);
        setStreak(0);
        playSound('lose');
        
        // Award XP for playing
        if (awardXP) {
          awardXP('GAME_PLAYED', 1, {
            gamesPlayed: (user.gamesPlayed || 0) + 1,
            winRate: calculateWinRate(user.gamesWon || 0, user.gamesPlayed + 1)
          });
        }
      }

      // Log the game play
      try {
        await fetch('/api/logging/game-play', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            gameType: 'coinflip',
            betAmount,
            winAmount,
            gameData: {
              selectedSide,
              result: coinResult,
              outcome: won ? 'win' : 'lose',
              streak: won ? streak + 1 : 0
            },
            balanceBefore,
            balanceAfter
          })
        });
      } catch (error) {
        console.error('Failed to log coinflip game:', error);
      }

      setIsFlipping(false);
      setSelectedSide(null);
      setBetPlaced(false);
    }, 3000); // Longer flip time for better suspense
  };

  const selectSide = (side) => {
    if (!isFlipping) {
      setSelectedSide(side);
      setMessage(`Selected: ${side.toUpperCase()}`);
      playSound('click');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      {/* Celebration Particles */}
      {showCelebration && customSettings.particlesEnabled && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <ParticleSystem 
            type="confetti" 
            intensity="high" 
            isActive={showCelebration}
          />
        </div>
      )}

      {/* Enhanced Game Header */}
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              🪙 Coinflip Arena
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            The ultimate 50/50 challenge - double or nothing!
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
              <span>Fair 50/50 odds</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span>2x multiplier</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
              <span>Instant results</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-white">{flipCount}</div>
          <div className="text-gray-400 text-sm">Total Flips</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-orange-400">{streak}</div>
          <div className="text-gray-400 text-sm">Win Streak</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-2xl font-bold text-green-400">{lastBetAmount}</div>
          <div className="text-gray-400 text-sm">Last Bet</div>
        </div>
        <div className="modern-card text-center p-4">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-400">
            {gameHistory.length > 0 ? Math.round((gameHistory.filter(g => g.won).length / gameHistory.length) * 100) : 0}%
          </div>
          <div className="text-gray-400 text-sm">Win Rate</div>
        </div>
      </div>

      {/* Enhanced Game Board */}
      <div className="modern-card mb-8 relative overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 pointer-events-none"></div>
        
        {/* Enhanced Coin Display */}
        <div className="flex justify-center mb-8 relative">
          <div className={`coin-container ${flipAnimation} ${isFlipping ? 'flipping' : ''}`}>
            <div className="coin">
              <div className="coin-side coin-heads">
                <div className="coin-inner">
                  <div className="text-7xl mb-2">👑</div>
                  <div className="text-xl font-bold text-yellow-400">HEADS</div>
                  <div className="text-sm text-yellow-300 opacity-80">Royal Side</div>
                </div>
              </div>
              <div className="coin-side coin-tails">
                <div className="coin-inner">
                  <div className="text-7xl mb-2">🦅</div>
                  <div className="text-xl font-bold text-blue-400">TAILS</div>
                  <div className="text-sm text-blue-300 opacity-80">Eagle Side</div>
                </div>
              </div>
            </div>
            
            {/* Coin glow effect */}
            <div className="coin-glow"></div>
          </div>
          
          {/* Flip indicator */}
          {isFlipping && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-2 rounded-full font-bold text-sm animate-pulse">
                Flipping...
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Side Selection */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => selectSide('heads')}
            className={`relative overflow-hidden py-8 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              selectedSide === 'heads' 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-2xl ring-4 ring-yellow-400/50' 
                : 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300 hover:from-gray-600 hover:to-gray-500 shadow-xl'
            }`}
            disabled={isFlipping}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">👑</span>
              </div>
              <div className="text-2xl font-bold mb-2">HEADS</div>
              <div className="text-sm opacity-80 mb-2">Royal Crown</div>
              <div className="bg-black/20 rounded-full px-3 py-1 text-xs font-bold">
                2x Multiplier
              </div>
            </div>
            
            {/* Selection indicator */}
            {selectedSide === 'heads' && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-yellow-500 text-sm">✓</span>
              </div>
            )}
          </button>
          
          <button
            onClick={() => selectSide('tails')}
            className={`relative overflow-hidden py-8 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              selectedSide === 'tails' 
                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-2xl ring-4 ring-blue-400/50' 
                : 'bg-gradient-to-br from-gray-700 to-gray-600 text-gray-300 hover:from-gray-600 hover:to-gray-500 shadow-xl'
            }`}
            disabled={isFlipping}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">🦅</span>
              </div>
              <div className="text-2xl font-bold mb-2">TAILS</div>
              <div className="text-sm opacity-80 mb-2">Majestic Eagle</div>
              <div className="bg-black/20 rounded-full px-3 py-1 text-xs font-bold">
                2x Multiplier
              </div>
            </div>
            
            {/* Selection indicator */}
            {selectedSide === 'tails' && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-500 text-sm">✓</span>
              </div>
            )}
          </button>
        </div>

        {/* Enhanced Result Display */}
        {result && (
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-6 shadow-2xl border border-gray-600">
              <div className="text-8xl mb-4 animate-bounce">
                {result === 'heads' ? '👑' : '🦅'}
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {result.toUpperCase()} WINS!
              </div>
              <div className="text-gray-400">
                The coin has spoken
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Message Display */}
      {message && (
        <div className={`text-center mb-8 p-6 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
          message.includes('🎉') 
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 text-green-300 shadow-2xl glow-pulse' 
            : message.includes('💔')
            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400/50 text-red-300 shadow-xl'
            : message.includes('Flipping')
            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 text-yellow-300 shadow-xl pulse-glow'
            : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 text-blue-300 shadow-xl'
        }`}>
          <div className="flex items-center justify-center space-x-3">
            <div className="text-4xl">
              {message.includes('🎉') ? '🎉' : 
               message.includes('💔') ? '💔' : 
               message.includes('Flipping') ? '🪙' : 
               message.includes('Selected') ? '🎯' : 'ℹ️'}
            </div>
            <div className="text-2xl font-bold">
              {message}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Betting Controls */}
      <div className="mb-8">
        <BettingControls 
          onBetPlaced={handleBetPlaced}
          disabled={isFlipping || !selectedSide || betPlaced}
        />
      </div>

      {/* Game History */}
      {gameHistory.length > 0 && (
        <div className="modern-card mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Recent Games
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameHistory.slice(0, 6).map((game) => (
              <div 
                key={game.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  game.won 
                    ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' 
                    : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">
                      {game.selectedSide === 'heads' ? '👑' : '🦅'}
                    </div>
                    <div className="text-sm text-gray-400">vs</div>
                    <div className="text-2xl">
                      {game.result === 'heads' ? '👑' : '🦅'}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                    {game.won ? 'WIN' : 'LOSE'}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="text-gray-400">
                    Bet: {game.betAmount} MSP
                  </div>
                  <div className={`font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                    {game.won ? `+${game.winAmount}` : `-${game.betAmount}`} MSP
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {game.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Games Section - Matching reference design */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">OPEN GAMES</h3>
          <span className="text-sm text-gray-400">3</span>
        </div>
        
        <div className="space-y-3">
          {/* Mock game entries */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white">Thickman...</span>
                <span className="text-gray-400 text-sm">⚡</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">vs</span>
                <span className="text-gray-400">Waiting...</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-red-500">🎰</span>
                <span className="text-white font-bold">60.00</span>
              </div>
              <button className="btn-primary px-4 py-2 text-sm">Join</button>
              <button className="text-gray-400 hover:text-white">👁</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white">Dejvid</span>
                <span className="text-gray-400 text-sm">⚡</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">vs</span>
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-white">Travis Bott</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-red-500">🎰</span>
                <span className="text-white font-bold">137.54</span>
              </div>
              <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Winner</div>
              <button className="text-gray-400 hover:text-white">👁</button>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white">Dejvid</span>
                <span className="text-gray-400 text-sm">⚡</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">vs</span>
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <span className="text-white">Howly Jr.</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-red-500">🎰</span>
                <span className="text-white font-bold">59.80</span>
              </div>
              <div className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Winner</div>
              <button className="text-gray-400 hover:text-white">👁</button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-400 mb-2">How to Play</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Choose heads (👑) or tails (🦅)</li>
            <li>• Place your bet amount</li>
            <li>• Watch the coin flip</li>
            <li>• Win 2x your bet if you guess correctly</li>
          </ul>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-400 mb-2">Payout Info</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Correct Guess:</strong> 2x your bet</li>
            <li>• <strong>Wrong Guess:</strong> Lose your bet</li>
            <li>• <strong>Win Rate:</strong> 50% chance</li>
            <li>• <strong>House Edge:</strong> 0% (Fair game)</li>
          </ul>
        </div>
      </div>

      {/* Enhanced Coin Animation Styles */}
      <style jsx>{`
        .coin-container {
          perspective: 1200px;
          width: 250px;
          height: 250px;
          position: relative;
        }
        
        .coin {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .coin-side {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 6px solid #fbbf24;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          box-shadow: 
            0 12px 40px rgba(251, 191, 36, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.2),
            inset 0 -4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .coin-inner {
          text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .coin-heads {
          transform: rotateY(0deg);
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
        }
        
        .coin-tails {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%);
          border-color: #6b7280;
        }
        
        .coin-glow {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .flipping .coin-glow {
          opacity: 1;
          animation: glow-pulse 0.5s ease-in-out infinite alternate;
        }
        
        .animate-flip .coin {
          animation: enhanced-flip 3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes enhanced-flip {
          0% { 
            transform: rotateY(0deg) rotateX(0deg) scale(1);
          }
          25% { 
            transform: rotateY(450deg) rotateX(180deg) scale(1.1);
          }
          50% { 
            transform: rotateY(900deg) rotateX(360deg) scale(1.2);
          }
          75% { 
            transform: rotateY(1350deg) rotateX(540deg) scale(1.1);
          }
          100% { 
            transform: rotateY(1800deg) rotateX(720deg) scale(1);
          }
        }
        
        @keyframes glow-pulse {
          0% { 
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
          }
          100% { 
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.8);
          }
        }
        
        /* Hover effects for selection buttons */
        .coin-container:hover .coin-glow {
          opacity: 0.5;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .coin-container {
            width: 200px;
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
}