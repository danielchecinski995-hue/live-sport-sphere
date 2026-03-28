# Architektura Techniczna - Live Sport Sphere

## Przegląd Systemu

Live Sport Sphere to aplikacja webowa składająca się z trzech głównych warstw:

1. **Frontend** (React + TypeScript) - interfejs użytkownika
2. **Backend** (Node.js + Express) - API i logika biznesowa
3. **Database** (PostgreSQL) - przechowywanie danych

```
┌─────────────────┐
│   React Client  │ ← Użytkownik (organizator/widz)
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP (Fetch API)
         ↓
┌─────────────────┐
│  Express Server │ ← REST API
│   (Port 3000)   │
└────────┬────────┘
         │ SQL Queries (pg)
         ↓
┌─────────────────┐
│   PostgreSQL    │ ← Dane
│   (Port 5432)   │
└─────────────────┘
```

---

## Backend Architecture

### Warstwa API (Express Routes)

**Routing:**
```typescript
/api/auth/*          → authRoutes       (rejestracja, login, logout)
/api/tournaments/*   → tournamentRoutes (CRUD turniejów)
/api/teams/*         → teamRoutes       (zarządzanie drużynami)
/api/matches/*       → matchRoutes      (wyniki meczów)
/api/standings/*     → standingsRoutes  (tabele/rankingi)
```

**Middleware Stack:**
```
Request
  → CORS (cors)
  → Body Parser (express.json)
  → Session (express-session)
  → Routes
    → Auth Middleware (requireAuth) [opcjonalnie]
    → Controller
      → Service (business logic)
        → Model (DB queries)
  → Error Handler
Response
```

### Silniki Formatów Turniejowych (Engines)

Każdy format turnieju to osobna klasa implementująca interfejs `TournamentEngine`:

```typescript
interface TournamentEngine {
  // Generuje harmonogram meczów
  generateMatches(teams: Team[], config: FormatConfig): Match[]

  // Oblicza tabelę/ranking
  calculateStandings(matches: Match[]): Standing[]

  // Sprawdza, czy są następne fazy (dla turniejów wielofazowych)
  getNextPhase(currentPhase: Phase): Phase | null

  // Określa, które drużyny awansują
  validateAdvancement(standings: Standing[], rules: AdvancementRules): Team[]
}
```

**Zaimplementowane silniki:**

1. **LeagueEngine** - Liga klasyczna
   - Round-robin (każdy z każdym)
   - 1 lub 2 rundy
   - Punktacja: 3-1-0

2. **KnockoutEngine** - System pucharowy
   - Eliminacje (1/16, 1/8, ćwierćfinały, półfinały, finał)
   - Seeding (rozstawienie) opcjonalny
   - Dwumecze lub single-match

3. **GroupsPlayoffEngine** - Grupy + Playoff
   - Faza 1: Podział na grupy → round-robin
   - Faza 2: TOP drużyny → knockout
   - Przenoszenie wyników opcjonalne

4. **MultiLevelEngine** - Golden/Silver/Bronze
   - Faza 1: Grupy wstępne
   - Faza 2: Grupy klasyfikacyjne (według pozycji)
   - Przenoszenie wyników z meczów bezpośrednich

5. **LeaguePlayoffEngine** - Liga + Playoff
   - Faza 1: Sezon regularny (liga)
   - Faza 2: Playoff dla TOP drużyn
   - Warianty: eliminacyjny, pozycyjny, split

6. **SwissEngine** - System szwajcarski
   - Pojedyncza pula (bez grup)
   - Parowanie według aktualnej tabeli
   - 5-8 rund → TOP awansuje

### Match Scheduler (Harmonogram)

Centralna klasa do generowania par meczowych:

```typescript
class MatchScheduler {
  // Liga: algorytm round-robin
  generateRoundRobin(teams: Team[], doubleRound: boolean): Match[]

  // Puchar: drabinka eliminacyjna (bracket)
  generateKnockoutBracket(teams: Team[], seeded: boolean): Match[]

  // Grupy: podział + round-robin w każdej grupie
  generateGroupStage(teams: Team[], groupsConfig: GroupConfig): Match[]

  // Playoff pozycyjny (1vs2, 3vs4, 5vs6...)
  generatePositionalPlayoff(standings: Standing[]): Match[]

  // Szwajcarski: parowanie według rankingu
  generateSwissPairings(standings: Standing[], round: number): Match[]
}
```

**Algorytm Round-Robin (przykład):**
```typescript
// Rotacja drużyn (circle method)
// [1,2,3,4] → kolejki: (1-4, 2-3), (1-3, 4-2), (1-2, 3-4)
```

---

## Database Schema

### Główne Tabele

**users** - Organizatorzy turniejów
```sql
id           UUID PRIMARY KEY
email        VARCHAR UNIQUE NOT NULL
password     VARCHAR NOT NULL  -- bcrypt hash
name         VARCHAR
created_at   TIMESTAMP
```

**tournaments** - Turnieje
```sql
id              UUID PRIMARY KEY
name            VARCHAR NOT NULL
creator_id      UUID REFERENCES users(id)
format_type     VARCHAR NOT NULL  -- 'league', 'knockout', 'groups_playoff', etc.
share_code      VARCHAR(8) UNIQUE NOT NULL  -- kod do udostępniania
status          VARCHAR  -- 'draft', 'active', 'finished'
created_at      TIMESTAMP
config          JSONB  -- elastyczna konfiguracja (patrz niżej)
```

**tournament_config (JSONB structure):**
```json
{
  "points": { "win": 3, "draw": 1, "loss": 0 },
  "match_type": "single" | "double",
  "groups": {
    "count": 4,
    "teams_per_group": 4,
    "rounds": 1
  },
  "advancement": {
    "per_group": 2,
    "best_thirds": 0
  },
  "playoff": {
    "type": "knockout" | "positional",
    "teams": 8
  }
}
```

**teams** - Drużyny
```sql
id              UUID PRIMARY KEY
tournament_id   UUID REFERENCES tournaments(id) ON DELETE CASCADE
name            VARCHAR NOT NULL
logo_url        VARCHAR
created_at      TIMESTAMP
```

**phases** - Fazy turnieju (dla multi-phase formats)
```sql
id              UUID PRIMARY KEY
tournament_id   UUID REFERENCES tournaments(id) ON DELETE CASCADE
phase_type      VARCHAR  -- 'group_stage', 'playoff', 'golden_group', etc.
phase_order     INT
status          VARCHAR  -- 'pending', 'active', 'completed'
```

**groups** - Grupy (dla formatów grupowych)
```sql
id         UUID PRIMARY KEY
phase_id   UUID REFERENCES phases(id) ON DELETE CASCADE
name       VARCHAR  -- 'Grupa A', 'Golden Group', etc.
```

**matches** - Mecze
```sql
id              UUID PRIMARY KEY
phase_id        UUID REFERENCES phases(id) ON DELETE CASCADE
group_id        UUID REFERENCES groups(id) [nullable]
home_team_id    UUID REFERENCES teams(id) ON DELETE CASCADE
away_team_id    UUID REFERENCES teams(id) ON DELETE CASCADE
home_score      INT [nullable]
away_score      INT [nullable]
match_date      TIMESTAMP [nullable]
match_order     INT  -- kolejność w harmonogramie
status          VARCHAR  -- 'scheduled', 'completed'
```

**standings** - Tabele/Rankingi (cache)
```sql
id               UUID PRIMARY KEY
phase_id         UUID REFERENCES phases(id)
group_id         UUID REFERENCES groups(id) [nullable]
team_id          UUID REFERENCES teams(id)
points           INT DEFAULT 0
wins             INT DEFAULT 0
draws            INT DEFAULT 0
losses           INT DEFAULT 0
goals_for        INT DEFAULT 0
goals_against    INT DEFAULT 0
goal_difference  INT GENERATED ALWAYS AS (goals_for - goals_against)
position         INT
updated_at       TIMESTAMP
```

**Indeksy dla wydajności:**
```sql
CREATE INDEX idx_tournaments_creator ON tournaments(creator_id);
CREATE INDEX idx_tournaments_share_code ON tournaments(share_code);
CREATE INDEX idx_matches_phase ON matches(phase_id);
CREATE INDEX idx_standings_phase ON standings(phase_id);
```

---

## Frontend Architecture

### Struktura Komponentów

```
App.tsx
├── Router
    ├── PublicLayout
    │   ├── HomePage
    │   └── TournamentViewPage (publiczny dostęp)
    │       ├── TournamentHeader
    │       ├── StandingsTable
    │       ├── MatchesList
    │       └── PhaseSelector
    │
    └── AuthLayout (wymaga logowania)
        ├── LoginPage
        ├── RegisterPage
        └── DashboardPage
            ├── MyTournaments
            ├── CreateTournamentWizard
            │   ├── Step1BasicInfo
            │   ├── Step2FormatConfig
            │   ├── Step3AddTeams
            │   └── Step4Review
            └── ManageTournamentPage
                ├── EditTeams
                ├── MatchResults
                └── AdvancePhase
```

### State Management

**Prosty stan (bez Redux/Zustand na MVP):**

```typescript
// Context API dla auth
AuthContext
  ├── user: User | null
  ├── isAuthenticated: boolean
  └── login/logout functions

// Local state w komponentach
useState() dla formularzy, UI state
```

### API Communication (services/)

```typescript
// services/api.ts
const API_BASE = '/api';

// Helper z obsługą sesji
async function fetchAPI(endpoint: string, options?: RequestInit) {
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',  // Wysyła cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
}

// services/tournamentService.ts
export const tournamentService = {
  getAll: () => fetchAPI('/tournaments'),
  getByCode: (code: string) => fetchAPI(`/tournaments/${code}`),
  create: (data: CreateTournamentDTO) =>
    fetchAPI('/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  // ...
};
```

---

## Przepływ Danych

### Tworzenie Turnieju (Organizator)

```
1. Frontend: Formularz → CreateTournamentDTO
   ↓
2. POST /api/tournaments (+ cookie sesji)
   ↓
3. Backend: Middleware sprawdza auth
   ↓
4. Controller → Service
   ↓
5. Service:
   - Generuje share_code (random 8-char)
   - Zapisuje tournament + config (JSONB)
   - Zwraca tournament object
   ↓
6. Frontend: Redirect → /manage-tournament/:id
```

### Przeglądanie Turnieju (Widz)

```
1. Widz otwiera: /t/ABC123 (share_code)
   ↓
2. GET /api/tournaments/ABC123 (BEZ auth!)
   ↓
3. Backend: TournamentModel.findByShareCode()
   ↓
4. Zwraca: tournament + teams + matches + standings
   ↓
5. Frontend: Renderuje TournamentViewPage
```

### Wprowadzanie Wyniku Meczu (Organizator)

```
1. Frontend: Formularz (home_score, away_score)
   ↓
2. PUT /api/matches/:id (+ cookie)
   ↓
3. Backend: Sprawdza czy user jest creator turnieju
   ↓
4. MatchService.updateResult():
   - Aktualizuje match
   - Przelicza standings (StandingsService)
   - Sprawdza czy faza zakończona
   ↓
5. Frontend: Odświeża dane (re-fetch)
```

---

## Security & Performance

### Bezpieczeństwo

**Autoryzacja:**
- Session cookies (httpOnly, secure w produkcji)
- CSRF protection (express-session domyślnie)
- Rate limiting (opcjonalnie: express-rate-limit)

**Walidacja:**
- Backend: Walidacja wszystkich inputów
- SQL injection: Parametryzowane zapytania (pg placeholders)
- XSS: React automatycznie escapuje (dangerouslySetInnerHTML zabroniony)

**Hasła:**
- bcrypt z salt rounds = 10
- Nigdy nie zwracamy password_hash w API

### Wydajność

**Backend:**
- Connection pooling (pg.Pool)
- Indeksy na foreign keys
- Cache standings (przeliczaj tylko po zmianie)

**Frontend:**
- Lazy loading routes (React.lazy)
- Vite code splitting (automatyczny)
- Optymalizacja obrazów (WebP, lazy loading)

**Database:**
- EXPLAIN ANALYZE dla złożonych zapytań
- Partial indexes dla często filtrowanych kolumn

---

## Deployment (Przyszłość)

**Backend:**
- Heroku / Railway / Render
- Zmienne środowiskowe (.env → platform config)

**Frontend:**
- Vercel / Netlify
- Build: `npm run build` → dist/

**Database:**
- Heroku Postgres / Supabase / Neon

**CI/CD:**
- GitHub Actions (testy + deploy)

---

*Dokumentacja aktualizowana w miarę rozwoju projektu.*
