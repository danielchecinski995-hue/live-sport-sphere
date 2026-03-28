import { query } from '../config/database';

export class MatchModel {
  static async findByTournamentId(tournamentId: string) {
    const result = await query(
      `SELECT m.*,
        ht.name as home_team_name, ht.logo_url as home_team_logo,
        at.name as away_team_name, at.logo_url as away_team_logo
       FROM matches m
       JOIN phases p ON m.phase_id = p.id
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE p.tournament_id = $1
       ORDER BY m.match_order`,
      [tournamentId]
    );
    return result.rows;
  }

  static async findById(matchId: string) {
    const result = await query(
      `SELECT m.*,
        ht.name as home_team_name, ht.logo_url as home_team_logo,
        at.name as away_team_name, at.logo_url as away_team_logo
       FROM matches m
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE m.id = $1`,
      [matchId]
    );
    return result.rows[0] || null;
  }

  static async updateResult(matchId: string, homeScore: number, awayScore: number) {
    const result = await query(
      `UPDATE matches SET home_score = $2, away_score = $3, status = 'completed' WHERE id = $1 RETURNING *`,
      [matchId, homeScore, awayScore]
    );
    return result.rows[0] || null;
  }

  static async updateStatus(matchId: string, status: string) {
    const result = await query(
      `UPDATE matches SET status = $2 WHERE id = $1 RETURNING *`,
      [matchId, status]
    );
    return result.rows[0] || null;
  }

  static async getMatchTeams(matchId: string) {
    const match = await query(`SELECT home_team_id, away_team_id FROM matches WHERE id = $1`, [matchId]);
    if (!match.rows[0]) return null;

    const { home_team_id, away_team_id } = match.rows[0];

    const homePlayers = await query(
      `SELECT p.id, p.first_name, p.last_name, tp.jersey_number, tp.is_starter
       FROM players p JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1 ORDER BY tp.jersey_number`,
      [home_team_id]
    );

    const awayPlayers = await query(
      `SELECT p.id, p.first_name, p.last_name, tp.jersey_number, tp.is_starter
       FROM players p JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1 ORDER BY tp.jersey_number`,
      [away_team_id]
    );

    return {
      home: { team_id: home_team_id, players: homePlayers.rows },
      away: { team_id: away_team_id, players: awayPlayers.rows },
    };
  }

  static async getGoalScorers(matchId: string) {
    const result = await query(
      `SELECT gs.*, p.first_name, p.last_name, t.name as team_name
       FROM goal_scorers gs
       JOIN players p ON gs.player_id = p.id
       JOIN teams t ON gs.team_id = t.id
       WHERE gs.match_id = $1
       ORDER BY gs.created_at`,
      [matchId]
    );
    return result.rows;
  }

  static async addGoalScorer(matchId: string, playerId: string, teamId: string, isOwnGoal: boolean = false) {
    const result = await query(
      `INSERT INTO goal_scorers (match_id, player_id, team_id, is_own_goal) VALUES ($1, $2, $3, $4) RETURNING *`,
      [matchId, playerId, teamId, isOwnGoal]
    );
    return result.rows[0];
  }

  static async getMatchCards(matchId: string) {
    const result = await query(
      `SELECT mc.*, p.first_name, p.last_name, t.name as team_name
       FROM match_cards mc
       JOIN players p ON mc.player_id = p.id
       JOIN teams t ON mc.team_id = t.id
       WHERE mc.match_id = $1
       ORDER BY mc.minute`,
      [matchId]
    );
    return result.rows;
  }

  static async addCard(matchId: string, playerId: string, teamId: string, cardType: string, minute?: number) {
    const result = await query(
      `INSERT INTO match_cards (match_id, player_id, team_id, card_type, minute) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [matchId, playerId, teamId, cardType, minute || null]
    );
    return result.rows[0];
  }

  static async getSubstitutions(matchId: string) {
    const result = await query(
      `SELECT s.*,
        po.first_name as player_out_first_name, po.last_name as player_out_last_name,
        pi.first_name as player_in_first_name, pi.last_name as player_in_last_name,
        t.name as team_name
       FROM substitutions s
       JOIN players po ON s.player_out_id = po.id
       JOIN players pi ON s.player_in_id = pi.id
       JOIN teams t ON s.team_id = t.id
       WHERE s.match_id = $1
       ORDER BY s.minute`,
      [matchId]
    );
    return result.rows;
  }

  static async addSubstitution(matchId: string, teamId: string, playerOutId: string, playerInId: string, minute?: number) {
    const result = await query(
      `INSERT INTO substitutions (match_id, team_id, player_out_id, player_in_id, minute) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [matchId, teamId, playerOutId, playerInId, minute || null]
    );
    return result.rows[0];
  }

  static async getStandingsByTournament(tournamentId: string) {
    const result = await query(
      `SELECT s.*, t.name as team_name, t.logo_url as team_logo
       FROM standings s
       JOIN phases p ON s.phase_id = p.id
       JOIN teams t ON s.team_id = t.id
       WHERE p.tournament_id = $1
       ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC`,
      [tournamentId]
    );
    return result.rows;
  }
}
