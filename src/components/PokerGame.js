import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import PokerTable from './ui/PokerTable';
import PlayerSeat from './ui/PlayerSeat';
import CommunityCards from './ui/CommunityCards';
import PlayerControls from './ui/PlayerControls';
import GameInfo from './ui/GameInfo';
import GameLog from './ui/GameLog';
import BotProfileCard from './ui/BotProfileCard';
import { 
  evaluateBestHand, 
  calculateWinProbability,
  calculatePotOdds,
  isCallProfitable
} from './PokerHandEvaluator';

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function PokerGame({ players: initialPlayers, tableSize, onExit }) {
  const { user, updateUserCash } = useAuth();
  
  // Game state
  const [gameState, setGameState] = useState('waiting'); // waiting, preflop, flop, turn, river, showdown
  const [players, setPlayers] = useState(initialPlayers || []);
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
  const [gameLog, setGameLog] = useState([]);
  const [showCards, setShowCards] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [handInProgress, setHandInProgress] = useState(false);
  const [hoveredBot, setHoveredBot] = useState(null);
  const [botProfileVisibility, setBotProfileVisibility] = useState({});

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
  const startNewHand = useCallback(() => {
    const newDeck = createDeck();
    const activePlayers = players.filter(p => p.chips > 0);
    
    if (activePlayers.length < 2) {
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
    
    // If it's a bot's turn, make decision after delay
    const currentPlayer = updatedPlayers[currentPlayerIndex];
    if (currentPlayer.isBot) {
      setTimeout(() => {
        const { decision, amount } = makeBotDecision(currentPlayer);
        processAction(currentPlayer.id, decision, amount);
      }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
    }
  };

  // Evaluate poker hand using the advanced evaluator
  const evaluateHand = (holeCards, community) => {
    return evaluateBestHand(holeCards, community);
  };

  // Advanced Bot AI decision making
  const makeBotDecision = (player) => {
    const { personality } = player;
    
    // Default personality if not defined
    const botPersonality = personality || { 
      aggression: 0.5, 
      bluffRate: 0.2 
    };
    
    // Calculate hand strength and win probability
    const handEvaluation = player.cards.length === 2 ? 
      evaluateHand(player.cards, communityCards) : { ranking: 0, strength: 0 };
    
    const handStrength = handEvaluation.ranking;
    const winProbability = calculateWinProbability(
      player.cards, 
      communityCards, 
      players.filter(p => !p.isFolded).length
    );
    
    // Calculate pot odds
    const potOdds = calculatePotOdds(currentBet - player.bet, pot);
    const isProfit = isCallProfitable(winProbability, potOdds);
    
    // Random factor for unpredictability
    const random = Math.random();
    
    // Game stage affects strategy
    const gameStageMultiplier = {
      'preflop': 0.8,  // More cautious preflop
      'flop': 1.0,     // Standard on flop
      'turn': 1.2,     // More aggressive on turn
      'river': 1.5     // Most aggressive on river
    }[gameState] || 1.0;
    
    // Calculate decision based on personality, hand strength, and game stage
    let decision = 'fold';
    let amount = 0;
    
    // Adjust thresholds based on personality and game stage
    const foldThreshold = botPersonality.aggression * 0.3 * gameStageMultiplier;
    const callThreshold = botPersonality.aggression * 0.5 * gameStageMultiplier;
    const raiseThreshold = botPersonality.aggression * 0.7 * gameStageMultiplier;
    const bluffChance = botPersonality.bluffRate * gameStageMultiplier;
    
    // Decision logic
    if (currentBet === 0 || currentBet === player.bet) {
      // No bet to call - check or bet
      if (handStrength >= 4 || winProbability > 0.6 || random < raiseThreshold) {
        // Strong hand - bet/raise
        decision = 'raise';
        const betSize = Math.floor((0.5 + botPersonality.aggression * 0.5) * pot);
        amount = Math.min(betSize, player.chips);
      } else {
        // Weak hand - check
        decision = 'check';
      }
    } else {
      // There's a bet to call
      const callAmount = currentBet - player.bet;
      
      if (random < bluffChance && player.chips > callAmount * 3) {
        // Bluff
        decision = 'raise';
        const raiseSize = callAmount * (2 + Math.floor(random * 3));
        amount = Math.min(raiseSize, player.chips);
      } 
      else if (handStrength >= 7 || winProbability > 0.8) {
        // Very strong hand - raise big
        decision = 'raise';
        const raiseSize = callAmount * (3 + Math.floor(botPersonality.aggression * 3));
        amount = Math.min(raiseSize, player.chips);
      }
      else if (handStrength >= 5 || winProbability > 0.6 || random < raiseThreshold) {
        // Strong hand - raise
        decision = 'raise';
        const raiseSize = callAmount * (2 + Math.floor(botPersonality.aggression * 2));
        amount = Math.min(raiseSize, player.chips);
      }
      else if (isProfit || handStrength >= 2 || random < callThreshold) {
        // Decent hand or profitable call
        decision = 'call';
        amount = Math.min(callAmount, player.chips);
      }
      // Otherwise fold (default)
    }
    
    // Adjust for chip stack
    if (amount >= player.chips * 0.9) {
      decision = 'all-in';
      amount = player.chips;
    }
    
    // Special case: if bot has very few chips left, be more willing to go all-in
    if (player.chips <= currentBet * 3 && handStrength >= 2) {
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
          player.bet = currentBet + (raiseAmount - player.bet);
          player.totalBet += raiseAmount;
          player.action = `Raised to ${player.bet}`;
          setCurrentBet(player.bet);
          setMinRaise(player.bet - currentBet);
          setPot(prev => prev + raiseAmount);
          addToLog(`${player.name} raises to ${player.bet}`);
          break;
          
        case 'all-in':
          const allInAmount = player.chips;
          player.chips = 0;
          player.bet += allInAmount;
          player.totalBet += allInAmount;
          player.isAllIn = true;
          player.action = `All-in (${allInAmount})`;
          if (player.bet > currentBet) {
            setCurrentBet(player.bet);
            setMinRaise(player.bet - currentBet);
          }
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
      if (!nextPlayer.isFolded && !nextPlayer.isAllIn) {
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
    setTimeout(() => {
      setIsAnimating(false);
      
      // If it's a bot's turn, make decision after delay
      const currentPlayer = players[(dealerIndex + 1) % players.length];
      if (currentPlayer && currentPlayer.isBot && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
        setTimeout(() => {
          const { decision, amount } = makeBotDecision(currentPlayer);
          processAction(currentPlayer.id, decision, amount);
        }, 1000 + Math.random() * 2000);
      }
    }, 500);
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
    setTimeout(() => {
      setIsAnimating(false);
      
      // If it's a bot's turn, make decision after delay
      const currentPlayer = players[(dealerIndex + 1) % players.length];
      if (currentPlayer && currentPlayer.isBot && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
        setTimeout(() => {
          const { decision, amount } = makeBotDecision(currentPlayer);
          processAction(currentPlayer.id, decision, amount);
        }, 1000 + Math.random() * 2000);
      }
    }, 500);
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
    setTimeout(() => {
      setIsAnimating(false);
      
      // If it's a bot's turn, make decision after delay
      const currentPlayer = players[(dealerIndex + 1) % players.length];
      if (currentPlayer && currentPlayer.isBot && !currentPlayer.isFolded && !currentPlayer.isAllIn) {
        setTimeout(() => {
          const { decision, amount } = makeBotDecision(currentPlayer);
          processAction(currentPlayer.id, decision, amount);
        }, 1000 + Math.random() * 2000);
      }
    }, 500);
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
    
    // Update bot stats for all bots that participated
    const updateBotStats = async () => {
      const botUpdates = players
        .filter(p => p.isBot && p.botId) // Only bots with IDs (from database)
        .map(bot => {
          const isWinner = winners.some(w => w.id === bot.id);
          const botWinAmount = isWinner ? winAmount : -bot.totalBet;
          
          return fetch('/api/bots/profiles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              botId: bot.botId,
              handWon: isWinner,
              winAmount: botWinAmount
            })
          }).catch(err => console.error(`Error updating bot ${bot.name}:`, err));
        });
      
      await Promise.all(botUpdates);
    };
    
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
    
    // Update bot stats in the background
    updateBotStats();
    
    setTimeout(() => {
      // Move dealer button and blinds
      setDealerIndex((dealerIndex + 1) % players.length);
      setSmallBlindIndex((smallBlindIndex + 1) % players.length);
      setBigBlindIndex((bigBlindIndex + 1) % players.length);
      setHandInProgress(false);
    }, 5000);
  };

  // Add message to game log
  const addToLog = (message) => {
    setGameLog(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize game
  useEffect(() => {
    if (players.length >= 2 && !handInProgress) {
      setTimeout(startNewHand, 1000);
    }
  }, [players, handInProgress, startNewHand]);

  // Get player position based on table size and index
  const getPlayerPosition = (index, totalPlayers) => {
    // Calculate position around the table based on total players
    const angle = (360 / totalPlayers) * index - 90; // Start from top
    const radius = totalPlayers <= 6 ? 40 : 45; // Adjust radius based on table size
    
    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
    const y = 50 + radius * Math.sin(angle * Math.PI / 180);
    
    return { x, y };
  };

  const currentPlayer = players[currentPlayerIndex];
  const isUserTurn = currentPlayer && currentPlayer.id === 'user';
  const userPlayer = players.find(p => p.id === 'user');

  // Calculate user's hand strength and win probability
  const userHandStrength = userPlayer?.cards?.length === 2 ? 
    evaluateHand(userPlayer.cards, communityCards) : null;
  
  const userWinProbability = userPlayer?.cards?.length === 2 ? 
    calculateWinProbability(
      userPlayer.cards, 
      communityCards, 
      players.filter(p => !p.isFolded).length
    ) : 0;

  return (
    <div className="poker-game">
      {/* Game Info */}
      <GameInfo 
        gameState={gameState}
        pot={pot}
        currentBet={currentBet}
        handInProgress={handInProgress}
        onNewHand={startNewHand}
      />
      
      {/* Main Game Area */}
      <div className="game-area mb-6">
        <PokerTable tableSize={tableSize}>
          {/* Community Cards */}
          <CommunityCards 
            cards={communityCards}
            pot={pot}
            gameState={gameState}
          />
          
          {/* Players */}
          {players.map((player, index) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isCurrentPlayer={index === currentPlayerIndex}
              isDealer={index === dealerIndex}
              isSmallBlind={index === smallBlindIndex}
              isBigBlind={index === bigBlindIndex}
              showCards={showCards}
              isUser={player.id === 'user'}
              position={getPlayerPosition(index, players.length)}
              onHover={(bot) => setHoveredBot(bot)}
            />
          ))}
        </PokerTable>
        
        {/* Bot Profile Popup */}
        {hoveredBot && hoveredBot.isBot && (
          <div className="bot-profile-popup">
            <BotProfileCard bot={hoveredBot} />
          </div>
        )}
      </div>
      
      {/* Bottom Controls Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Controls */}
        {isUserTurn && gameState !== 'showdown' && (
          <PlayerControls
            player={userPlayer}
            currentBet={currentBet}
            minRaise={minRaise}
            pot={pot}
            onAction={processAction}
            handStrength={userHandStrength?.ranking || 0}
            winProbability={userWinProbability}
            handDescription={userHandStrength?.description || ''}
          />
        )}
        
        {/* Game Log */}
        <GameLog messages={gameLog} />
      </div>
      
      <style jsx>{`
        .poker-game {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .game-area {
          position: relative;
        }
        
        .bot-profile-popup {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 100;
          width: 250px;
        }
      `}</style>
    </div>
  );
}