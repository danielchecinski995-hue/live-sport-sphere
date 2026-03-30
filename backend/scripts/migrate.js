/**
 * Database Migration Script
 * Live Sport Sphere - Tournament Management System
 *
 * Tworzy schemat bazy danych PostgreSQL dla systemu turniejowego
 *
 * Uruchom: npm run db:migrate
 */

const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.INSTANCE_CONNECTION_NAME
  ? {
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      database: process.env.DB_NAME || 'live_sport_sphere',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'live_sport_sphere',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool(poolConfig);

const migrations = [
  // 1. Enable UUID extension
  `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `,

  // 2. Users table (organizatorzy turniejów)
  `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 3. Tournaments table (turnieje)
  `
    CREATE TABLE IF NOT EXISTS tournaments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
      format_type VARCHAR(50) NOT NULL,
      share_code VARCHAR(8) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'draft',
      config JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 4. Players table (zawodnicy - pula organizatora, reużywalni)
  `
    CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 5. Teams table (drużyny)
  `
    CREATE TABLE IF NOT EXISTS teams (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      logo_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 6. Team-Player assignments (przypisanie zawodników do drużyn w turnieju)
  `
    CREATE TABLE IF NOT EXISTS team_players (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      player_id UUID REFERENCES players(id) ON DELETE CASCADE,
      UNIQUE(team_id, player_id)
    );
  `,

  // 7. Phases table (fazy turnieju - dla multi-phase formats)
  `
    CREATE TABLE IF NOT EXISTS phases (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
      phase_type VARCHAR(50) NOT NULL,
      phase_order INT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending'
    );
  `,

  // 8. Groups table (grupy w fazie grupowej)
  `
    CREATE TABLE IF NOT EXISTS groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL
    );
  `,

  // 9. Matches table (mecze)
  `
    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
      group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
      home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      home_score INT,
      away_score INT,
      match_date TIMESTAMP,
      match_order INT NOT NULL,
      status VARCHAR(20) DEFAULT 'scheduled'
    );
  `,

  // 10. Goal scorers (bramkarze - statystyki zawodników)
  `
    CREATE TABLE IF NOT EXISTS goal_scorers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      player_id UUID REFERENCES players(id) ON DELETE CASCADE,
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      goals_count INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // 11. Standings table (tabele/rankingi - cache)
  `
    CREATE TABLE IF NOT EXISTS standings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
      group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      points INT DEFAULT 0,
      wins INT DEFAULT 0,
      draws INT DEFAULT 0,
      losses INT DEFAULT 0,
      goals_for INT DEFAULT 0,
      goals_against INT DEFAULT 0,
      goal_difference INT GENERATED ALWAYS AS (goals_for - goals_against) STORED,
      position INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phase_id, group_id, team_id)
    );
  `,

  // 12. Seed data - fikcyjny organizator do testów
  `
    INSERT INTO users (id, email, password, name)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'test@livesportsphere.com',
      'test_password_hash',
      'Test Organizer'
    )
    ON CONFLICT (id) DO NOTHING;
  `,

  // 13. Indexes dla wydajności
  `
    CREATE INDEX IF NOT EXISTS idx_tournaments_creator ON tournaments(creator_id);
    CREATE INDEX IF NOT EXISTS idx_tournaments_share_code ON tournaments(share_code);
    CREATE INDEX IF NOT EXISTS idx_players_creator ON players(creator_id);
    CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_players_player ON team_players(player_id);
    CREATE INDEX IF NOT EXISTS idx_phases_tournament ON phases(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase_id);
    CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
    CREATE INDEX IF NOT EXISTS idx_goal_scorers_match ON goal_scorers(match_id);
    CREATE INDEX IF NOT EXISTS idx_goal_scorers_player ON goal_scorers(player_id);
    CREATE INDEX IF NOT EXISTS idx_standings_phase ON standings(phase_id);
    CREATE INDEX IF NOT EXISTS idx_standings_group ON standings(group_id);
  `
];

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migration...\n');

    // Rozpocznij transakcję
    await client.query('BEGIN');

    // Wykonaj wszystkie migracje
    for (let i = 0; i < migrations.length; i++) {
      console.log(`⏳ Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
      console.log(`✅ Migration ${i + 1} completed\n`);
    }

    // Zatwierdź transakcję
    await client.query('COMMIT');

    console.log('✨ All migrations completed successfully!');
    console.log('\nDatabase schema created:');
    console.log('  ✓ users (+ test organizer seeded)');
    console.log('  ✓ players');
    console.log('  ✓ tournaments');
    console.log('  ✓ teams');
    console.log('  ✓ team_players');
    console.log('  ✓ phases');
    console.log('  ✓ groups');
    console.log('  ✓ matches');
    console.log('  ✓ goal_scorers');
    console.log('  ✓ standings');
    console.log('  ✓ indexes\n');
    console.log('🔑 Test Organizer ID: 00000000-0000-0000-0000-000000000001');
    console.log('📧 Test Email: test@livesportsphere.com\n');

  } catch (error) {
    // Cofnij transakcję w razie błędu
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Uruchom migrację
migrate();
