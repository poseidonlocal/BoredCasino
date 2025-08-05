import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PlayingCard from './ui/PlayingCard';

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Hand rankings
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

const PAYOUTS = {
  'Royal Flush': 100,
  'Straight Flush': 50,
  'Four of a Kind': 20,
  'Full House': 7,
  'Flush': 5,
  'Straight': 4,
  'Three of a Kind': 3,
  'Two Pair': 2,
  'One Pair': 1,
  'High Card': 1
};

export default function TexasHoldem() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState('betting'); // betting, dealing, flop, turn, river, showdown, gameOver
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [deck, setDeck] = useState([]);
  const [currentBet, setCurrentBet] = useState(10);
  const [pot, setPot] = useState(0);
  const [playerBest, setPlayerBest] = useState({ hand: '', cards: [] });
  const [dealerBest, setDealerBest] = useState({ hand: '', cards: [] });
  const [winner, setWinner] = useState('');
  const [winAmount, setWinAmount] = useState(0);
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

  // Start new game
  const startNewGame = () => {
    const newDeck = createDeck();
    setDeck(newDeck);
    setPlayerHand([]);
    setDealerHand([]);
    setCommunityCards([]);
    setGameState('betting');
    setPot(0);
    setPlayerBest({ hand: '', cards: [] });
    setDealerBest({ hand: '', cards: [] });
    setWinner('');
    setWinAmount(0);
    setIsAnimating(false);
  };

  // Deal initial cards
  const dealCards = () => {
    if (currentBet <= 0) return;
    
    setIsAnimating(true);
    const newDeck = [...deck];
    
    // Deal 2 cards to player and dealer
    const playerCards = [newDeck.pop(), newDeck.pop()];
    const dealerCards = [newDeck.pop(), newDeck.pop()];
    
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setDeck(newDeck);
    setPot(currentBet * 2); // Player bet + dealer ante
    setGameState('dealing');
    
    setTimeout(() => {
      setGameState('flop');
      setIsAnimating(false);
    }, 1000);
  };

  // Deal flop (3 community cards)
  const dealFlop = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const flop = [newDeck.pop(), newDeck.pop(), newDeck.pop()];
    
    setCommunityCards(flop);
    setDeck(newDeck);
    setGameState('turn');
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Deal turn (4th community card)
  const dealTurn = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const turnCard = newDeck.pop();
    
    setCommunityCards(prev => [...prev, turnCard]);
    setDeck(newDeck);
    setGameState('river');
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Deal river (5th community card)
  const dealRiver = () => {
    setIsAnimating(true);
    const newDeck = [...deck];
    newDeck.pop(); // Burn card
    const riverCard = newDeck.pop();
    
    setCommunityCards(prev => [...prev, riverCard]);
    setDeck(newDeck);
    setGameState('showdown');
    
    setTimeout(() => {
      setIsAnimating(false);
      showdown();
    }, 500);
  };

  // Evaluate best hand
  const evaluateHand = (holeCards, community) => {
    const allCards = [...holeCards, ...community];
    let bestHand = { hand: 'High Card', cards: [], ranking: 1 };
    
    // Generate all possible 5-card combinations
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
    
    // Royal Flush
    if (isFlush && isStraight && values[0] === 14) {
      return { hand: 'Royal Flush', cards: sortedCards, ranking: 10 };
    }
    
    // Straight Flush
    if (isFlush && isStraight) {
      return { hand: 'Straight Flush', cards: sortedCards, ranking: 9 };
    }
    
    // Four of a Kind
    if (valueCounts.some(count => count === 4)) {
      return { hand: 'Four of a Kind', cards: sortedCards, ranking: 8 };
    }
    
    // Full House
    if (valueCounts.includes(3) && valueCounts.includes(2)) {
      return { hand: 'Full House', cards: sortedCards, ranking: 7 };
    }
    
    // Flush
    if (isFlush) {
      return { hand: 'Flush', cards: sortedCards, ranking: 6 };
    }
    
    // Straight
    if (isStraight) {
      return { hand: 'Straight', cards: sortedCards, ranking: 5 };
    }
    
    // Three of a Kind
    if (valueCounts.includes(3)) {
      return { hand: 'Three of a Kind', cards: sortedCards, ranking: 4 };
    }
    
    // Two Pair
    if (valueCounts.filter(count => count === 2).length === 2) {
      return { hand: 'Two Pair', cards: sortedCards, ranking: 3 };
    }
    
    // One Pair
    if (valueCounts.includes(2)) {
      return { hand: 'One Pair', cards: sortedCards, ranking: 2 };
    }
    
    // High Card
    return { hand: 'High Card', cards: sortedCards, ranking: 1 };
  };

  const checkStraight = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] !== 1) {
        // Check for A-2-3-4-5 straight
        if (sorted[0] === 2 && sorted[4] === 14) {
          return true;
        }
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

  // Showdown
  const showdown = () => {
    const playerBestHand = evaluateHand(playerHand, communityCards);
    const dealerBestHand = evaluateHand(dealerHand, communityCards);
    
    setPlayerBest(playerBestHand);
    setDealerBest(dealerBestHand);
    
    let gameWinner = '';
    let payout = 0;
    
    if (playerBestHand.ranking > dealerBestHand.ranking) {
      gameWinner = 'player';
      payout = currentBet * (PAYOUTS[playerBestHand.hand] || 1);
    } else if (dealerBestHand.ranking > playerBestHand.ranking) {
      gameWinner = 'dealer';
      payout = 0;
    } else {
      // Tie - return bet
      gameWinner = 'tie';
      payout = currentBet;
    }
    
    setWinner(gameWinner);
    setWinAmount(payout);
    setGameState('gameOver');
  };

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const renderCard = (card, isHidden = false, className = '') => {
    if (!card) return null;
    return (
      <PlayingCard 
        card={card} 
        isHidden={isHidden} 
        className={className} 
        size="normal"
      />
    );
  };

  const canProceed = () => {
    return !isAnimating && gameState !== 'betting' && gameState !== 'gameOver';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Game Board */}
      <div className="glow-card mb-8">
        {/* Dealer Section */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Dealer</h3>
          <div className="flex justify-center space-x-2 mb-4">
            {dealerHand.map((card, index) => 
              renderCard(card, gameState !== 'gameOver', 'animate-slide-down')
            )}
          </div>
          {dealerBest.hand && (
            <div className="text-sm text-dark-300">
              Best Hand: <span className="text-accent-400 font-semibold">{dealerBest.hand}</span>
            </div>
          )}
        </div>

        {/* Community Cards */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Community Cards</h3>
          <div className="flex justify-center space-x-2 min-h-[120px] items-center">
            {Array.from({ length: 5 }, (_, index) => {
              const card = communityCards[index];
              return (
                <div key={index} className="poker-card-placeholder">
                  {card && renderCard(card, false, 'animate-slide-up')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Section */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Your Hand</h3>
          <div className="flex justify-center space-x-2 mb-4">
            {playerHand.map((card, index) => 
              renderCard(card, false, 'animate-slide-up')
            )}
          </div>
          {playerBest.hand && (
            <div className="text-sm text-dark-300">
              Best Hand: <span className="text-primary-400 font-semibold">{playerBest.hand}</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Betting Controls */}
        <div className="modern-card">
          <h3 className="text-xl font-bold text-white mb-4">Betting</h3>
          
          {gameState === 'betting' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bet Amount: {currentBet} MSP
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={currentBet}
                  onChange={(e) => setCurrentBet(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-dark-400 mt-1">
                  <span>10 MSP</span>
                  <span>500 MSP</span>
                </div>
              </div>
              
              <button
                onClick={dealCards}
                className="btn-success w-full py-3"
                disabled={currentBet <= 0}
              >
                Deal Cards ({currentBet} MSP)
              </button>
            </div>
          )}

          {gameState === 'flop' && (
            <button onClick={dealFlop} className="btn-primary w-full py-3" disabled={!canProceed()}>
              Deal Flop
            </button>
          )}

          {gameState === 'turn' && (
            <button onClick={dealTurn} className="btn-primary w-full py-3" disabled={!canProceed()}>
              Deal Turn
            </button>
          )}

          {gameState === 'river' && (
            <button onClick={dealRiver} className="btn-primary w-full py-3" disabled={!canProceed()}>
              Deal River
            </button>
          )}

          {gameState === 'gameOver' && (
            <button onClick={startNewGame} className="btn-accent w-full py-3">
              New Game
            </button>
          )}
        </div>

        {/* Game Info */}
        <div className="modern-card">
          <h3 className="text-xl font-bold text-white mb-4">Game Info</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-300">Pot:</span>
              <span className="text-warning-400 font-bold">{pot} MSP</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-dark-300">Your Bet:</span>
              <span className="text-white">{currentBet} MSP</span>
            </div>

            {winner && (
              <div className="border-t border-dark-600 pt-3 mt-4">
                <div className="text-center">
                  {winner === 'player' && (
                    <div>
                      <div className="text-success-400 font-bold text-lg mb-2">You Win!</div>
                      <div className="text-white">Won: {winAmount} MSP</div>
                    </div>
                  )}
                  {winner === 'dealer' && (
                    <div>
                      <div className="text-danger-400 font-bold text-lg mb-2">Dealer Wins</div>
                      <div className="text-white">Lost: {currentBet} MSP</div>
                    </div>
                  )}
                  {winner === 'tie' && (
                    <div>
                      <div className="text-warning-400 font-bold text-lg mb-2">It's a Tie!</div>
                      <div className="text-white">Bet Returned: {currentBet} MSP</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .poker-card-placeholder {
          width: 4rem;
          height: 5.5rem;
          border: 2px dashed #374151;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(55, 65, 81, 0.1);
        }
        
        /* Animation classes */
        .animate-slide-down {
          animation: slideDown 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
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
}