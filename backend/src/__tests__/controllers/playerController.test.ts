import { Request, Response } from 'express';
import { PlayerController } from '../../controllers/playerController';
import { PlayerModel } from '../../models/playerModel';

jest.mock('../../models/playerModel');

const mockPlayer = {
  id: 'player-1',
  first_name: 'Jan',
  last_name: 'Kowalski',
  creator_id: '00000000-0000-0000-0000-000000000001',
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

describe('PlayerController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAll', () => {
    it('returns all players', async () => {
      (PlayerModel.findByCreator as jest.Mock).mockResolvedValue([mockPlayer]);
      const { req, res } = mockReqRes();

      await PlayerController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [mockPlayer] });
    });
  });

  describe('getById', () => {
    it('returns player when found', async () => {
      (PlayerModel.findById as jest.Mock).mockResolvedValue(mockPlayer);
      const { req, res } = mockReqRes({ params: { id: 'player-1' } });

      await PlayerController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockPlayer });
    });

    it('returns 404 when not found', async () => {
      (PlayerModel.findById as jest.Mock).mockResolvedValue(null);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await PlayerController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('creates player with valid data', async () => {
      (PlayerModel.create as jest.Mock).mockResolvedValue(mockPlayer);
      const { req, res } = mockReqRes({
        body: { first_name: 'Jan', last_name: 'Kowalski' },
      });

      await PlayerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 400 when first_name is missing', async () => {
      const { req, res } = mockReqRes({
        body: { last_name: 'Kowalski' },
      });

      await PlayerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when last_name is missing', async () => {
      const { req, res } = mockReqRes({
        body: { first_name: 'Jan' },
      });

      await PlayerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('delete', () => {
    it('deletes player successfully', async () => {
      (PlayerModel.delete as jest.Mock).mockResolvedValue(true);
      const { req, res } = mockReqRes({ params: { id: 'player-1' } });

      await PlayerController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 404 when not found', async () => {
      (PlayerModel.delete as jest.Mock).mockResolvedValue(false);
      const { req, res } = mockReqRes({ params: { id: 'nonexistent' } });

      await PlayerController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('search', () => {
    it('returns search results', async () => {
      (PlayerModel.search as jest.Mock).mockResolvedValue([mockPlayer]);
      const { req, res } = mockReqRes({ query: { q: 'Jan' } });

      await PlayerController.search(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
    });

    it('returns 400 when query is empty', async () => {
      const { req, res } = mockReqRes({ query: {} });

      await PlayerController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
