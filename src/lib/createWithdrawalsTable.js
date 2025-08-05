import { getConnection } from './db';

export async function createWithdrawalsTable() {
  try {
    const connection = await getConnection();
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        account_details TEXT NOT NULL,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        status ENUM('pending', 'approved', 'processed', 'rejected', 'cancelled') DEFAULT 'pending',
        admin_notes TEXT,
        processed_by INT,
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_transaction_id (transaction_id),
        INDEX idx_created_at (created_at)
      )
    `);
    
    console.log('Withdrawals table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating withdrawals table:', error);
    return false;
  }
}