// Advanced Poker Utilities
export const HAND_RANKINGS = {
  'High Card': 1,
  'One Pair': 2,
  'Two Pair': 3,
  'Three of a Kind': 4,
  'Straight': 5,
  'Flush': 6,
  'Full House': 7,
  'Four of a Kind': 8,
  'Straight Flush': 9,
  'Royal Flush': 10
};

export const CARD_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Enhanced hand evaluation
export function evaluatePokerHand(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  const cardValues = allCards.map(card => CARD_VALUES[card.rank]).sort((a, b) => b - a);
  const suits = allCards.map(card => card.suit);
  
  // Count occurrences of each value
  const valueCounts = {};
  cardValues.forEach(value => {
    valueCounts[value] = (valueCounts[value] || 0) + 1;
  });
  
  const counts = Object.values(valueCounts).sort((a, b) => b - a);
  const uniqueValues = [...new Set(cardValues)].sort((a, b) => b - a);
  
  // Check for flush
  const flushSuit = suits.find(suit => suits.filter(s => s === suit).length >= 5);
  const isFlush = !!flushSuit;
  
  // Check for straight
  const isStraight = checkStraight(uniqueValues);
  const isLowStraight = checkLowStraight(uniqueValues); // A-2-3-4-5
  
  // Get flush cards if flush exists
  const flushCards = isFlush ? allCards.filter(card => card.suit === flushSuit) : [];
  const flushValues = flushCards.map(card => CARD_VALUES[card.rank]).sort((a, b) => b - a);
  
  // Check for straight flush
  const isStraightFlush = isFlush && (checkStraight(flushValues) || checkLowStraight(flushValues));
  const isRoyalFlush = isStraightFlush && flushValues.includes(14) && flushValues.includes(13);
  
  // Determine hand ranking and kickers
  if (isRoyalFlush) {
    return {
      hand: 'Royal Flush',
      ranking: HAND_RANKINGS['Royal Flush'],
      kickers: [14],
      strength: 10.0
    };
  } else if (isStraightFlush) {
    const highCard = isLowStraight ? 5 : Math.max(...flushValues);
    return {
      hand: 'Straight Flush',
      ranking: HAND_RANKINGS['Straight Flush'],
      kickers: [highCard],
      strength: 9.0 + (highCard / 100)
    };
  } else if (counts[0] === 4) {
    const fourKind = Object.keys(valueCounts).find(key => valueCounts[key] === 4);
    const kicker = Object.keys(valueCounts).find(key => valueCounts[key] === 1);
    return {
      hand: 'Four of a Kind',
      ranking: HAND_RANKINGS['Four of a Kind'],
      kickers: [parseInt(fourKind), parseInt(kicker)],
      strength: 8.0 + (parseInt(fourKind) / 100)
    };
  } else if (counts[0] === 3 && counts[1] === 2) {
    const threeKind = Object.keys(valueCounts).find(key => valueCounts[key] === 3);
    const pair = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
    return {
      hand: 'Full House',
      ranking: HAND_RANKINGS['Full House'],
      kickers: [parseInt(threeKind), parseInt(pair)],
      strength: 7.0 + (parseInt(threeKind) / 100)
    };
  } else if (isFlush) {
    return {
      hand: 'Flush',
      ranking: HAND_RANKINGS['Flush'],
      kickers: flushValues.slice(0, 5),
      strength: 6.0 + (flushValues[0] / 100)
    };
  } else if (isStraight || isLowStraight) {
    const highCard = isLowStraight ? 5 : uniqueValues[0];
    return {
      hand: 'Straight',
      ranking: HAND_RANKINGS['Straight'],
      kickers: [highCard],
      strength: 5.0 + (highCard / 100)
    };
  } else if (counts[0] === 3) {
    const threeKind = Object.keys(valueCounts).find(key => valueCounts[key] === 3);
    const kickers = Object.keys(valueCounts)
      .filter(key => valueCounts[key] === 1)
      .map(k => parseInt(k))
      .sort((a, b) => b - a)
      .slice(0, 2);
    return {
      hand: 'Three of a Kind',
      ranking: HAND_RANKINGS['Three of a Kind'],
      kickers: [parseInt(threeKind), ...kickers],
      strength: 4.0 + (parseInt(threeKind) / 100)
    };
  } else if (counts[0] === 2 && counts[1] === 2) {
    const pairs = Object.keys(valueCounts)
      .filter(key => valueCounts[key] === 2)
      .map(k => parseInt(k))
      .sort((a, b) => b - a);
    const kicker = Object.keys(valueCounts).find(key => valueCounts[key] === 1);
    return {
      hand: 'Two Pair',
      ranking: HAND_RANKINGS['Two Pair'],
      kickers: [...pairs, parseInt(kicker)],
      strength: 3.0 + (pairs[0] / 100) + (pairs[1] / 1000)
    };
  } else if (counts[0] === 2) {
    const pair = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
    const kickers = Object.keys(valueCounts)
      .filter(key => valueCounts[key] === 1)
      .map(k => parseInt(k))
      .sort((a, b) => b - a)
      .slice(0, 3);
    return {
      hand: 'One Pair',
      ranking: HAND_RANKINGS['One Pair'],
      kickers: [parseInt(pair), ...kickers],
      strength: 2.0 + (parseInt(pair) / 100)
    };
  } else {
    return {
      hand: 'High Card',
      ranking: HAND_RANKINGS['High Card'],
      kickers: uniqueValues.slice(0, 5),
      strength: 1.0 + (uniqueValues[0] / 100)
    };
  }
}

function checkStraight(values) {
  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
      return true;
    }
  }
  return false;
}

function checkLowStraight(values) {
  // Check for A-2-3-4-5 straight (wheel)
  const requiredValues = [14, 5, 4, 3, 2];
  return requiredValues.every(val => values.includes(val));
}

// Advanced bot personalities
export const BOT_PERSONALITIES = {
  TIGHT_AGGRESSIVE: {
    name: 'Tight-Aggressive',
    foldThreshold: 0.3,
    raiseThreshold: 0.7,
    bluffRate: 0.1,
    aggression: 0.8,
    description: 'Plays few hands but plays them aggressively'
  },
  LOOSE_AGGRESSIVE: {
    name: 'Loose-Aggressive',
    foldThreshold: 0.15,
    raiseThreshold: 0.5,
    bluffRate: 0.25,
    aggression: 0.9,
    description: 'Plays many hands very aggressively'
  },
  TIGHT_PASSIVE: {
    name: 'Tight-Passive',
    foldThreshold: 0.4,
    raiseThreshold: 0.8,
    bluffRate: 0.05,
    aggression: 0.3,
    description: 'Plays few hands and rarely raises'
  },
  LOOSE_PASSIVE: {
    name: 'Loose-Passive',
    foldThreshold: 0.2,
    raiseThreshold: 0.7,
    bluffRate: 0.1,
    aggression: 0.4,
    description: 'Plays many hands but rarely raises'
  },
  MANIAC: {
    name: 'Maniac',
    foldThreshold: 0.1,
    raiseThreshold: 0.3,
    bluffRate: 0.4,
    aggression: 1.0,
    description: 'Plays almost every hand very aggressively'
  },
  ROCK: {
    name: 'Rock',
    foldThreshold: 0.5,
    raiseThreshold: 0.9,
    bluffRate: 0.02,
    aggression: 0.2,
    description: 'Extremely tight, only plays premium hands'
  }
};

// Calculate pot odds
export function calculatePotOdds(potSize, betToCall) {
  if (betToCall === 0) return 0;
  return betToCall / (potSize + betToCall);
}

// Calculate hand equity (simplified)
export function calculateHandEquity(playerCards, communityCards, opponents = 1) {
  const handEval = evaluatePokerHand(playerCards, communityCards);
  
  // Simplified equity calculation based on hand strength
  let baseEquity = handEval.strength / 10;
  
  // Adjust for number of opponents
  const opponentAdjustment = Math.pow(0.85, opponents - 1);
  
  return Math.min(baseEquity * opponentAdjustment, 0.95);
}

// Generate realistic bot decision
export function generateBotDecision(player, gameState) {
  const { currentBet, pot, communityCards, minRaise } = gameState;
  const personality = player.personality || BOT_PERSONALITIES.TIGHT_AGGRESSIVE;
  
  const callAmount = currentBet - player.bet;
  const potOdds = calculatePotOdds(pot, callAmount);
  
  let handStrength = 0.5; // Default neutral strength
  
  if (player.cards && player.cards.length === 2) {
    const handEval = evaluatePokerHand(player.cards, communityCards);
    handStrength = handEval.strength / 10;
  }
  
  // Adjust hand strength based on personality
  const adjustedStrength = handStrength + (Math.random() - 0.5) * 0.2;
  const bluffFactor = Math.random() < personality.bluffRate ? 0.3 : 0;
  const finalStrength = Math.min(adjustedStrength + bluffFactor, 1.0);
  
  // Decision logic
  if (callAmount === 0) {
    // No bet to call - can check or bet
    if (finalStrength > personality.raiseThreshold || bluffFactor > 0) {
      const betSize = Math.floor(pot * (0.3 + personality.aggression * 0.7) * (0.5 + Math.random() * 0.5));
      return {
        action: 'raise',
        amount: Math.min(Math.max(betSize, minRaise), player.chips)
      };
    } else {
      return { action: 'check' };
    }
  } else {
    // There's a bet to call
    if (callAmount >= player.chips) {
      // All-in decision
      if (finalStrength > 0.6 || (potOdds > 0.3 && finalStrength > 0.4)) {
        return { action: 'all-in' };
      } else {
        return { action: 'fold' };
      }
    } else {
      // Normal betting decision
      if (finalStrength < personality.foldThreshold && bluffFactor === 0) {
        return { action: 'fold' };
      } else if (finalStrength > personality.raiseThreshold || bluffFactor > 0) {
        const raiseSize = Math.floor(currentBet * (1 + personality.aggression) * (0.5 + Math.random()));
        return {
          action: 'raise',
          amount: Math.min(Math.max(raiseSize, callAmount + minRaise), player.chips)
        };
      } else {
        return { action: 'call' };
      }
    }
  }
}

// Format currency
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US').format(amount);
}

// Calculate blinds based on hand number
export function calculateBlinds(handNumber) {
  const baseSmallBlind = 10;
  const baseBigBlind = 20;
  
  // Increase blinds every 20 hands
  const level = Math.floor(handNumber / 20);
  const multiplier = Math.pow(1.5, level);
  
  return {
    smallBlind: Math.floor(baseSmallBlind * multiplier),
    bigBlind: Math.floor(baseBigBlind * multiplier)
  };
}

// Shuffle array utility
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}