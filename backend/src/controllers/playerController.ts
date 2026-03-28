/**
 * Player Controller
 * Handles HTTP requests for player endpoints
 */

import { Request, Response } from 'express';
import { PlayerModel } from '../models/playerModel';
import { CreatePlayerRequest } from '../types';

// Temporary: Hardcoded test organizer ID (bez auth na razie)
const TEST_ORGANIZER_ID = '00000000-0000-0000-0000-000000000001';

export class PlayerController {
  /**
   * GET /api/players
   * Get all players for current organizer
   */
  static async getAll(req: Request, res: Response) {
    try {
      // TODO: Po dodaniu auth, użyj req.session.userId
      const creatorId = TEST_ORGANIZER_ID;

      const players = await PlayerModel.findByCreator(creatorId);

      res.json({
        success: true,
        count: players.length,
        data: players
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/players/:id
   * Get single player by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const player = await PlayerModel.findById(id);

      if (!player) {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }

      res.json({
        success: true,
        data: player
      });
    } catch (error) {
      console.error('Error fetching player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/players/:id/stats
   * Get player statistics
   */
  static async getStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const playerWithStats = await PlayerModel.getStats(id);

      if (!playerWithStats) {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }

      res.json({
        success: true,
        data: playerWithStats
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/players
   * Create new player
   */
  static async create(req: Request, res: Response) {
    try {
      const { first_name, last_name }: CreatePlayerRequest = req.body;

      // Walidacja
      if (!first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required'
        });
      }

      if (first_name.trim().length === 0 || last_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name cannot be empty'
        });
      }

      // TODO: Po dodaniu auth, użyj req.session.userId
      const creatorId = TEST_ORGANIZER_ID;

      const player = await PlayerModel.create(
        creatorId,
        first_name.trim(),
        last_name.trim()
      );

      res.status(201).json({
        success: true,
        message: 'Player created successfully',
        data: player
      });
    } catch (error) {
      console.error('Error creating player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create player',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/players/:id
   * Update player
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { first_name, last_name }: CreatePlayerRequest = req.body;

      // Walidacja
      if (!first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required'
        });
      }

      const player = await PlayerModel.update(
        id,
        first_name.trim(),
        last_name.trim()
      );

      if (!player) {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }

      res.json({
        success: true,
        message: 'Player updated successfully',
        data: player
      });
    } catch (error) {
      console.error('Error updating player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update player',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /api/players/:id
   * Delete player
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await PlayerModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }

      res.json({
        success: true,
        message: 'Player deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete player',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/players/search?q=...
   * Search players by name
   */
  static async search(req: Request, res: Response) {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      // TODO: Po dodaniu auth, użyj req.session.userId
      const creatorId = TEST_ORGANIZER_ID;

      const players = await PlayerModel.search(creatorId, query.trim());

      res.json({
        success: true,
        count: players.length,
        data: players
      });
    } catch (error) {
      console.error('Error searching players:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search players',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
