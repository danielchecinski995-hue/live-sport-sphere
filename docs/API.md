# API Documentation - Live Sport Sphere

Base URL: `http://localhost:3000/api`

All responses follow this format:
```json
{
  "success": true | false,
  "data": ...,           // On success
  "count": number,       // For list endpoints
  "message": string,     // For mutations
  "error": string,       // On failure
  "details": string      // Error details (development only)
}
```

---

## Health Check

### `GET /api/health`
Check server and database status.

**Response:**
```json
{
  "status": "ok",
  "message": "Live Sport Sphere API is running",
  "timestamp": "2025-10-11T...",
  "database": "connected"
}
```

---

## Players API

### `GET /api/players`
Get all players for current organizer.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "creator_id": "uuid",
      "first_name": "Jan",
      "last_name": "Kowalski",
      "created_at": "2025-10-11T..."
    }
  ]
}
```

### `POST /api/players`
Create new player.

**Request Body:**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player created successfully",
  "data": { /* player object */ }
}
```

### `GET /api/players/:id`
Get single player by ID.

### `GET /api/players/:id/stats`
Get player statistics (goals, matches played).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "total_goals": 5,
    "matches_played": 3
  }
}
```

### `PUT /api/players/:id`
Update player.

**Request Body:**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski"
}
```

### `DELETE /api/players/:id`
Delete player.

### `GET /api/players/search?q=kowalski`
Search players by name.

---

## Tournaments API

### `GET /api/tournaments`
Get all tournaments for current organizer.

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "uuid",
      "name": "Turniej Orlika 2025",
      "creator_id": "uuid",
      "format_type": "league",
      "share_code": "3U9HZWB2",
      "status": "active",
      "config": {
        "points": { "win": 3, "draw": 1, "loss": 0 }
      },
      "created_at": "2025-10-11T..."
    }
  ]
}
```

### `GET /api/tournaments/public`
Get all public tournaments (status: active or finished).

**Query Parameters:**
- `limit` (optional) - Max results, default 20

### `GET /api/tournaments/code/:shareCode`
Get tournament by share code (public access, no auth required).

**Example:** `GET /api/tournaments/code/3U9HZWB2`

### `POST /api/tournaments`
Create new tournament.

**Request Body:**
```json
{
  "name": "Turniej Orlika 2025",
  "format_type": "league",
  "config": {
    "points": { "win": 3, "draw": 1, "loss": 0 }
  }
}
```

**Format Types:**
- `league` - Round-robin
- `knockout` - Elimination bracket
- `groups_playoff` - Groups then playoff
- `multi_level` - Golden/Silver/Bronze groups
- `league_playoff` - League then playoff
- `swiss` - Swiss system

**Response:**
```json
{
  "success": true,
  "message": "Tournament created successfully",
  "data": {
    "id": "uuid",
    "share_code": "3U9HZWB2",  // Auto-generated
    "status": "draft",          // Initial status
    /* ... */
  }
}
```

### `GET /api/tournaments/:id`
Get tournament by ID.

### `PUT /api/tournaments/:id`
Update tournament.

**Request Body:**
```json
{
  "name": "Updated Name",
  "format_type": "league",
  "config": { /* ... */ }
}
```

### `PATCH /api/tournaments/:id/status`
Update tournament status.

**Request Body:**
```json
{
  "status": "active"  // draft | active | finished
}
```

### `DELETE /api/tournaments/:id`
Delete tournament (cascades to teams, matches, etc.).

### `GET /api/tournaments/search?q=orlik`
Search tournaments by name (only public tournaments).

---

## Teams API

### `GET /api/tournaments/:tournamentId/teams`
Get all teams for a tournament.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "tournament_id": "uuid",
      "name": "FC Test U12",
      "logo_url": null,
      "created_at": "2025-10-11T..."
    }
  ]
}
```

### `POST /api/tournaments/:tournamentId/teams`
Create new team in tournament.

**Request Body:**
```json
{
  "name": "FC Test U12",
  "logo_url": "https://...",  // optional
  "player_ids": ["uuid1", "uuid2"]  // optional, assign players immediately
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "data": {
    "id": "uuid",
    "name": "FC Test U12",
    "players": [/* if player_ids provided */]
  }
}
```

### `GET /api/teams/:id`
Get single team.

**Query Parameters:**
- `include_players=true` - Include assigned players

**Response with players:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "FC Test U12",
    "players": [
      {
        "id": "uuid",
        "first_name": "Jan",
        "last_name": "Kowalski"
      }
    ]
  }
}
```

### `PUT /api/teams/:id`
Update team.

**Request Body:**
```json
{
  "name": "FC Test U12",
  "logo_url": "https://..."
}
```

### `DELETE /api/teams/:id`
Delete team.

---

## Team-Player Assignment

### `GET /api/teams/:id/players`
Get players assigned to team.

### `POST /api/teams/:id/players`
Add single player to team.

**Request Body:**
```json
{
  "player_id": "uuid"
}
```

### `PUT /api/teams/:id/players`
Set team players (replaces all current assignments).

**Request Body:**
```json
{
  "player_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team players updated",
  "data": {
    "players": [/* array of player objects */]
  }
}
```

### `DELETE /api/teams/:id/players/:playerId`
Remove player from team.

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to ...",
  "details": "Error details (development only)"
}
```

---

## Testing Examples (curl)

### Create Player
```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Jan","last_name":"Kowalski"}'
```

### Create Tournament
```bash
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Turniej Orlika 2025",
    "format_type":"league",
    "config":{"points":{"win":3,"draw":1,"loss":0}}
  }'
```

### Get Public Tournaments
```bash
curl http://localhost:3000/api/tournaments/public
```

### Get Tournament by Share Code
```bash
curl http://localhost:3000/api/tournaments/code/3U9HZWB2
```

### Create Team with Players
```bash
curl -X POST http://localhost:3000/api/tournaments/{tournamentId}/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name":"FC Test U12",
    "player_ids":["player-uuid-1","player-uuid-2"]
  }'
```

---

## Future Endpoints (Not Yet Implemented)

### Matches API
- `GET /api/tournaments/:id/matches` - Get all matches
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match result
- `POST /api/matches/:id/goals` - Add goal scorer

### Standings API
- `GET /api/tournaments/:id/standings` - Get tournament table
- `GET /api/tournaments/:id/standings/:groupId` - Get group standings

### Auth API
- `POST /api/auth/register` - Register organizer
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

---

**Last Updated:** 2025-10-11
