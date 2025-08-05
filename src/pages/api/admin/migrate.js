import { verifyAdmin } from '../../../lib/adminAuth';
import { getConnection } from '../../../lib/db';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const admin = await verifyAdmin(req);
    
    const connection = await getConnection();
    
    // Read and execute migrations
    const migrations = [
      'add-security-logs.sql',
      'add-transaction-logs.sql'
    ];
    
    for (const migrationFile of migrations) {
      const migrationPath = path.join(process.cwd(), 'src/lib/migrations', migrationFile);
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement.trim());
          }
        }
      }
    }

    res.status(200).json({ 
      message: 'Security logs migration completed successfully',
      admin: admin.username
    });

  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
      message: 'Migration failed', 
      error: error.message 
    });
  }
}