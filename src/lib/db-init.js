import { initializeDatabase } from './sqlite.js';

async function main() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

main();