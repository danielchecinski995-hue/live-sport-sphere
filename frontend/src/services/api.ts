/**
 * API Service
 * Fetch API communication with backend
 */

import { getAuth } from 'firebase/auth';

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  body?: any;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Get Firebase auth token
  const auth = getAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Helper to extract data array from {success, count, data} responses
async function fetchData(endpoint: string, options: FetchOptions = {}) {
  const result = await fetchAPI(endpoint, options);
  return result.data ?? result;
}

// ========================================
// Players API
// ========================================

export const playersAPI = {
  getAll: () => fetchAPI('/players'),
  getById: (id: string) => fetchAPI(`/players/${id}`),
  create: (data: { first_name: string; last_name: string }) =>
    fetchAPI('/players', { method: 'POST', body: data }),
  delete: (id: string) => fetchAPI(`/players/${id}`, { method: 'DELETE' }),
};

// ========================================
// Tournaments API
// ========================================

export const tournamentsAPI = {
  getAll: () => fetchData('/tournaments'),
  getPublic: () => fetchData('/tournaments?is_public=true'),
  getById: (id: string) => fetchData(`/tournaments/${id}`),
  getByShareCode: (code: string) => fetchData(`/tournaments/code/${code}`),
  getTeams: (id: string) => fetchData(`/tournaments/${id}/teams`),
  getMatches: (id: string) => fetchData(`/tournaments/${id}/matches`),
  getStandings: (id: string) => fetchData(`/tournaments/${id}/standings`),
  create: (data: {
    name: string;
    format_type: string;
    config?: any;
  }) => fetchAPI('/tournaments', { method: 'POST', body: data }),
  updateStatus: (id: string, status: string) =>
    fetchAPI(`/tournaments/${id}/status`, { method: 'PATCH', body: { status } }),
  delete: (id: string) => fetchAPI(`/tournaments/${id}`, { method: 'DELETE' }),
};

// ========================================
// Teams API
// ========================================

export const teamsAPI = {
  getByTournament: (tournamentId: string) =>
    fetchData(`/tournaments/${tournamentId}/teams`),
  getById: (id: string, includePlayers = false) =>
    fetchAPI(`/teams/${id}?include_players=${includePlayers}`),
  create: (tournamentId: string, data: { name: string; player_ids?: string[] }) =>
    fetchAPI(`/tournaments/${tournamentId}/teams`, { method: 'POST', body: data }),
  setPlayers: (teamId: string, playerIds: string[]) =>
    fetchAPI(`/teams/${teamId}/players`, {
      method: 'PUT',
      body: { player_ids: playerIds },
    }),
  delete: (id: string) => fetchAPI(`/teams/${id}`, { method: 'DELETE' }),
};

// ========================================
// Matches API
// ========================================

export const matchesAPI = {
  getById: (id: string) => fetchData(`/matches/${id}`),
  getTeams: (id: string) => fetchData(`/matches/${id}/teams`),
  getGoalScorers: (id: string) => fetchData(`/matches/${id}/goal-scorers`),
  getCards: (id: string) => fetchData(`/matches/${id}/cards`),
  getSubstitutions: (id: string) => fetchData(`/matches/${id}/substitutions`),
  addGoalScorer: (matchId: string, data: { player_id: string; team_id: string; is_own_goal?: boolean }) =>
    fetchAPI(`/matches/${matchId}/goal-scorers`, { method: 'POST', body: data }),
  addCard: (matchId: string, data: { player_id: string; team_id: string; card_type: string; minute?: number }) =>
    fetchAPI(`/matches/${matchId}/cards`, { method: 'POST', body: data }),
  addSubstitution: (matchId: string, data: { teamId: string; playerOutId: string; playerInId: string; minute?: number }) =>
    fetchAPI(`/matches/${matchId}/substitutions`, { method: 'POST', body: data }),
  updateStatus: (matchId: string, status: string) =>
    fetchAPI(`/matches/${matchId}/status`, { method: 'PUT', body: { status } }),
  updateResult: (matchId: string, data: { home_score: number; away_score: number; goal_scorers?: any[] }) =>
    fetchAPI(`/matches/${matchId}/result`, { method: 'PUT', body: data }),
};
