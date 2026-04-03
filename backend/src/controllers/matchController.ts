import { Request, Response } from 'express';
import { MatchModel } from '../models/matchModel';

export class MatchController {
  static async getByTournament(req: Request, res: Response) {
    try {
      const { tournamentId } = req.params;
      const matches = await MatchModel.findByTournamentId(tournamentId);
      res.json({ success: true, data: matches });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch matches', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const match = await MatchModel.findById(req.params.id);
      if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
      res.json({ success: true, data: match });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch match', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async updateResult(req: Request, res: Response) {
    try {
      const { homeScore, awayScore } = req.body;
      const match = await MatchModel.updateResult(req.params.id, homeScore, awayScore);
      if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
      res.json({ success: true, data: match });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update result', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const match = await MatchModel.updateStatus(req.params.id, status);
      if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
      res.json({ success: true, data: match });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update status', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getMatchTeams(req: Request, res: Response) {
    try {
      const teams = await MatchModel.getMatchTeams(req.params.id);
      if (!teams) return res.status(404).json({ success: false, error: 'Match not found' });
      res.json({ success: true, data: teams });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch match teams', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getGoalScorers(req: Request, res: Response) {
    try {
      const scorers = await MatchModel.getGoalScorers(req.params.id);
      res.json({ success: true, data: scorers });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch goal scorers', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async addGoalScorer(req: Request, res: Response) {
    try {
      const { player_id, team_id, is_own_goal } = req.body;
      const scorer = await MatchModel.addGoalScorer(req.params.id, player_id, team_id, is_own_goal || false);
      res.status(201).json({ success: true, data: scorer });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to add goal scorer', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getMatchCards(req: Request, res: Response) {
    try {
      const cards = await MatchModel.getMatchCards(req.params.id);
      res.json({ success: true, data: cards });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch cards', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async addCard(req: Request, res: Response) {
    try {
      const { player_id, team_id, card_type, minute } = req.body;
      const card = await MatchModel.addCard(req.params.id, player_id, team_id, card_type, minute);
      res.status(201).json({ success: true, data: card });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to add card', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getSubstitutions(req: Request, res: Response) {
    try {
      const subs = await MatchModel.getSubstitutions(req.params.id);
      res.json({ success: true, data: subs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch substitutions', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async addSubstitution(req: Request, res: Response) {
    try {
      const { teamId, playerOutId, playerInId, minute } = req.body;
      const sub = await MatchModel.addSubstitution(req.params.id, teamId, playerOutId, playerInId, minute);
      res.status(201).json({ success: true, data: sub });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to add substitution', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { tournamentId } = req.params;
      const { home_team_id, away_team_id, match_date } = req.body;

      if (!home_team_id || !away_team_id) {
        return res.status(400).json({ success: false, error: 'home_team_id and away_team_id are required' });
      }
      if (home_team_id === away_team_id) {
        return res.status(400).json({ success: false, error: 'Teams must be different' });
      }

      const match = await MatchModel.create(tournamentId, home_team_id, away_team_id, match_date);

      // Fetch with team names
      const full = await MatchModel.findById(match.id);
      res.status(201).json({ success: true, data: full });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create match', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const deleted = await MatchModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Match not found' });
      res.json({ success: true, message: 'Match deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete match', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }

  static async getStandings(req: Request, res: Response) {
    try {
      const { tournamentId } = req.params;
      const standings = await MatchModel.getStandingsByTournament(tournamentId);
      res.json({ success: true, data: standings });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch standings', details: error instanceof Error ? error.message : 'Unknown' });
    }
  }
}
