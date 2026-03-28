# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Live Sport Sphere** is a tournament management system for youth sports competitions. It allows organizers to create tournaments, manage teams, assign players, and track results. The system supports multiple tournament formats (league, knockout, groups+playoff, etc.) and provides public access via share codes.

## Technology Stack

### Backend
- **Node.js 22.14** + **TypeScript 5.3**
- **Express.js** - REST API server
- **PostgreSQL 16** - Relational database
- **express-session** - Session management (no JWT)
- **bcrypt** - Password hashing
- **tsx** - TypeScript execution with hot reload

### Frontend
- **React 18** + **TypeScript 5.3**
- **Vite 5** - Build tool and dev server
- **Fetch API** - HTTP communication (no axios)
- Pure CSS - No UI library (minimalist approach)

## Project Structure

```
live-sport-sphere/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # PostgreSQL connection pool
│   │   ├── controllers/             # Request handlers
│   │   │   ├── playerController.ts
│   │   │   ├── tournamentController.ts
│   │   │   └── teamController.ts
│   │   ├── models/                  # Database queries
│   │   │   ├── playerModel.ts
│   │   │   ├── tournamentModel.ts
│   │   │   └── teamModel.ts
│   │   ├── routes/                  # API route definitions
│   │   │   ├── playerRoutes.ts
│   │   │   ├── tournamentRoutes.ts
│   │   │   └── teamRoutes.ts
│   │   ├── engines/                 # Tournament format engines (future)
│   │   ├── types/                   # TypeScript type definitions
│   │   │   └── index.ts
│   │   ├── utils/                   # Helper functions
│   │   │   └── generateCode.ts
│   │   └── server.ts                # Main Express application
│   ├── scripts/
│   │   └── migrate.js               # Database migration script
│   ├── .env                         # Environment variables (not in git)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.ts               # Fetch API wrapper
│   │   ├── App.tsx                  # Main component
│   │   └── main.tsx                 # Entry point
│   └── package.json
│
└── docs/
    ├── DEVELOPMENT_LOG.md           # Development history
    └── ARCHITECTURE.md              # Detailed architecture
```

## Database Schema

### Key Tables

**users** - Tournament organizers
- Uses UUID for `id`
- Password stored as bcrypt hash
- Test organizer: `00000000-0000-0000-0000-000000000001`

**players** - Player pool (reusable across tournaments)
- Each organizer has their own player pool
- Simple: first_name, last_name only
- Statistics tracked via `goal_scorers` table

**tournaments** - Tournaments
- `share_code` (8-char unique code) for public access
- `status`: draft → active → finished
- `config` (JSONB) stores format-specific configuration
- `format_type`: league, knockout, groups_playoff, etc.

**teams** - Teams in tournaments
- Belongs to a tournament (CASCADE delete)
- Optional `logo_url`

**team_players** - Many-to-many relationship
- Links players to teams
- Same player can be in multiple tournaments/teams

**phases** - Tournament phases (for multi-stage formats)
- Examples: group_stage, playoff, golden_group

**groups** - Groups within phases
- For group-stage formats

**matches** - Match results
- `home_team_id` vs `away_team_id`
- `home_score`, `away_score` (nullable until completed)
- `match_order` for scheduling

**goal_scorers** - Player statistics
- Links player to match with goals_count
- Allows tracking individual scorer stats

**standings** - Cached standings/rankings
- Pre-calculated to avoid heavy queries
- Updated when match results change

### Database Connection

Connection managed via `pg.Pool` in `src/config/database.ts`:
```typescript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
```

## Running the Application

### Development

**Backend:**
```bash
cd backend
npm run dev  # Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm run dev  # Runs on http://localhost:5173
```

**Database Migration:**
```bash
cd backend
npm run db:migrate
```

### Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Set `DB_PASSWORD` to your PostgreSQL password
3. Database name: `live_sport_sphere`

### Test Data

After migration, the following test data is seeded:
- **Test Organizer:** `test@livesportsphere.com` (ID: `00000000-0000-0000-0000-000000000001`)

## API Architecture

### Authentication Pattern

Currently uses **test organizer** (ID hardcoded in controllers).

**Future implementation:**
- Login creates session → `req.session.userId`
- Controllers check `req.session.userId` instead of hardcoded ID
- Middleware: `requireAuth` for protected routes

### API Response Format

Consistent response structure:
```typescript
{
  success: boolean,
  data?: any,
  count?: number,        // For list endpoints
  message?: string,      // For mutations
  error?: string         // On failure
}
```

### CORS Configuration

Frontend (Vite) proxies `/api` requests to backend:
```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  }
}
```

Backend allows credentials:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## Key API Endpoints

### Players
- `GET /api/players` - List all players for organizer
- `POST /api/players` - Create player (first_name, last_name)
- `GET /api/players/:id/stats` - Get player stats (goals, matches)
- `GET /api/players/search?q=...` - Search players by name

### Tournaments
- `GET /api/tournaments` - My tournaments
- `GET /api/tournaments/public` - Public tournaments (active/finished)
- `GET /api/tournaments/code/:shareCode` - Get by share code (public)
- `POST /api/tournaments` - Create (name, format_type, config)
- `PATCH /api/tournaments/:id/status` - Update status

### Teams
- `GET /api/tournaments/:id/teams` - Teams in tournament
- `POST /api/tournaments/:id/teams` - Create team (name, player_ids[])
- `GET /api/teams/:id?include_players=true` - Team with players
- `PUT /api/teams/:id/players` - Set team players (player_ids[])

## Frontend Architecture

### API Service Pattern

All backend communication goes through `services/api.ts`:
```typescript
const fetchAPI = (endpoint, options) => {
  return fetch(`/api${endpoint}`, {
    credentials: 'include',  // Send cookies
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
};
```

### State Management

Currently uses **React useState** (no Redux/Zustand):
- Simple for MVP
- Each component manages its own state
- API calls trigger re-fetches

**Future:** Consider Context API for shared auth state.

### Styling

Pure inline styles for MVP:
- Black text on white background
- Minimal CSS
- Focus on functionality, not design

## Code Patterns & Conventions

### TypeScript Patterns

**Never use `any`** - Always define proper types in `src/types/index.ts`

**DTO Pattern:**
```typescript
// User with password (DB)
interface User {
  password: string;
  // ...
}

// User without password (API response)
interface UserDTO {
  // password excluded
}
```

### Database Queries

**Always use parameterized queries** to prevent SQL injection:
```typescript
// ✅ Good
await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ Bad
await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

**Transaction pattern** for multi-step operations:
```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // ... multiple queries
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

### Error Handling

**Backend:**
```typescript
try {
  // logic
  res.json({ success: true, data });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'User-friendly message',
    details: error instanceof Error ? error.message : 'Unknown'
  });
}
```

**Frontend:**
```typescript
try {
  const result = await api.call();
  // handle success
} catch (err) {
  alert('Error: ' + (err instanceof Error ? err.message : 'Unknown'));
}
```

## Tournament Format System (Future)

### Engine Interface

Each format will implement `TournamentEngine`:
```typescript
interface TournamentEngine {
  generateMatches(teams, config): Match[];
  calculateStandings(matches): Standing[];
  getNextPhase?(phase): Phase | null;
  validateAdvancement?(standings, config): Team[];
}
```

### Planned Formats

1. **League** (Round-robin) - Each team plays each other
2. **Knockout** (Playoff) - Single/double elimination
3. **Groups + Playoff** - Group stage → knockout
4. **Multi-level** (Golden/Silver/Bronze) - Classification groups
5. **League + Playoff** - Regular season → playoffs
6. **Swiss** - Hybrid format (like new Champions League)

### Match Scheduler

Centralized in `src/services/matchScheduler.ts`:
- `generateRoundRobin()` - Circle method algorithm
- `generateKnockoutBracket()` - Seeded or random
- `generateGroupStage()` - Divide teams into groups

## Development Guidelines

### When Adding New Features

1. **Models first** - Database queries in `src/models/`
2. **Controllers** - Request handlers in `src/controllers/`
3. **Routes** - Endpoint definitions in `src/routes/`
4. **Update server.ts** - Mount new routes
5. **Frontend API** - Add to `frontend/src/services/api.ts`
6. **Test manually** - Use curl or browser

### Code Quality

- **No hardcoded values** - Use config/env variables
- **Efficient queries** - Use indexes, avoid N+1
- **Validate inputs** - Check required fields, types
- **Consistent naming** - camelCase (TS), snake_case (DB)

### Documentation

After significant changes, update:
- `docs/DEVELOPMENT_LOG.md` - What changed
- `docs/ARCHITECTURE.md` - If structure changed
- This file (CLAUDE.md) - If patterns changed

## Common Tasks

### Add New API Endpoint

1. Define TypeScript types in `src/types/index.ts`
2. Create model method in `src/models/`
3. Create controller method in `src/controllers/`
4. Add route in `src/routes/`
5. Mount route in `src/server.ts`
6. Add to frontend `services/api.ts`

### Database Schema Change

1. Edit `scripts/migrate.js`
2. Drop database: `DROP DATABASE live_sport_sphere;`
3. Recreate: `CREATE DATABASE live_sport_sphere;`
4. Run migration: `npm run db:migrate`

### Add New Tournament Format

1. Create engine in `src/engines/` (implement `TournamentEngine`)
2. Add format type to `TournamentFormatType` in types
3. Update tournament creation validation
4. Add config schema documentation

## Performance Considerations

### Database

- **Indexes on foreign keys** - Already added in migration
- **Connection pooling** - Max 20 connections
- **Cached standings** - Pre-calculate, update on match result

### Frontend

- **Lazy loading** - Use `React.lazy()` for routes (future)
- **Code splitting** - Vite handles automatically
- **Minimal re-renders** - Use proper React keys

## Security Notes

### Current (Development)

- ❌ No authentication (test organizer hardcoded)
- ✅ SQL injection protected (parameterized queries)
- ✅ CORS configured
- ✅ Session cookies (httpOnly in production)

### Future (Production)

- ✅ Add proper auth with bcrypt
- ✅ Rate limiting (express-rate-limit)
- ✅ Input sanitization
- ✅ HTTPS only (secure cookies)
- ✅ Environment variable validation

## Known Limitations (MVP)

1. **No authentication** - Using test organizer
2. **No authorization checks** - Any user can modify any tournament
3. **No match scheduling** - Manual input only
4. **No real-time updates** - Requires page refresh
5. **No tournament engines** - Only creates structure, no match generation
6. **Basic UI** - Black text on white, no styling

## Future Enhancements

### Phase 1 (Core Features)
- [ ] Tournament format engines (generate matches)
- [ ] Match results + automatic standings
- [ ] Player statistics aggregation
- [ ] Basic authentication

### Phase 2 (UX)
- [ ] Better UI/styling (still minimalist)
- [ ] QR code for share links
- [ ] PDF export (standings, schedules)

### Phase 3 (Mobile)
- [ ] React Native app
- [ ] Push notifications

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `netstat -an | findstr 5432`
- Verify .env credentials match PostgreSQL
- Check port 3000 is free

### Frontend API errors
- Ensure backend is running on port 3000
- Check CORS configuration in server.ts
- Verify Vite proxy in vite.config.ts

### Database connection failed
- Password in .env matches PostgreSQL
- Database `live_sport_sphere` exists
- Run migration if tables missing

---

**Last Updated:** 2025-10-11
**Project Status:** MVP Complete - Backend API + Basic Frontend
