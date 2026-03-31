/**
 * Auth Routes
 * Handles user profile sync with Firebase Auth
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/sync
 * Sync Firebase user with database (called after login/register)
 * Creates user record if it doesn't exist
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const { uid, email, name } = req.user!;

    const result = await pool.query(
      `INSERT INTO users (id, email, password, name)
       VALUES ($1, $2, 'firebase-auth', $3)
       ON CONFLICT (email) DO UPDATE SET name = COALESCE($3, users.name)
       RETURNING id, email, name, created_at`,
      [uid, email, name || email?.split('@')[0]]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Auth sync error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user!.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

export default router;
