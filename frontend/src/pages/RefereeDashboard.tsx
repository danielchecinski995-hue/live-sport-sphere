import { useState, useEffect, useRef } from 'react';
import { tournamentsAPI, matchesAPI } from '../services/api';
import { TeamLogo } from '../components/TeamLogo';
import type { Tournament, Match, GoalScorer, MatchCard as MatchCardType, Player, TeamWithPlayers } from '../types';
import { normalizeMatch } from '../types';

export function RefereeDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
    const interval = setInterval(loadTournaments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    loadMatches();
    const interval = setInterval(loadMatches, 5000);
    return () => clearInterval(interval);
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      const data = await tournamentsAPI.getAll();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!selectedTournament) return;
    try {
      const data = await tournamentsAPI.getMatches(selectedTournament.id);
      setMatches((Array.isArray(data) ? data : []).map(normalizeMatch));
    } catch {}
  };

  // Referee Mode
  if (selectedMatch) {
    return (
      <RefereeMode
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    );
  }

  // Match list
  if (selectedTournament) {
    return (
      <div>
        <button onClick={() => setSelectedTournament(null)} style={styles.backBtn}>
          &larr; Powrot do turniejow
        </button>
        <h2 style={{ margin: '0 0 20px' }}>{selectedTournament.name}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Brak meczy w turnieju</p>
          ) : (
            matches.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                style={styles.matchCard}
              >
                <div style={styles.matchRow}>
                  <div style={styles.teamSide}>
                    <TeamLogo logoUrl={m.homeTeamLogo} teamName={m.homeTeamName || ''} size={32} />
                    <span style={{ fontWeight: 600 }}>{m.homeTeamName}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, padding: '0 12px' }}>
                    {m.homeScore ?? '-'} : {m.awayScore ?? '-'}
                  </div>
                  <div style={{ ...styles.teamSide, justifyContent: 'flex-end' }}>
                    <span style={{ fontWeight: 600 }}>{m.awayTeamName}</span>
                    <TeamLogo logoUrl={m.awayTeamLogo} teamName={m.awayTeamName || ''} size={32} />
                  </div>
                </div>
                <p style={{ color: '#10b981', fontSize: 13, margin: '8px 0 0', textAlign: 'center' as const }}>
                  Dotknij, aby sedziowac &rarr;
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Tournament list
  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>Tryb Sedziego</h2>
      {loading ? (
        <p>Ladowanie...</p>
      ) : tournaments.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Brak dostepnych turniejow</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tournaments.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTournament(t)}
              style={styles.tournamentCard}
            >
              <h3 style={{ margin: 0 }}>{t.name}</h3>
              <p style={{ color: '#10b981', fontSize: 13, margin: '4px 0 0' }}>
                Dotknij, aby wybrac &rarr;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================
// REFEREE MODE — Full match management
// ================================================

function RefereeMode({ match: initialMatch, onClose }: { match: Match; onClose: () => void }) {
  const [match, setMatch] = useState(initialMatch);
  const [homeTeam, setHomeTeam] = useState<TeamWithPlayers | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamWithPlayers | null>(null);
  const [scorers, setScorers] = useState<GoalScorer[]>([]);
  const [cards, setCards] = useState<MatchCardType[]>([]);
  const [timer, setTimer] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; teamId: string; isHome: boolean } | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [playerOut, setPlayerOut] = useState<{ player: Player; teamId: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadLiveData, 5000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (match.status === 'live') {
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [match.status]);

  const loadData = async () => {
    try {
      const [teams, gs, c] = await Promise.all([
        matchesAPI.getTeams(match.id),
        matchesAPI.getGoalScorers(match.id),
        matchesAPI.getCards(match.id),
      ]);
      if (teams) {
        setHomeTeam(teams.homeTeam || teams.home_team || teams.home || null);
        setAwayTeam(teams.awayTeam || teams.away_team || teams.away || null);
      }
      setScorers(Array.isArray(gs) ? gs : []);
      setCards(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLiveData = async () => {
    try {
      const [m, gs, c] = await Promise.all([
        matchesAPI.getById(match.id),
        matchesAPI.getGoalScorers(match.id),
        matchesAPI.getCards(match.id),
      ]);
      const normalized = normalizeMatch(Array.isArray(m) ? m[0] : m);
      setMatch(normalized);
      setScorers(Array.isArray(gs) ? gs : []);
      setCards(Array.isArray(c) ? c : []);
    } catch {}
  };

  const handleStartMatch = async () => {
    try {
      await matchesAPI.updateStatus(match.id, 'live');
      setMatch({ ...match, status: 'live' });
      setTimer(0);
    } catch (err) {
      alert('Blad rozpoczynania meczu');
    }
  };

  const handleEndMatch = async () => {
    if (!confirm('Czy na pewno chcesz zakonczyc mecz?')) return;
    try {
      await matchesAPI.updateStatus(match.id, 'completed');
      setMatch({ ...match, status: 'completed' });
    } catch (err) {
      alert('Blad konczenia meczu');
    }
  };

  const handleAddGoal = async (playerId: string, teamId: string, isOwnGoal: boolean) => {
    try {
      await matchesAPI.addGoalScorer(match.id, { player_id: playerId, team_id: teamId, is_own_goal: isOwnGoal });
      setSelectedPlayer(null);
      loadLiveData();
      loadData();
    } catch (err) {
      alert('Blad dodawania gola');
    }
  };

  const handleAddCard = async (playerId: string, teamId: string, cardType: 'yellow' | 'red') => {
    try {
      await matchesAPI.addCard(match.id, { player_id: playerId, team_id: teamId, card_type: cardType });
      setSelectedPlayer(null);
      loadLiveData();
    } catch (err) {
      alert('Blad dodawania kartki');
    }
  };

  const handleSubstitution = async (playerInId: string) => {
    if (!playerOut) return;
    try {
      await matchesAPI.addSubstitution(match.id, {
        teamId: playerOut.teamId,
        playerOutId: playerOut.player.id,
        playerInId,
      });
      setShowSubModal(false);
      setPlayerOut(null);
      setSelectedPlayer(null);
      loadData();
    } catch (err) {
      alert('Blad zmiany zawodnika');
    }
  };

  const getPlayerStats = (playerId: string) => {
    const goals = scorers.filter((s) => s.player_id === playerId && !s.is_own_goal).reduce((sum, s) => sum + s.goals_count, 0);
    const ownGoals = scorers.filter((s) => s.player_id === playerId && s.is_own_goal).reduce((sum, s) => sum + s.goals_count, 0);
    const yellow = cards.filter((c) => c.player_id === playerId && c.card_type === 'yellow').length;
    const red = cards.filter((c) => c.player_id === playerId && c.card_type === 'red').length;
    return { goals, ownGoals, yellow, red };
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const renderPlayerColumn = (team: TeamWithPlayers | null, isHome: boolean) => {
    if (!team?.players) return null;
    const teamId = team.id;
    const starters = team.players.filter((p) => p.is_starter);
    const subs = team.players.filter((p) => !p.is_starter);

    const renderPlayer = (p: Player, _isStarter: boolean) => {
      const stats = getPlayerStats(p.id);
      const hasGoals = stats.goals > 0 || stats.ownGoals > 0;
      return (
        <div
          key={p.id}
          onClick={() => match.status === 'live' && setSelectedPlayer({ player: p, teamId, isHome })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: hasGoals ? '#fef3c7' : '#f9fafb',
            marginBottom: 4,
            cursor: match.status === 'live' ? 'pointer' : 'default',
            position: 'relative' as const,
            transition: 'background 0.15s',
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isHome ? '#2563eb' : '#dc2626',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {p.jersey_number || '-'}
          </div>
          <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {p.first_name} {p.last_name}
          </span>
          <div style={{ display: 'flex', gap: 3, fontSize: 11 }}>
            {stats.goals > 0 && <span>⚽{stats.goals > 1 ? stats.goals : ''}</span>}
            {stats.ownGoals > 0 && <span>⚽(s)</span>}
            {stats.yellow > 0 && <span>🟨</span>}
            {stats.red > 0 && <span>🟥</span>}
          </div>
        </div>
      );
    };

    return (
      <div>
        <h4 style={{ margin: '0 0 8px', color: isHome ? '#2563eb' : '#dc2626', fontSize: 14 }}>
          {isHome ? 'Gospodarze' : 'Goscie'}
        </h4>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px', fontWeight: 600 }}>Podstawowy sklad</p>
        {starters.map((p) => renderPlayer(p, true))}
        {subs.length > 0 && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px', fontWeight: 600 }}>Rezerwowi</p>
            {subs.map((p) => renderPlayer(p, false))}
          </>
        )}
      </div>
    );
  };

  const getSubs = () => {
    if (!playerOut) return [];
    const team = playerOut.teamId === homeTeam?.id ? homeTeam : awayTeam;
    return team?.players?.filter((p) => !p.is_starter) || [];
  };

  return (
    <div style={{ position: 'relative' as const }}>
      {/* Header */}
      <div style={refStyles.header}>
        <button onClick={onClose} style={refStyles.backBtn}>&larr; Powrot</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>Tryb Sedziowski</h2>
      </div>

      {/* Score */}
      <div style={refStyles.scoreSection}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' as const }}>
            <TeamLogo logoUrl={match.homeTeamLogo} teamName={match.homeTeamName || ''} size={48} />
            <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>{match.homeTeamName}</p>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>
            {match.homeScore ?? 0} : {match.awayScore ?? 0}
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <TeamLogo logoUrl={match.awayTeamLogo} teamName={match.awayTeamName || ''} size={48} />
            <p style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 0' }}>{match.awayTeamName}</p>
          </div>
        </div>
      </div>

      {/* Match Controls */}
      <div style={refStyles.controls}>
        {match.status === 'scheduled' && (
          <button onClick={handleStartMatch} style={refStyles.startBtn}>
            ▶ Rozpocznij Mecz
          </button>
        )}
        {match.status === 'live' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
            <div style={refStyles.timer}>{formatTime(timer)}</div>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>● LIVE</span>
            <button onClick={handleEndMatch} style={refStyles.endBtn}>
              ■ Zakoncz Mecz
            </button>
          </div>
        )}
        {match.status === 'completed' && (
          <p style={{ textAlign: 'center' as const, color: '#6b7280', fontWeight: 600 }}>Mecz Zakonczony</p>
        )}
      </div>

      {/* Player Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {renderPlayerColumn(homeTeam, true)}
        {renderPlayerColumn(awayTeam, false)}
      </div>

      {/* Action Popup */}
      {selectedPlayer && (
        <div style={refStyles.overlay} onClick={() => setSelectedPlayer(null)}>
          <div style={refStyles.popup} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px' }}>
              #{selectedPlayer.player.jersey_number} {selectedPlayer.player.first_name} {selectedPlayer.player.last_name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => handleAddGoal(selectedPlayer.player.id, selectedPlayer.teamId, false)}
                style={{ ...refStyles.actionBtn, background: '#10b981' }}
              >
                ⚽ Gol
              </button>
              <button
                onClick={() => handleAddCard(selectedPlayer.player.id, selectedPlayer.teamId, 'yellow')}
                style={{ ...refStyles.actionBtn, background: '#f59e0b' }}
              >
                🟨 Zolta kartka
              </button>
              <button
                onClick={() => handleAddCard(selectedPlayer.player.id, selectedPlayer.teamId, 'red')}
                style={{ ...refStyles.actionBtn, background: '#ef4444' }}
              >
                🟥 Czerwona kartka
              </button>
              <button
                onClick={() => handleAddGoal(selectedPlayer.player.id, selectedPlayer.teamId, true)}
                style={{ ...refStyles.actionBtn, background: '#8b5cf6' }}
              >
                ⚽ Samoboj
              </button>
              {selectedPlayer.player.is_starter && (
                <button
                  onClick={() => {
                    setPlayerOut({ player: selectedPlayer.player, teamId: selectedPlayer.teamId });
                    setShowSubModal(true);
                  }}
                  style={{ ...refStyles.actionBtn, background: '#0ea5e9' }}
                >
                  🔁 Zmiana
                </button>
              )}
              <button
                onClick={() => setSelectedPlayer(null)}
                style={{ ...refStyles.actionBtn, background: '#6b7280' }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubModal && playerOut && (
        <div style={refStyles.overlay} onClick={() => { setShowSubModal(false); setPlayerOut(null); }}>
          <div style={refStyles.subModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px' }}>Wybierz rezerwowego</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>
              Schodzi: #{playerOut.player.jersey_number} {playerOut.player.first_name} {playerOut.player.last_name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {getSubs().map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSubstitution(p.id)}
                  style={refStyles.subPlayer}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#2563eb',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {p.jersey_number || '-'}
                  </div>
                  <span>{p.first_name} {p.last_name}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setShowSubModal(false); setPlayerOut(null); }}
              style={{ ...refStyles.actionBtn, background: '#6b7280', marginTop: 12, width: '100%' }}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 },
  matchCard: {
    background: 'white',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    borderLeft: '4px solid #10b981',
  },
  matchRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  teamSide: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  tournamentCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
};

const refStyles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  backBtn: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  scoreSection: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  controls: {
    background: 'white',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  startBtn: {
    width: '100%',
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  endBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  timer: {
    background: '#1f2937',
    color: '#10b981',
    padding: '8px 16px',
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 700,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  popup: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  subModal: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    minWidth: 320,
    maxWidth: 400,
    maxHeight: '70vh',
    overflowY: 'auto' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  actionBtn: {
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  subPlayer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#f9fafb',
    cursor: 'pointer',
  },
};
