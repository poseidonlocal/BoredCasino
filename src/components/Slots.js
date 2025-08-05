import React, { useState } from 'react';
import { useCash } from '../context/CashContext';
import BettingControls from './BettingControls';

const slotSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];

const payouts = {
  '🍒🍒🍒': 10,
  '🍋🍋🍋': 15,
  '🍊🍊🍊': 20,
  '🍇🍇🍇': 25,
  '🔔🔔🔔': 50,
  '💎💎💎': 100,
  '7️⃣7️⃣7️⃣': 500
};

export default function Slots() {
  const { cash, placeBet, win, lose } = useCash();
  const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('');
  const [lastWin, setLastWin] = useState(0);

  const handleBetPlaced = (betAmount) => {
    placeBet(betAmount);
    spin(betAmount);
  };

  const spin = (betAmount) => {
    setIsSpinning(true);
    setMessage('Spinning...');
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels([
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
      ]);
    }, 100);

    // Stop spinning after 2 seconds
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Final result
      const finalReels = [
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)],
        slotSymbols[Math.floor(Math.random() * slotSymbols.length)]
      ];
      
      setReels(finalReels);
      
      const combination = finalReels.join('');
      const multiplier = payouts[combination] || 0;
      const winAmount = multiplier * betAmount;
      
      if (winAmount > 0) {
        win(winAmount);
        setLastWin(winAmount);
        setMessage(`JACKPOT! ${combination} - You won ${winAmount} MSP!`);
      } else {
        // Check for partial matches
        if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          const partialWin = Math.floor(betAmount * 0.5);
          win(partialWin);
          setLastWin(partialWin);
          setMessage(`Close! ${combination} - Small win: ${partialWin} MSP`);
        } else {
          lose();
          setLastWin(0);
          setMessage(`${combination} - Try again!`);
        }
      }
      
      setIsSpinning(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Enhanced Game Header */}
      <div className="gaming-header mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
              🎰 Lucky Slots
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Spin the reels and match the symbols to win big!
          </p>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
            <div>Match 3 symbols for maximum payout</div>
            <div>•</div>
            <div>Partial matches also pay out</div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Slot Machine Display */}
      <div className="slot-machine mb-8">
        {/* Machine Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full px-6 py-3 border border-yellow-400/30">
            <span className="text-2xl">🎰</span>
            <span className="text-xl font-bold text-yellow-400">LUCKY SLOTS</span>
            <span className="text-2xl">🎰</span>
          </div>
        </div>

        {/* Reels Display */}
        <div className="flex justify-center space-x-6 mb-8">
          {reels.map((symbol, index) => (
            <div
              key={index}
              className={`slot-reel ${isSpinning ? 'slot-spinning' : ''} ${
                lastWin > 0 && !isSpinning ? 'pulse-glow' : ''
              }`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="text-8xl">{symbol}</div>
            </div>
          ))}
        </div>

        {/* Win Display */}
        {lastWin > 0 && (
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-2xl font-bold text-2xl shadow-2xl bounce-in">
              🎉 WIN: {lastWin} MSP 🎉
            </div>
          </div>
        )}
        
        {/* Enhanced Payout Table */}
        <div className="modern-card">
          <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            💰 Payout Table
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(payouts).map(([combination, multiplier]) => (
              <div key={combination} className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300">
                <div className="text-3xl mb-2">{combination}</div>
                <div className="text-yellow-400 font-bold text-lg">{multiplier}x</div>
                <div className="text-gray-400 text-sm">
                  {multiplier >= 100 ? 'JACKPOT!' : multiplier >= 50 ? 'BIG WIN!' : 'WIN!'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Special Features */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="text-center">
              <h4 className="text-lg font-bold text-purple-400 mb-2">🌟 Special Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Partial matches pay 0.5x bet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Triple 7s = 500x MEGA JACKPOT!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Message Display */}
      {message && (
        <div className={`text-center mb-8 p-6 rounded-2xl backdrop-blur-sm transition-all duration-500 ${
          message.includes('JACKPOT') 
            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 text-yellow-300 shadow-2xl glow-pulse' 
            : message.includes('Close') || message.includes('Small win')
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 text-green-300 shadow-xl'
            : message.includes('Spinning')
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 text-purple-300 shadow-xl pulse-glow'
            : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-2 border-gray-400/50 text-gray-300 shadow-xl'
        }`}>
          <div className="flex items-center justify-center space-x-3">
            <div className="text-3xl">
              {message.includes('JACKPOT') ? '🎉' : 
               message.includes('Close') || message.includes('Small win') ? '🎊' : 
               message.includes('Spinning') ? '🎰' : '🎲'}
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
        disabled={isSpinning}
      />
    </div>
  );
}