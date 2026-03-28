/**
 * API Service
 * Fetch API communication with backend
 */

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  body?: any;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Wysyła cookies
    headers: {
      'Content-Type': 'application/json',
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
  getAll: () => fetchAPI('/tournaments'),
  getPublic: () => fetchAPI('/tournaments/public'),
  getById: (id: string) => fetchAPI(`/tournaments/${id}`),
  getByShareCode: (code: string) => fetchAPI(`/tournaments/code/${code}`),
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
    fetchAPI(`/tournaments/${tournamentId}/teams`),
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
