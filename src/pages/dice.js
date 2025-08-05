import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function DiceGame() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState(100);
  const [prediction, setPrediction] = useState('under');
  const [targetNumber, setTargetNumber] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, profit: 0 });

  // Calculate win chance and multiplier
  const winChance = prediction === 'under' ? targetNumber : (100 - targetNumber);
  const multiplier = winChance > 0 ? (95 / winChance) : 1;
  const potentialWin = betAmount * multiplier;

  const rollDice = async () => {
    if (!isAuthenticated || betAmount > user.cash_balance || isRolling) return;

    setIsRolling(true);
    updateBalance(-betAmount);

    // Simulate dice roll animation
    const animationDuration = 2000;
    const animationInterval = setInterval(() => {
      setLastRoll(Math.floor(Math.random() * 100) + 1);
    }, 100);

    setTimeout(async () => {
      clearInterval(animationInterval);
      
      // Generate final result
      const roll = Math.floor(Math.random() * 100) + 1;
      setLastRoll(roll);

      // Determine win/loss
      const isWin = (prediction === 'under' && roll < targetNumber) || 
                    (prediction === 'over' && roll > targetNumber);
      
      const payout = isWin ? potentialWin : 0;
      const profit = payout - betAmount;

      if (isWin) {
        updateBalance(payout);
      }

      // Update stats
      setStats(prev => ({
        wins: prev.wins + (isWin ? 1 : 0),
        losses: prev.losses + (isWin ? 0 : 1),
        profit: prev.profit + profit
      }));

      // Add to history
      const gameResult = {
        roll,
        prediction,
        target: targetNumber,
        bet: betAmount,
        win: isWin,
        payout,
        profit,
        timestamp: new Date()
      };
      setGameHistory(prev => [gameResult, ...prev.slice(0, 9)]);

      // Log game result
      try {
        await fetch('/api/games/log-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            gameType: 'dice',
            betType: `${prediction} ${targetNumber}`,
            betAmount: betAmount,
            result: isWin ? 'win' : 'loss',
            payout: payout,
            profit: profit,
            details: `Rolled ${roll}, predicted ${prediction} ${targetNumber}`
          })
        });
      } catch (error) {
        console.error('Failed to log dice game:', error);
      }

      setIsRolling(false);
    }, animationDuration);
  };

  const getDiceColor = () => {
    if (!lastRoll) return 'text-gray-400';
    if (isRolling) return 'text-yellow-400';
    
    const isWin = (prediction === 'under' && lastRoll < targetNumber) || 
                  (prediction === 'over' && lastRoll > targetNumber);
    return isWin ? 'text-green-400' : 'text-red-400';
  };

  const getWinChanceColor = () => {
    if (winChance < 25) return 'text-red-400';
    if (winChance < 50) return 'text-yellow-400';
    if (winChance < 75) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎲 Dice Game
          </h1>
          <p className="text-gray-400">Roll the dice and predict the outcome!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <div className="text-center py-12">
                {/* Dice Display */}
                <div className={`text-8xl font-bold mb-6 ${getDiceColor()}`}>
                  {lastRoll || '?'}
                </div>

                {/* Target Range Visualization */}
                <div className="mb-8">
                  <div className="relative w-full h-8 bg-gray-700 rounded-lg overflow-hidden">
                    {prediction === 'under' ? (
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${targetNumber}%` }}
                      />
                    ) : (
                      <div 
                        className="h-full bg-green-500 ml-auto transition-all duration-300"
                        style={{ width: `${100 - targetNumber}%` }}
                      />
                    )}
                    
                    {/* Current roll indicator */}
                    {lastRoll && (
                      <div 
                        className="absolute top-0 w-1 h-full bg-white"
                        style={{ left: `${lastRoll}%` }}
                      />
                    )}
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>1</span>
                    <span className="text-white font-bold">{targetNumber}</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Game Result */}
                {lastRoll && !isRolling && (
                  <div className="mb-6">
                    {((prediction === 'under' && lastRoll < targetNumber) || 
                      (prediction === 'over' && lastRoll > targetNumber)) ? (
                      <div className="text-green-400 text-2xl font-bold">
                        🎉 You Won! +{(potentialWin - betAmount).toFixed(0)} MSP
                      </div>
                    ) : (
                      <div className="text-red-400 text-2xl font-bold">
                        💸 You Lost! -{betAmount} MSP
                      </div>
                    )}
                  </div>
                )}

                {/* Roll Button */}
                <button
                  onClick={rollDice}
                  disabled={!isAuthenticated || isRolling || betAmount > (user?.cash_balance || 0)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-xl font-bold transition-colors"
                >
                  {isRolling ? '🎲 Rolling...' : `Roll Dice (${betAmount} MSP)`}
                </button>

                {!isAuthenticated && (
                  <p className="text-red-400 text-sm mt-4">Login to play</p>
                )}
              </div>
            </Card>

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card className="bg-gray-900 border-gray-700 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-sm text-gray-400">Wins</div>
              </Card>
              <Card className="bg-gray-900 border-gray-700 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-sm text-gray-400">Losses</div>
              </Card>
              <Card className="bg-gray-900 border-gray-700 text-center">
                <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">Profit</div>
              </Card>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="space-y-6">
            <Card title="Place Bet" className="bg-gray-900 border-gray-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    max={user?.cash_balance || 1000}
                    disabled={isRolling}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prediction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPrediction('under')}
                      className={`py-2 rounded-lg font-semibold transition-colors ${
                        prediction === 'under' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      disabled={isRolling}
                    >
                      Under
                    </button>
                    <button
                      onClick={() => setPrediction('over')}
                      className={`py-2 rounded-lg font-semibold transition-colors ${
                        prediction === 'over' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      disabled={isRolling}
                    >
                      Over
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Number: {targetNumber}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="98"
                    value={targetNumber}
                    onChange={(e) => setTargetNumber(parseInt(e.target.value))}
                    className="w-full"
                    disabled={isRolling}
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Chance:</span>
                    <span className={getWinChanceColor()}>{winChance.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Multiplier:</span>
                    <span className="text-yellow-400">{multiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potential Win:</span>
                    <span className="text-green-400">{potentialWin.toFixed(0)} MSP</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Bet Buttons */}
            <Card title="Quick Bets" className="bg-gray-900 border-gray-700">
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition-colors"
                    disabled={isRolling}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </Card>

            {/* Game History */}
            <Card title="Recent Rolls" className="bg-gray-900 border-gray-700">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gameHistory.map((game, index) => (
                  <div key={index} className="flex justify-between items-center text-sm bg-gray-800 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${game.win ? 'text-green-400' : 'text-red-400'}`}>
                        {game.roll}
                      </span>
                      <span className="text-gray-400">
                        {game.prediction} {game.target}
                      </span>
                    </div>
                    <span className={game.win ? 'text-green-400' : 'text-red-400'}>
                      {game.win ? '+' : ''}{game.profit.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}