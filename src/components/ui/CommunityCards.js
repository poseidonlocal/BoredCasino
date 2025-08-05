import React from 'react';
import PlayingCard from './PlayingCard';
import PokerChip from './PokerChip';

const CommunityCards = ({ cards = [], pot = 0, gameState = 'preflop' }) => {
  // Animation classes based on game state
  const getAnimationClass = (index) => {
    if (gameState === 'preflop') return '';
    if (gameState === 'flop' && index <= 2) return 'animate-deal-card';
    if (gameState === 'turn' && index === 3) return 'animate-deal-card';
    if (gameState === 'river' && index === 4) return 'animate-deal-card';
    return '';
  };
  
  return (
    <div className="community-cards-container">
      {/* Pot display */}
      <div className="pot-display mb-4">
        <div className="flex items-center justify-center">
          <PokerChip value={pot} size="large" stacked={true} count={Math.ceil(pot / 1000)} />
          <span className="ml-2 text-white font-bold text-lg">{pot.toLocaleString()} MSP</span>
        </div>
      </div>
      
      {/* Community cards */}
      <div className="community-cards flex justify-center space-x-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const card = cards[index];
          const animationClass = getAnimationClass(index);
          
          return (
            <div key={index} className="card-placeholder">
              {card ? (
                <div className={animationClass}>
                  <PlayingCard card={card} size="normal" />
                </div>
              ) : (
                <div className="card-placeholder-inner"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .community-cards-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 5;
        }
        
        .pot-display {
          background: rgba(0,0,0,0.5);
          border-radius: 20px;
          padding: 5px 15px;
          display: inline-block;
        }
        
        .card-placeholder {
          width: 4rem;
          height: 5.5rem;
          position: relative;
        }
        
        .card-placeholder-inner {
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(255,255,255,0.3);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
        }
        
        .animate-deal-card {
          animation: dealCard 0.5s ease-out forwards;
        }
        
        @keyframes dealCard {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CommunityCards;