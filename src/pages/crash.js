import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function CrashGame() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const [gameState, setGameState] = useState('waiting'); // waiting, running, crashed
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashOut, setAutoCashOut] = useState(2.00);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashOutAt, setCashOutAt] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentPlayers, setCurrentPlayers] = useState([]);
  const intervalRef = useRef(null);
  const gameStartTime = useRef(null);

  // Simulate crash point (in real app, this would come from server)
  const generateCrashPoint = () => {
    const random = Math.random();
    if (random < 0.33) return 1 + Math.random() * 1; // 1.00 - 2.00
    if (random < 0.66) return 2 + Math.random() * 3; // 2.00 - 5.00
    return 5 + Math.random() * 10; // 5.00 - 15.00
  };

  const startGame = () => {
    const crashPoint = generateCrashPoint();
    setGameState('running');
    setMultiplier(1.00);
    setCashedOut(false);
    setCashOutAt(0);
    gameStartTime.current = Date.now();

    // Generate mock players
    const mockPlayers = Array.from({ length: Math.floor(Math.random() * 8) + 2 }, (_, i) => ({
      id: i,
      username: `Player${i + 1}`,
      bet: Math.floor(Math.random() * 500) + 50,
      cashedOut: false,
      cashOutMultiplier: 0
    }));
    setCurrentPlayers(mockPlayers);

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - gameStartTime.current) / 1000;
      const currentMultiplier = 1 + (elapsed * 0.1) + (elapsed * elapsed * 0.01);
      
      setMultiplier(currentMultiplier);

      // Auto cash out
      if (hasActiveBet && !cashedOut && autoCashOut > 0 && currentMultiplier >= autoCashOut) {
        handleCashOut();
      }

      // Simulate other players cashing out
      setCurrentPlayers(prev => prev.map(player => {
        if (!player.cashedOut && Math.random() < 0.02) {
          return {
            ...player,
            cashedOut: true,
            cashOutMultiplier: currentMultiplier
          };
        }
        return player;
      }));

      // Check if game should crash
      if (currentMultiplier >= crashPoint) {
        crashGame(crashPoint);
      }
    }, 100);
  };

  const crashGame = (crashPoint) => {
    clearInterval(intervalRef.current);
    setGameState('crashed');
    setMultiplier(crashPoint);

    // Handle player's bet if they didn't cash out
    if (hasActiveBet && !cashedOut) {
      handleGameResult('loss', 0);
    }

    // Add to history
    setGameHistory(prev => [crashPoint, ...prev.slice(0, 19)]);

    // Start next game after delay
    setTimeout(() => {
      setGameState('waiting');
      setHasActiveBet(false);
      setTimeout(startGame, 3000);
    }, 3000);
  };

  const placeBet = () => {
    if (!isAuthenticated || betAmount > user.cash_balance || hasActiveBet) return;
    
    setHasActiveBet(true);
    updateBalance(-betAmount);
  };

  const handleCashOut = () => {
    if (!hasActiveBet || cashedOut) return;
    
    setCashedOut(true);
    setCashOutAt(multiplier);
    const winAmount = betAmount * multiplier;
    
    handleGameResult('win', winAmount);
    updateBalance(winAmount);
  };

  const handleGameResult = async (result, payout) => {
    if (!isAuthenticated) return;

    try {
      await fetch('/api/games/log-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          gameType: 'crash',
          betType: 'Standard',
          betAmount: betAmount,
          result: result,
          payout: payout,
          profit: payout - betAmount,
          details: `Crashed at ${multiplier.toFixed(2)}x${cashedOut ? `, cashed out at ${cashOutAt.toFixed(2)}x` : ''}`
        })
      });
    } catch (error) {
      console.error('Failed to log crash game:', error);
    }
  };

  // Start first game
  useEffect(() => {
    const timer = setTimeout(startGame, 2000);
    return () => {
      clearTimeout(timer);
      clearInterval(intervalRef.current);
    };
  }, []);

  const getMultiplierColor = () => {
    if (gameState === 'crashed') return 'text-red-500';
    if (multiplier < 2) return 'text-green-400';
    if (multiplier < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-yellow-600 bg-clip-text text-transparent mb-4">
            🚀 Crash Game
          </h1>
          <p className="text-gray-400">Bet and cash out before the crash!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <div className="text-center py-12">
                {/* Multiplier Display */}
                <div className={`text-8xl font-bold mb-4 ${getMultiplierColor()}`}>
                  {multiplier.toFixed(2)}x
                </div>
                
                {/* Game Status */}
                <div className="text-xl mb-6">
                  {gameState === 'waiting' && (
                    <span className="text-blue-400">🕐 Next round starting...</span>
                  )}
                  {gameState === 'running' && (
                    <span className="text-green-400">🚀 Flying...</span>
                  )}
                  {gameState === 'crashed' && (
                    <span className="text-red-500">💥 CRASHED!</span>
                  )}
                </div>

                {/* Cash Out Button */}
                {hasActiveBet && !cashedOut && gameState === 'running' && (
                  <button
                    onClick={handleCashOut}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-bold transition-colors"
                  >
                    Cash Out {(betAmount * multiplier).toFixed(0)} MSP
                  </button>
                )}

                {/* Cashed Out Display */}
                {cashedOut && (
                  <div className="text-green-400 text-xl">
                    ✅ Cashed out at {cashOutAt.toFixed(2)}x for {(betAmount * cashOutAt).toFixed(0)} MSP
                  </div>
                )}
              </div>
            </Card>

            {/* Current Players */}
            <Card title="Current Players" className="mt-6 bg-gray-900 border-gray-700">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentPlayers.map(player => (
                  <div key={player.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{player.username}</span>
                    <span className="text-yellow-400">{player.bet} MSP</span>
                    <span className={player.cashedOut ? 'text-green-400' : 'text-gray-500'}>
                      {player.cashedOut ? `${player.cashOutMultiplier.toFixed(2)}x` : 'Flying...'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
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
                    disabled={hasActiveBet}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Auto Cash Out
                  </label>
                  <input
                    type="number"
                    value={autoCashOut}
                    onChange={(e) => setAutoCashOut(parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1.01"
                    step="0.01"
                    placeholder="Auto cash out at..."
                  />
                </div>

                <button
                  onClick={placeBet}
                  disabled={!isAuthenticated || hasActiveBet || gameState !== 'waiting' || betAmount > (user?.cash_balance || 0)}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {hasActiveBet ? 'Bet Placed' : `Bet ${betAmount} MSP`}
                </button>

                {!isAuthenticated && (
                  <p className="text-red-400 text-sm text-center">Login to play</p>
                )}
              </div>
            </Card>

            {/* Game History */}
            <Card title="Recent Crashes" className="bg-gray-900 border-gray-700">
              <div className="grid grid-cols-5 gap-2">
                {gameHistory.map((crash, index) => (
                  <div
                    key={index}
                    className={`text-center py-2 rounded text-sm font-bold ${
                      crash < 2 ? 'bg-red-900 text-red-300' :
                      crash < 5 ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }`}
                  >
                    {crash.toFixed(2)}x
                  </div>
                ))}
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
                    disabled={hasActiveBet}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}