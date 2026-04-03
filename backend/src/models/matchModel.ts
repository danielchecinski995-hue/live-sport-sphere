import { query } from '../config/database';

export class MatchModel {
  static async create(tournamentId: string, homeTeamId: string, awayTeamId: string, matchDate?: string) {
    // Get or create phase for this tournament
    let phaseResult = await query(
      `SELECT id FROM phases WHERE tournament_id = $1 LIMIT 1`,
      [tournamentId]
    );
    if (phaseResult.rows.length === 0) {
      phaseResult = await query(
        `INSERT INTO phases (tournament_id, phase_type, phase_order, status)
         VALUES ($1, 'group_stage', 1, 'active') RETURNING id`,
        [tournamentId]
      );
    }
    const phaseId = phaseResult.rows[0].id;

    // Get next match_order
    const orderResult = await query(
      `SELECT COALESCE(MAX(match_order), 0) + 1 as next_order FROM matches WHERE phase_id = $1`,
      [phaseId]
    );
    const matchOrder = orderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO matches (id, phase_id, home_team_id, away_team_id, match_date, match_order, status, home_score, away_score)
       VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'scheduled', 0, 0)
       RETURNING *`,
      [phaseId, homeTeamId, awayTeamId, matchDate || null, matchOrder]
    );
    return result.rows[0];
  }

  static async delete(matchId: string) {
    // Delete related records first
    await query(`DELETE FROM goal_scorers WHERE match_id = $1`, [matchId]);
    await query(`DELETE FROM match_cards WHERE match_id = $1`, [matchId]);
    await query(`DELETE FROM substitutions WHERE match_id = $1`, [matchId]);
    const result = await query(`DELETE FROM matches WHERE id = $1 RETURNING id`, [matchId]);
    return result.rows.length > 0;
  }

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

    const homeTeamInfo = await query(`SELECT id, name, logo_url FROM teams WHERE id = $1`, [home_team_id]);
    const awayTeamInfo = await query(`SELECT id, name, logo_url FROM teams WHERE id = $1`, [away_team_id]);

    return {
      home: { id: home_team_id, team_id: home_team_id, ...homeTeamInfo.rows[0], players: homePlayers.rows },
      away: { id: away_team_id, team_id: away_team_id, ...awayTeamInfo.rows[0], players: awayPlayers.rows },
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

    // Update match score based on goal_scorers
    const match = await query(`SELECT home_team_id, away_team_id FROM matches WHERE id = $1`, [matchId]);
    if (match.rows[0]) {
      const { home_team_id, away_team_id } = match.rows[0];
      const scorers = await query(`SELECT team_id, is_own_goal, goals_count FROM goal_scorers WHERE match_id = $1`, [matchId]);
      let homeScore = 0, awayScore = 0;
      for (const s of scorers.rows) {
        if (s.is_own_goal) {
          // Own goal scores for the opposing team
          if (s.team_id === home_team_id) awayScore += s.goals_count;
          else homeScore += s.goals_count;
        } else {
          if (s.team_id === home_team_id) homeScore += s.goals_count;
          else awayScore += s.goals_count;
        }
      }
      await query(`UPDATE matches SET home_score = $2, away_score = $3 WHERE id = $1`, [matchId, homeScore, awayScore]);
    }

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

    // Swap is_starter: player out becomes reserve, player in becomes starter
    await query(`UPDATE team_players SET is_starter = false WHERE team_id = $1 AND player_id = $2`, [teamId, playerOutId]);
    await query(`UPDATE team_players SET is_starter = true WHERE team_id = $1 AND player_id = $2`, [teamId, playerInId]);

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
