// Helper function to record game results to history
export const recordGameResult = async (gameData) => {
  try {
    const response = await fetch('/api/game-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });

    if (!response.ok) {
      console.error('Failed to record game result');
    }
  } catch (error) {
    console.error('Error recording game result:', error);
  }
};

// Helper to format game data for different game types
export const formatGameData = (gameType, betAmount, result, payout, details = '') => {
  return {
    gameType: gameType,
    betType: 'Standard',
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: details
  };
};

// Game-specific formatters
export const formatRouletteGame = (betType, betAmount, result, payout, winningNumber) => {
  return {
    gameType: 'Roulette',
    betType: betType,
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: `Winning number: ${winningNumber}`
  };
};

export const formatSlotsGame = (betAmount, result, payout, symbols) => {
  return {
    gameType: 'Slots',
    betType: 'Spin',
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: `Symbols: ${symbols.join(' | ')}`
  };
};

export const formatPokerGame = (betAmount, result, payout, playerHand, dealerHand) => {
  return {
    gameType: 'Poker',
    betType: 'Texas Hold\'em',
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: `Player: ${playerHand} vs Dealer: ${dealerHand}`
  };
};

export const formatCoinflipGame = (betSide, betAmount, result, payout, actualSide) => {
  return {
    gameType: 'Coinflip',
    betType: betSide,
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: `Bet ${betSide}, landed ${actualSide}`
  };
};

export const formatCaseOpeningGame = (caseType, betAmount, result, payout, itemName, rarity) => {
  return {
    gameType: 'Case Opening',
    betType: caseType,
    betAmount: betAmount,
    result: result,
    payout: payout,
    details: `Unboxed: ${itemName} (${rarity})`
  };
};