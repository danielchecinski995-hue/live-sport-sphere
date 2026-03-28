/**
 * Team Model
 * Database queries for teams table
 */

import { pool } from '../config/database';
import { Team, TeamWithPlayers, Player } from '../types';

export class TeamModel {
  /**
   * Get all teams for a tournament
   */
  static async findByTournament(tournamentId: string): Promise<Team[]> {
    const result = await pool.query(
      `SELECT id, tournament_id, name, logo_url, created_at
       FROM teams
       WHERE tournament_id = $1
       ORDER BY name ASC`,
      [tournamentId]
    );

    return result.rows;
  }

  /**
   * Get single team by ID
   */
  static async findById(teamId: string): Promise<Team | null> {
    const result = await pool.query(
      `SELECT id, tournament_id, name, logo_url, created_at
       FROM teams
       WHERE id = $1`,
      [teamId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get team with players
   */
  static async findByIdWithPlayers(teamId: string): Promise<TeamWithPlayers | null> {
    const teamResult = await pool.query(
      `SELECT id, tournament_id, name, logo_url, created_at
       FROM teams
       WHERE id = $1`,
      [teamId]
    );

    if (teamResult.rows.length === 0) return null;

    const team = teamResult.rows[0];

    // Get players assigned to this team
    const playersResult = await pool.query(
      `SELECT p.id, p.creator_id, p.first_name, p.last_name, p.created_at
       FROM players p
       JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1
       ORDER BY p.last_name ASC, p.first_name ASC`,
      [teamId]
    );

    return {
      ...team,
      players: playersResult.rows
    };
  }

  /**
   * Create new team
   */
  static async create(
    tournamentId: string,
    name: string,
    logoUrl?: string
  ): Promise<Team> {
    const result = await pool.query(
      `INSERT INTO teams (tournament_id, name, logo_url)
       VALUES ($1, $2, $3)
       RETURNING id, tournament_id, name, logo_url, created_at`,
      [tournamentId, name, logoUrl || null]
    );

    return result.rows[0];
  }

  /**
   * Update team
   */
  static async update(
    teamId: string,
    name: string,
    logoUrl?: string
  ): Promise<Team | null> {
    const result = await pool.query(
      `UPDATE teams
       SET name = $1, logo_url = $2
       WHERE id = $3
       RETURNING id, tournament_id, name, logo_url, created_at`,
      [name, logoUrl || null, teamId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete team
   */
  static async delete(teamId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM teams WHERE id = $1`,
      [teamId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Add player to team
   */
  static async addPlayer(teamId: string, playerId: string): Promise<void> {
    await pool.query(
      `INSERT INTO team_players (team_id, player_id)
       VALUES ($1, $2)
       ON CONFLICT (team_id, player_id) DO NOTHING`,
      [teamId, playerId]
    );
  }

  /**
   * Remove player from team
   */
  static async removePlayer(teamId: string, playerId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM team_players
       WHERE team_id = $1 AND player_id = $2`,
      [teamId, playerId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Set team players (replace all)
   */
  static async setPlayers(teamId: string, playerIds: string[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Remove all current players
      await client.query(
        'DELETE FROM team_players WHERE team_id = $1',
        [teamId]
      );

      // Add new players
      if (playerIds.length > 0) {
        const values = playerIds.map((playerId, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        await client.query(
          `INSERT INTO team_players (team_id, player_id) VALUES ${values}`,
          [teamId, ...playerIds]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get players for a team
   */
  static async getPlayers(teamId: string): Promise<Player[]> {
    const result = await pool.query(
      `SELECT p.id, p.creator_id, p.first_name, p.last_name, p.created_at
       FROM players p
       JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1
       ORDER BY p.last_name ASC, p.first_name ASC`,
      [teamId]
    );

    return result.rows;
  }
}
