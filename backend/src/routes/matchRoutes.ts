import { Router } from 'express';
import { MatchController } from '../controllers/matchController';

const router = Router();

// Tournament-scoped routes
router.get('/tournaments/:tournamentId/matches', MatchController.getByTournament);
router.get('/tournaments/:tournamentId/standings', MatchController.getStandings);

// Match routes
router.get('/matches/:id', MatchController.getById);
router.put('/matches/:id/result', MatchController.updateResult);
router.put('/matches/:id/status', MatchController.updateStatus);
router.get('/matches/:id/teams', MatchController.getMatchTeams);

// Goal scorers
router.get('/matches/:id/goal-scorers', MatchController.getGoalScorers);
router.post('/matches/:id/goal-scorers', MatchController.addGoalScorer);

// Cards
router.get('/matches/:id/cards', MatchController.getMatchCards);
router.post('/matches/:id/cards', MatchController.addCard);

// Substitutions
router.get('/matches/:id/substitutions', MatchController.getSubstitutions);
router.post('/matches/:id/substitutions', MatchController.addSubstitution);

export default router;
