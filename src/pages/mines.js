import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function MinesGame() {
  const { user, isAuthenticated, updateBalance } = useAuth();
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState('betting'); // betting, playing, finished
  const [grid, setGrid] = useState([]);
  const [revealedCells, setRevealedCells] = useState([]);
  const [minePositions, setMinePositions] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, profit: 0 });

  const GRID_SIZE = 25; // 5x5 grid

  // Calculate multiplier based on revealed gems and mine count
  const calculateMultiplier = (gemsRevealed, totalMines) => {
    if (gemsRevealed === 0) return 1;
    const totalGems = GRID_SIZE - totalMines;
    let multiplier = 1;
    
    for (let i = 0; i < gemsRevealed; i++) {
      multiplier *= (totalGems - i) / (GRID_SIZE - totalMines - i);
    }
    
    return multiplier * 0.97; // House edge
  };

  const startGame = () => {
    if (!isAuthenticated || betAmount > user.cash_balance) return;

    // Generate mine positions
    const mines = [];
    while (mines.length < mineCount) {
      const position = Math.floor(Math.random() * GRID_SIZE);
      if (!mines.includes(position)) {
        mines.push(position);
      }
    }

    setMinePositions(mines);
    setRevealedCells([]);
    setCurrentMultiplier(1);
    setGameState('playing');
    updateBalance(-betAmount);

    // Initialize grid
    const newGrid = Array(GRID_SIZE).fill().map((_, index) => ({
      id: index,
      revealed: false,
      isMine: mines.includes(index),
      isGem: !mines.includes(index)
    }));
    setGrid(newGrid);
  };

  const revealCell = (cellId) => {
    if (gameState !== 'playing' || revealedCells.includes(cellId)) return;

    const cell = grid[cellId];
    const newRevealedCells = [...revealedCells, cellId];
    setRevealedCells(newRevealedCells);

    if (cell.isMine) {
      // Hit a mine - game over
      setGameState('finished');
      endGame(false, 0);
    } else {
      // Found a gem
      const newMultiplier = calculateMultiplier(newRevealedCells.length, mineCount);
      setCurrentMultiplier(newMultiplier);

      // Check if all gems found
      const totalGems = GRID_SIZE - mineCount;
      if (newRevealedCells.length === totalGems) {
        setGameState('finished');
        endGame(true, betAmount * newMultiplier);
      }
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing' || revealedCells.length === 0) return;
    
    const payout = betAmount * currentMultiplier;
    setGameState('finished');
    endGame(true, payout);
  };

  const endGame = async (won, payout) => {
    const profit = payout - betAmount;
    
    if (won && payout > 0) {
      updateBalance(payout);
    }

    // Update stats
    setStats(prev => ({
      wins: prev.wins + (won ? 1 : 0),
      losses: prev.losses + (won ? 0 : 1),
      profit: prev.profit + profit
    }));

    // Add to history
    const gameResult = {
      bet: betAmount,
      mines: mineCount,
      gemsFound: revealedCells.length,
      won,
      payout,
      profit,
      multiplier: currentMultiplier,
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
          gameType: 'mines',
          betType: `${mineCount} mines`,
          betAmount: betAmount,
          result: won ? 'win' : 'loss',
          payout: payout,
          profit: profit,
          details: `Found ${revealedCells.length} gems, ${mineCount} mines, ${currentMultiplier.toFixed(2)}x multiplier`
        })
      });
    } catch (error) {
      console.error('Failed to log mines game:', error);
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setGrid([]);
    setRevealedCells([]);
    setMinePositions([]);
    setCurrentMultiplier(1);
  };

  const getCellContent = (cell, index) => {
    if (gameState === 'finished') {
      if (cell.isMine) return '💣';
      if (revealedCells.includes(index)) return '💎';
      return '💎';
    }
    
    if (revealedCells.includes(index)) {
      return cell.isMine ? '💣' : '💎';
    }
    
    return '';
  };

  const getCellClass = (cell, index) => {
    const baseClass = "w-16 h-16 border border-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 cursor-pointer";
    
    if (gameState === 'finished') {
      if (cell.isMine) return `${baseClass} bg-red-900 text-red-300`;
      if (revealedCells.includes(index)) return `${baseClass} bg-green-900 text-green-300`;
      return `${baseClass} bg-blue-900 text-blue-300`;
    }
    
    if (revealedCells.includes(index)) {
      return `${baseClass} ${cell.isMine ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`;
    }
    
    return `${baseClass} bg-gray-700 hover:bg-gray-600`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
            💣 Mines Game
          </h1>
          <p className="text-gray-400">Find gems and avoid mines!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-700">
              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  {currentMultiplier.toFixed(2)}x Multiplier
                </div>
                <div className="text-lg text-gray-300">
                  Potential Win: {(betAmount * currentMultiplier).toFixed(0)} MSP
                </div>
              </div>

              {/* Game Grid */}
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto mb-6">
                {grid.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => revealCell(index)}
                    disabled={gameState !== 'playing'}
                    className={getCellClass(cell, index)}
                  >
                    {getCellContent(cell, index)}
                  </button>
                ))}
              </div>

              {/* Game Controls */}
              <div className="text-center space-y-4">
                {gameState === 'betting' && (
                  <button
                    onClick={startGame}
                    disabled={!isAuthenticated || betAmount > (user?.cash_balance || 0)}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors"
                  >
                    Start Game ({betAmount} MSP)
                  </button>
                )}

                {gameState === 'playing' && revealedCells.length > 0 && (
                  <button
                    onClick={cashOut}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors"
                  >
                    Cash Out ({(betAmount * currentMultiplier).toFixed(0)} MSP)
                  </button>
                )}

                {gameState === 'finished' && (
                  <div className="space-y-4">
                    <div className={`text-2xl font-bold ${
                      stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {revealedCells.some(id => grid[id]?.isMine) ? '💥 Hit a Mine!' : '🎉 Cashed Out!'}
                    </div>
                    <button
                      onClick={resetGame}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors"
                    >
                      Play Again
                    </button>
                  </div>
                )}

                {!isAuthenticated && (
                  <p className="text-red-400 text-sm">Login to play</p>
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
            <Card title="Game Settings" className="bg-gray-900 border-gray-700">
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
                    disabled={gameState !== 'betting'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Mines: {mineCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={mineCount}
                    onChange={(e) => setMineCount(parseInt(e.target.value))}
                    className="w-full"
                    disabled={gameState !== 'betting'}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 (Easy)</span>
                    <span>20 (Hard)</span>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Gems to Find:</span>
                    <span className="text-blue-400">{GRID_SIZE - mineCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Gems:</span>
                    <span className="text-green-400">{revealedCells.length}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Settings */}
            <Card title="Quick Settings" className="bg-gray-900 border-gray-700">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Mine Count:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 10].map(count => (
                      <button
                        key={count}
                        onClick={() => setMineCount(count)}
                        className={`py-2 rounded text-sm transition-colors ${
                          mineCount === count 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        disabled={gameState !== 'betting'}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Bet Amount:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm transition-colors"
                        disabled={gameState !== 'betting'}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Game History */}
            <Card title="Recent Games" className="bg-gray-900 border-gray-700">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {gameHistory.map((game, index) => (
                  <div key={index} className="bg-gray-800 rounded p-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">
                        {game.gemsFound}/{GRID_SIZE - game.mines} gems
                      </span>
                      <span className={game.won ? 'text-green-400' : 'text-red-400'}>
                        {game.won ? '+' : ''}{game.profit.toFixed(0)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {game.mines} mines • {game.multiplier.toFixed(2)}x
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