import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createUser(username, email, password) {
  const connection = await getConnection();
  const hashedPassword = await hashPassword(password);
  
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    return {
      id: result.insertId,
      username,
      email,
      cashBalance: 1000.00
    };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

export async function getUserByUsername(username) {
  const connection = await getConnection();
  
  const [rows] = await connection.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  
  return rows[0] || null;
}

export async function getUserById(userId) {
  const connection = await getConnection();
  
  const [rows] = await connection.execute(
    'SELECT id, username, email, cash_balance, is_admin FROM users WHERE id = ?',
    [userId]
  );
  
  return rows[0] || null;
}

export async function updateUserCash(userId, newBalance) {
  const connection = await getConnection();
  
  await connection.execute(
    'UPDATE users SET cash_balance = ? WHERE id = ?',
    [newBalance, userId]
  );
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  return req.cookies?.token || null;
}

export async function verifyToken(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserById(decoded.userId);
    
    return user;
  } catch (error) {
    return null;
  }
}

