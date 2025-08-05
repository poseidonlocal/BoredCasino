import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function WheelGame() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBets, setSelectedBets] = useState({});
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, profit: 0 });
  const wheelRef = useRef(null);

  // Wheel segments with different colors and multipliers
  const wheelSegments = [
    { id: 0, color: 'green', multiplier: 14, label: '14x' },
    { id: 1, color: 'red', multiplier: 2, label: '2x' },
    { id: 2, color: 'red', multiplier: 2, label: '2x' },
    { id: 3, color: 'red', multiplier: 2, label: '2x' },
    { id: 4, color: 'red', multiplier: 2, label: '2x' },
    { id: 5, color: 'red', multiplier: 2, label: '2x' },
    { id: 6, color: 'red', multiplier: 2, label: '2x' },
    { id: 7, color: 'red', multiplier: 2, label: '2x' },
    { id: 8, color: 'yellow', multiplier: 3, label: '3x' },
    { id: 9, color: 'yellow', multiplier: 3, label: '3x' },
    { id: 10, color: 'yellow', multiplier: 3, label: '3x' },
    { id: 11, color: 'yellow', multiplier: 3, label: '3x' },
    { id: 12, color: 'blue', multiplier: 5, label: '5x' },
    { id: 13, color: 'blue', multiplier: 5, label: '5x' },
    { id: 14, color: 'purple', multiplier: 50, label: '50x' }
  ];

  const betOptions = [
    { id: 'red', label: 'Red (2x)', color: 'bg-red-600', multiplier: 2 },
    { id: 'yellow', label: 'Yellow (3x)', color: 'bg-yellow-600', multiplier: 3 },
    { id: 'blue', label: 'Blue (5x)', color: 'bg-blue-600', multiplier: 5 },
    { id: 'green', label: 'Green (14x)', color: 'bg-green-600', multiplier: 14 },
    { id: 'purple', label: 'Purple (50x)', color: 'bg-purple-600', multiplier: 50 }
  ];

  const placeBet = (betType) => {
    if (!isAuthenticated || isSpinning) return;
    
    const currentBet = selectedBets[betType] || 0;
    const newBetAmount = currentBet + betAmount;
    
    if (newBetAmount > user.cash_balance) return;
    
    setSelectedBets(prev => ({
      ...prev,
      [betType]: newBetAmount
    }));
  };

  const removeBet = (betType) => {
    setSelectedBets(prev => {
      const newBets = { ...prev };
      delete newBets[betType];
      return newBets;
    });
  };

  const getTotalBetAmount = () => {
    return Object.values(selectedBets).reduce((sum, bet) => sum + bet, 0);
  };

  const spinWheel = async () => {
    const totalBet = getTotalBetAmount();
    if (!isAuthenticated || totalBet === 0 || totalBet > user.cash_balance || isSpinning) return;

    setIsSpinning(true);
    updateBalance(-totalBet);

    // Generate random result
    const resultIndex = Math.floor(Math.random() * wheelSegments.length);
    const result = wheelSegments[resultIndex];
    
    // Calculate wheel rotation
    const segmentAngle = 360 / wheelSegments.length;
    const targetAngle = (resultIndex * segmentAngle) + (segmentAngle / 2);
    const spins = 5; // Number of full rotations
    const finalRotation = wheelRotation + (spins * 360) + (360 - targetAngle);
    
    setWheelRotation(finalRotation);

    // Wait for animation to complete
    setTimeout(async () => {
      setLastResult(result);
      
      // Calculate winnings
      let totalWinnings = 0;
      const winningBets = [];
      
      Object.entries(selectedBets).forEach(([betType, betAmount]) => {
        if (betType === result.color) {
          const winAmount = betAmount * result.multiplier;
          totalWinnings += winAmount;
          winningBets.push({ type: betType, amount: betAmount, win: winAmount });
        }
      });

      const profit = totalWinnings - totalBet;
      
      if (totalWinnings > 0) {
        updateBalance(totalWinnings);
      }

      // Update stats
      setStats(prev => ({
        wins: prev.wins + (totalWinnings > 0 ? 1 : 0),
        losses: prev.losses + (totalWinnings > 0 ? 0 : 1),
        profit: prev.profit + profit
      }));

      // Add to history
      const gameResult = {
        result: result,
        bets: selectedBets,
        totalBet,
        totalWinnings,
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
            gameType: 'wheel',
            betType: Object.keys(selectedBets).join(', '),
            betAmount: totalBet,
            result: totalWinnings > 0 ? 'win' : 'loss',
            payout: totalWinnings,
            profit: profit,
            details: `Landed on ${result.color} ${result.multiplier}x, bets: ${JSON.stringify(selectedBets)}`
          })
        });
      } catch (error) {
        console.error('Failed to log wheel game:', error);
      }

      setIsSpinning(false);
      setSelectedBets({});
    }, 3000);
  };

  const getSegmentColor = (segment) => {
    const colors = {
      red: '#ef4444',
      yellow: '#eab308',
      blue: '#3b82f6',
      green: '#22c55e',
      purple: '#a855f7'
    };
    return colors[segment.color];
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent mb-4">
            🎡 Wheel of Fortune
          </h1>
          <p className="text-gray-400">Spin the wheel and win big!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <div className="text-center py-8">
                {/* Wheel */}
                <div className="relative mx-auto mb-8" style={{ width: '300px', height: '300px' }}>
                  {/* Pointer */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
                  </div>
                  
                  {/* Wheel SVG */}
                  <svg
                    ref={wheelRef}
                    width="300"
                    height="300"
                    className="transition-transform duration-3000 ease-out"
                    style={{ transform: `rotate(${wheelRotation}deg)` }}
                  >
                    {wheelSegments.map((segment, index) => {
                      const angle = (360 / wheelSegments.length) * index;
                      const nextAngle = (360 / wheelSegments.length) * (index + 1);
                      
                      const x1 = 150 + 140 * Math.cos((angle * Math.PI) / 180);
                      const y1 = 150 + 140 * Math.sin((angle * Math.PI) / 180);
                      const x2 = 150 + 140 * Math.cos((nextAngle * Math.PI) / 180);
                      const y2 = 150 + 140 * Math.sin((nextAngle * Math.PI) / 180);
                      
                      const largeArcFlag = (nextAngle - angle) > 180 ? 1 : 0;
                      
                      return (
                        <g key={segment.id}>
                          <path
                            d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={getSegmentColor(segment)}
                            stroke="#1f2937"
                            strokeWidth="2"
                          />
                          <text
                            x={150 + 100 * Math.cos(((angle + nextAngle) / 2 * Math.PI) / 180)}
                            y={150 + 100 * Math.sin(((angle + nextAngle) / 2 * Math.PI) / 180)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="14"
                            fontWeight="bold"
                          >
                            {segment.label}
                          </text>
                        </g>
                      );
                    })}
                    <circle cx="150" cy="150" r="20" fill="#374151" stroke="#fff" strokeWidth="2" />
                  </svg>
                </div>

                {/* Last Result */}
                {lastResult && (
                  <div className="mb-6">
                    <div className="text-2xl font-bold mb-2">
                      Last Result: <span style={{ color: getSegmentColor(lastResult) }}>
                        {lastResult.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Spin Button */}
                <button
                  onClick={spinWheel}
                  disabled={!isAuthenticated || isSpinning || getTotalBetAmount() === 0 || getTotalBetAmount() > (user?.cash_balance || 0)}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-xl font-bold transition-colors"
                >
                  {isSpinning ? '🎡 Spinning...' : `Spin (${getTotalBetAmount()} MSP)`}
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
            <Card title="Place Bets" className="bg-gray-900 border-gray-700">
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
                    disabled={isSpinning}
                  />
                </div>

                <div className="space-y-2">
                  {betOptions.map(option => (
                    <div key={option.id} className="flex items-center justify-between">
                      <button
                        onClick={() => placeBet(option.id)}
                        disabled={isSpinning}
                        className={`flex-1 ${option.color} hover:opacity-80 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-opacity mr-2`}
                      >
                        {option.label}
                      </button>
                      {selectedBets[option.id] && (
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400 font-bold">
                            {selectedBets[option.id]}
                          </span>
                          <button
                            onClick={() => removeBet(option.id)}
                            disabled={isSpinning}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Bet:</span>
                    <span className="text-yellow-400 font-bold">{getTotalBetAmount()} MSP</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Bet Buttons */}
            <Card title="Quick Bets" className="bg-gray-900 border-gray-700">
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 250].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition-colors"
                    disabled={isSpinning}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </Card>

            {/* Game History */}
            <Card title="Recent Spins" className="bg-gray-900 border-gray-700">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gameHistory.map((game, index) => (
                  <div key={index} className="bg-gray-800 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span style={{ color: getSegmentColor(game.result) }} className="font-bold">
                        {game.result.label}
                      </span>
                      <span className={game.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {game.profit >= 0 ? '+' : ''}{game.profit.toFixed(0)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Bet: {game.totalBet} MSP
                    </div>
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