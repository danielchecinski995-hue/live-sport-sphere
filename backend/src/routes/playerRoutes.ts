/**
 * Player Routes
 * API endpoints for player management
 */

import { Router } from 'express';
import { PlayerController } from '../controllers/playerController';

const router = Router();

/**
 * @route   GET /api/players
 * @desc    Get all players for current organizer
 * @access  Public (na razie, później będzie require auth)
 */
router.get('/', PlayerController.getAll);

/**
 * @route   GET /api/players/search?q=...
 * @desc    Search players by name
 * @access  Public
 */
router.get('/search', PlayerController.search);

/**
 * @route   GET /api/players/:id
 * @desc    Get single player by ID
 * @access  Public
 */
router.get('/:id', PlayerController.getById);

/**
 * @route   GET /api/players/:id/stats
 * @desc    Get player statistics
 * @access  Public
 */
router.get('/:id/stats', PlayerController.getStats);

/**
 * @route   POST /api/players
 * @desc    Create new player
 * @access  Public (później będzie require auth)
 */
router.post('/', PlayerController.create);

/**
 * @route   PUT /api/players/:id
 * @desc    Update player
 * @access  Public (później będzie require auth)
 */
router.put('/:id', PlayerController.update);

/**
 * @route   DELETE /api/players/:id
 * @desc    Delete player
 * @access  Public (później będzie require auth)
 */
router.delete('/:id', PlayerController.delete);

export default router;
