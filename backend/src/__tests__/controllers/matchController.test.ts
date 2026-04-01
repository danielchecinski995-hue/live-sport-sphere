import { Request, Response } from 'express';
import { MatchController } from '../../controllers/matchController';
import { MatchModel } from '../../models/matchModel';

jest.mock('../../models/matchModel');

const mockMatch = {
  id: 'match-1',
  tournament_id: 'tournament-1',
  home_team_id: 'team-1',
  away_team_id: 'team-2',
  home_score: null,
  away_score: null,
  status: 'scheduled',
};

function mockReqRes(overrides: { params?: any; body?: any; query?: any } = {}) {
  const req = {
    params: overrides.params || {},
    body: overrides.body || {},
    query: overrides.query || {},
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  return { req, res };
}

describe('MatchController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getByTournament', () => {
    it('returns matches for a tournament', async () => {
      (MatchModel.findByTournamentId as jest.Mock).mockResolvedValue([mockMatch]);
      const { req, res } = mockReqRes({ params: { tournamentId: 'tournament-1' } });

      await MatchController.getByTournament(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: [mockMatch] });
    });

    it('returns 500 on error', async () => {
      (MatchModel.findByTournamentId as jest.Mock).mockRejectedValue(new Error('DB error'));
      const { req, res } = mockReqRes({ params: { tournamentId: 'tournament-1' } });

      await MatchController.getByTournament(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('returns match when found', async () => {
      (MatchModel.findById as jest.Mock).mockResolvedValue(mockMatch);
      const { req, res } = mockReqRes({ params: { id: 'match-1' } });

      await MatchController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockMatch });
    });

    it('returns 404 when not found', async () => {
      (MatchModel.findById as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await MatchController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateResult', () => {
    it('updates match result', async () => {
      (MatchModel.updateResult as jest.Mock).mockResolvedValue({ ...mockMatch, home_score: 2, away_score: 1 });
      const { req, res } = mockReqRes({
        params: { id: 'match-1' },
        body: { homeScore: 2, awayScore: 1 },
      });

      await MatchController.updateResult(req, res);

      expect(MatchModel.updateResult).toHaveBeenCalledWith('match-1', 2, 1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when match not found', async () => {
      (MatchModel.updateResult as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({
        params: { id: 'nonexistent' },
        body: { homeScore: 0, awayScore: 0 },
      });

      await MatchController.updateResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateStatus', () => {
    it('updates match status', async () => {
      (MatchModel.updateStatus as jest.Mock).mockResolvedValue({ ...mockMatch, status: 'completed' });
      const { req, res } = mockReqRes({
        params: { id: 'match-1' },
        body: { status: 'completed' },
      });

      await MatchController.updateStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('addGoalScorer', () => {
    it('adds goal scorer', async () => {
      const scorer = { id: 'gs-1', match_id: 'match-1', player_id: 'player-1', team_id: 'team-1', is_own_goal: false };
      (MatchModel.addGoalScorer as jest.Mock).mockResolvedValue(scorer);
      const { req, res } = mockReqRes({
        params: { id: 'match-1' },
        body: { player_id: 'player-1', team_id: 'team-1' },
      });

      await MatchController.addGoalScorer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getStandings', () => {
    it('returns standings for tournament', async () => {
      const standings = [{ team_id: 'team-1', points: 9, wins: 3 }];
      (MatchModel.getStandingsByTournament as jest.Mock).mockResolvedValue(standings);
      const { req, res } = mockReqRes({ params: { tournamentId: 'tournament-1' } });

      await MatchController.getStandings(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: standings });
    });
  });
});
