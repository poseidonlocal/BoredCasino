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

export default function SimplePokerGame({ players: initialPlayers, tableSize, onExit }) {
  const { user, updateUserCash } = useAuth();

  // Game state
  const [gameState, setGameState] = useState('waiting'); // waiting, preflop, flop, turn, river, showdown
  const [players, setPlayers] = useState(initialPlayers || []);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dealerIndex, setDealerIndex] = useState(Math.floor(Math.random() * (initialPlayers?.length || 2)));

  // Cards and deck
  const [deck, setDeck] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(20); // Big blind
  const [minRaise, setMinRaise] = useState(20);

  // UI state
  const [raiseAmount, setRaiseAmount] = useState(60);
  const [gameLog, setGameLog] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [handInProgress, setHandInProgress] = useState(false);
  const [botActionInProgress, setBotActionInProgress] = useState(false);
  const [handNumber, setHandNumber] = useState(1);

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
  const startNewHand = () => {
    const newDeck = createDeck();

    if (players.length < 2) {
      addToLog('Not enough players to start a new hand');
      return;
    }

    setHandInProgress(true);

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
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;
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

    addToLog(`Hand #${handNumber} started. Blinds: ${resetPlayers[smallBlindIndex].name} (${smallBlind}), ${resetPlayers[bigBlindIndex].name} (${bigBlind})`);

    // Deal hole cards
    dealHoleCards(newDeck, resetPlayers);
  };

  // Deal hole cards to all players
  const dealHoleCards = (currentDeck, currentPlayers) => {
    const newDeck = [...currentDeck];
    const updatedPlayers = currentPlayers.map(player => {
      if (!player.isFolded) {
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

  // Simple hand evaluation
  const evaluateHand = (holeCards, community) => {
    // For simplicity, just return a random hand strength
    // In a real implementation, you would evaluate the actual hand
    const handRank = Math.floor(Math.random() * 10) + 1;
    return {
      hand: Object.keys(HAND_RANKINGS).find(key => HAND_RANKINGS[key] === handRank) || 'High Card',
      ranking: handRank
    };
  };

  // Simple bot decision making
  const makeBotDecision = (player, betToCall = currentBet) => {
    const randomAction = Math.random();
    const callAmount = betToCall - player.bet;

    // If player has already matched the current bet, they can check
    if (callAmount <= 0) {
      // No bet to call - check or bet
      if (randomAction < 0.6) {
        return { decision: 'check' };
      } else if (randomAction < 0.9) {
        const betAmount = Math.min(20 + Math.floor(Math.random() * 80), player.chips);
        return { decision: 'raise', amount: betAmount };
      } else {
        return { decision: 'all-in' };
      }
    } else {
      // There's a bet to call
      if (callAmount >= player.chips) {
        // Can only call all-in or fold
        if (randomAction < 0.4) {
          return { decision: 'fold' };
        } else {
          return { decision: 'all-in' };
        }
      } else {
        // Can fold, call, or raise
        if (randomAction < 0.25) {
          return { decision: 'fold' };
        } else if (randomAction < 0.7) {
          return { decision: 'call' };
        } else if (randomAction < 0.95) {
          const minRaiseAmount = callAmount + Math.max(20, betToCall - player.bet);
          const maxRaiseAmount = Math.min(player.chips, callAmount + betToCall);
          const raiseAmount = Math.min(
            minRaiseAmount + Math.floor(Math.random() * (maxRaiseAmount - minRaiseAmount + 1)),
            player.chips
          );
          return { decision: 'raise', amount: raiseAmount };
        } else {
          return { decision: 'all-in' };
        }
      }
    }
  };

  // Handle bot actions without nested state updates
  const makeBotAction = (botId) => {
    if (botActionInProgress) {
      return; // Prevent multiple simultaneous bot actions
    }

    const botPlayer = players.find(p => p.id === botId);
    if (!botPlayer || botPlayer.isFolded || botPlayer.isAllIn) {
      return;
    }

    setBotActionInProgress(true);

    // Improved bot decision logic
    const callAmount = currentBet - botPlayer.bet;
    const random = Math.random();
    let decision, amount;

    if (callAmount === 0) {
      // No bet to call - check or bet
      if (random < 0.7) {
        decision = 'check';
      } else {
        decision = 'raise';
        amount = Math.min(20 + Math.floor(random * 60), botPlayer.chips);
      }
    } else {
      // There's a bet to call
      if (callAmount >= botPlayer.chips) {
        // All-in or fold decision
        decision = random < 0.4 ? 'fold' : 'all-in';
      } else {
        // Normal betting decision
        if (random < 0.25) {
          decision = 'fold';
        } else if (random < 0.75) {
          decision = 'call';
        } else {
          decision = 'raise';
          amount = Math.min(currentBet + 20 + Math.floor(random * 40), botPlayer.chips);
        }
      }
    }

    processAction(botId, decision, amount);

    // Reset the flag after a short delay
    setTimeout(() => {
      setBotActionInProgress(false);
    }, 300);
  };

  // Process player action with improved money handling
  const processAction = (playerId, action, amount = 0) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = [...prevPlayers];
      const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return prevPlayers;

      const player = updatedPlayers[playerIndex];

      switch (action) {
        case 'fold':
          player.isFolded = true;
          player.action = 'Folded';
          addToLog(`${player.name} folds`);
          break;

        case 'call':
          const callAmount = Math.min(currentBet - player.bet, player.chips);
          if (callAmount > 0) {
            player.chips -= callAmount;
            player.bet = currentBet;
            player.totalBet += callAmount;
            player.action = `Called ${callAmount}`;
            setPot(prev => prev + callAmount);
            addToLog(`${player.name} calls ${callAmount}`);
          } else {
            player.action = 'Checked';
            addToLog(`${player.name} checks`);
          }
          break;

        case 'raise':
          const callPortion = Math.max(0, currentBet - player.bet);
          const totalRaiseAmount = Math.min(amount, player.chips);
          const actualRaiseAmount = totalRaiseAmount - callPortion;

          if (totalRaiseAmount > 0) {
            player.chips -= totalRaiseAmount;
            player.bet = currentBet + actualRaiseAmount;
            player.totalBet += totalRaiseAmount;
            player.action = `Raised to ${player.bet}`;

            setCurrentBet(player.bet);
            setMinRaise(Math.max(actualRaiseAmount, 20));
            setPot(prev => prev + totalRaiseAmount);
            addToLog(`${player.name} raises to ${player.bet}`);
          }
          break;

        case 'all-in':
          const allInAmount = player.chips;
          if (allInAmount > 0) {
            player.chips = 0;
            player.bet += allInAmount;
            player.totalBet += allInAmount;
            player.isAllIn = true;
            player.action = `All-in ${allInAmount}`;

            if (player.bet > currentBet) {
              setCurrentBet(player.bet);
              setMinRaise(Math.max(player.bet - currentBet, 20));
            }
            setPot(prev => prev + allInAmount);
            addToLog(`${player.name} goes all-in with ${allInAmount}`);
          }
          break;

        case 'check':
          player.action = 'Checked';
          addToLog(`${player.name} checks`);
          break;
      }

      return updatedPlayers;
    });

    // Move to next player after a short delay
    setTimeout(() => {
      moveToNextPlayer();
    }, 300);
  };

  // Move to next active player with improved betting logic
  const moveToNextPlayer = () => {
    const activePlayers = players.filter(p => !p.isFolded && !p.isAllIn);

    // Check if only one player left
    if (activePlayers.length <= 1) {
      setTimeout(() => moveToNextPhase(), 500);
      return;
    }

    // Check if betting round is complete
    const maxBet = Math.max(...players.map(p => p.bet));
    const playersNeedingAction = activePlayers.filter(p => p.bet < maxBet);

    if (playersNeedingAction.length === 0) {
      // All active players have matched the highest bet
      setTimeout(() => moveToNextPhase(), 500);
      return;
    }

    // Find next player who needs to act
    let nextIndex = (currentPlayerIndex + 1) % players.length;
    let attempts = 0;

    while (attempts < players.length) {
      const nextPlayer = players[nextIndex];
      if (!nextPlayer.isFolded && !nextPlayer.isAllIn && nextPlayer.bet < maxBet) {
        setCurrentPlayerIndex(nextIndex);
        
        // Force bot action if bot gets stuck
        if (nextPlayer.isBot) {
          setTimeout(() => {
            if (currentPlayerIndex === nextIndex && !botActionInProgress) {
              console.log('Forcing bot action for stuck bot:', nextPlayer.name);
              makeBotAction(nextPlayer.id);
            }
          }, 3000); // 3 second timeout for stuck bots
        }
        return;
      }
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
    }

    // If we get here, betting round should be complete
    setTimeout(() => moveToNextPhase(), 500);
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
  };

  const dealTurn = () => {
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
  };

  const dealRiver = () => {
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

    // Process winners
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
      // Move dealer button and increment hand number
      setDealerIndex((dealerIndex + 1) % players.length);
      setHandNumber(prev => prev + 1);
      setHandInProgress(false);
    }, 3000);
  };

  // Add message to game log
  const addToLog = (message) => {
    setGameLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize game
  useEffect(() => {
    if (players.length >= 2 && !handInProgress) {
      setTimeout(startNewHand, 1000);
    }
  }, [players, handInProgress]);

  // Update raise amount when current bet changes
  useEffect(() => {
    const userPlayer = players.find(p => p.id === 'user');
    if (userPlayer) {
      const minRaiseAmount = Math.max(currentBet + minRaise, (userPlayer.bet || 0) + 20);
      const suggestedRaise = Math.min(minRaiseAmount + 40, userPlayer.chips);
      setRaiseAmount(suggestedRaise);
    }
  }, [currentBet, minRaise, players]);

  // Handle bot actions when it's their turn
  useEffect(() => {
    if (!handInProgress || gameState === 'showdown' || botActionInProgress) return;

    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer && currentPlayer.isBot && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
      const timer = setTimeout(() => {
        makeBotAction(currentPlayer.id);
      }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay

      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, players, handInProgress, gameState, botActionInProgress]);

  const currentPlayer = players[currentPlayerIndex];
  const isUserTurn = currentPlayer && currentPlayer.id === 'user';
  const userPlayer = players.find(p => p.id === 'user');

  return (
    <div className="poker-game poker-font">
      {/* Game Info */}
      <div className="howl-game-info mb-4 p-6 rounded-xl poker-font">
        <div className="flex justify-between items-center">
          <div className="game-status flex space-x-6">
            <div>
              <span className="text-gray-400 poker-caption">Hand #{handNumber}</span>
              <div className="text-white poker-font-semibold">{gameState.charAt(0).toUpperCase() + gameState.slice(1)}</div>
            </div>
            <div>
              <span className="text-gray-400 poker-caption">Pot</span>
              <div className="text-white poker-numbers">{pot} <span className="text-blue-400">MSP</span></div>
            </div>
            <div>
              <span className="text-gray-400 poker-caption">Current Bet</span>
              <div className="text-white poker-numbers">{currentBet} <span className="text-blue-400">MSP</span></div>
            </div>
          </div>

          {!handInProgress && (
            <button
              onClick={startNewHand}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded poker-button"
            >
              Deal New Hand
            </button>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-area mb-6">
        <div className="howl-poker-table rounded-full p-8 relative mx-auto" style={{ width: '800px', height: '500px' }}>
          {/* Community Cards */}
          <div className="community-cards absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="mb-4 bg-black/50 px-4 py-2 rounded-full inline-block">
              <span className="text-white poker-numbers">Pot: {pot} MSP</span>
            </div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const card = communityCards[index];
                return (
                  <div key={index} className="card-placeholder">
                    {card ? (
                      <PlayingCard card={card} size="normal" />
                    ) : (
                      <div className="card-placeholder-inner"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Players */}
          <div className="players-container relative w-full h-full">
            {players.map((player, index) => {
              // Calculate position around the table
              const angle = (360 / players.length) * index - 90; // Start from top
              const radius = 40;
              const x = 50 + radius * Math.cos(angle * Math.PI / 180);
              const y = 50 + radius * Math.sin(angle * Math.PI / 180);

              const isCurrentPlayer = index === currentPlayerIndex;
              const isUser = player.id === 'user';

              return (
                <div
                  key={player.id}
                  className={`player-seat ${isCurrentPlayer ? 'current-player' : ''} ${player.isFolded ? 'folded' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="player-info bg-black/70 p-3 rounded-lg poker-font">
                    <div className="flex items-center space-x-2">
                      <div className="player-avatar text-2xl">
                        {player.avatar}
                      </div>
                      <div>
                        <div className="text-white poker-font-semibold text-sm">{player.name}</div>
                        <div className="text-green-400 poker-numbers text-sm">{player.chips} MSP</div>
                        {player.action && (
                          <div className="text-yellow-400 poker-caption text-xs">{player.action}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="player-cards mt-2 flex justify-center">
                    {player.cards && player.cards.map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="transform"
                        style={{
                          marginLeft: cardIndex > 0 ? '-10px' : '0',
                          zIndex: cardIndex
                        }}
                      >
                        <PlayingCard
                          card={card}
                          isHidden={!isUser && !showCards && !player.isFolded}
                          size="small"
                        />
                      </div>
                    ))}
                  </div>

                  {player.totalBet > 0 && (
                    <div className="player-bet absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-2">
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full poker-numbers">
                        {player.totalBet} MSP
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Controls */}
        {gameState !== 'showdown' && userPlayer && (
          <div className={`howl-user-controls p-6 rounded-xl ${!isUserTurn || userPlayer.isFolded ? 'opacity-50' : ''}`}>
            <div className="mb-3">
              <div className="text-center">
                <span className={`poker-caption ${userPlayer.isFolded
                    ? 'text-red-400'
                    : isUserTurn
                      ? 'text-green-400'
                      : 'text-gray-400'
                  }`}>
                  {userPlayer.isFolded
                    ? 'You have folded'
                    : isUserTurn
                      ? 'Your Turn'
                      : `Waiting for ${currentPlayer?.name || 'other players'}`
                  }
                </span>
              </div>
            </div>

            {/* Howl.gg Style Round Action Buttons */}
            <div className="action-buttons grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => processAction('user', 'fold')}
                className={`howl-button fold-button ${isUserTurn && !userPlayer.isFolded
                    ? 'active'
                    : 'disabled'
                  }`}
                disabled={!isUserTurn || userPlayer.isFolded}
              >
                <div className="button-content">
                  <span className="button-icon">❌</span>
                  <span className="button-text">Fold</span>
                </div>
              </button>

              {currentBet === 0 || currentBet === userPlayer?.bet ? (
                <button
                  onClick={() => processAction('user', 'check')}
                  className={`howl-button check-button ${isUserTurn && !userPlayer.isFolded
                      ? 'active'
                      : 'disabled'
                    }`}
                  disabled={!isUserTurn || userPlayer.isFolded}
                >
                  <div className="button-content">
                    <span className="button-icon">✓</span>
                    <span className="button-text">Check</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => processAction('user', 'call')}
                  className={`howl-button call-button ${isUserTurn && !userPlayer.isFolded && userPlayer.chips >= (currentBet - userPlayer.bet)
                      ? 'active'
                      : 'disabled'
                    }`}
                  disabled={!isUserTurn || userPlayer.isFolded || userPlayer.chips < (currentBet - userPlayer.bet)}
                >
                  <div className="button-content">
                    <span className="button-icon">📞</span>
                    <span className="button-text">Call</span>
                    <span className="button-amount">{Math.min(currentBet - (userPlayer?.bet || 0), userPlayer?.chips || 0)}</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => processAction('user', 'raise', raiseAmount)}
                className={`howl-button raise-button ${isUserTurn && !userPlayer.isFolded && userPlayer.chips > (currentBet - userPlayer.bet)
                    ? 'active'
                    : 'disabled'
                  }`}
                disabled={!isUserTurn || userPlayer.isFolded || userPlayer.chips <= (currentBet - userPlayer.bet)}
              >
                <div className="button-content">
                  <span className="button-icon">📈</span>
                  <span className="button-text">Raise</span>
                  <span className="button-amount">{raiseAmount}</span>
                </div>
              </button>

              <button
                onClick={() => processAction('user', 'all-in')}
                className={`howl-button allin-button ${isUserTurn && !userPlayer.isFolded && userPlayer.chips > 0
                    ? 'active'
                    : 'disabled'
                  }`}
                disabled={!isUserTurn || userPlayer.isFolded || userPlayer.chips === 0}
              >
                <div className="button-content">
                  <span className="button-icon">🚀</span>
                  <span className="button-text">All-in</span>
                  <span className="button-amount">{userPlayer?.chips}</span>
                </div>
              </button>
            </div>

            {/* Enhanced Raise Controls */}
            <div className="raise-controls mt-6">
              <div className="howl-slider-container">
                <label className="howl-label">Raise Amount</label>
                <div className="slider-wrapper">
                  <input
                    type="range"
                    min={Math.max(currentBet + minRaise, (userPlayer?.bet || 0) + 20)}
                    max={userPlayer?.chips || 100}
                    value={Math.min(raiseAmount, userPlayer?.chips || 100)}
                    onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                    className="howl-slider"
                    disabled={!isUserTurn || userPlayer.isFolded || userPlayer.chips <= (currentBet - userPlayer.bet)}
                  />
                  <div className="slider-track"></div>
                </div>
                <div className="slider-labels">
                  <span className="min-label">{Math.max(currentBet + minRaise, (userPlayer?.bet || 0) + 20)}</span>
                  <span className="current-label">{Math.min(raiseAmount, userPlayer?.chips || 100)} MSP</span>
                  <span className="max-label">{userPlayer?.chips || 0}</span>
                </div>
              </div>

              {/* Quick Bet Buttons */}
              <div className="quick-bet-buttons mt-4">
                <button
                  onClick={() => setRaiseAmount(Math.min(Math.floor(pot * 0.5), userPlayer?.chips || 0))}
                  className="howl-quick-bet"
                  disabled={!isUserTurn || userPlayer?.isFolded}
                >
                  1/2 Pot
                </button>
                <button
                  onClick={() => setRaiseAmount(Math.min(pot, userPlayer?.chips || 0))}
                  className="howl-quick-bet"
                  disabled={!isUserTurn || userPlayer?.isFolded}
                >
                  Pot
                </button>
                <button
                  onClick={() => setRaiseAmount(Math.min(pot * 2, userPlayer?.chips || 0))}
                  className="howl-quick-bet"
                  disabled={!isUserTurn || userPlayer?.isFolded}
                >
                  2x Pot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Log */}
        <div className="game-log bg-gray-800 p-4 rounded-lg poker-font">
          <h4 className="text-white poker-font-semibold mb-2">Game Log</h4>
          <div className="log-messages h-40 overflow-y-auto">
            {gameLog.map((message, index) => (
              <div key={index} className="log-message text-gray-300 text-sm py-1 border-b border-gray-700 poker-body">
                {message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Howl.gg Theme Styles */
        .card-placeholder {
          width: 4rem;
          height: 5.5rem;
          position: relative;
        }
        
        .card-placeholder-inner {
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.05);
        }
        
        .current-player {
          z-index: 10;
        }
        
        .current-player .player-info {
          box-shadow: 0 0 0 3px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.4);
          animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 3px #8b5cf6, 0 0 20px rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 3px #a855f7, 0 0 30px rgba(168, 85, 247, 0.6); }
        }
        
        .folded {
          opacity: 0.4;
          filter: grayscale(100%);
        }
        
        /* Howl.gg Poker Table */
        .howl-poker-table {
          background: radial-gradient(ellipse at center, #1f2937 0%, #111827 70%, #0f172a 100%);
          border: 3px solid #374151;
          box-shadow: 
            inset 0 0 50px rgba(139, 92, 246, 0.1),
            0 0 50px rgba(0, 0, 0, 0.5);
        }
        
        /* Howl.gg Round Buttons */
        .howl-button {
          position: relative;
          width: 100%;
          height: 80px;
          border-radius: 50px;
          border: 2px solid transparent;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .howl-button.active {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }
        
        .howl-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          border-color: #374151;
        }
        
        .howl-button:hover.active {
          transform: translateY(-2px);
          box-shadow: 0 5px 25px rgba(139, 92, 246, 0.4);
        }
        
        .button-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 4px;
        }
        
        .button-icon {
          font-size: 20px;
          margin-bottom: 2px;
        }
        
        .button-text {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .button-amount {
          font-size: 10px;
          opacity: 0.8;
          font-family: 'JetBrains Mono', monospace;
        }
        
        /* Specific Button Colors */
        .fold-button.active {
          border-color: #ef4444;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        
        .fold-button:hover.active {
          box-shadow: 0 5px 25px rgba(239, 68, 68, 0.4);
        }
        
        .check-button.active {
          border-color: #10b981;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
        
        .check-button:hover.active {
          box-shadow: 0 5px 25px rgba(16, 185, 129, 0.4);
        }
        
        .call-button.active {
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        
        .call-button:hover.active {
          box-shadow: 0 5px 25px rgba(59, 130, 246, 0.4);
        }
        
        .raise-button.active {
          border-color: #f59e0b;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
        
        .raise-button:hover.active {
          box-shadow: 0 5px 25px rgba(245, 158, 11, 0.4);
        }
        
        .allin-button.active {
          border-color: #8b5cf6;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }
        
        .allin-button:hover.active {
          box-shadow: 0 5px 25px rgba(139, 92, 246, 0.4);
        }
        
        /* Howl.gg Slider Styles */
        .howl-slider-container {
          background: rgba(31, 41, 55, 0.8);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #374151;
        }
        
        .howl-label {
          display: block;
          color: #d1d5db;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .slider-wrapper {
          position: relative;
          margin-bottom: 12px;
        }
        
        .howl-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #374151;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        
        .howl-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          cursor: pointer;
          border: 2px solid #1f2937;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
        }
        
        .howl-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.5);
        }
        
        .slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9ca3af;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .current-label {
          color: #8b5cf6;
          font-weight: 600;
        }
        
        /* Quick Bet Buttons */
        .quick-bet-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        
        .howl-quick-bet {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #374151;
          background: rgba(31, 41, 55, 0.8);
          color: #d1d5db;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .howl-quick-bet:hover:not(:disabled) {
          border-color: #8b5cf6;
          color: #8b5cf6;
          transform: translateY(-1px);
        }
        
        .howl-quick-bet:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Howl.gg Game Info */
        .howl-game-info {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border: 1px solid #374151;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        /* Howl.gg User Controls */
        .howl-user-controls {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border: 1px solid #374151;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}