import React, { useState, useEffect } from 'react';
import PokerChip from './PokerChip';

const PlayerControls = ({ 
  player,
  currentBet = 0,
  minRaise = 20,
  pot = 0,
  onAction = () => {},
  handStrength = 0,
  winProbability = 0,
  handDescription = ''
}) => {
  const [raiseAmount, setRaiseAmount] = useState(currentBet + minRaise);
  const [quickRaises, setQuickRaises] = useState([]);
  
  // Update raise amount when currentBet or minRaise changes
  useEffect(() => {
    setRaiseAmount(Math.min(currentBet + minRaise, player?.chips || 0));
    
    // Calculate quick raise options (pot, half pot, 3x, etc)
    const options = [];
    
    // Min raise
    options.push({
      label: 'Min',
      amount: currentBet + minRaise
    });
    
    // Half pot
    const halfPot = currentBet + Math.floor(pot * 0.5);
    if (halfPot > currentBet + minRaise) {
      options.push({
        label: '1/2 Pot',
        amount: halfPot
      });
    }
    
    // 3/4 pot
    const threeQuarterPot = currentBet + Math.floor(pot * 0.75);
    if (threeQuarterPot > halfPot) {
      options.push({
        label: '3/4 Pot',
        amount: threeQuarterPot
      });
    }
    
    // Pot
    const potRaise = currentBet + pot;
    if (potRaise > threeQuarterPot) {
      options.push({
        label: 'Pot',
        amount: potRaise
      });
    }
    
    // All-in
    if (player?.chips > potRaise) {
      options.push({
        label: 'All-In',
        amount: player.chips
      });
    }
    
    setQuickRaises(options.filter(option => option.amount <= (player?.chips || 0)));
  }, [currentBet, minRaise, pot, player]);
  
  // Calculate if call is profitable based on pot odds and win probability
  const isProfitableCall = () => {
    if (currentBet === 0 || currentBet === player?.bet) return true;
    
    const callAmount = currentBet - (player?.bet || 0);
    const potOdds = callAmount / (pot + callAmount);
    
    return winProbability > potOdds;
  };
  
  // Format the hand strength as a percentage
  const formatHandStrength = () => {
    return `${Math.round(winProbability * 100)}%`;
  };
  
  return (
    <div className="player-controls">
      {/* Hand strength indicator */}
      <div className="hand-strength-indicator mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-medium">Hand Strength</span>
          <span className="text-sm text-gray-300">
            {handDescription || 'Waiting for cards...'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full" 
            style={{ width: `${Math.max(5, Math.round(winProbability * 100))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Weak</span>
          <span>{formatHandStrength()} win chance</span>
          <span>Strong</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="action-buttons flex flex-wrap gap-2">
        <button 
          onClick={() => onAction('fold')}
          className="btn-danger flex-1"
        >
          Fold
        </button>
        
        {currentBet === 0 || currentBet === player?.bet ? (
          <button 
            onClick={() => onAction('check')}
            className="btn-secondary flex-1"
          >
            Check
          </button>
        ) : (
          <button 
            onClick={() => onAction('call')}
            className={`btn-primary flex-1 ${isProfitableCall() ? 'profitable-call' : ''}`}
            disabled={!player || player.chips < (currentBet - (player.bet || 0))}
          >
            Call {Math.min(currentBet - (player?.bet || 0), player?.chips || 0)}
            {isProfitableCall() && <span className="ml-1 text-xs">✓</span>}
          </button>
        )}
        
        <button 
          onClick={() => onAction('raise', raiseAmount)}
          className="btn-success flex-1"
          disabled={!player || player.chips <= (currentBet - (player?.bet || 0))}
        >
          Raise to {raiseAmount}
        </button>
        
        <button 
          onClick={() => onAction('all-in')}
          className="btn-warning flex-1"
          disabled={!player || player.chips === 0}
        >
          All-in {player?.chips}
        </button>
      </div>
      
      {/* Raise controls */}
      {player && player.chips > (currentBet - (player.bet || 0)) && (
        <div className="raise-controls mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-300">Raise Amount</span>
            <div className="flex items-center">
              <PokerChip value={raiseAmount} size="small" />
              <span className="ml-1 text-white">{raiseAmount}</span>
            </div>
          </div>
          
          {/* Quick raise buttons */}
          <div className="quick-raises flex flex-wrap gap-2 mb-2">
            {quickRaises.map((option, index) => (
              <button
                key={index}
                onClick={() => setRaiseAmount(option.amount)}
                className={`quick-raise-btn ${raiseAmount === option.amount ? 'active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Raise slider */}
          <input
            type="range"
            min={currentBet + minRaise}
            max={player.chips}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{currentBet + minRaise}</span>
            <span>{player.chips}</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .player-controls {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-warning {
          padding: 10px;
          border-radius: 6px;
          font-weight: bold;
          transition: all 0.2s;
          text-align: center;
        }
        
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; }
        
        .btn-secondary { background: #6b7280; color: white; }
        .btn-secondary:hover { background: #4b5563; }
        
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        
        .btn-warning { background: #f59e0b; color: white; }
        .btn-warning:hover { background: #d97706; }
        
        .profitable-call {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5);
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .quick-raise-btn {
          background: #374151;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .quick-raise-btn:hover {
          background: #4b5563;
        }
        
        .quick-raise-btn.active {
          background: #10b981;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          height: 6px;
          background: #4b5563;
          border-radius: 3px;
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default PlayerControls;