import { Request, Response } from 'express';
import { TeamController } from '../../controllers/teamController';
import { TeamModel } from '../../models/teamModel';

jest.mock('../../models/teamModel');

const mockTeam = {
  id: 'team-1',
  tournament_id: 'tournament-1',
  name: 'FC Test',
  logo_url: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

const mockTeamWithPlayers = {
  ...mockTeam,
  players: [
    { id: 'player-1', first_name: 'Jan', last_name: 'Kowalski' },
  ],
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

describe('TeamController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getByTournament', () => {
    it('returns teams for a tournament', async () => {
      (TeamModel.findByTournament as jest.Mock).mockResolvedValue([mockTeam]);
      const { req, res } = mockReqRes({ params: { tournamentId: 'tournament-1' } });

      await TeamController.getByTournament(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [mockTeam] });
    });
  });

  describe('getById', () => {
    it('returns team without players by default', async () => {
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      const { req, res } = mockReqRes({ params: { id: 'team-1' } });

      await TeamController.getById(req, res);

      expect(TeamModel.findById).toHaveBeenCalledWith('team-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTeam });
    });

    it('returns team with players when include_players=true', async () => {
      (TeamModel.findByIdWithPlayers as jest.Mock).mockResolvedValue(mockTeamWithPlayers);
      const { req, res } = mockReqRes({
        params: { id: 'team-1' },
        query: { include_players: 'true' },
      });

      await TeamController.getById(req, res);

      expect(TeamModel.findByIdWithPlayers).toHaveBeenCalledWith('team-1');
    });

    it('returns 404 when not found', async () => {
      (TeamModel.findById as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await TeamController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('creates team with name', async () => {
      (TeamModel.create as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.findByIdWithPlayers as jest.Mock).mockResolvedValue(mockTeamWithPlayers);
      const { req, res } = mockReqRes({
        params: { tournamentId: 'tournament-1' },
        body: { name: 'FC Test' },
      });

      await TeamController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('creates team with players', async () => {
      (TeamModel.create as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.setPlayers as jest.Mock).mockResolvedValue(undefined);
      (TeamModel.findByIdWithPlayers as jest.Mock).mockResolvedValue(mockTeamWithPlayers);
      const { req, res } = mockReqRes({
        params: { tournamentId: 'tournament-1' },
        body: { name: 'FC Test', player_ids: ['player-1'] },
      });

      await TeamController.create(req, res);

      expect(TeamModel.setPlayers).toHaveBeenCalledWith('team-1', ['player-1']);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 when name is missing', async () => {
      const { req, res } = mockReqRes({
        params: { tournamentId: 'tournament-1' },
        body: {},
      });

      await TeamController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when name is empty', async () => {
      const { req, res } = mockReqRes({
        params: { tournamentId: 'tournament-1' },
        body: { name: '   ' },
      });

      await TeamController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('delete', () => {
    it('deletes team successfully', async () => {
      (TeamModel.delete as jest.Mock).mockResolvedValue(true);
      const { req, res } = mockReqRes({ params: { id: 'team-1' } });

      await TeamController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('returns 404 when not found', async () => {
      (TeamModel.delete as jest.Mock).mockResolvedValue(false);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await TeamController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addPlayer', () => {
    it('adds player to team', async () => {
      (TeamModel.addPlayer as jest.Mock).mockResolvedValue(undefined);
      (TeamModel.getPlayers as jest.Mock).mockResolvedValue([{ id: 'player-1' }]);
      const { req, res } = mockReqRes({
        params: { id: 'team-1' },
        body: { player_id: 'player-1' },
      });

      await TeamController.addPlayer(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('returns 400 when player_id missing', async () => {
      const { req, res } = mockReqRes({
        params: { id: 'team-1' },
        body: {},
      });

      await TeamController.addPlayer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('setPlayers', () => {
    it('sets players array', async () => {
      (TeamModel.setPlayers as jest.Mock).mockResolvedValue(undefined);
      (TeamModel.getPlayers as jest.Mock).mockResolvedValue([]);
      const { req, res } = mockReqRes({
        params: { id: 'team-1' },
        body: { player_ids: ['p1', 'p2'] },
      });

      await TeamController.setPlayers(req, res);

      expect(TeamModel.setPlayers).toHaveBeenCalledWith('team-1', ['p1', 'p2']);
    });

    it('returns 400 when player_ids is not an array', async () => {
      const { req, res } = mockReqRes({
        params: { id: 'team-1' },
        body: { player_ids: 'not-array' },
      });

      await TeamController.setPlayers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
