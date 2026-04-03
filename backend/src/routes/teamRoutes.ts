/**
 * Team Routes
 * API endpoints for team management
 */

import { Router } from 'express';
import { TeamController } from '../controllers/teamController';

const router = Router();

/**
 * @route   GET /api/tournaments/:tournamentId/teams
 * @desc    Get all teams for a tournament
 * @access  Public
 */
router.get('/tournaments/:tournamentId/teams', TeamController.getByTournament);

/**
 * @route   POST /api/tournaments/:tournamentId/teams
 * @desc    Create new team in tournament
 * @access  Public (później będzie require auth)
 */
router.post('/tournaments/:tournamentId/teams', TeamController.create);

/**
 * @route   GET /api/teams/:id
 * @desc    Get single team by ID (with ?include_players=true for players)
 * @access  Public
 */
router.get('/teams/:id', TeamController.getById);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team
 * @access  Public (później będzie require auth)
 */
router.put('/teams/:id', TeamController.update);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team
 * @access  Public (później będzie require auth)
 */
router.delete('/teams/:id', TeamController.delete);

/**
 * @route   GET /api/teams/:id/players
 * @desc    Get players for a team
 * @access  Public
 */
router.get('/teams/:id/players', TeamController.getPlayers);

/**
 * @route   POST /api/teams/:id/players
 * @desc    Add player to team
 * @access  Public (później będzie require auth)
 */
router.post('/teams/:id/players', TeamController.addPlayer);

/**
 * @route   PUT /api/teams/:id/players
 * @desc    Set team players (replace all)
 * @access  Public (później będzie require auth)
 */
router.put('/teams/:id/players', TeamController.setPlayers);

/**
 * @route   DELETE /api/teams/:id/players/:playerId
 * @desc    Remove player from team
 * @access  Public (później będzie require auth)
 */
router.put('/teams/:id/players/:playerId', TeamController.updatePlayer);
router.delete('/teams/:id/players/:playerId', TeamController.removePlayer);

export default router;
