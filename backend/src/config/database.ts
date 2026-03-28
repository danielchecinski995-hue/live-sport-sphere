/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'live_sport_sphere',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Connection pool (reużywalny dla wszystkich zapytań)
export const pool = new Pool(poolConfig);

// Test połączenia przy starcie
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper do wykonywania zapytań z error handling
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Query executed', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

export default pool;
