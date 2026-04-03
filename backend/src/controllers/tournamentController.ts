/**
 * Tournament Controller
 * Handles HTTP requests for tournament endpoints
 */

import { Request, Response } from 'express';
import { TournamentModel } from '../models/tournamentModel';
import { CreateTournamentRequest } from '../types';

// Temporary: Hardcoded test organizer ID
const TEST_ORGANIZER_ID = '00000000-0000-0000-0000-000000000001';

export class TournamentController {
  /**
   * GET /api/tournaments
   * Get all tournaments for current organizer
   */
  static async getMyTournaments(req: Request, res: Response) {
    try {
      // TODO: Po dodaniu auth, użyj req.session.userId
      const creatorId = TEST_ORGANIZER_ID;

      const tournaments = await TournamentModel.findByCreator(creatorId);

      res.json({
        success: true,
        count: tournaments.length,
        data: tournaments
      });
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tournaments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/tournaments/public
   * Get all public tournaments
   */
  static async getPublicTournaments(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const tournaments = await TournamentModel.findAllPublic(limit);

      res.json({
        success: true,
        count: tournaments.length,
        data: tournaments
      });
    } catch (error) {
      console.error('Error fetching public tournaments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch public tournaments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/tournaments/:id
   * Get tournament by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const tournament = await TournamentModel.findById(id);

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      res.json({
        success: true,
        data: tournament
      });
    } catch (error) {
      console.error('Error fetching tournament:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tournament',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/tournaments/code/:shareCode
   * Get tournament by share code (public access)
   */
  static async getByShareCode(req: Request, res: Response) {
    try {
      const { shareCode } = req.params;

      const tournament = await TournamentModel.findByShareCode(shareCode);

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found with this share code'
        });
      }

      res.json({
        success: true,
        data: tournament
      });
    } catch (error) {
      console.error('Error fetching tournament by share code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tournament',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/tournaments
   * Create new tournament
   */
  static async create(req: Request, res: Response) {
    try {
      const { name, format_type, config }: CreateTournamentRequest = req.body;

      // Walidacja
      if (!name || !format_type) {
        return res.status(400).json({
          success: false,
          error: 'Name and format_type are required'
        });
      }

      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name cannot be empty'
        });
      }

      const validFormats = ['league', 'knockout', 'groups_playoff', 'multi_level', 'league_playoff', 'swiss'];
      if (!validFormats.includes(format_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format_type',
          validFormats
        });
      }

      // TODO: Po dodaniu auth, użyj req.session.userId
      const creatorId = TEST_ORGANIZER_ID;

      const tournament = await TournamentModel.create(
        creatorId,
        name.trim(),
        format_type,
        config || {}
      );

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: tournament
      });
    } catch (error) {
      console.error('Error creating tournament:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create tournament',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/tournaments/:id
   * Update tournament
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, format_type, config }: CreateTournamentRequest = req.body;

      // Walidacja
      if (!name || !format_type) {
        return res.status(400).json({
          success: false,
          error: 'Name and format_type are required'
        });
      }

      // TODO: Sprawdź czy user jest creatorem turnieju
      // const creatorId = TEST_ORGANIZER_ID;
      // const isCreator = await TournamentModel.isCreator(id, creatorId);
      // if (!isCreator) return res.status(403).json({ error: 'Forbidden' });

      const tournament = await TournamentModel.update(
        id,
        name.trim(),
        format_type,
        config || {}
      );

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      res.json({
        success: true,
        message: 'Tournament updated successfully',
        data: tournament
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tournament',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PATCH /api/tournaments/:id/status
   * Update tournament status (draft → active → finished)
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required'
        });
      }

      const validStatuses = ['draft', 'active', 'finished'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
          validStatuses
        });
      }

      const tournament = await TournamentModel.updateStatus(id, status);

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      res.json({
        success: true,
        message: `Tournament status updated to ${status}`,
        data: tournament
      });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tournament status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /api/tournaments/:id
   * Delete tournament
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // TODO: Sprawdź czy user jest creatorem turnieju

      const deleted = await TournamentModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      res.json({
        success: true,
        message: 'Tournament deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tournament:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete tournament',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PATCH /api/tournaments/:id/referees
   */
  static async updateReferees(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { referees } = req.body;

      if (!Array.isArray(referees) || referees.length > 3) {
        return res.status(400).json({ success: false, error: 'referees must be an array of max 3 strings' });
      }

      const tournament = await TournamentModel.updateReferees(id, referees.map((r: any) => String(r).trim()).filter(Boolean));
      if (!tournament) {
        return res.status(404).json({ success: false, error: 'Tournament not found' });
      }

      res.json({ success: true, data: tournament });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update referees' });
    }
  }

  /**
   * GET /api/tournaments/search?q=...
   * Search tournaments by name
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

      const tournaments = await TournamentModel.search(query.trim());

      res.json({
        success: true,
        count: tournaments.length,
        data: tournaments
      });
    } catch (error) {
      console.error('Error searching tournaments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search tournaments',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
