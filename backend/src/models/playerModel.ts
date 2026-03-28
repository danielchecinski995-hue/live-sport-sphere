/**
 * Player Model
 * Database queries for players table
 */

import { pool } from '../config/database';
import { Player, PlayerWithStats } from '../types';

export class PlayerModel {
  /**
   * Get all players for a specific organizer (creator)
   */
  static async findByCreator(creatorId: string): Promise<Player[]> {
    const result = await pool.query(
      `SELECT id, creator_id, first_name, last_name, created_at
       FROM players
       WHERE creator_id = $1
       ORDER BY last_name ASC, first_name ASC`,
      [creatorId]
    );

    return result.rows;
  }

  /**
   * Get single player by ID
   */
  static async findById(playerId: string): Promise<Player | null> {
    const result = await pool.query(
      `SELECT id, creator_id, first_name, last_name, created_at
       FROM players
       WHERE id = $1`,
      [playerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new player
   */
  static async create(
    creatorId: string,
    firstName: string,
    lastName: string
  ): Promise<Player> {
    const result = await pool.query(
      `INSERT INTO players (creator_id, first_name, last_name)
       VALUES ($1, $2, $3)
       RETURNING id, creator_id, first_name, last_name, created_at`,
      [creatorId, firstName, lastName]
    );

    return result.rows[0];
  }

  /**
   * Update player
   */
  static async update(
    playerId: string,
    firstName: string,
    lastName: string
  ): Promise<Player | null> {
    const result = await pool.query(
      `UPDATE players
       SET first_name = $1, last_name = $2
       WHERE id = $3
       RETURNING id, creator_id, first_name, last_name, created_at`,
      [firstName, lastName, playerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete player
   */
  static async delete(playerId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM players WHERE id = $1`,
      [playerId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get player statistics (total goals, matches played)
   */
  static async getStats(playerId: string): Promise<PlayerWithStats | null> {
    const result = await pool.query(
      `SELECT
         p.id,
         p.creator_id,
         p.first_name,
         p.last_name,
         p.created_at,
         COALESCE(SUM(gs.goals_count), 0)::int AS total_goals,
         COUNT(DISTINCT gs.match_id)::int AS matches_played
       FROM players p
       LEFT JOIN goal_scorers gs ON p.id = gs.player_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [playerId]
    );

    return result.rows[0] || null;
  }

  /**
   * Search players by name (for autocomplete)
   */
  static async search(creatorId: string, query: string): Promise<Player[]> {
    const searchTerm = `%${query}%`;
    const result = await pool.query(
      `SELECT id, creator_id, first_name, last_name, created_at
       FROM players
       WHERE creator_id = $1
         AND (
           LOWER(first_name) LIKE LOWER($2)
           OR LOWER(last_name) LIKE LOWER($2)
         )
       ORDER BY last_name ASC, first_name ASC
       LIMIT 20`,
      [creatorId, searchTerm]
    );

    return result.rows;
  }
}
