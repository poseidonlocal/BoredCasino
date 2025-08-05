-- Add transaction_logs table for comprehensive transaction logging
CREATE TABLE IF NOT EXISTS transaction_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('game_bet', 'game_win', 'daily_bonus', 'admin_adjustment', 'purchase', 'refund')),
  amount REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  game_type TEXT CHECK (game_type IN ('roulette', 'slots', 'texas_holdem', 'coinflip')),
  game_data TEXT, -- JSON string
  description TEXT NOT NULL,
  ip_address TEXT,
  admin_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_type ON transaction_logs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_created_at ON transaction_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_game_type ON transaction_logs(game_type);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_admin_id ON transaction_logs(admin_id);