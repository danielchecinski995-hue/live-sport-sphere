/**
 * Live Sport Sphere - Backend Server
 * Main Express application
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { requireAuth, optionalAuth } from './middleware/auth';
import playerRoutes from './routes/playerRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import teamRoutes from './routes/teamRoutes';
import matchRoutes from './routes/matchRoutes';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Middleware
// ========================================

// CORS - pozwala na requesty z frontendu i aplikacji mobilnej
app.use(cors({
  origin: true, // Allow all origins (mobile app + web)
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured logging middleware (Cloud Logging compatible)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
      message: `${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${duration / 1000}s`,
        userAgent: req.get('user-agent'),
        remoteIp: req.ip,
      },
    };
    console.log(JSON.stringify(log));
  });
  next();
});

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

// Auth routes
app.use('/api/auth', authRoutes);

// API routes (public read, auth required for write)
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api', teamRoutes);
app.use('/api', matchRoutes);

// ========================================
// Error Handling
// ========================================

// Full seed endpoint: fix schema, add data, complete some matches
app.post('/api/seed/full-reset', async (req: Request, res: Response) => {
  try {
    const log: string[] = [];

    // 1. Add missing columns
    try {
      await pool.query('ALTER TABLE team_players ADD COLUMN jersey_number INT');
      log.push('Added jersey_number column');
    } catch { log.push('jersey_number column exists'); }

    try {
      await pool.query('ALTER TABLE team_players ADD COLUMN is_starter BOOLEAN DEFAULT false');
      log.push('Added is_starter column');
    } catch { log.push('is_starter column exists'); }

    // 2. Delete all duplicate phases, standings, matches — start fresh
    // Clean up - handle missing tables gracefully
    for (const table of ['goal_scorers', 'match_cards', 'cards', 'substitutions', 'matches', 'standings', 'phases']) {
      try { await pool.query(`DELETE FROM ${table}`); } catch {}
    }
    log.push('Cleared old matches/phases/standings');

    // 3. Get all tournaments (except "oko")
    const tournamentsResult = await pool.query("SELECT id, name FROM tournaments WHERE name != 'oko' ORDER BY created_at");
    const tournaments = tournamentsResult.rows;

    // Logo URLs (soccer shield placeholders via UI Avatars)
    const teamColors: Record<string, string> = {};
    const colors = ['2563eb', 'dc2626', '10b981', 'f59e0b', '7c3aed', 'ec4899', '06b6d4', 'ea580c'];

    let colorIdx = 0;
    for (const tournament of tournaments) {
      const teamsResult = await pool.query('SELECT id, name FROM teams WHERE tournament_id = $1 ORDER BY name', [tournament.id]);
      const teams = teamsResult.rows;

      // Set logo_url for each team
      for (const team of teams) {
        const color = colors[colorIdx % colors.length];
        colorIdx++;
        const initials = team.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
        const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=128&bold=true&format=png`;
        await pool.query('UPDATE teams SET logo_url = $1 WHERE id = $2', [logoUrl, team.id]);
      }

      // Set jersey numbers and is_starter
      for (const team of teams) {
        const playersResult = await pool.query('SELECT player_id FROM team_players WHERE team_id = $1 ORDER BY player_id', [team.id]);
        for (let k = 0; k < playersResult.rows.length; k++) {
          await pool.query(
            'UPDATE team_players SET jersey_number = $1, is_starter = $2 WHERE team_id = $3 AND player_id = $4',
            [k + 1, k < 7, team.id, playersResult.rows[k].player_id]
          );
        }
      }

      // Create phase
      const phaseResult = await pool.query(
        `INSERT INTO phases (id, tournament_id, phase_type, phase_order, status)
         VALUES (uuid_generate_v4(), $1, 'group_stage', 1, 'active') RETURNING id`,
        [tournament.id]
      );
      const phaseId = phaseResult.rows[0].id;

      // Generate round-robin matches
      let matchOrder = 1;
      const matchIds: string[] = [];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const mResult = await pool.query(
            `INSERT INTO matches (phase_id, home_team_id, away_team_id, match_order, status)
             VALUES ($1, $2, $3, $4, 'scheduled') RETURNING id`,
            [phaseId, teams[i].id, teams[j].id, matchOrder++]
          );
          matchIds.push(mResult.rows[0].id);
        }
      }

      // Create standings
      for (const team of teams) {
        await pool.query(
          `INSERT INTO standings (id, phase_id, team_id, points, wins, draws, losses, goals_for, goals_against)
           VALUES (uuid_generate_v4(), $1, $2, 0, 0, 0, 0, 0, 0)`,
          [phaseId, team.id]
        );
      }

      // Complete ~40% of matches with random results
      const matchesToComplete = Math.floor(matchIds.length * 0.4);
      for (let m = 0; m < matchesToComplete; m++) {
        const matchId = matchIds[m];
        const homeScore = Math.floor(Math.random() * 4);
        const awayScore = Math.floor(Math.random() * 4);

        await pool.query(
          'UPDATE matches SET home_score = $1, away_score = $2, status = $3 WHERE id = $4',
          [homeScore, awayScore, 'completed', matchId]
        );

        // Get match teams
        const matchData = await pool.query('SELECT home_team_id, away_team_id FROM matches WHERE id = $1', [matchId]);
        const { home_team_id, away_team_id } = matchData.rows[0];

        // Update standings
        const homePts = homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0;
        const awayPts = awayScore > homeScore ? 3 : awayScore === homeScore ? 1 : 0;
        await pool.query(
          `UPDATE standings SET
            wins = wins + $2::int, draws = draws + $3::int, losses = losses + $4::int,
            goals_for = goals_for + $5::int, goals_against = goals_against + $6::int,
            points = points + $7::int
           WHERE phase_id = $8 AND team_id = $1`,
          [home_team_id, homeScore > awayScore ? 1 : 0, homeScore === awayScore ? 1 : 0, homeScore < awayScore ? 1 : 0, homeScore, awayScore, homePts, phaseId]
        );
        await pool.query(
          `UPDATE standings SET
            wins = wins + $2::int, draws = draws + $3::int, losses = losses + $4::int,
            goals_for = goals_for + $5::int, goals_against = goals_against + $6::int,
            points = points + $7::int
           WHERE phase_id = $8 AND team_id = $1`,
          [away_team_id, awayScore > homeScore ? 1 : 0, awayScore === homeScore ? 1 : 0, awayScore < homeScore ? 1 : 0, awayScore, homeScore, awayPts, phaseId]
        );

        // Add goal scorers for completed matches
        try {
          if (homeScore > 0) {
            const homePlayers = await pool.query(
              'SELECT player_id FROM team_players WHERE team_id = $1 ORDER BY random() LIMIT $2',
              [home_team_id, homeScore]
            );
            for (const p of homePlayers.rows) {
              await pool.query(
                'INSERT INTO goal_scorers (match_id, player_id, team_id) VALUES ($1, $2, $3)',
                [matchId, p.player_id, home_team_id]
              );
            }
          }
          if (awayScore > 0) {
            const awayPlayers = await pool.query(
              'SELECT player_id FROM team_players WHERE team_id = $1 ORDER BY random() LIMIT $2',
              [away_team_id, awayScore]
            );
            for (const p of awayPlayers.rows) {
              await pool.query(
                'INSERT INTO goal_scorers (match_id, player_id, team_id) VALUES ($1, $2, $3)',
                [matchId, p.player_id, away_team_id]
              );
            }
          }
        } catch (gsErr) { log.push('goal_scorers insert failed: ' + (gsErr instanceof Error ? gsErr.message : '')); }
      }

      log.push(`${tournament.name}: ${matchIds.length} matches (${matchesToComplete} completed, ${matchIds.length - matchesToComplete} scheduled)`);
    }

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(JSON.stringify({
    severity: 'ERROR',
    message: `Unhandled error: ${err.message}`,
    stack: err.stack,
    httpRequest: { requestMethod: req.method, requestUrl: req.originalUrl },
  }));

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========================================
// Server Start
// ========================================

export { app };

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
