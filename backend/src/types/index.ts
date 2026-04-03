/**
 * TypeScript Type Definitions
 * Centralne typy dla całego backendu
 */

// ========================================
// User Types
// ========================================

export interface User {
  id: string;
  email: string;
  password: string; // bcrypt hash
  name: string | null;
  created_at: Date;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  // password nigdy nie jest zwracany w DTO!
}

// ========================================
// Tournament Types
// ========================================

export type TournamentFormatType =
  | 'league'              // Liga klasyczna
  | 'knockout'            // System pucharowy
  | 'groups_playoff'      // Grupy + Playoff
  | 'multi_level'         // Golden/Silver/Bronze
  | 'league_playoff'      // Liga + Playoff
  | 'swiss';              // System szwajcarski

export type TournamentStatus = 'draft' | 'active' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  creator_id: string;
  format_type: TournamentFormatType;
  share_code: string;
  status: TournamentStatus;
  config: TournamentConfig;
  referees: string[];
  created_at: Date;
}

// Konfiguracja turnieju (JSONB w bazie)
export interface TournamentConfig {
  points?: {
    win: number;
    draw: number;
    loss: number;
  };
  match_type?: 'single' | 'double'; // jeden mecz vs dwumecz
  groups?: {
    count: number;
    teams_per_group: number;
    rounds: number; // 1 = każdy z każdym raz, 2 = dwukrotnie
  };
  advancement?: {
    per_group: number;        // ile z każdej grupy awansuje
    best_thirds?: number;     // ile najlepszych trzecich miejsc
  };
  playoff?: {
    type: 'knockout' | 'positional' | 'split';
    teams: number;
  };
  swiss?: {
    rounds: number;
  };
}

// ========================================
// Player Types
// ========================================

export interface Player {
  id: string;
  creator_id: string;
  first_name: string;
  last_name: string;
  created_at: Date;
}

export interface PlayerWithStats extends Player {
  total_goals: number;
  matches_played: number;
}

// ========================================
// Team Types
// ========================================

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  logo_url: string | null;
  coach_name: string | null;
  created_at: Date;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

// ========================================
// Team-Player Assignment
// ========================================

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  jersey_number: number | null;
  is_starter: boolean;
}

// ========================================
// Phase Types
// ========================================

export type PhaseType =
  | 'group_stage'
  | 'playoff'
  | 'golden_group'
  | 'silver_group'
  | 'bronze_group'
  | 'knockout_round';

export type PhaseStatus = 'pending' | 'active' | 'completed';

export interface Phase {
  id: string;
  tournament_id: string;
  phase_type: PhaseType;
  phase_order: number;
  status: PhaseStatus;
}

// ========================================
// Group Types
// ========================================

export interface Group {
  id: string;
  phase_id: string;
  name: string;
}

// ========================================
// Match Types
// ========================================

export type MatchStatus = 'scheduled' | 'completed';

export interface Match {
  id: string;
  phase_id: string;
  group_id: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: Date | null;
  match_order: number;
  status: MatchStatus;
}

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
}

// ========================================
// Standing Types
// ========================================

export interface Standing {
  id: string;
  phase_id: string;
  group_id: string | null;
  team_id: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  position: number;
  updated_at: Date;
}

export interface StandingWithTeam extends Standing {
  team: Team;
}

// ========================================
// Goal Scorer Types (Statystyki)
// ========================================

export interface GoalScorer {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  goals_count: number;
  created_at: Date;
}

export interface GoalScorerWithDetails extends GoalScorer {
  player: Player;
  team: Team;
  match: Match;
}

// ========================================
// Engine Types
// ========================================

export interface TournamentEngine {
  generateMatches(teams: Team[], config: TournamentConfig): Match[];
  calculateStandings(matches: Match[]): Standing[];
  getNextPhase?(currentPhase: Phase): Phase | null;
  validateAdvancement?(standings: Standing[], config: TournamentConfig): Team[];
}

// ========================================
// API Request/Response Types
// ========================================

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTournamentRequest {
  name: string;
  format_type: TournamentFormatType;
  config: TournamentConfig;
  referees?: string[];
}

export interface CreateTeamRequest {
  name: string;
  logo_url?: string;
  coach_name?: string;
  player_ids?: string[];
}

export interface CreatePlayerRequest {
  first_name: string;
  last_name: string;
}

export interface UpdateMatchRequest {
  home_score: number;
  away_score: number;
  goal_scorers?: Array<{
    player_id: string;
    team_id: string;
    goals_count: number;
  }>;
}

// ========================================
// Session Types (express-session)
// ========================================

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// ========================================
// Utility Types
// ========================================

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
