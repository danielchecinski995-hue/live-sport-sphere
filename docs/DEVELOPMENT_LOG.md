# Development Log - Live Sport Sphere

Dziennik rozwoju aplikacji do zarządzania turniejami sportowymi.

---

## 2025-10-11: Inicjalizacja Projektu

### Milestone: Project Setup ✅

**Wykonane:**
1. ✅ Utworzono strukturę projektu (backend + frontend)
2. ✅ Skonfigurowano TypeScript dla obu części
3. ✅ Setup Node.js + Express (backend)
4. ✅ Setup React + Vite (frontend)
5. ✅ Utworzono dokumentację podstawową

**Stack Technologiczny:**
- Backend: Node.js, Express, TypeScript, PostgreSQL, express-session, bcrypt
- Frontend: React 18, Vite, TypeScript, Fetch API
- Baza: PostgreSQL (relacyjna)

**Struktura katalogów:**

```
backend/
├── src/
│   ├── config/         # DB connection, session config
│   ├── controllers/    # Request handlers
│   ├── engines/        # Tournament format engines (LeagueEngine, etc.)
│   ├── middleware/     # Auth, error handling
│   ├── models/         # Database queries
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helpers
│   └── server.ts       # Main server file
└── scripts/
    └── migrate.js      # DB migrations

frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page views
│   ├── services/       # API communication
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helpers
│   ├── App.tsx
│   └── main.tsx
└── index.html
```

**Decyzje Architektoniczne:**

1. **Autoryzacja bez JWT:**
   - Używamy express-session + cookies
   - Prostsze, lżejsze, idealne dla MVP
   - Organizator loguje się raz, przeglądarka pamięta sesję
   - Publiczny dostęp bez logowania (tylko link/kod)

2. **Fetch API zamiast axios:**
   - Natywny w przeglądarkach (0 KB extra)
   - Wystarczający dla prostej komunikacji REST
   - Async/await dla czystego kodu

3. **Vite zamiast Create React App:**
   - 10x szybszy build
   - Lżejszy bundle
   - Hot Module Replacement

4. **PostgreSQL zamiast MongoDB:**
   - Relacje: turnieje → grupy → mecze → drużyny
   - ACID transactions dla integralności wyników
   - Lepsze zapytania SQL dla tabel/rankingów

**Pliki konfiguracyjne:**
- `package.json` (backend + frontend)
- `tsconfig.json` (strict mode)
- `vite.config.ts` (proxy do backend)
- `.env.example` (template dla zmiennych środowiskowych)

**Następne kroki:**
- Schemat bazy danych
- Skrypt migracji
- Podstawowa konfiguracja serwera

---

## 2025-10-11: MVP Complete - Backend API + Basic Frontend ✅

### Milestone: Fully Functional Application

**Wykonane:**

**1. Database Schema & Migrations** ✅
- Utworzono 10 tabel w PostgreSQL
- Tabele: users, players, tournaments, teams, team_players, phases, groups, matches, goal_scorers, standings
- Dodano indeksy dla wydajności (foreign keys, share_code)
- Seed data: Test Organizer (ID: 00000000-0000-0000-0000-000000000001)
- Migracja działa: `npm run db:migrate`

**2. Players API** ✅
- `GET /api/players` - Lista zawodników organizatora
- `POST /api/players` - Dodaj zawodnika (first_name, last_name)
- `PUT /api/players/:id` - Edytuj zawodnika
- `DELETE /api/players/:id` - Usuń zawodnika
- `GET /api/players/:id/stats` - Statystyki (bramki, mecze)
- `GET /api/players/search?q=...` - Szukaj po nazwisku

**Testowane:**
- Utworzono 3 zawodników: Jan Kowalski, Adam Nowak, Michał Wiśniewski
- Model: `PlayerModel` (src/models/playerModel.ts)
- Controller: `PlayerController` (src/controllers/playerController.ts)

**3. Tournaments API** ✅
- `GET /api/tournaments` - Moje turnieje
- `GET /api/tournaments/public` - Publiczne turnieje (active/finished)
- `GET /api/tournaments/code/:shareCode` - Dostęp po kodzie (publiczny)
- `POST /api/tournaments` - Utwórz turniej (name, format_type, config)
- `PATCH /api/tournaments/:id/status` - Zmień status (draft → active → finished)
- `PUT /api/tournaments/:id` - Edytuj turniej
- `DELETE /api/tournaments/:id` - Usuń turniej

**Share Code System:**
- Automatycznie generowany 8-znakowy kod (bez podobnych znaków: 0/O, 1/I/L)
- Unikalność sprawdzana przed zapisem
- Przykład: "3U9HZWB2"

**Testowane:**
- Utworzono "Turniej Orlika 2025" (share_code: 3U9HZWB2)
- Status zmieniony: draft → active
- Model: `TournamentModel` (src/models/tournamentModel.ts)

**4. Teams API** ✅
- `GET /api/tournaments/:id/teams` - Drużyny w turnieju
- `POST /api/tournaments/:id/teams` - Utwórz drużynę (name, player_ids[])
- `GET /api/teams/:id?include_players=true` - Drużyna z zawodnikami
- `PUT /api/teams/:id/players` - Przypisz zawodników (player_ids[])
- `POST /api/teams/:id/players` - Dodaj zawodnika
- `DELETE /api/teams/:id/players/:playerId` - Usuń zawodnika
- `DELETE /api/teams/:id` - Usuń drużynę

**Testowane:**
- Utworzono "FC Test U12"
- Przypisano zawodników: Jan Kowalski, Adam Nowak
- Model: `TeamModel` (src/models/teamModel.ts)

**5. Frontend React + Vite** ✅
- Formularz tworzenia turnieju
- Lista "Moje Turnieje" (z share_code, status)
- Lista "Publiczne Turnieje" (active/finished)
- Przycisk aktywacji turnieju (draft → active)
- API service z Fetch (src/services/api.ts)
- Minimalistyczny UI (czarny tekst, białe tło)

**Struktura:**
```
frontend/src/
├── services/api.ts      # Fetch API wrapper (playersAPI, tournamentsAPI, teamsAPI)
├── App.tsx              # Main component (tournament list, create form)
└── main.tsx             # Entry point
```

**Decyzje Techniczne:**

**1. Zawodnicy jako pula organizatora:**
- `players` tabela z `creator_id`
- Organizator dodaje zawodników raz, potem przypisuje do różnych drużyn
- `team_players` tabela łączy zawodników z drużynami (many-to-many)

**2. Statystyki zawodników:**
- `goal_scorers` tabela: match_id, player_id, team_id, goals_count
- Agregacja przez JOIN dla statystyk gracza
- Na razie tylko bramki, gotowe na rozszerzenie (kartki, asysty)

**3. Session-based auth (bez JWT):**
- express-session + cookies
- Prostsze dla MVP
- Test organizer hardcoded (ID: 00000000-0000-0000-0000-000000000001)
- Gotowe do dodania prawdziwej autoryzacji później

**4. Fetch API zamiast axios:**
- Natywny w przeglądarkach (0 KB)
- credentials: 'include' dla cookies
- Centralizacja w services/api.ts

**Dane Testowe w Bazie:**
```
Organizator: Test Organizer (test@livesportsphere.com)
Zawodnicy:
  - Jan Kowalski
  - Adam Nowak
  - Michał Wiśniewski
Turniej: Turniej Orlika 2025
  - Format: league
  - Share Code: 3U9HZWB2
  - Status: active
Drużyna: FC Test U12
  - Zawodnicy: Jan Kowalski, Adam Nowak
```

**Uruchomione Serwery:**
- Backend: http://localhost:3000 (tsx watch, hot reload)
- Frontend: http://localhost:5173 (Vite dev server)
- PostgreSQL: localhost:5432

**Kluczowe Pliki:**
```
backend/src/
├── server.ts                    # Express app, CORS, sessions, routes
├── config/database.ts           # PostgreSQL pool (max 20 connections)
├── utils/generateCode.ts        # Share code generator
├── models/*.ts                  # Database queries (PlayerModel, TournamentModel, TeamModel)
├── controllers/*.ts             # Request handlers
└── routes/*.ts                  # Route definitions

backend/scripts/
└── migrate.js                   # Database migration (13 steps)

frontend/src/
├── services/api.ts              # API communication
└── App.tsx                      # Main UI component
```

**Co działa:**
✅ Tworzenie turniejów z konfiguracją JSONB
✅ Generowanie unikalnych share codes
✅ Publiczny dostęp po kodzie (bez logowania)
✅ Przypisywanie zawodników do drużyn
✅ Frontend wyświetla turnieje i pozwala tworzyć nowe
✅ Hot reload dla backendu i frontendu

**Co NIE zostało zaimplementowane (zaplanowane na przyszłość):**
- ❌ Tournament format engines (generowanie meczów)
- ❌ Match results API (wprowadzanie wyników)
- ❌ Standings calculation (automatyczne tabele)
- ❌ Prawdziwa autoryzacja (login/register)
- ❌ Widok szczegółów turnieju
- ❌ Zarządzanie drużynami w UI

---

## Następny Milestone: Match Generation & Results

**Do zrobienia:**
1. Implementacja Tournament Engines:
   - LeagueEngine (round-robin, każdy z każdym)
   - KnockoutEngine (drabinka eliminacyjna)
   - GroupsPlayoffEngine (grupy + playoff)

2. Match Scheduler:
   - Algorytm generowania par round-robin
   - Generowanie harmonogramu meczów
   - Zapisywanie do tabeli `matches`

3. Matches API:
   - `GET /api/tournaments/:id/matches` - Harmonogram meczów
   - `PUT /api/matches/:id` - Wprowadź wynik (home_score, away_score, goal_scorers)
   - `GET /api/matches/:id` - Szczegóły meczu z zawodnikami

4. Standings Calculation:
   - Automatyczne przeliczanie tabeli po wprowadzeniu wyniku
   - Aktualizacja tabeli `standings` (punkty, bramki, bilans)
   - Ranking według: punkty → różnica bramek → bramki strzelone

5. Frontend - Widok Turnieju:
   - Strona `/tournament/:shareCode`
   - Wyświetlanie drużyn, meczów, tabeli
   - Formularz wprowadzania wyników (tylko dla creatora)

**Kryteria sukcesu:**
- Automatyczne generowanie meczów przy starcie turnieju
- Wprowadzanie wyników aktualizuje tabelę w czasie rzeczywistym
- Publiczny widok turnieju działa bez logowania

---

## Coding Principles

**Efektywność:**
- Zero hardkodowania - wszystko z konfiguracji/bazy
- Reużywalne funkcje (DRY principle)
- Optymalne zapytania SQL (indexed columns)

**Czytelność:**
- Nazwy zmiennych/funkcji opisowe (camelCase)
- Komentarze dla złożonej logiki
- TypeScript interfaces dla wszystkich struktur danych

**Lekki kod:**
- Minimalne zależności (tylko niezbędne biblioteki)
- Tree-shaking w Vite (nieużywany kod nie trafia do bundle)
- Lazy loading komponentów React (React.lazy)

---

*Dokumentacja aktualizowana po każdym milestone.*
