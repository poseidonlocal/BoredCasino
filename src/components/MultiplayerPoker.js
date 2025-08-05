import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PlayingCard from './ui/PlayingCard';

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Bot personalities with different playing styles
const BOT_PERSONALITIES = [
  { name: 'Alex_Aggressive', style: 'aggressive', avatar: '🤖', aggression: 0.8, bluffRate: 0.3 },
  { name: 'Sarah_Tight', style: 'tight', avatar: '👩', aggression: 0.3, bluffRate: 0.1 },
  { name: 'Mike_Loose', style: 'loose', avatar: '👨', aggression: 0.6, bluffRate: 0.4 },
  { name: 'Emma_Balanced', style: 'balanced', avatar: '👱‍♀️', aggression: 0.5, bluffRate: 0.2 },
  { name: 'David_Caller', style: 'calling_station', avatar: '🧔', aggression: 0.2, bluffRate: 0.05 },
  { name: 'Lisa_Bluffer', style: 'bluffer', avatar: '👩‍🦰', aggression: 0.7, bluffRate: 0.6 },
  { name: 'Tom_Rock', style: 'rock', avatar: '👨‍🦲', aggression: 0.1, bluffRate: 0.02 },
  { name: 'Anna_Wild', style: 'wild', avatar: '👩‍🦳', aggression: 0.9, bluffRate: 0.5 },
  { name: 'Jake_Pro', style: 'professional', avatar: '🕴️', aggression: 0.6, bluffRate: 0.25 },
  { name: 'Zoe_Maniac', style: 'maniac', avatar: '🤪', aggression: 0.95, bluffRate: 0.7 }
];

const HAND_RANKINGS = {
  'Royal Flush': 10,
  'Straight Flush': 9,
  'Four of a Kind': 8,
  'Full House': 7,
  'Flush': 6,
  'Straight': 5,
  'Three of a Kind': 4,
  'Two Pair': 3,
  'One Pair': 2,
  'High Card': 1
};

export default function MultiplayerPoker() {
  const { user, updateUserCash } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState('waiting'); // waiting, preflop, flop, turn, river, showdown
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(0);
  const [smallBlindIndex, setSmallBlindIndex] = useState(1);
  const [bigBlindIndex, setBigBlindIndex] = useState(2);
  
  // Cards and deck
  const [deck, setDeck] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(20); // Big blind
  const [minRaise, setMinRaise] = useState(20);
  
  // UI state
  const [playerAction, setPlayerAction] = useState('');
  const [raiseAmount, setRaiseAmount] = useState(40);
  const [gameLog, setGameLog] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize deck
  const createDeck = () => {
    const newDeck = [];
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        newDeck.push({ suit, rank, value: getRankValue(rank) });
      }
    }
    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const getRankValue = (rank) => {
    if (rank === 'A') return 14;
    if (rank === 'K') return 13;
    if (rank === 'Q') return 12;
    if (rank === 'J') return 11;
    return parseInt(rank);
  };

  // Initialize players (user + 9 bots)
  const initializePlayers = useCallback(() => {
    const newPlayers = [
      {
        id: 'user',
        name: user?.username || 'Player',
        isBot: false,
        chips: user?.cashBalance || 1000,
        cards: [],
        bet: 0,
        totalBet: 0,
        action: '',
        isActive: true,
        isFolded: false,
        isAllIn: false,
        avatar: '👤'
      }
    ];

    // Add 9 bots with random personalities
    const shuffledBots = [...BOT_PERSONALITIES].sort(() => Math.random() - 0.5).slice(0, 9);
    shuffledBots.forEach((bot, index) => {
      newPlayers.push({
        id: `bot_${index}`,
        name: bot.name,
        isBot: true,
        chips: 1000 + Math.floor(Math.random() * 2000), // Random starting chips
        cards: [],
        bet: 0,
        totalBet: 0,
        action: '',
        isActive: true,
        isFolded: false,
        isAllIn: false,
        avatar: bot.avatar,
        personality: bot
      });
    });

    setPlayers(newPlayers);
    return newPlayers;
  }, [user]);

  // Start new game
  const startNewGame = useCallback(() => {
    const newDeck = createDeck();
    const activePlayers = players.filter(p => p.chips > 0 && p.isActive);
    
    if (activePlayers.length < 2) {
      addToLog('Not enough players to start a new hand');
      return;
    }

    // Reset player states
    const resetPlayers = players.map(player => ({
      ...player,
      cards: [],
      bet: 0,
      totalBet: 0,
      action: '',
      isFolded: false,
      isAllIn: false
    }));

    // Post blinds
    const smallBlind = 10;
    const bigBlind = 20;
    
    resetPlayers[smallBlindIndex].bet = smallBlind;
    resetPlayers[smallBlindIndex].totalBet = smallBlind;
    resetPlayers[smallBlindIndex].chips -= smallBlind;
    resetPlayers[smallBlindIndex].action = `Small Blind (${smallBlind})`;

    resetPlayers[bigBlindIndex].bet = bigBlind;
    resetPlayers[bigBlindIndex].totalBet = bigBlind;
    resetPlayers[bigBlindIndex].chips -= bigBlind;
    resetPlayers[bigBlindIndex].action = `Big Blind (${bigBlind})`;

    setPlayers(resetPlayers);
    setDeck(newDeck);
    setCommunityCards([]);
    setPot(smallBlind + bigBlind);
    setCurrentBet(bigBlind);
    setMinRaise(bigBlind);
    setGameState('preflop');
    setCurrentPlayerIndex((bigBlindIndex + 1) % players.length);
    setShowCards(false);
    
    addToLog(`New hand started. Blinds: ${resetPlayers[smallBlindIndex].name} (${smallBlind}), ${resetPlayers[bigBlindIndex].name} (${bigBlind})`);
    
    // Deal hole cards
    setTimeout(() => dealHoleCards(newDeck, resetPlayers), 500);
  }, [players, smallBlindIndex, bigBlindIndex]);

  // Deal hole cards to all players
  const dealHoleCards = (currentDeck, currentPlayers) => {
    const newDeck = [...currentDeck];
    const updatedPlayers = currentPlayers.map(player => {
      if (player.isActive && !player.isFolded) {
        return {
          ...player,
          cards: [newDeck.pop(), newDeck.pop()]
        };
      }
      return player;
    });
    
    setPlayers(updatedPlayers);
    setDeck(newDeck);
    addToLog('Hole cards dealt to all players');
  };

  // Evaluate poker hand
  const evaluateHand = (holeCards, community) => {
    const allCards = [...holeCards, ...community];
    if (allCards.length < 5) return { hand: 'High Card', ranking: 1, cards: allCards };
    
    let bestHand = { hand: 'High Card', cards: [], ranking: 1 };
    const combinations = getCombinations(allCards, 5);
    
    for (let combo of combinations) {
      const evaluation = evaluatePokerHand(combo);
      if (evaluation.ranking > bestHand.ranking) {
        bestHand = evaluation;
      }
    }
    
    return bestHand;
  };

  const getCombinations = (arr, k) => {
    if (k === 1) return arr.map(x => [x]);
    if (k === arr.length) return [arr];
    
    const combinations = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const head = arr[i];
      const tailCombos = getCombinations(arr.slice(i + 1), k - 1);
      for (let combo of tailCombos) {
        combinations.push([head, ...combo]);
      }
    }
    return combinations;
  };

  const evaluatePokerHand = (cards) => {
    const sortedCards = cards.sort((a, b) => b.value - a.value);
    const suits = cards.map(c => c.suit);
    const values = cards.map(c => c.value);
    
    const isFlush = suits.every(suit => suit === suits[0]);
    const isStraight = checkStraight(values);
    const valueCounts = getValueCounts(values);
    
    if (isFlush && isStraight && values[0] === 14) {
      return { hand: 'Royal Flush', cards: sortedCards, ranking: 10 };
    }
    if (isFlush && isStraight) {
      return { hand: 'Straight Flush', cards: sortedCards, ranking: 9 };
    }
    if (valueCounts.some(count => count === 4)) {
      return { hand: 'Four of a Kind', cards: sortedCards, ranking: 8 };
    }
    if (valueCounts.includes(3) && valueCounts.includes(2)) {
      return { hand: 'Full House', cards: sortedCards, ranking: 7 };
    }
    if (isFlush) {
      return { hand: 'Flush', cards: sortedCards, ranking: 6 };
    }
    if (isStraight) {
      return { hand: 'Straight', cards: sortedCards, ranking: 5 };
    }
    if (valueCounts.includes(3)) {
      return { hand: 'Three of a Kind', cards: sortedCards, ranking: 4 };
    }
    if (valueCounts.filter(count => count === 2).length === 2) {
      return { hand: 'Two Pair', cards: sortedCards, ranking: 3 };
    }
    if (valueCounts.includes(2)) {
      return { hand: 'One Pair', cards: sortedCards, ranking: 2 };
    }
    return { hand: 'High Card', cards: sortedCards, ranking: 1 };
  };

  const checkStraight = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] !== 1) {
        if (sorted[0] === 2 && sorted[4] === 14) return true;
        return false;
      }
    }
    return true;
  };

  const getValueCounts = (values) => {
    const counts = {};
    values.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.values(counts);
  };

  // Bot AI decision making
  const makeBotDecision = (player) => {
    const { personality } = player;
    const handStrength = evaluateHand(player.cards, communityCards).ranking;
    const potOdds = currentBet / (pot + currentBet);
    const random = Math.random();
    
    // Calculate decision based on personality and hand strength
    let decision = 'fold';
    let amount = 0;
    
    // Adjust thresholds based on personality
    const foldThreshold = personality.aggression * 0.3 + handStrength * 0.1;
    const raiseThreshold = personality.aggression * 0.6 + handStrength * 0.15;
    const bluffChance = personality.bluffRate;
    
    if (random < bluffChance && player.chips > currentBet * 2) {
      // Bluff
      decision = 'raise';
      amount = Math.min(currentBet * (1 + random), player.chips);
    } else if (handStrength >= 6 || random < raiseThreshold) {
      // Strong hand or aggressive play
      decision = 'raise';
      amount = Math.min(currentBet + minRaise + Math.floor(random * currentBet), player.chips);
    } else if (handStrength >= 3 || random < foldThreshold || currentBet === 0) {
      // Decent hand or call
      decision = 'call';
      amount = Math.min(currentBet, player.chips);
    }
    
    // Adjust for chip stack
    if (amount >= player.chips * 0.8) {
      decision = 'all-in';
      amount = player.chips;
    }
    
    return { decision, amount };
  };

  // Process player action
  const processAction = (playerId, action, amount = 0) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
      const player = updatedPlayers[playerIndex];
      
      switch (action) {
        case 'fold':
          player.isFolded = true;
          player.action = 'Folded';
          addToLog(`${player.name} folds`);
          break;
          
        case 'call':
          const callAmount = Math.min(currentBet - player.bet, player.chips);
          player.chips -= callAmount;
          player.bet += callAmount;
          player.totalBet += callAmount;
          player.action = `Called (${callAmount})`;
          setPot(prev => prev + callAmount);
          addToLog(`${player.name} calls ${callAmount}`);
          break;
          
        case 'raise':
          const raiseAmount = Math.min(amount, player.chips);
          player.chips -= raiseAmount;
          player.bet = raiseAmount;
          player.totalBet += raiseAmount;
          player.action = `Raised to ${raiseAmount}`;
          setCurrentBet(raiseAmount);
          setMinRaise(raiseAmount - currentBet);
          setPot(prev => prev + raiseAmount);
          addToLog(`${player.name} raises to ${raiseAmount}`);
          break;
          
        case 'all-in':
          const allInAmount = player.chips;
          player.chips = 0;
          player.bet += allInAmount;
          player.totalBet += allInAmount;
          player.isAllIn = true;
          player.action = `All-in (${allInAmount})`;
          setPot(prev => prev + allInAmount);
          addToLog(`${player.name} goes all-in with ${allInAmount}`);
          break;
          
        case 'check':
          player.action = 'Checked';
          addToLog(`${player.name} checks`);
          break;
      }
      
      return updatedPlayers;
    });
    
    // Move to next player
    moveToNextPlayer();
  };

  // Move to next active player
  const moveToNextPlayer = () => {
    let nextIndex = (currentPlayerIndex + 1) % players.length;
    let attempts = 0;
    
    while (attempts < players.length) {
      const nextPlayer = players[nextIndex];
      if (nextPlayer.isActive && !nextPlayer.isFolded && !nextPlayer.isAllIn) {
        setCurrentPlayerIndex(nextIndex);
        
        // If it's a bot's turn, make decision after delay
        if (nextPlayer.isBot) {
          setTimeout(() => {
            const { decision, amount } = makeBotDecision(nextPlayer);
            processAction(nextPlayer.id, decision, amount);
          }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
        }
        return;
      }
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }
    
    // If no more active players, move to next phase
    moveToNextPhase();
  };

  // Move to next phase of the game
  const moveToNextPhase = () => {
    switch (gameState) {
      case 'preflop':
        dealFlop();
        break;
      case 'flop':
        dealTurn();
        break;
      case 'turn':
        dealRiver();
        break;
      case 'river':
        showdown();
        break;
    }
  };

  // Deal community cards
  const dealFlop = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const flop = [newDeck.pop(), newDeck.pop(), newDeck.pop()];
    
    setCommunityCards(flop);
    setDeck(newDeck);
    setGameState('flop');
    setCurrentBet(0);
    setCurrentPlayerIndex((dealerIndex + 1) % players.length);
    
    // Reset player bets for new round
    setPlayers(prev => prev.map(p => ({ ...p, bet: 0, action: '' })));
    
    addToLog('Flop dealt');
    setTimeout(() => setIsAnimating(false), 500);
  };

  const dealTurn = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const turnCard = newDeck.pop();
    
    setCommunityCards(prev => [...prev, turnCard]);
    setDeck(newDeck);
    setGameState('turn');
    setCurrentBet(0);
    setCurrentPlayerIndex((dealerIndex + 1) % players.length);
    
    setPlayers(prev => prev.map(p => ({ ...p, bet: 0, action: '' })));
    
    addToLog('Turn dealt');
    setTimeout(() => setIsAnimating(false), 500);
  };

  const dealRiver = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const riverCard = newDeck.pop();
    
    setCommunityCards(prev => [...prev, riverCard]);
    setDeck(newDeck);
    setGameState('river');
    setCurrentBet(0);
    setCurrentPlayerIndex((dealerIndex + 1) % players.length);
    
    setPlayers(prev => prev.map(p => ({ ...p, bet: 0, action: '' })));
    
    addToLog('River dealt');
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Showdown
  const showdown = () => {
    setGameState('showdown');
    setShowCards(true);
    
    const activePlayers = players.filter(p => !p.isFolded);
    const playerHands = activePlayers.map(player => ({
      ...player,
      bestHand: evaluateHand(player.cards, communityCards)
    }));
    
    // Find winner(s)
    const maxRanking = Math.max(...playerHands.map(p => p.bestHand.ranking));
    const winners = playerHands.filter(p => p.bestHand.ranking === maxRanking);
    
    const winAmount = Math.floor(pot / winners.length);
    
    winners.forEach(winner => {
      if (winner.id === 'user') {
        updateUserCash(user.cashBalance + winAmount);
      }
      addToLog(`${winner.name} wins ${winAmount} with ${winner.bestHand.hand}`);
    });
    
    // Update player chips
    setPlayers(prev => prev.map(player => {
      const winner = winners.find(w => w.id === player.id);
      if (winner) {
        return { ...player, chips: player.chips + winAmount };
      }
      return player;
    }));
    
    setTimeout(() => {
      // Move dealer button and blinds
      setDealerIndex((dealerIndex + 1) % players.length);
      setSmallBlindIndex((smallBlindIndex + 1) % players.length);
      setBigBlindIndex((bigBlindIndex + 1) % players.length);
      
      // Start new hand after delay
      setTimeout(startNewGame, 3000);
    }, 5000);
  };

  // Add message to game log
  const addToLog = (message) => {
    setGameLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize game
  useEffect(() => {
    const initialPlayers = initializePlayers();
    if (initialPlayers.length >= 2) {
      setTimeout(startNewGame, 1000);
    }
  }, [initializePlayers, startNewGame]);

  // Render card component
  const renderCard = (card, isHidden = false, className = '') => {
    if (!card) return null;
    return (
      <PlayingCard 
        card={card} 
        isHidden={isHidden} 
        className={className} 
        size={className.includes('player-card') ? 'small' : 'normal'}
      />
    );
  };

  // Render player
  const renderPlayer = (player, index) => {
    const isCurrentPlayer = index === currentPlayerIndex;
    const isUser = player.id === 'user';
    
    return (
      <div 
        key={player.id}
        className={`player-seat ${isCurrentPlayer ? 'current-player' : ''} ${player.isFolded ? 'folded' : ''}`}
      >
        <div className="player-info">
          <div className="player-avatar">{player.avatar}</div>
          <div className="player-details">
            <div className="player-name">{player.name}</div>
            <div className="player-chips">{player.chips} MSP</div>
            {player.action && (
              <div className="player-action">{player.action}</div>
            )}
          </div>
        </div>
        
        <div className="player-cards">
          {player.cards.map((card, cardIndex) => 
            renderCard(card, !isUser && !showCards, 'player-card')
          )}
        </div>
        
        {player.totalBet > 0 && (
          <div className="player-bet">{player.totalBet} MSP</div>
        )}
      </div>
    );
  };

  const currentPlayer = players[currentPlayerIndex];
  const isUserTurn = currentPlayer && currentPlayer.id === 'user';

  return (
    <div className="multiplayer-poker">
      {/* Game Table */}
      <div className="poker-table">
        {/* Community Cards */}
        <div className="community-cards">
          <h3 className="text-lg font-semibold text-white mb-4">Community Cards</h3>
          <div className="cards-container">
            {Array.from({ length: 5 }, (_, index) => {
              const card = communityCards[index];
              return (
                <div key={index} className="community-card-slot">
                  {card && renderCard(card, false, 'community-card')}
                </div>
              );
            })}
          </div>
          <div className="pot-display">
            Pot: <span className="pot-amount">{pot} MSP</span>
          </div>
        </div>

        {/* Players */}
        <div className="players-container">
          {players.map((player, index) => renderPlayer(player, index))}
        </div>
      </div>

      {/* User Controls */}
      {isUserTurn && gameState !== 'showdown' && (
        <div className="user-controls">
          <div className="action-buttons">
            <button 
              onClick={() => processAction('user', 'fold')}
              className="btn-danger"
            >
              Fold
            </button>
            
            {currentBet === 0 ? (
              <button 
                onClick={() => processAction('user', 'check')}
                className="btn-secondary"
              >
                Check
              </button>
            ) : (
              <button 
                onClick={() => processAction('user', 'call')}
                className="btn-primary"
                disabled={currentPlayer.chips < currentBet}
              >
                Call {Math.min(currentBet, currentPlayer.chips)}
              </button>
            )}
            
            <div className="raise-controls">
              <input
                type="range"
                min={currentBet + minRaise}
                max={currentPlayer.chips}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                className="raise-slider"
              />
              <button 
                onClick={() => processAction('user', 'raise', raiseAmount)}
                className="btn-success"
                disabled={currentPlayer.chips < raiseAmount}
              >
                Raise to {raiseAmount}
              </button>
            </div>
            
            <button 
              onClick={() => processAction('user', 'all-in')}
              className="btn-warning"
            >
              All-in ({currentPlayer.chips})
            </button>
          </div>
        </div>
      )}

      {/* Game Log */}
      <div className="game-log">
        <h4 className="text-white font-semibold mb-2">Game Log</h4>
        <div className="log-messages">
          {gameLog.map((message, index) => (
            <div key={index} className="log-message">{message}</div>
          ))}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .multiplayer-poker {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .poker-table {
          background: linear-gradient(135deg, #1a5f3f, #2d8f5f);
          border-radius: 50%;
          width: 800px;
          height: 500px;
          margin: 0 auto 20px;
          position: relative;
          border: 8px solid #8b4513;
          box-shadow: inset 0 0 50px rgba(0,0,0,0.3);
        }

        .community-cards {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .cards-container {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .community-card-slot {
          width: 4rem;
          height: 5.5rem;
          border: 2px dashed #ffffff40;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .community-card {
          /* Sizing is handled by the PlayingCard component */
        }

        .pot-display {
          color: white;
          font-weight: bold;
          background: rgba(0,0,0,0.5);
          padding: 5px 10px;
          border-radius: 15px;
        }

        .pot-amount {
          color: #ffd700;
        }

        .players-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .player-seat {
          position: absolute;
          width: 120px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .player-seat:nth-child(1) { top: 10px; left: 50%; transform: translateX(-50%); }
        .player-seat:nth-child(2) { top: 20px; right: 20px; }
        .player-seat:nth-child(3) { top: 40%; right: 10px; }
        .player-seat:nth-child(4) { bottom: 20px; right: 20px; }
        .player-seat:nth-child(5) { bottom: 10px; right: 40%; }
        .player-seat:nth-child(6) { bottom: 10px; left: 40%; }
        .player-seat:nth-child(7) { bottom: 20px; left: 20px; }
        .player-seat:nth-child(8) { top: 40%; left: 10px; }
        .player-seat:nth-child(9) { top: 20px; left: 20px; }
        .player-seat:nth-child(10) { top: 30px; left: 50%; transform: translateX(-50%); }

        .current-player {
          box-shadow: 0 0 20px #ffd700;
          border-radius: 10px;
          background: rgba(255, 215, 0, 0.1);
        }

        .folded {
          opacity: 0.5;
        }

        .player-info {
          background: rgba(0,0,0,0.7);
          border-radius: 8px;
          padding: 8px;
          margin-bottom: 5px;
        }

        .player-avatar {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .player-name {
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .player-chips {
          color: #4ade80;
          font-size: 11px;
        }

        .player-action {
          color: #fbbf24;
          font-size: 10px;
          margin-top: 2px;
        }

        .player-cards {
          display: flex;
          gap: 2px;
          justify-content: center;
          margin-bottom: 5px;
        }

        .player-card {
          /* Sizing is handled by the PlayingCard component */
        }

        .player-bet {
          background: #dc2626;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: bold;
        }

        /* Card styling is now handled by the PlayingCard component */

        .user-controls {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .raise-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .raise-slider {
          width: 150px;
        }

        .game-log {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
          padding: 15px;
          max-height: 200px;
          overflow-y: auto;
        }

        .log-messages {
          max-height: 150px;
          overflow-y: auto;
        }

        .log-message {
          color: #d1d5db;
          font-size: 12px;
          margin-bottom: 2px;
          padding: 2px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-warning {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
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

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}