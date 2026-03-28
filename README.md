# Live Sport Sphere 🏆

System zarządzania turniejami sportowymi dla młodzieżowych rozgrywek. Umożliwia organizatorom tworzenie turniejów, zarządzanie drużynami i wynikami, a uczestnikom łatwy dostęp do terminarzów i tabel.

## Funkcjonalności

### Dla Organizatorów
- Tworzenie i zarządzanie turniejami
- Dodawanie drużyn z herbami
- Wybór formatu rozgrywek (liga, puchar, grupy+playoff, etc.)
- Wprowadzanie wyników meczów
- Historia własnych turniejów

### Dla Uczestników/Widzów
- Publiczny dostęp do turniejów (bez logowania)
- Przeglądanie terminarzów
- Tabele i rankingi
- Wyniki meczów na żywo

## Stack Technologiczny

### Backend
- **Node.js** + **TypeScript** - wydajny runtime z typowaniem
- **Express.js** - minimalistyczny framework
- **PostgreSQL** - relacyjna baza danych
- **express-session** - zarządzanie sesjami (bez JWT)
- **bcrypt** - hashowanie haseł

### Frontend
- **React 18** - biblioteka UI
- **Vite** - super szybki bundler
- **TypeScript** - typowanie
- **Fetch API** - komunikacja z backend (bez axios)
- **CSS** - czysty CSS (bez UI library na razie)

### Dlaczego ten stack?
✅ Lekki - minimalne zależności
✅ Szybki - Vite + optymalizowany kod
✅ Typowanie - mniej błędów w runtime
✅ Prosty - łatwy w utrzymaniu

## Instalacja i Uruchomienie (Lokalne)

### Wymagania
- Node.js 18+ ([pobierz tutaj](https://nodejs.org/))
- PostgreSQL 14+ ([pobierz tutaj](https://www.postgresql.org/download/))
- npm lub yarn

### Krok 1: Sklonuj repozytorium
```bash
git clone <repo-url>
cd live-sport-sphere
```

### Krok 2: Setup Backend

```bash
cd backend

# Zainstaluj zależności
npm install

# Stwórz plik .env (skopiuj z .env.example)
cp .env.example .env

# Edytuj .env i ustaw dane do PostgreSQL:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=live_sport_sphere
# DB_USER=postgres
# DB_PASSWORD=twoje_haslo
```

### Krok 3: Stwórz bazę danych

```bash
# Zaloguj się do PostgreSQL
psql -U postgres

# W konsoli PostgreSQL:
CREATE DATABASE live_sport_sphere;
\q

# Uruchom migracje (stwórz tabele)
npm run db:migrate
```

### Krok 4: Uruchom Backend

```bash
# Tryb deweloperski (hot reload)
npm run dev

# Backend działa na http://localhost:3000
```

### Krok 5: Setup Frontend

```bash
# Otwórz nowy terminal
cd frontend

# Zainstaluj zależności
npm install

# Uruchom frontend
npm run dev

# Frontend działa na http://localhost:5173
```

### Krok 6: Otwórz aplikację

Otwórz przeglądarkę: **http://localhost:5173**

## Struktura Projektu

```
live-sport-sphere/
├── backend/
│   ├── src/
│   │   ├── config/         # Konfiguracja (DB, session)
│   │   ├── controllers/    # Logika endpointów
│   │   ├── engines/        # Silniki formatów turniejów
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/         # Modele danych (DB queries)
│   │   ├── routes/         # Definicje API routes
│   │   ├── services/       # Logika biznesowa
│   │   ├── types/          # TypeScript typy
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Główny plik serwera
│   ├── scripts/
│   │   └── migrate.js      # Skrypty migracji DB
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Komponenty React
│   │   ├── pages/          # Strony (widoki)
│   │   ├── services/       # API calls (Fetch)
│   │   ├── types/          # TypeScript typy
│   │   ├── utils/          # Helper functions
│   │   ├── App.tsx         # Główny komponent
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   └── package.json
│
├── docs/                   # Dokumentacja techniczna
└── README.md
```

## Formaty Turniejów (Do Implementacji)

System wspiera następujące formaty:

1. **Liga Klasyczna** - każdy z każdym (1 lub 2 rundy)
2. **System Pucharowy** - eliminacje (1/16, 1/8, ćwierćfinały, etc.)
3. **Grupy + Playoff** - faza grupowa → play-off
4. **Golden/Silver/Bronze** - podział po fazie grupowej
5. **Liga + Playoff** - sezon regularny → play-off finałowy
6. **System Szwajcarski** - hybrydowy (nowy format LM)

Szczegóły implementacji: `docs/TOURNAMENT_FORMATS.md`

## API Endpoints (Planowane)

```
Auth:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

Tournaments:
GET    /api/tournaments          # Publiczne - lista turniejów
GET    /api/tournaments/:code    # Publiczne - szczegóły turnieju
POST   /api/tournaments          # Auth - utwórz turniej
PUT    /api/tournaments/:id      # Auth - edytuj (tylko creator)

Teams:
GET    /api/tournaments/:id/teams
POST   /api/tournaments/:id/teams  # Auth

Matches:
GET    /api/tournaments/:id/matches
PUT    /api/matches/:id             # Auth - wprowadź wynik

Standings:
GET    /api/tournaments/:id/standings
```

Pełna dokumentacja API: `docs/API.md` (po implementacji)

## Zasady Rozwoju

### Kod musi być:
- **Lekki** - zero zbędnych zależności
- **Efektywny** - optymalizowany, bez hardkodowania
- **Czysty** - czytelny, z komentarzami w kluczowych miejscach
- **Typowany** - pełne wykorzystanie TypeScript

### Dokumentacja:
Po każdym milestone (np. ukończenie backendu) aktualizujemy:
- Ten README.md
- Dokumentację techniczną w `/docs`
- Komentarze w kodzie

## Roadmap

### Faza 1: MVP (Aktualnie) ✅
- [x] Setup projektu
- [ ] Baza danych i migracje
- [ ] System autoryzacji (session)
- [ ] Podstawowy CRUD turniejów
- [ ] Pierwszy format: Liga Klasyczna
- [ ] Frontend: tworzenie turnieju + widok publiczny

### Faza 2: Więcej Formatów
- [ ] System pucharowy
- [ ] Grupy + Playoff
- [ ] Golden/Silver/Bronze

### Faza 3: UX Enhancement
- [ ] Styling (nadal minimalistyczny)
- [ ] QR kody do udostępniania
- [ ] Export PDF

### Faza 4: Aplikacja Mobilna
- [ ] React Native
- [ ] Powiadomienia push

## Status Projektu

🚧 **W budowie** - Faza 1 (MVP)

Ostatnia aktualizacja: 2025-10-11

---

Stworzone z ❤️ dla społeczności sportowej młodzieży
