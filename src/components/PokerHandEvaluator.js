// Advanced poker hand evaluator with detailed analysis

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Get numeric value for a card rank
export const getRankValue = (rank) => {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank);
};

// Get display name for a rank value
export const getRankName = (value) => {
  if (value === 14) return 'Ace';
  if (value === 13) return 'King';
  if (value === 12) return 'Queen';
  if (value === 11) return 'Jack';
  return value.toString();
};

// Check if cards form a straight
export const checkStraight = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  
  // Check for A-5 straight (Ace can be low)
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 4 && 
      sorted[3] === 5 && sorted[4] === 14) {
    return { isStraight: true, highCard: 5, isLowAce: true };
  }
  
  // Check for regular straight
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] !== 1) {
      return { isStraight: false };
    }
  }
  
  return { isStraight: true, highCard: sorted[sorted.length - 1], isLowAce: false };
};

// Get counts of each card value
export const getValueCounts = (values) => {
  const counts = {};
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
};

// Evaluate a 5-card poker hand
export const evaluatePokerHand = (cards) => {
  const sortedCards = cards.sort((a, b) => b.value - a.value);
  const suits = cards.map(c => c.suit);
  const values = cards.map(c => c.value);
  
  const isFlush = suits.every(suit => suit === suits[0]);
  const straightResult = checkStraight(values);
  const isStraight = straightResult.isStraight;
  const valueCounts = getValueCounts(values);
  const countValues = Object.values(valueCounts);
  const countEntries = Object.entries(valueCounts).map(([value, count]) => ({ 
    value: parseInt(value), 
    count 
  })).sort((a, b) => b.count - a.count || b.value - a.value);
  
  // Royal Flush
  if (isFlush && isStraight && values.includes(14) && values.includes(13)) {
    return { 
      hand: 'Royal Flush', 
      cards: sortedCards, 
      ranking: 10,
      description: `Royal Flush of ${suits[0]}`,
      strength: 10 * 15 + 14 // Max possible value
    };
  }
  
  // Straight Flush
  if (isFlush && isStraight) {
    const highCard = straightResult.isLowAce ? 5 : straightResult.highCard;
    return { 
      hand: 'Straight Flush', 
      cards: sortedCards, 
      ranking: 9,
      description: `${getRankName(highCard)}-high Straight Flush of ${suits[0]}`,
      strength: 9 * 15 + highCard
    };
  }
  
  // Four of a Kind
  if (countValues.includes(4)) {
    const fourKind = countEntries.find(e => e.count === 4);
    const kicker = countEntries.find(e => e.count === 1);
    return { 
      hand: 'Four of a Kind', 
      cards: sortedCards, 
      ranking: 8,
      description: `Four ${getRankName(fourKind.value)}s with ${getRankName(kicker.value)} kicker`,
      strength: 8 * 15 + fourKind.value
    };
  }
  
  // Full House
  if (countValues.includes(3) && countValues.includes(2)) {
    const threeKind = countEntries.find(e => e.count === 3);
    const pair = countEntries.find(e => e.count === 2);
    return { 
      hand: 'Full House', 
      cards: sortedCards, 
      ranking: 7,
      description: `${getRankName(threeKind.value)}s full of ${getRankName(pair.value)}s`,
      strength: 7 * 15 + threeKind.value
    };
  }
  
  // Flush
  if (isFlush) {
    return { 
      hand: 'Flush', 
      cards: sortedCards, 
      ranking: 6,
      description: `${getRankName(sortedCards[0].value)}-high Flush of ${suits[0]}`,
      strength: 6 * 15 + sortedCards[0].value
    };
  }
  
  // Straight
  if (isStraight) {
    const highCard = straightResult.isLowAce ? 5 : straightResult.highCard;
    return { 
      hand: 'Straight', 
      cards: sortedCards, 
      ranking: 5,
      description: `${getRankName(highCard)}-high Straight`,
      strength: 5 * 15 + highCard
    };
  }
  
  // Three of a Kind
  if (countValues.includes(3)) {
    const threeKind = countEntries.find(e => e.count === 3);
    const kickers = countEntries.filter(e => e.count === 1).map(e => getRankName(e.value)).join(', ');
    return { 
      hand: 'Three of a Kind', 
      cards: sortedCards, 
      ranking: 4,
      description: `Three ${getRankName(threeKind.value)}s with ${kickers} kickers`,
      strength: 4 * 15 + threeKind.value
    };
  }
  
  // Two Pair
  if (countValues.filter(count => count === 2).length === 2) {
    const pairs = countEntries.filter(e => e.count === 2).sort((a, b) => b.value - a.value);
    const kicker = countEntries.find(e => e.count === 1);
    return { 
      hand: 'Two Pair', 
      cards: sortedCards, 
      ranking: 3,
      description: `${getRankName(pairs[0].value)}s and ${getRankName(pairs[1].value)}s with ${getRankName(kicker.value)} kicker`,
      strength: 3 * 15 + pairs[0].value * 15 + pairs[1].value
    };
  }
  
  // One Pair
  if (countValues.includes(2)) {
    const pair = countEntries.find(e => e.count === 2);
    const kickers = countEntries.filter(e => e.count === 1)
      .map(e => getRankName(e.value))
      .join(', ');
    return { 
      hand: 'One Pair', 
      cards: sortedCards, 
      ranking: 2,
      description: `Pair of ${getRankName(pair.value)}s with ${kickers} kickers`,
      strength: 2 * 15 + pair.value
    };
  }
  
  // High Card
  return { 
    hand: 'High Card', 
    cards: sortedCards, 
    ranking: 1,
    description: `${getRankName(sortedCards[0].value)} high`,
    strength: 1 * 15 + sortedCards[0].value
  };
};

// Evaluate the best 5-card hand from 7 cards (2 hole + 5 community)
export const evaluateBestHand = (holeCards, communityCards) => {
  const allCards = [...holeCards, ...communityCards];
  
  // If we don't have at least 5 cards, return what we have
  if (allCards.length < 5) {
    return { 
      hand: 'Incomplete', 
      cards: allCards, 
      ranking: 0,
      description: 'Waiting for more cards',
      strength: 0
    };
  }
  
  // Generate all possible 5-card combinations
  const combinations = getCombinations(allCards, 5);
  
  // Evaluate each combination
  let bestHand = { hand: 'High Card', cards: [], ranking: 0, strength: 0 };
  
  for (let combo of combinations) {
    const evaluation = evaluatePokerHand(combo);
    
    // Compare hands by ranking first, then by strength for tiebreakers
    if (evaluation.ranking > bestHand.ranking || 
        (evaluation.ranking === bestHand.ranking && evaluation.strength > bestHand.strength)) {
      bestHand = evaluation;
    }
  }
  
  // Add information about which hole cards are used
  const usedHoleCards = bestHand.cards.filter(card => 
    holeCards.some(holeCard => 
      holeCard.suit === card.suit && holeCard.rank === card.rank
    )
  );
  
  bestHand.usedHoleCards = usedHoleCards;
  bestHand.usedHoleCardCount = usedHoleCards.length;
  
  return bestHand;
};

// Generate all combinations of k elements from array
export const getCombinations = (arr, k) => {
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

// Calculate win probability based on current cards
export const calculateWinProbability = (holeCards, communityCards, playerCount) => {
  // This is a simplified probability calculation
  // In a real implementation, you would run Monte Carlo simulations
  
  if (holeCards.length < 2) return 0;
  
  const handEvaluation = evaluateBestHand(holeCards, communityCards);
  const handRanking = handEvaluation.ranking;
  
  // Base probabilities for different hand types
  const baseProbabilities = {
    10: 0.999, // Royal Flush
    9: 0.998,  // Straight Flush
    8: 0.97,   // Four of a Kind
    7: 0.95,   // Full House
    6: 0.90,   // Flush
    5: 0.85,   // Straight
    4: 0.80,   // Three of a Kind
    3: 0.70,   // Two Pair
    2: 0.60,   // One Pair
    1: 0.40,   // High Card
    0: 0.20    // Incomplete hand
  };
  
  // Adjust for number of players
  const playerAdjustment = Math.pow(0.85, playerCount - 1);
  
  // Adjust for community cards (more community cards = more accurate evaluation)
  const communityAdjustment = communityCards.length / 5;
  
  // Calculate final probability
  let probability = baseProbabilities[handRanking] * playerAdjustment * communityAdjustment;
  
  // Ensure probability is between 0 and 1
  return Math.min(1, Math.max(0, probability));
};

// Calculate pot odds (ratio of current bet to pot)
export const calculatePotOdds = (currentBet, potSize) => {
  if (currentBet === 0) return 0;
  return currentBet / (potSize + currentBet);
};

// Determine if a call is profitable based on win probability and pot odds
export const isCallProfitable = (winProbability, potOdds) => {
  return winProbability > potOdds;
};

// Export all functions
export default {
  evaluatePokerHand,
  evaluateBestHand,
  calculateWinProbability,
  calculatePotOdds,
  isCallProfitable,
  getRankValue,
  getRankName,
  checkStraight,
  getValueCounts,
  getCombinations
};