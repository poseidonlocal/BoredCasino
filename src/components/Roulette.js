import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BettingControls from './BettingControls';

const rouletteNumbers = [
  { number: 0, color: 'green' },
  { number: 1, color: 'red' }, { number: 2, color: 'black' }, { number: 3, color: 'red' },
  { number: 4, color: 'black' }, { number: 5, color: 'red' }, { number: 6, color: 'black' },
  { number: 7, color: 'red' }, { number: 8, color: 'black' }, { number: 9, color: 'red' },
  { number: 10, color: 'black' }, { number: 11, color: 'black' }, { number: 12, color: 'red' },
  { number: 13, color: 'black' }, { number: 14, color: 'red' }, { number: 15, color: 'black' },
  { number: 16, color: 'red' }, { number: 17, color: 'black' }, { number: 18, color: 'red' },
  { number: 19, color: 'red' }, { number: 20, color: 'black' }, { number: 21, color: 'red' },
  { number: 22, color: 'black' }, { number: 23, color: 'red' }, { number: 24, color: 'black' },
  { number: 25, color: 'red' }, { number: 26, color: 'black' }, { number: 27, color: 'red' },
  { number: 28, color: 'black' }, { number: 29, color: 'black' }, { number: 30, color: 'red' },
  { number: 31, color: 'black' }, { number: 32, color: 'red' }, { number: 33, color: 'black' },
  { number: 34, color: 'red' }, { number: 35, color: 'black' }, { number: 36, color: 'red' }
];

export default function Roulette() {
  const { user, updateUserCash } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [selectedBet, setSelectedBet] = useState({ type: null, value: null });
  const [message, setMessage] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);

  const cash = user?.cashBalance || 0;

  const handleBetPlaced = async (amount) => {
    if (isSpinning || !selectedBet.type) {
      setMessage('Please select a bet type first!');
      return;
    }

    if (amount > cash) {
      setMessage('Insufficient funds!');
      return;
    }

    // Store the balance before deduction for logging
    const balanceBefore = cash;
    
    // Deduct bet amount
    const newBalance = cash - amount;
    await updateUserCash(newBalance);
    setBetPlaced(true);
    
    // Log the bet placement
    try {
      await fetch('/api/logging/game-play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'roulette',
          betAmount: amount,
          winAmount: 0, // Will be updated after spin
          gameData: {
            betType: selectedBet.type,
            betValue: selectedBet.value,
            status: 'bet_placed'
          },
          balanceBefore,
          balanceAfter: newBalance
        })
      });
    } catch (error) {
      console.error('Failed to log bet placement:', error);
    }
    
    spinWheel(amount);
  };

  const spinWheel = (betAmount) => {
    setIsSpinning(true);
    setMessage('Spinning...');

    // Simulate wheel spinning
    setTimeout(async () => {
      const randomIndex = Math.floor(Math.random() * rouletteNumbers.length);
      const result = rouletteNumbers[randomIndex];
      setWinningNumber(result);

      const winAmount = calculateWinAmount(selectedBet, result, betAmount);

      if (winAmount > 0) {
        await updateUserCash(winAmount);
        setMessage(`Winner! Number ${result.number} (${result.color}) - You won ${winAmount} MSP!`);
      } else {
        setMessage(`Number ${result.number} (${result.color}) - Better luck next time!`);
      }

      setIsSpinning(false);
      setSelectedBet({ type: null, value: null });
      setBetPlaced(false);
    }, 3000);
  };

  const calculateWinAmount = (bet, result, betAmount) => {
    switch (bet.type) {
      case 'number':
        return bet.value === result.number ? betAmount * 35 : 0;
      case 'color':
        return bet.value === result.color && result.number !== 0 ? betAmount * 2 : 0;
      case 'even':
        return result.number !== 0 && result.number % 2 === 0 ? betAmount * 2 : 0;
      case 'odd':
        return result.number !== 0 && result.number % 2 === 1 ? betAmount * 2 : 0;
      default:
        return 0;
    }
  };

  const selectBet = (type, value) => {
    setSelectedBet({ type, value });
    setMessage(`Selected: ${type} ${value || ''}`);
  };

  const getBetButtonColor = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'black':
        return 'bg-gray-900 hover:bg-gray-800 text-white';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Enhanced Game Header */}
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
              🎰 European Roulette
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Place your bets and spin the wheel of fortune!
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Red Numbers</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-gray-800 rounded-full border border-gray-600"></span>
              <span>Black Numbers</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Zero (Green)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Game Board */}
      <div className="modern-card mb-8">
        {/* Enhanced Roulette Wheel */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className={`gaming-wheel w-80 h-80 flex items-center justify-center ${isSpinning ? 'spinning' : ''}`}>
              <div className="text-center z-10 relative">
                <div className="text-7xl font-bold text-white mb-2 drop-shadow-2xl">
                  {winningNumber ? winningNumber.number : '?'}
                </div>
                {winningNumber && (
                  <div className={`text-3xl font-bold drop-shadow-lg ${
                    winningNumber.color === 'red' ? 'text-red-400' : 
                    winningNumber.color === 'black' ? 'text-gray-300' : 
                    'text-green-400'
                  }`}>
                    {winningNumber.color.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Wheel Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Betting Options */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => selectBet('color', 'red')}
            className={`relative overflow-hidden py-6 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet.type === 'color' && selectedBet.value === 'red' 
                ? 'ring-4 ring-yellow-400 shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
            style={{
              background: selectedBet.type === 'color' && selectedBet.value === 'red'
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)'
                : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              border: '2px solid rgba(220, 38, 38, 0.5)',
              boxShadow: selectedBet.type === 'color' && selectedBet.value === 'red'
                ? '0 0 30px rgba(220, 38, 38, 0.6)'
                : '0 8px 25px rgba(220, 38, 38, 0.3)'
            }}
            disabled={isSpinning}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-2">🔴</div>
              <div className="text-sm font-bold">RED</div>
              <div className="text-xs opacity-80">2:1 Payout</div>
            </div>
          </button>
          
          <button
            onClick={() => selectBet('color', 'black')}
            className={`relative overflow-hidden py-6 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet.type === 'color' && selectedBet.value === 'black' 
                ? 'ring-4 ring-yellow-400 shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
            style={{
              background: selectedBet.type === 'color' && selectedBet.value === 'black'
                ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)'
                : 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              border: '2px solid rgba(75, 85, 99, 0.5)',
              boxShadow: selectedBet.type === 'color' && selectedBet.value === 'black'
                ? '0 0 30px rgba(75, 85, 99, 0.6)'
                : '0 8px 25px rgba(75, 85, 99, 0.3)'
            }}
            disabled={isSpinning}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-2">⚫</div>
              <div className="text-sm font-bold">BLACK</div>
              <div className="text-xs opacity-80">2:1 Payout</div>
            </div>
          </button>
          
          <button
            onClick={() => selectBet('even')}
            className={`relative overflow-hidden py-6 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet.type === 'even' 
                ? 'ring-4 ring-yellow-400 shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
            style={{
              background: selectedBet.type === 'even'
                ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)'
                : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              boxShadow: selectedBet.type === 'even'
                ? '0 0 30px rgba(59, 130, 246, 0.6)'
                : '0 8px 25px rgba(59, 130, 246, 0.3)'
            }}
            disabled={isSpinning}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-bold">EVEN</div>
              <div className="text-xs opacity-80">2:1 Payout</div>
            </div>
          </button>
          
          <button
            onClick={() => selectBet('odd')}
            className={`relative overflow-hidden py-6 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet.type === 'odd' 
                ? 'ring-4 ring-yellow-400 shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
            style={{
              background: selectedBet.type === 'odd'
                ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)'
                : 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
              border: '2px solid rgba(124, 58, 237, 0.5)',
              boxShadow: selectedBet.type === 'odd'
                ? '0 0 30px rgba(124, 58, 237, 0.6)'
                : '0 8px 25px rgba(124, 58, 237, 0.3)'
            }}
            disabled={isSpinning}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-sm font-bold">ODD</div>
              <div className="text-xs opacity-80">2:1 Payout</div>
            </div>
          </button>
          
          <button
            onClick={() => selectBet('color', 'green')}
            className={`relative overflow-hidden py-6 px-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet.type === 'color' && selectedBet.value === 'green' 
                ? 'ring-4 ring-yellow-400 shadow-2xl' 
                : 'hover:shadow-xl'
            }`}
            style={{
              background: selectedBet.type === 'color' && selectedBet.value === 'green'
                ? 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
                : 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              border: '2px solid rgba(5, 150, 105, 0.5)',
              boxShadow: selectedBet.type === 'color' && selectedBet.value === 'green'
                ? '0 0 30px rgba(5, 150, 105, 0.6)'
                : '0 8px 25px rgba(5, 150, 105, 0.3)'
            }}
            disabled={isSpinning}
          >
            <div className="text-white text-center">
              <div className="text-3xl mb-2">🟢</div>
              <div className="text-sm font-bold">ZERO</div>
              <div className="text-xs opacity-80">35:1 Payout</div>
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Message Display */}
      {message && (
        <div className={`text-center mb-8 p-6 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
          message.includes('Winner') 
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 text-green-300 shadow-2xl glow-pulse' 
            : message.includes('Insufficient')
            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-400/50 text-red-300 shadow-xl'
            : message.includes('Spinning')
            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 text-yellow-300 shadow-xl pulse-glow'
            : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 text-blue-300 shadow-xl'
        }`}>
          <div className="flex items-center justify-center space-x-3">
            <div className="text-3xl">
              {message.includes('Winner') ? '🎉' : 
               message.includes('Insufficient') ? '⚠️' : 
               message.includes('Spinning') ? '🎰' : 'ℹ️'}
            </div>
            <div className="text-xl font-bold">
              {message}
            </div>
          </div>
        </div>
      )}

      {/* Betting Controls */}
      <BettingControls 
        onBetPlaced={handleBetPlaced}
        disabled={isSpinning || !selectedBet.type || betPlaced}
      />

      {/* Enhanced Game Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="modern-card group hover:border-yellow-400/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl">
              🎯
            </div>
            <h4 className="text-xl font-bold text-yellow-400 mb-4">How to Play</h4>
            <ul className="text-gray-300 space-y-3 text-left">
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Select your bet type first</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Choose your bet amount</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Watch the wheel spin</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Win based on where the ball lands</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="modern-card group hover:border-green-400/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl">
              💰
            </div>
            <h4 className="text-xl font-bold text-green-400 mb-4">Payouts</h4>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Red/Black</span>
                <span className="text-green-400 font-bold">2:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Even/Odd</span>
                <span className="text-green-400 font-bold">2:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Green (0)</span>
                <span className="text-yellow-400 font-bold">35:1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Single Number</span>
                <span className="text-yellow-400 font-bold">35:1</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modern-card group hover:border-purple-400/30">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-3xl">
              🎲
            </div>
            <h4 className="text-xl font-bold text-purple-400 mb-4">Pro Tips</h4>
            <ul className="text-gray-300 space-y-3 text-left">
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Start with outside bets (Red/Black)</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Manage your bankroll wisely</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Green (0) beats all other bets</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Each spin is independent</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}