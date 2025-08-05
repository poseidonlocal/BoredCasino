import React from 'react';

const PlayingCard = ({ card, isHidden = false, className = '', size = 'normal' }) => {
  if (!card) return null;

  const isRed = card.suit === '♥' || card.suit === '♦';
  
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    normal: 'w-16 h-22 text-sm',
    large: 'w-20 h-28 text-base'
  };

  const getSuitSymbol = (suit) => {
    const symbols = {
      '♠': '♠',
      '♥': '♥', 
      '♦': '♦',
      '♣': '♣'
    };
    return symbols[suit] || suit;
  };

  const getRankDisplay = (rank) => {
    return rank;
  };

  if (isHidden) {
    return (
      <div className={`playing-card card-back ${sizeClasses[size]} ${className}`}>
        <div className="card-back-pattern">
          <div className="card-back-design">
            <div className="back-pattern-1"></div>
            <div className="back-pattern-2"></div>
            <div className="back-center">🎮</div>
          </div>
        </div>
        
        <style jsx>{`
          .playing-card {
            position: relative;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            border: 1px solid #2d3748;
          }
          
          .card-back {
            background: linear-gradient(135deg, #1a365d 0%, #2d5a87 50%, #1a365d 100%);
            border: 2px solid #4a5568;
          }
          
          .card-back-pattern {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            border-radius: 10px;
          }
          
          .card-back-design {
            width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .back-pattern-1 {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.1) 0px,
              rgba(255, 255, 255, 0.1) 2px,
              transparent 2px,
              transparent 8px
            );
          }
          
          .back-pattern-2 {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(
              -45deg,
              rgba(255, 255, 255, 0.05) 0px,
              rgba(255, 255, 255, 0.05) 2px,
              transparent 2px,
              transparent 8px
            );
          }
          
          .back-center {
            font-size: 1.5em;
            color: rgba(255, 255, 255, 0.8);
            z-index: 2;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`playing-card card-face ${sizeClasses[size]} ${className}`}>
      <div className={`card-content ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {/* Top left corner */}
        <div className="corner-top-left">
          <div className="rank">{getRankDisplay(card.rank)}</div>
          <div className="suit">{getSuitSymbol(card.suit)}</div>
        </div>
        
        {/* Center symbol */}
        <div className="center-symbol">
          {getSuitSymbol(card.suit)}
        </div>
        
        {/* Bottom right corner (rotated) */}
        <div className="corner-bottom-right">
          <div className="rank">{getRankDisplay(card.rank)}</div>
          <div className="suit">{getSuitSymbol(card.suit)}</div>
        </div>
      </div>
      
      <style jsx>{`
        .playing-card {
          position: relative;
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
          cursor: pointer;
          overflow: hidden;
        }
        
        .playing-card:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.2),
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        .card-face {
          background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
        }
        
        .card-content {
          width: 100%;
          height: 100%;
          position: relative;
          padding: 4px;
          font-weight: bold;
        }
        
        .corner-top-left {
          position: absolute;
          top: 4px;
          left: 4px;
          text-align: center;
          line-height: 1;
        }
        
        .corner-bottom-right {
          position: absolute;
          bottom: 4px;
          right: 4px;
          text-align: center;
          line-height: 1;
          transform: rotate(180deg);
        }
        
        .center-symbol {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.8em;
          opacity: 0.8;
        }
        
        .rank {
          font-size: 0.9em;
          font-weight: bold;
          margin-bottom: 1px;
        }
        
        .suit {
          font-size: 0.8em;
        }
        
        /* Red suits styling */
        .text-red-600 {
          color: #dc2626;
        }
        
        /* Black suits styling */
        .text-gray-900 {
          color: #111827;
        }
        
        /* Size variations */
        .w-12 { width: 3rem; }
        .h-16 { height: 4rem; }
        .w-16 { width: 4rem; }
        .h-22 { height: 5.5rem; }
        .w-20 { width: 5rem; }
        .h-28 { height: 7rem; }
        
        .text-xs .rank { font-size: 0.7em; }
        .text-xs .suit { font-size: 0.6em; }
        .text-xs .center-symbol { font-size: 1.2em; }
        
        .text-sm .rank { font-size: 0.8em; }
        .text-sm .suit { font-size: 0.7em; }
        .text-sm .center-symbol { font-size: 1.5em; }
        
        .text-base .rank { font-size: 1em; }
        .text-base .suit { font-size: 0.9em; }
        .text-base .center-symbol { font-size: 2em; }
      `}</style>
    </div>
  );
};

export default PlayingCard;