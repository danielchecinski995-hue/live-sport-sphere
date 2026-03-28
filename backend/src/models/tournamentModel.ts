/**
 * Tournament Model
 * Database queries for tournaments table
 */

import { pool } from '../config/database';
import { Tournament, TournamentConfig, TournamentFormatType, TournamentStatus } from '../types';
import { generateShareCode } from '../utils/generateCode';

export class TournamentModel {
  /**
   * Get all tournaments for a specific creator
   */
  static async findByCreator(creatorId: string): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT id, name, creator_id, format_type, share_code, status, config, created_at
       FROM tournaments
       WHERE creator_id = $1
       ORDER BY created_at DESC`,
      [creatorId]
    );

    return result.rows;
  }

  /**
   * Get all public tournaments (for home page)
   */
  static async findAllPublic(limit: number = 20): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT id, name, creator_id, format_type, share_code, status, config, created_at
       FROM tournaments
       WHERE status IN ('active', 'finished')
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Get tournament by ID
   */
  static async findById(tournamentId: string): Promise<Tournament | null> {
    const result = await pool.query(
      `SELECT id, name, creator_id, format_type, share_code, status, config, created_at
       FROM tournaments
       WHERE id = $1`,
      [tournamentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get tournament by share code (public access)
   */
  static async findByShareCode(shareCode: string): Promise<Tournament | null> {
    const result = await pool.query(
      `SELECT id, name, creator_id, format_type, share_code, status, config, created_at
       FROM tournaments
       WHERE share_code = $1`,
      [shareCode]
    );

    return result.rows[0] || null;
  }

  /**
   * Create new tournament
   */
  static async create(
    creatorId: string,
    name: string,
    formatType: TournamentFormatType,
    config: TournamentConfig
  ): Promise<Tournament> {
    // Generuj unikalny share_code
    let shareCode = generateShareCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Sprawdź czy kod jest unikalny (mała szansa na kolizję, ale lepiej sprawdzić)
    while (attempts < maxAttempts) {
      const existing = await this.findByShareCode(shareCode);
      if (!existing) break;
      shareCode = generateShareCode();
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error('Failed to generate unique share code');
    }

    const result = await pool.query(
      `INSERT INTO tournaments (creator_id, name, format_type, share_code, status, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, creator_id, format_type, share_code, status, config, created_at`,
      [creatorId, name, formatType, shareCode, 'draft', JSON.stringify(config)]
    );

    return result.rows[0];
  }

  /**
   * Update tournament
   */
  static async update(
    tournamentId: string,
    name: string,
    formatType: TournamentFormatType,
    config: TournamentConfig
  ): Promise<Tournament | null> {
    const result = await pool.query(
      `UPDATE tournaments
       SET name = $1, format_type = $2, config = $3
       WHERE id = $4
       RETURNING id, name, creator_id, format_type, share_code, status, config, created_at`,
      [name, formatType, JSON.stringify(config), tournamentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update tournament status
   */
  static async updateStatus(
    tournamentId: string,
    status: TournamentStatus
  ): Promise<Tournament | null> {
    const result = await pool.query(
      `UPDATE tournaments
       SET status = $1
       WHERE id = $2
       RETURNING id, name, creator_id, format_type, share_code, status, config, created_at`,
      [status, tournamentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete tournament (cascade deletes teams, matches, etc.)
   */
  static async delete(tournamentId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM tournaments WHERE id = $1`,
      [tournamentId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if user is creator of tournament
   */
  static async isCreator(tournamentId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM tournaments WHERE id = $1 AND creator_id = $2`,
      [tournamentId, userId]
    );

    return result.rows.length > 0;
  }

  /**
   * Search tournaments by name
   */
  static async search(query: string, limit: number = 20): Promise<Tournament[]> {
    const searchTerm = `%${query}%`;
    const result = await pool.query(
      `SELECT id, name, creator_id, format_type, share_code, status, config, created_at
       FROM tournaments
       WHERE status IN ('active', 'finished')
         AND LOWER(name) LIKE LOWER($1)
       ORDER BY created_at DESC
       LIMIT $2`,
      [searchTerm, limit]
    );

    return result.rows;
  }
}
