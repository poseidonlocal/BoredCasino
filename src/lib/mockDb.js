// Mock database for development when MySQL is not available
import bcrypt from 'bcryptjs';

// In-memory data store
let users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@boredcasino.com',
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        cash_balance: 50000.00,
        is_admin: 1,
        is_active: 1,
        is_banned: 0,
        ban_reason: null,
        last_daily_bonus: null,
        total_winnings: 0.00,
        total_losses: 0.00,
        games_played: 0,
        last_login: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        cash_balance: 1500.00,
        is_admin: 0,
        is_active: 1,
        is_banned: 0,
        ban_reason: null,
        last_daily_bonus: null,
        total_winnings: 250.00,
        total_losses: 100.00,
        games_played: 15,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        username: 'player1',
        email: 'player1@example.com',
        password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password123
        cash_balance: 2000.00,
        is_admin: 0,
        is_active: 1,
        is_banned: 0,
        ban_reason: null,
        last_daily_bonus: null,
        total_winnings: 500.00,
        total_losses: 300.00,
        games_played: 25,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

let gameHistory = [
    {
        id: 1,
        user_id: 2,
        game_type: 'roulette',
        bet_amount: 50.00,
        win_amount: 100.00,
        game_data: { bet_type: 'red', winning_number: 7, result: 'win' },
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        user_id: 2,
        game_type: 'slots',
        bet_amount: 25.00,
        win_amount: 0.00,
        game_data: { reels: ['🍒', '🍋', '🍊'], result: 'lose' },
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        user_id: 3,
        game_type: 'roulette',
        bet_amount: 100.00,
        win_amount: 0.00,
        game_data: { bet_type: 'number', bet_number: 13, winning_number: 7, result: 'lose' },
        created_at: new Date().toISOString()
    }
];

let adminActions = [];

// Mock database connection
export async function getConnection() {
    return {
        execute: async (query, params = []) => {
            console.log('Mock DB Query:', query, params);

            // Handle different query types
            if (query.includes('SELECT') && query.includes('users') && query.includes('username')) {
                const username = params[0];
                const user = users.find(u => u.username === username);
                return [user ? [user] : []];
            }

            if (query.includes('SELECT') && query.includes('users') && query.includes('id =')) {
                const userId = params[0];
                if (!userId) {
                    return [[]]; // Return empty result if no user ID provided
                }
                const user = users.find(u => u.id === parseInt(userId));
                if (user && query.includes('cash_balance, is_admin')) {
                    // Return user with specific fields for getUserById
                    return [[{
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        cash_balance: user.cash_balance,
                        is_admin: user.is_admin
                    }]];
                }
                return [user ? [user] : []];
            }

            if (query.includes('SELECT COUNT(*) as count FROM users')) {
                if (query.includes('is_active = 1 AND is_banned = 0')) {
                    return [{ count: users.filter(u => u.is_active && !u.is_banned).length }];
                }
                if (query.includes('DATE(created_at)')) {
                    return [{ count: 1 }]; // Mock new users today
                }
                return [{ count: users.length }];
            }

            if (query.includes('SELECT COUNT(*) as count FROM game_history')) {
                return [{ count: gameHistory.length }];
            }

            if (query.includes('SELECT SUM(bet_amount - win_amount) as revenue')) {
                const revenue = gameHistory.reduce((sum, game) => sum + (game.bet_amount - game.win_amount), 0);
                return [{ revenue }];
            }

            if (query.includes('SELECT COUNT(DISTINCT user_id) as count FROM game_history')) {
                const uniqueUsers = [...new Set(gameHistory.map(g => g.user_id))].length;
                return [{ count: uniqueUsers }];
            }

            if (query.includes('SELECT * FROM users')) {
                return [users];
            }

            if (query.includes('UPDATE users SET')) {
                // Handle user updates
                return [{ affectedRows: 1 }];
            }

            if (query.includes('INSERT INTO admin_actions')) {
                const action = {
                    id: adminActions.length + 1,
                    admin_id: params[0],
                    action_type: params[1],
                    target_user_id: params[2] || null,
                    details: params[3] || null,
                    ip_address: params[4] || null,
                    created_at: new Date().toISOString()
                };
                adminActions.push(action);
                return [{ insertId: action.id }];
            }

            if (query.includes('SELECT * FROM admin_actions')) {
                return [adminActions.slice(-10)]; // Return last 10 actions
            }

            // Default response
            return [[]];
        }
    };
}

export async function initializeDatabase() {
    console.log('Mock database initialized');
    return true;
}

export default { getConnection, initializeDatabase };