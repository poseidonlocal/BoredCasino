import { getConnection } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

// Bot personality types with their characteristics
const BOT_PERSONALITIES = {
  aggressive: { aggression: 0.8, bluffRate: 0.3, description: "Plays aggressively with frequent raises and bluffs" },
  tight: { aggression: 0.3, bluffRate: 0.1, description: "Plays conservatively, only betting with strong hands" },
  loose: { aggression: 0.6, bluffRate: 0.4, description: "Plays many hands and calls frequently" },
  balanced: { aggression: 0.5, bluffRate: 0.2, description: "Plays a balanced strategy with mixed aggression" },
  calling_station: { aggression: 0.2, bluffRate: 0.05, description: "Calls often but rarely raises" },
  bluffer: { aggression: 0.7, bluffRate: 0.6, description: "Bluffs frequently, even with weak hands" },
  rock: { aggression: 0.1, bluffRate: 0.02, description: "Extremely tight player who only plays premium hands" },
  wild: { aggression: 0.9, bluffRate: 0.5, description: "Unpredictable player with wild betting patterns" },
  professional: { aggression: 0.6, bluffRate: 0.25, description: "Skilled player with solid fundamentals" },
  maniac: { aggression: 0.95, bluffRate: 0.7, description: "Extremely aggressive player who raises constantly" }
};

// Bot avatar options
const BOT_AVATARS = ['🤖', '👨', '👩', '👱‍♂️', '👱‍♀️', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦲', '👩‍🦳', '🕴️', '🤪'];

// First names and last names for generating bot names
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Dakota',
  'Sam', 'Charlie', 'Jessie', 'Skyler', 'Finley', 'Blake', 'Reese', 'Parker', 'Drew', 'Hayden',
  'Max', 'Ash', 'Remy', 'Kai', 'Phoenix', 'River', 'Sage', 'Rowan', 'Emery', 'Harley'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
  'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
  'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright'
];

// Create bot profiles table if it doesn't exist
async function createBotProfilesTable(connection) {
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bot_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        avatar VARCHAR(10) NOT NULL,
        personality_type VARCHAR(20) NOT NULL,
        aggression FLOAT NOT NULL,
        bluff_rate FLOAT NOT NULL,
        description TEXT,
        chips INT DEFAULT 1000,
        hands_played INT DEFAULT 0,
        hands_won INT DEFAULT 0,
        biggest_win INT DEFAULT 0,
        biggest_loss INT DEFAULT 0,
        total_winnings INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return true;
  } catch (error) {
    console.error('Error creating bot_profiles table:', error);
    return false;
  }
}

// Generate a unique bot username
async function generateUniqueBotUsername(connection) {
  let username;
  let isUnique = false;
  
  while (!isUnique) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const suffix = Math.floor(Math.random() * 1000);
    
    username = `${firstName}${lastName}${suffix}`;
    
    // Check if username exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM bot_profiles WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length === 0) {
      isUnique = true;
    }
  }
  
  return username;
}

// Create a new bot profile
async function createBotProfile(connection, personalityType = null) {
  try {
    // Select a random personality type if not specified
    if (!personalityType || !BOT_PERSONALITIES[personalityType]) {
      const types = Object.keys(BOT_PERSONALITIES);
      personalityType = types[Math.floor(Math.random() * types.length)];
    }
    
    const personality = BOT_PERSONALITIES[personalityType];
    const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
    const username = await generateUniqueBotUsername(connection);
    
    // Add some randomness to personality traits
    const aggression = Math.min(1, Math.max(0, personality.aggression + (Math.random() * 0.2 - 0.1)));
    const bluffRate = Math.min(1, Math.max(0, personality.bluffRate + (Math.random() * 0.2 - 0.1)));
    
    // Random starting chips between 1000 and 5000
    const chips = 1000 + Math.floor(Math.random() * 4000);
    
    // Insert the bot profile
    const [result] = await connection.execute(`
      INSERT INTO bot_profiles (
        username, avatar, personality_type, aggression, bluff_rate, 
        description, chips
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      username, avatar, personalityType, aggression, bluffRate,
      personality.description, chips
    ]);
    
    // Get the created bot
    const [bots] = await connection.execute(
      'SELECT * FROM bot_profiles WHERE id = ?',
      [result.insertId]
    );
    
    return bots[0];
  } catch (error) {
    console.error('Error creating bot profile:', error);
    return null;
  }
}

// Get bot profiles
async function getBotProfiles(connection, limit = 10) {
  try {
    // SQLite doesn't have RAND() function, use random() instead
    // Also check if we're using SQLite or MySQL
    let query;
    try {
      // Try to use MySQL's RAND() function
      const [testResult] = await connection.execute('SELECT RAND() as test');
      query = `
        SELECT * FROM bot_profiles
        ORDER BY RAND()
        LIMIT ?
      `;
    } catch (err) {
      // If RAND() fails, we're using SQLite, so use random()
      query = `
        SELECT * FROM bot_profiles
        ORDER BY random()
        LIMIT ?
      `;
    }
    
    const [bots] = await connection.execute(query, [limit]);
    return bots;
  } catch (error) {
    console.error('Error getting bot profiles:', error);
    return [];
  }
}

// Update bot stats after a game
async function updateBotStats(connection, botId, handWon, winAmount = 0) {
  try {
    const [bots] = await connection.execute(
      'SELECT * FROM bot_profiles WHERE id = ?',
      [botId]
    );
    
    if (bots.length === 0) return false;
    
    const bot = bots[0];
    
    // Update stats
    const handsPlayed = bot.hands_played + 1;
    const handsWon = handWon ? bot.hands_won + 1 : bot.hands_won;
    const chips = bot.chips + winAmount;
    const totalWinnings = winAmount > 0 ? bot.total_winnings + winAmount : bot.total_winnings;
    const biggestWin = winAmount > bot.biggest_win ? winAmount : bot.biggest_win;
    const biggestLoss = winAmount < 0 && Math.abs(winAmount) > bot.biggest_loss ? Math.abs(winAmount) : bot.biggest_loss;
    
    await connection.execute(`
      UPDATE bot_profiles SET
        hands_played = ?,
        hands_won = ?,
        chips = ?,
        total_winnings = ?,
        biggest_win = ?,
        biggest_loss = ?,
        last_active = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      handsPlayed,
      handsWon,
      chips,
      totalWinnings,
      biggestWin,
      biggestLoss,
      botId
    ]);
    
    return true;
  } catch (error) {
    console.error('Error updating bot stats:', error);
    return false;
  }
}

export default async function handler(req, res) {
  try {
    // Verify user is authenticated for certain operations
    const user = await verifyToken(req);
    
    const connection = await getConnection();
    
    // Ensure the bot_profiles table exists
    await createBotProfilesTable(connection);
    
    // GET: Retrieve bot profiles
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 10;
      const bots = await getBotProfiles(connection, limit);
      
      return res.status(200).json({ bots });
    }
    
    // POST: Create a new bot profile
    if (req.method === 'POST') {
      // Only allow authenticated users to create bots
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { personalityType } = req.body;
      const bot = await createBotProfile(connection, personalityType);
      
      if (!bot) {
        return res.status(500).json({ error: 'Failed to create bot profile' });
      }
      
      return res.status(201).json({ bot });
    }
    
    // PUT: Update bot stats
    if (req.method === 'PUT') {
      // Only allow authenticated users to update bot stats
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { botId, handWon, winAmount } = req.body;
      
      if (!botId) {
        return res.status(400).json({ error: 'Bot ID is required' });
      }
      
      const success = await updateBotStats(connection, botId, handWon, winAmount);
      
      if (!success) {
        return res.status(500).json({ error: 'Failed to update bot stats' });
      }
      
      return res.status(200).json({ success: true });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Bot profiles API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}