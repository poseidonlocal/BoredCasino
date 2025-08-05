import React from 'react';

const GameInfo = ({ gameState, pot, currentBet, handInProgress, onNewHand }) => {
  // Format game state for display
  const formatGameState = (state) => {
    switch (state) {
      case 'preflop': return 'Pre-Flop';
      case 'flop': return 'Flop';
      case 'turn': return 'Turn';
      case 'river': return 'River';
      case 'showdown': return 'Showdown';
      default: return state.charAt(0).toUpperCase() + state.slice(1);
    }
  };
  
  return (
    <div className="game-info">
      <div className="flex justify-between items-center">
        <div className="game-status">
          <div className="status-item">
            <span className="label">Game:</span>
            <span className="value">{formatGameState(gameState)}</span>
          </div>
          <div className="status-item">
            <span className="label">Pot:</span>
            <span className="value">{pot.toLocaleString()} MSP</span>
          </div>
          <div className="status-item">
            <span className="label">Current Bet:</span>
            <span className="value">{currentBet.toLocaleString()} MSP</span>
          </div>
        </div>
        
        {!handInProgress && (
          <button 
            onClick={onNewHand}
            className="btn-primary"
          >
            Deal New Hand
          </button>
        )}
      </div>
      
      <style jsx>{`
        .game-info {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .game-status {
          display: flex;
          gap: 16px;
        }
        
        .status-item {
          display: flex;
          flex-direction: column;
        }
        
        .label {
          color: #9ca3af;
          font-size: 12px;
        }
        
        .value {
          color: white;
          font-weight: bold;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          transition: all 0.2s;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default GameInfo;