/**
 * Live Sport Sphere - Backend Server
 * Main Express application
 */

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import playerRoutes from './routes/playerRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import teamRoutes from './routes/teamRoutes';
import matchRoutes from './routes/matchRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Middleware
// ========================================

// CORS - pozwala na requesty z frontendu
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081'], // Vite + Expo web
  credentials: true // Pozwala na cookies
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management (bez JWT - prostsze!)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS tylko w produkcji
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dni
  }
}));

// Logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========================================
// Routes
// ========================================

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');

    res.json({
      status: 'ok',
      message: 'Live Sport Sphere API is running',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint - get test organizer
app.get('/api/test/organizer', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      ['00000000-0000-0000-0000-000000000001']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test organizer not found' });
    }

    res.json({
      message: 'Test organizer found!',
      organizer: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database query failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api', teamRoutes); // Teams routes include /tournaments/:id/teams and /teams/:id

app.use('/api', matchRoutes);

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========================================
// Server Start
// ========================================

app.listen(PORT, () => {
  console.log('\n🚀 Live Sport Sphere Backend Server');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log('\n✨ Ready to accept requests!\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});
