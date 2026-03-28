/**
 * Tournament Routes
 * API endpoints for tournament management
 */

import { Router } from 'express';
import { TournamentController } from '../controllers/tournamentController';

const router = Router();

/**
 * @route   GET /api/tournaments
 * @desc    Get all tournaments for current organizer
 * @access  Public (później będzie require auth)
 */
router.get('/', TournamentController.getMyTournaments);

/**
 * @route   GET /api/tournaments/public
 * @desc    Get all public tournaments
 * @access  Public
 */
router.get('/public', TournamentController.getPublicTournaments);

/**
 * @route   GET /api/tournaments/search?q=...
 * @desc    Search tournaments by name
 * @access  Public
 */
router.get('/search', TournamentController.search);

/**
 * @route   GET /api/tournaments/code/:shareCode
 * @desc    Get tournament by share code (public access)
 * @access  Public
 */
router.get('/code/:shareCode', TournamentController.getByShareCode);

/**
 * @route   GET /api/tournaments/:id
 * @desc    Get tournament by ID
 * @access  Public
 */
router.get('/:id', TournamentController.getById);

/**
 * @route   POST /api/tournaments
 * @desc    Create new tournament
 * @access  Public (później będzie require auth)
 */
router.post('/', TournamentController.create);

/**
 * @route   PUT /api/tournaments/:id
 * @desc    Update tournament
 * @access  Public (później będzie require auth + creator only)
 */
router.put('/:id', TournamentController.update);

/**
 * @route   PATCH /api/tournaments/:id/status
 * @desc    Update tournament status
 * @access  Public (później będzie require auth + creator only)
 */
router.patch('/:id/status', TournamentController.updateStatus);

/**
 * @route   DELETE /api/tournaments/:id
 * @desc    Delete tournament
 * @access  Public (później będzie require auth + creator only)
 */
router.delete('/:id', TournamentController.delete);

export default router;
