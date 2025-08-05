import { getConnection } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const connection = await getConnection();

    // Get bot profile
    const [bots] = await connection.execute(
      'SELECT * FROM bot_profiles WHERE username = ?',
      [username]
    );

    if (bots.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const bot = bots[0];

    // Get recent games (mock data for now)
    // In a real implementation, you would fetch this from a games table
    const recentGames = generateMockGames(bot);

    res.status(200).json({ bot, recentGames });
  } catch (error) {
    console.error('Error fetching bot profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Generate mock game history for the bot
function generateMockGames(bot) {
  const games = [];
  const gameTypes = ['Texas Hold\'em', 'Poker Tournament', 'Cash Game'];
  const results = ['win', 'loss', 'tie'];
  
  // Generate between 0 and 10 games
  const numGames = Math.min(bot.hands_played, Math.floor(Math.random() * 11));
  
  for (let i = 0; i < numGames; i++) {
    const isWin = Math.random() < (bot.hands_won / Math.max(1, bot.hands_played));
    const result = isWin ? 'win' : (Math.random() < 0.1 ? 'tie' : 'loss');
    const amount = result === 'win' 
      ? Math.floor(Math.random() * 1000) + 50
      : result === 'loss'
        ? -Math.floor(Math.random() * 500) - 50
        : 0;
    
    // Generate a date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    games.push({
      game_type: gameTypes[Math.floor(Math.random() * gameTypes.length)],
      result,
      amount,
      played_at: date.toISOString()
    });
  }
  
  // Sort by date, most recent first
  return games.sort((a, b) => new Date(b.played_at) - new Date(a.played_at));
}