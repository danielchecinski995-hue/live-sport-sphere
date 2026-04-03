export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format?: string;
  format_type?: string;
  status: 'draft' | 'active' | 'completed';
  share_code: string;
  is_public?: boolean;
  referees?: string[];
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  coach_name?: string;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number?: number;
  is_starter?: boolean;
}

export interface Match {
  id: string;
  tournamentId?: string;
  tournament_id?: string;
  phaseId?: string;
  phase_id?: string;
  groupId?: string;
  group_id?: string;
  homeTeamId?: string;
  home_team_id?: string;
  awayTeamId?: string;
  away_team_id?: string;
  homeTeamName?: string;
  home_team_name?: string;
  awayTeamName?: string;
  away_team_name?: string;
  homeTeamLogo?: string;
  home_team_logo?: string;
  awayTeamLogo?: string;
  away_team_logo?: string;
  homeScore?: number;
  home_score?: number;
  awayScore?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'completed';
  matchDate?: string;
  match_date?: string;
  matchOrder?: number;
  match_order?: number;
  sportsFieldId?: string;
  sports_field_id?: string;
  sportsFieldName?: string;
  sports_field_name?: string;
  metadata?: { round?: number; match_number?: number };
  goalScorers?: GoalScorer[];
  goal_scorers?: GoalScorer[];
}

export interface GoalScorer {
  player_id: string;
  player_name?: string;
  first_name?: string;
  last_name?: string;
  team_id: string;
  goals_count: number;
  is_own_goal?: boolean;
}

export interface Standing {
  position: number;
  team_id: string;
  team_name: string;
  team_logo_url?: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
}

export interface MatchCard {
  id: string;
  player_id: string;
  team_id: string;
  card_type: 'yellow' | 'red';
  minute?: number;
  reason?: string;
  first_name?: string;
  last_name?: string;
}

export interface Substitution {
  id: string;
  match_id: string;
  team_id: string;
  player_out_id: string;
  player_in_id: string;
  minute?: number;
  created_at: string;
  player_out_first_name?: string;
  player_out_last_name?: string;
  player_out_jersey_number?: number;
  player_in_first_name?: string;
  player_in_last_name?: string;
  player_in_jersey_number?: number;
}

export interface MatchStatistics {
  home_possession?: number;
  away_possession?: number;
  home_shots?: number;
  away_shots?: number;
  home_shots_on_target?: number;
  away_shots_on_target?: number;
  home_fouls?: number;
  away_fouls?: number;
  home_big_chances_missed?: number;
  away_big_chances_missed?: number;
  home_corners?: number;
  away_corners?: number;
  home_offsides?: number;
  away_offsides?: number;
}

// Helper to normalize snake_case/camelCase from API
export function normalizeMatch(m: any): Match {
  return {
    ...m,
    id: m.id,
    tournamentId: m.tournamentId || m.tournament_id,
    phaseId: m.phaseId || m.phase_id,
    groupId: m.groupId || m.group_id,
    homeTeamId: m.homeTeamId || m.home_team_id,
    awayTeamId: m.awayTeamId || m.away_team_id,
    homeTeamName: m.homeTeamName || m.home_team_name,
    awayTeamName: m.awayTeamName || m.away_team_name,
    homeTeamLogo: m.homeTeamLogo || m.home_team_logo,
    awayTeamLogo: m.awayTeamLogo || m.away_team_logo,
    homeScore: m.homeScore ?? m.home_score,
    awayScore: m.awayScore ?? m.away_score,
    status: m.status,
    matchDate: m.matchDate || m.match_date,
    matchOrder: m.matchOrder || m.match_order,
    sportsFieldName: m.sportsFieldName || m.sports_field_name,
    metadata: m.metadata,
    goalScorers: m.goalScorers || m.goal_scorers,
  };
}
