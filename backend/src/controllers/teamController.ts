/**
 * Team Controller
 * Handles HTTP requests for team endpoints
 */

import { Request, Response } from 'express';
import { TeamModel } from '../models/teamModel';
import { CreateTeamRequest } from '../types';

export class TeamController {
  /**
   * GET /api/tournaments/:tournamentId/teams
   * Get all teams for a tournament
   */
  static async getByTournament(req: Request, res: Response) {
    try {
      const { tournamentId } = req.params;

      const teams = await TeamModel.findByTournament(tournamentId);

      res.json({
        success: true,
        count: teams.length,
        data: teams
      });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teams',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/teams/:id
   * Get single team by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const includePlayersParam = req.query.include_players as string;
      const includePlayers = includePlayersParam === 'true';

      if (includePlayers) {
        const team = await TeamModel.findByIdWithPlayers(id);

        if (!team) {
          return res.status(404).json({
            success: false,
            error: 'Team not found'
          });
        }

        return res.json({
          success: true,
          data: team
        });
      }

      const team = await TeamModel.findById(id);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      res.json({
        success: true,
        data: team
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/tournaments/:tournamentId/teams
   * Create new team
   */
  static async create(req: Request, res: Response) {
    try {
      const { tournamentId } = req.params;
      const { name, logo_url, player_ids }: CreateTeamRequest = req.body;

      // Walidacja
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Team name cannot be empty'
        });
      }

      // Create team
      const team = await TeamModel.create(
        tournamentId,
        name.trim(),
        logo_url
      );

      // Assign players if provided
      if (player_ids && player_ids.length > 0) {
        await TeamModel.setPlayers(team.id, player_ids);
      }

      // Return team with players
      const teamWithPlayers = await TeamModel.findByIdWithPlayers(team.id);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: teamWithPlayers
      });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/teams/:id
   * Update team
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, logo_url }: CreateTeamRequest = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      const team = await TeamModel.update(id, name.trim(), logo_url);

      if (!team) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team
      });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /api/teams/:id
   * Delete team
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deleted = await TeamModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }

      res.json({
        success: true,
        message: 'Team deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/teams/:id/players
   * Add player to team
   */
  static async addPlayer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { player_id } = req.body;

      if (!player_id) {
        return res.status(400).json({
          success: false,
          error: 'player_id is required'
        });
      }

      await TeamModel.addPlayer(id, player_id);

      const players = await TeamModel.getPlayers(id);

      res.json({
        success: true,
        message: 'Player added to team',
        data: { players }
      });
    } catch (error) {
      console.error('Error adding player to team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add player to team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * DELETE /api/teams/:id/players/:playerId
   * Remove player from team
   */
  static async removePlayer(req: Request, res: Response) {
    try {
      const { id, playerId } = req.params;

      const removed = await TeamModel.removePlayer(id, playerId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Player not found in team'
        });
      }

      res.json({
        success: true,
        message: 'Player removed from team'
      });
    } catch (error) {
      console.error('Error removing player from team:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove player from team',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * PUT /api/teams/:id/players
   * Set team players (replace all)
   */
  static async setPlayers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { player_ids } = req.body;

      if (!Array.isArray(player_ids)) {
        return res.status(400).json({
          success: false,
          error: 'player_ids must be an array'
        });
      }

      await TeamModel.setPlayers(id, player_ids);

      const players = await TeamModel.getPlayers(id);

      res.json({
        success: true,
        message: 'Team players updated',
        data: { players }
      });
    } catch (error) {
      console.error('Error setting team players:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set team players',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/teams/:id/players
   * Get players for a team
   */
  static async getPlayers(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const players = await TeamModel.getPlayers(id);

      res.json({
        success: true,
        count: players.length,
        data: players
      });
    } catch (error) {
      console.error('Error fetching team players:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team players',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
