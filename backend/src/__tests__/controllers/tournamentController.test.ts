import { Request, Response } from 'express';
import { TournamentController } from '../../controllers/tournamentController';
import { TournamentModel } from '../../models/tournamentModel';

// Mock the model
jest.mock('../../models/tournamentModel');

const mockTournament = {
  id: 'test-id-1',
  name: 'Test Tournament',
  creator_id: '00000000-0000-0000-0000-000000000001',
  format_type: 'league',
  share_code: 'ABCD1234',
  status: 'draft',
  config: { points: { win: 3, draw: 1, loss: 0 } },
  created_at: '2026-01-01T00:00:00.000Z',
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

describe('TournamentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyTournaments', () => {
    it('returns tournaments for the organizer', async () => {
      (TournamentModel.findByCreator as jest.Mock).mockResolvedValue([mockTournament]);
      const { req, res } = mockReqRes();

      await TournamentController.getMyTournaments(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: [mockTournament],
      });
    });

    it('returns empty array when no tournaments', async () => {
      (TournamentModel.findByCreator as jest.Mock).mockResolvedValue([]);
      const { req, res } = mockReqRes();

      await TournamentController.getMyTournaments(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
      });
    });

    it('returns 500 on database error', async () => {
      (TournamentModel.findByCreator as jest.Mock).mockRejectedValue(new Error('DB error'));
      const { req, res } = mockReqRes();

      await TournamentController.getMyTournaments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Failed to fetch tournaments' })
      );
    });
  });

  describe('getPublicTournaments', () => {
    it('returns public tournaments with default limit', async () => {
      (TournamentModel.findAllPublic as jest.Mock).mockResolvedValue([mockTournament]);
      const { req, res } = mockReqRes();

      await TournamentController.getPublicTournaments(req, res);

      expect(TournamentModel.findAllPublic).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 1 })
      );
    });

    it('accepts custom limit from query', async () => {
      (TournamentModel.findAllPublic as jest.Mock).mockResolvedValue([]);
      const { req, res } = mockReqRes({ query: { limit: '5' } });

      await TournamentController.getPublicTournaments(req, res);

      expect(TournamentModel.findAllPublic).toHaveBeenCalledWith(5);
    });
  });

  describe('getById', () => {
    it('returns tournament when found', async () => {
      (TournamentModel.findById as jest.Mock).mockResolvedValue(mockTournament);
      const { req, res } = mockReqRes({ params: { id: 'test-id-1' } });

      await TournamentController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTournament });
    });

    it('returns 404 when not found', async () => {
      (TournamentModel.findById as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await TournamentController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getByShareCode', () => {
    it('returns tournament by share code', async () => {
      (TournamentModel.findByShareCode as jest.Mock).mockResolvedValue(mockTournament);
      const { req, res } = mockReqRes({ params: { shareCode: 'ABCD1234' } });

      await TournamentController.getByShareCode(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTournament });
    });

    it('returns 404 for invalid share code', async () => {
      (TournamentModel.findByShareCode as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({ params: { shareCode: 'INVALID1' } });

      await TournamentController.getByShareCode(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('creates tournament with valid data', async () => {
      (TournamentModel.create as jest.Mock).mockResolvedValue(mockTournament);
      const { req, res } = mockReqRes({
        body: { name: 'New Tournament', format_type: 'league', config: {} },
      });

      await TournamentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Tournament created successfully' })
      );
    });

    it('returns 400 when name is missing', async () => {
      const { req, res } = mockReqRes({
        body: { format_type: 'league' },
      });

      await TournamentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Name and format_type are required' })
      );
    });

    it('returns 400 when format_type is missing', async () => {
      const { req, res } = mockReqRes({
        body: { name: 'Test' },
      });

      await TournamentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when name is empty string', async () => {
      const { req, res } = mockReqRes({
        body: { name: '   ', format_type: 'league' },
      });

      await TournamentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Name cannot be empty' })
      );
    });

    it('returns 400 for invalid format_type', async () => {
      const { req, res } = mockReqRes({
        body: { name: 'Test', format_type: 'invalid_format' },
      });

      await TournamentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid format_type' })
      );
    });

    it('accepts all valid format types', async () => {
      const formats = ['league', 'knockout', 'groups_playoff', 'multi_level', 'league_playoff', 'swiss'];

      for (const format of formats) {
        (TournamentModel.create as jest.Mock).mockResolvedValue({ ...mockTournament, format_type: format });
        const { req, res } = mockReqRes({
          body: { name: 'Test', format_type: format },
        });

        await TournamentController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('updateStatus', () => {
    it('updates status successfully', async () => {
      (TournamentModel.updateStatus as jest.Mock).mockResolvedValue({ ...mockTournament, status: 'active' });
      const { req, res } = mockReqRes({
        params: { id: 'test-id-1' },
        body: { status: 'active' },
      });

      await TournamentController.updateStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Tournament status updated to active' })
      );
    });

    it('returns 400 when status is missing', async () => {
      const { req, res } = mockReqRes({
        params: { id: 'test-id-1' },
        body: {},
      });

      await TournamentController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for invalid status', async () => {
      const { req, res } = mockReqRes({
        params: { id: 'test-id-1' },
        body: { status: 'cancelled' },
      });

      await TournamentController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when tournament not found', async () => {
      (TournamentModel.updateStatus as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({
        params: { id: 'nonexistent' },
        body: { status: 'active' },
      });

      await TournamentController.updateStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('deletes tournament successfully', async () => {
      (TournamentModel.delete as jest.Mock).mockResolvedValue(true);
      const { req, res } = mockReqRes({ params: { id: 'test-id-1' } });

      await TournamentController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Tournament deleted successfully' })
      );
    });

    it('returns 404 when tournament not found', async () => {
      (TournamentModel.delete as jest.Mock).mockResolvedValue(false);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await TournamentController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('search', () => {
    it('returns search results', async () => {
      (TournamentModel.search as jest.Mock).mockResolvedValue([mockTournament]);
      const { req, res } = mockReqRes({ query: { q: 'Test' } });

      await TournamentController.search(req, res);

      expect(TournamentModel.search).toHaveBeenCalledWith('Test');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, count: 1 })
      );
    });

    it('returns 400 when query is empty', async () => {
      const { req, res } = mockReqRes({ query: {} });

      await TournamentController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when query is whitespace', async () => {
      const { req, res } = mockReqRes({ query: { q: '   ' } });

      await TournamentController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
