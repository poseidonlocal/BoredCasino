import React from 'react';
import Link from 'next/link';
import PlayingCard from './PlayingCard';
import PokerChip from './PokerChip';
import DealerButton from './DealerButton';

const PlayerSeat = ({ 
  player, 
  isCurrentPlayer = false, 
  isDealer = false,
  isSmallBlind = false,
  isBigBlind = false,
  showCards = false,
  isUser = false,
  onHover = () => {},
  position = { x: 50, y: 50 }
}) => {
  if (!player) return null;
  
  const { isFolded, isAllIn } = player;
  
  // Get action color
  const getActionColor = (action) => {
    if (!action) return '';
    if (action.includes('Fold')) return 'text-red-400';
    if (action.includes('Check')) return 'text-blue-400';
    if (action.includes('Call')) return 'text-yellow-400';
    if (action.includes('Raise')) return 'text-green-400';
    if (action.includes('All-in')) return 'text-purple-400';
    return 'text-white';
  };
  
  return (
    <div 
      className={`player-seat ${isCurrentPlayer ? 'current-player' : ''} ${isFolded ? 'folded' : ''}`}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrentPlayer ? 10 : 5,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={() => onHover(player)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Player position indicators */}
      <div className="absolute -top-2 -left-2 flex space-x-1">
        {isDealer && <DealerButton type="dealer" size="small" />}
        {isSmallBlind && <DealerButton type="smallBlind" size="small" />}
        {isBigBlind && <DealerButton type="bigBlind" size="small" />}
      </div>
      
      {/* Player info */}
      <div className={`player-info ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}`}>
        <div className="flex items-center space-x-2">
          <div className="player-avatar">
            {player.profileUrl ? (
              <Link href={player.profileUrl}>
                <a className="hover:scale-110 transition-transform inline-block">
                  {player.avatar}
                </a>
              </Link>
            ) : (
              player.avatar
            )}
          </div>
          <div className="player-details">
            <div className="player-name">
              {player.profileUrl ? (
                <Link href={player.profileUrl}>
                  <a className="hover:text-green-400 transition-colors">
                    {player.name}
                    {player.isLoading ? '...' : ''}
                  </a>
                </Link>
              ) : (
                player.name
              )}
            </div>
            <div className="player-chips flex items-center">
              <PokerChip value={10} size="small" />
              <span className="ml-1">{player.chips.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Player action */}
        {player.action && (
          <div className={`player-action mt-1 ${getActionColor(player.action)}`}>
            {player.action}
          </div>
        )}
        
        {/* Player status indicators */}
        <div className="player-status flex justify-center mt-1">
          {isFolded && <span className="text-xs bg-red-900/50 px-2 py-0.5 rounded">Folded</span>}
          {isAllIn && <span className="text-xs bg-purple-900/50 px-2 py-0.5 rounded">All-In</span>}
          {player.isBot && player.personality && (
            <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded ml-1">
              {player.personality.style.charAt(0).toUpperCase() + player.personality.style.slice(1)}
            </span>
          )}
        </div>
      </div>
      
      {/* Player cards */}
      <div className="player-cards mt-2 flex justify-center">
        {player.cards && player.cards.map((card, cardIndex) => (
          <div 
            key={cardIndex} 
            className="transform transition-all duration-300"
            style={{ 
              marginLeft: cardIndex > 0 ? '-10px' : '0',
              transform: `rotate(${cardIndex === 0 ? '-5deg' : '5deg'})`,
              zIndex: cardIndex
            }}
          >
            <PlayingCard 
              card={card} 
              isHidden={!isUser && !showCards && !isFolded} 
              size="small"
            />
          </div>
        ))}
      </div>
      
      {/* Player bet */}
      {player.totalBet > 0 && (
        <div className="player-bet absolute" style={{
          bottom: '-20px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <PokerChip value={player.totalBet} stacked={true} count={Math.ceil(player.totalBet / 100)} />
        </div>
      )}
      
      <style jsx>{`
        .player-info {
          background: rgba(0,0,0,0.7);
          border-radius: 8px;
          padding: 8px;
          min-width: 120px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .player-avatar {
          font-size: 24px;
        }
        
        .player-name {
          color: white;
          font-size: 12px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }
        
        .player-chips {
          color: #4ade80;
          font-size: 11px;
        }
        
        .player-action {
          font-size: 10px;
          text-align: center;
        }
        
        .current-player {
          z-index: 10;
        }
        
        .folded {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default PlayerSeat;