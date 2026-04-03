/**
 * Team Model
 * Database queries for teams table
 */

import { pool } from '../config/database';
import { Team, TeamWithPlayers, Player } from '../types';

export class TeamModel {
  static async findByTournament(tournamentId: string): Promise<Team[]> {
    const result = await pool.query(
      `SELECT id, tournament_id, name, logo_url, coach_name, created_at
       FROM teams
       WHERE tournament_id = $1
       ORDER BY name ASC`,
      [tournamentId]
    );
    return result.rows;
  }

  static async findById(teamId: string): Promise<Team | null> {
    const result = await pool.query(
      `SELECT id, tournament_id, name, logo_url, coach_name, created_at
       FROM teams
       WHERE id = $1`,
      [teamId]
    );
    return result.rows[0] || null;
  }

  static async findByIdWithPlayers(teamId: string): Promise<TeamWithPlayers | null> {
    const teamResult = await pool.query(
      `SELECT id, tournament_id, name, logo_url, coach_name, created_at
       FROM teams
       WHERE id = $1`,
      [teamId]
    );
    if (teamResult.rows.length === 0) return null;

    const playersResult = await pool.query(
      `SELECT p.id, p.creator_id, p.first_name, p.last_name, p.created_at,
              tp.jersey_number, tp.is_starter
       FROM players p
       JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1
       ORDER BY tp.is_starter DESC, tp.jersey_number ASC NULLS LAST, p.last_name ASC`,
      [teamId]
    );

    return {
      ...teamResult.rows[0],
      players: playersResult.rows
    };
  }

  static async create(
    tournamentId: string,
    name: string,
    logoUrl?: string,
    coachName?: string
  ): Promise<Team> {
    const result = await pool.query(
      `INSERT INTO teams (tournament_id, name, logo_url, coach_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tournament_id, name, logo_url, coach_name, created_at`,
      [tournamentId, name, logoUrl || null, coachName || null]
    );
    return result.rows[0];
  }

  static async update(
    teamId: string,
    name: string,
    logoUrl?: string,
    coachName?: string
  ): Promise<Team | null> {
    const result = await pool.query(
      `UPDATE teams
       SET name = $1, logo_url = $2, coach_name = $3
       WHERE id = $4
       RETURNING id, tournament_id, name, logo_url, coach_name, created_at`,
      [name, logoUrl || null, coachName || null, teamId]
    );
    return result.rows[0] || null;
  }

  static async delete(teamId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM teams WHERE id = $1`,
      [teamId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async addPlayer(
    teamId: string,
    playerId: string,
    jerseyNumber?: number,
    isStarter?: boolean
  ): Promise<void> {
    await pool.query(
      `INSERT INTO team_players (team_id, player_id, jersey_number, is_starter)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, player_id) DO UPDATE SET jersey_number = $3, is_starter = $4`,
      [teamId, playerId, jerseyNumber || null, isStarter || false]
    );
  }

  static async removePlayer(teamId: string, playerId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM team_players
       WHERE team_id = $1 AND player_id = $2`,
      [teamId, playerId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async updatePlayer(
    teamId: string,
    playerId: string,
    jerseyNumber: number | null,
    isStarter: boolean
  ): Promise<boolean> {
    const result = await pool.query(
      `UPDATE team_players SET jersey_number = $3, is_starter = $4
       WHERE team_id = $1 AND player_id = $2`,
      [teamId, playerId, jerseyNumber, isStarter]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async setPlayers(teamId: string, playerIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM team_players WHERE team_id = $1', [teamId]);
      if (playerIds.length > 0) {
        const values = playerIds.map((_, i) => `($1, $${i + 2})`).join(', ');
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

  static async getPlayers(teamId: string): Promise<Player[]> {
    const result = await pool.query(
      `SELECT p.id, p.creator_id, p.first_name, p.last_name, p.created_at,
              tp.jersey_number, tp.is_starter
       FROM players p
       JOIN team_players tp ON p.id = tp.player_id
       WHERE tp.team_id = $1
       ORDER BY tp.is_starter DESC, tp.jersey_number ASC NULLS LAST, p.last_name ASC`,
      [teamId]
    );
    return result.rows;
  }
}
