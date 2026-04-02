import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesAPI } from '../services/api';
import { TeamLogo } from '../components/TeamLogo';
import type { Match, GoalScorer, MatchCard, Player, TeamWithPlayers } from '../types';
import { normalizeMatch } from '../types';

export function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamWithPlayers | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamWithPlayers | null>(null);
  const [scorers, setScorers] = useState<GoalScorer[]>([]);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    loadMatch();
    const interval = setInterval(loadLiveData, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      const [m, teams, gs, c] = await Promise.all([
        matchesAPI.getById(matchId!),
        matchesAPI.getTeams(matchId!),
        matchesAPI.getGoalScorers(matchId!),
        matchesAPI.getCards(matchId!),
      ]);
      const normalized = normalizeMatch(Array.isArray(m) ? m[0] : m);
      setMatch(normalized);
      if (teams) {
        setHomeTeam(teams.homeTeam || teams.home_team || null);
        setAwayTeam(teams.awayTeam || teams.away_team || null);
      }
      setScorers(Array.isArray(gs) ? gs : []);
      setCards(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveData = async () => {
    if (!matchId) return;
    try {
      const [m, gs, c] = await Promise.all([
        matchesAPI.getById(matchId),
        matchesAPI.getGoalScorers(matchId),
        matchesAPI.getCards(matchId),
      ]);
      setMatch(normalizeMatch(Array.isArray(m) ? m[0] : m));
      setScorers(Array.isArray(gs) ? gs : []);
      setCards(Array.isArray(c) ? c : []);
    } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Ladowanie meczu...</div>;
  if (!match) return <div style={{ textAlign: 'center', padding: 40 }}>Nie znaleziono meczu</div>;

  const statusColors: Record<string, string> = { scheduled: '#6b7280', live: '#ef4444', completed: '#3b82f6' };
  const statusLabels: Record<string, string> = { scheduled: 'Zaplanowany', live: 'Na zywo', completed: 'Zakonczony' };

  const homeScorers = scorers.filter((s) => s.team_id === (match.homeTeamId || match.home_team_id));
  const awayScorers = scorers.filter((s) => s.team_id === (match.awayTeamId || match.away_team_id));

  const getPlayerStats = (playerId: string) => {
    const goals = scorers.filter((s) => s.player_id === playerId && !s.is_own_goal).reduce((sum, s) => sum + s.goals_count, 0);
    const ownGoals = scorers.filter((s) => s.player_id === playerId && s.is_own_goal).reduce((sum, s) => sum + s.goals_count, 0);
    const yellow = cards.filter((c) => c.player_id === playerId && c.card_type === 'yellow').length;
    const red = cards.filter((c) => c.player_id === playerId && c.card_type === 'red').length;
    return { goals, ownGoals, yellow, red };
  };

  const renderPlayerList = (players: Player[], isHome: boolean) => {
    const starters = players.filter((p) => p.is_starter);
    const subs = players.filter((p) => !p.is_starter);

    const renderPlayer = (p: Player) => {
      const stats = getPlayerStats(p.id);
      const hasGoals = stats.goals > 0 || stats.ownGoals > 0;
      return (
        <div key={p.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 8,
          background: hasGoals ? '#fef3c7' : '#f9fafb',
          marginBottom: 4,
          position: 'relative' as const,
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: isHome ? '#2563eb' : '#dc2626',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}>
            {p.jersey_number || '-'}
          </div>
          <span style={{ fontSize: 14 }}>{p.first_name} {p.last_name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, fontSize: 12 }}>
            {stats.goals > 0 && <span title="Gole">⚽{stats.goals > 1 ? stats.goals : ''}</span>}
            {stats.ownGoals > 0 && <span title="Samoboje">⚽(sam.)</span>}
            {stats.yellow > 0 && <span title="Zolta kartka">🟨</span>}
            {stats.red > 0 && <span title="Czerwona kartka">🟥</span>}
          </div>
        </div>
      );
    };

    return (
      <div>
        <p style={{ fontWeight: 600, fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Podstawowy sklad</p>
        {starters.map(renderPlayer)}
        {subs.length > 0 && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
            <p style={{ fontWeight: 600, fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Rezerwowi</p>
            {subs.map(renderPlayer)}
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, display: 'inline-block', marginBottom: 16 }}>
        &larr; Powrot
      </Link>

      {/* Score Header */}
      <div style={styles.scoreCard}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{
            background: statusColors[match.status],
            color: 'white',
            padding: '3px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {statusLabels[match.status]}
          </span>
          {match.matchDate && (
            <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 10 }}>
              {new Date(match.matchDate).toLocaleDateString('pl-PL')}
            </span>
          )}
        </div>

        <div style={styles.scoreRow}>
          <div style={styles.scoreSide}>
            <TeamLogo logoUrl={match.homeTeamLogo} teamName={match.homeTeamName || ''} size={56} />
            <p style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 0', textAlign: 'center' as const }}>{match.homeTeamName}</p>
          </div>
          <div style={styles.scoreCenter}>
            <span style={{ fontSize: 48, fontWeight: 800 }}>
              {match.homeScore != null ? match.homeScore : '-'}
            </span>
            <span style={{ fontSize: 32, color: '#d1d5db', margin: '0 8px' }}>:</span>
            <span style={{ fontSize: 48, fontWeight: 800 }}>
              {match.awayScore != null ? match.awayScore : '-'}
            </span>
          </div>
          <div style={styles.scoreSide}>
            <TeamLogo logoUrl={match.awayTeamLogo} teamName={match.awayTeamName || ''} size={56} />
            <p style={{ fontWeight: 700, fontSize: 16, margin: '8px 0 0', textAlign: 'center' as const }}>{match.awayTeamName}</p>
          </div>
        </div>
      </div>

      {/* Goal Scorers */}
      {(homeScorers.length > 0 || awayScorers.length > 0) && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Strzelcy bramek</h3>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              {homeScorers.map((s, i) => (
                <p key={i} style={{ fontSize: 14, margin: '4px 0' }}>
                  ⚽ {s.first_name || ''} {s.last_name || s.player_name || ''}
                  {s.goals_count > 1 ? ` x${s.goals_count}` : ''}
                  {s.is_own_goal ? ' (sam.)' : ''}
                </p>
              ))}
            </div>
            <div style={{ width: 1, background: '#e5e7eb' }} />
            <div style={{ flex: 1, textAlign: 'right' as const }}>
              {awayScorers.map((s, i) => (
                <p key={i} style={{ fontSize: 14, margin: '4px 0' }}>
                  {s.first_name || ''} {s.last_name || s.player_name || ''}
                  {s.goals_count > 1 ? ` x${s.goals_count}` : ''}
                  {s.is_own_goal ? ' (sam.)' : ''} ⚽
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Info */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Informacje o meczu</h3>
        <div style={{ display: 'flex', gap: 20, fontSize: 14, color: '#6b7280' }}>
          {match.metadata?.round && <span>Runda: {match.metadata.round}</span>}
          {match.metadata?.match_number && <span>Mecz nr: {match.metadata.match_number}</span>}
          {match.sportsFieldName && <span>Boisko: {match.sportsFieldName}</span>}
        </div>
      </div>

      {/* Lineups */}
      {(homeTeam || awayTeam) && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Sklady</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ color: '#2563eb', margin: '0 0 10px' }}>{match.homeTeamName}</h4>
              {homeTeam?.players && renderPlayerList(homeTeam.players, true)}
            </div>
            <div>
              <h4 style={{ color: '#dc2626', margin: '0 0 10px' }}>{match.awayTeamName}</h4>
              {awayTeam?.players && renderPlayerList(awayTeam.players, false)}
            </div>
          </div>
        </div>
      )}

      {/* Result Summary */}
      {match.status === 'completed' && match.homeScore != null && match.awayScore != null && (
        <div style={{ ...styles.section, textAlign: 'center' as const }}>
          <h3 style={styles.sectionTitle}>Wynik</h3>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            {match.homeScore > match.awayScore
              ? `Zwyciestwo: ${match.homeTeamName}`
              : match.homeScore < match.awayScore
              ? `Zwyciestwo: ${match.awayTeamName}`
              : 'Remis'}
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scoreCard: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 },
  scoreRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 },
  scoreSide: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 },
  scoreCenter: { display: 'flex', alignItems: 'center' },
  section: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 },
  sectionTitle: { margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#1f2937' },
};
