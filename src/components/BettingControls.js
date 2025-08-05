import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const BettingControls = ({ onBetPlaced, disabled = false }) => {
  const { user } = useAuth();
  const [selectedBet, setSelectedBet] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  
  const cash = user?.cashBalance || 0;
  const canBet = (amount) => cash >= amount;

  const betAmounts = [5, 10, 25, 50, 100, 250];

  const handleBetSelect = (amount) => {
    setSelectedBet(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(value)) {
      setSelectedBet(Math.max(1, Math.min(cash, parseInt(value))));
    }
  };

  const handlePlaceBet = () => {
    if (canBet(selectedBet) && !disabled) {
      onBetPlaced(selectedBet);
    }
  };

  const formatMSP = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' MSP';
  };

  return (
    <div className="modern-card">
      {/* Enhanced Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full px-6 py-3 border border-yellow-400/30">
          <span className="text-3xl">💰</span>
          <h3 className="text-xl font-bold text-white">Place Your Bet</h3>
        </div>
        <p className="text-gray-400 mt-2">Available Balance: <span className="text-green-400 font-bold">{formatMSP(cash)}</span></p>
      </div>
      
      {/* Quick Bet Amounts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {betAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleBetSelect(amount)}
            disabled={!canBet(amount) || disabled}
            className={`relative overflow-hidden py-4 px-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              selectedBet === amount && !customAmount
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl border-2 border-purple-400'
                : canBet(amount) && !disabled
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 border border-gray-500'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
            }`}
          >
            <div className="relative z-10">
              <div className="text-lg font-bold">{amount}</div>
              <div className="text-xs opacity-80">MSP</div>
            </div>
            
            {/* Shimmer effect for active button */}
            {selectedBet === amount && !customAmount && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <span className="mr-2">🎯</span>
          Custom Amount
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max={cash}
            value={customAmount}
            onChange={handleCustomAmountChange}
            disabled={disabled}
            className="modern-input w-full pl-4 pr-12 py-4 text-lg"
            placeholder="Enter custom bet amount..."
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
            MSP
          </div>
        </div>
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={!canBet(selectedBet) || disabled}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
          canBet(selectedBet) && !disabled
            ? 'btn-gaming hover:scale-105 shadow-2xl'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
        }`}
      >
        {disabled ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Game in Progress...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🎲</span>
            <span>Bet {formatMSP(selectedBet)}</span>
          </div>
        )}
      </button>

      {/* Insufficient Funds Warning */}
      {!canBet(selectedBet) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border-2 border-red-400/50 rounded-xl text-center backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-2 text-red-300">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">
              Insufficient Microsoft Points for this bet
            </p>
          </div>
          <p className="text-red-400 text-sm mt-2">
            You need {formatMSP(selectedBet - cash)} more MSP
          </p>
        </div>
      )}

      {/* Betting Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl">
        <div className="flex items-center space-x-2 text-blue-300 mb-2">
          <span className="text-lg">💡</span>
          <span className="font-medium text-sm">Pro Tip</span>
        </div>
        <p className="text-gray-400 text-sm">
          Start with smaller bets to learn the game mechanics and build your strategy!
        </p>
      </div>
    </div>
  );
};

export default BettingControls;

