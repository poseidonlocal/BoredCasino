// Main database module - now using SQLite
import { getConnection as sqliteGetConnection, initializeDatabase as sqliteInitializeDatabase } from './sqlite.js';

export const getConnection = sqliteGetConnection;
export const initializeDatabase = sqliteInitializeDatabase;

export default { getConnection, initializeDatabase };

