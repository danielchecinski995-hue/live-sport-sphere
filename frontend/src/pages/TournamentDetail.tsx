import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsAPI, teamsAPI, matchesAPI } from '../services/api';
import { TeamLogo } from '../components/TeamLogo';
import { LogoPicker } from '../components/LogoPicker';
import { SquadManager } from '../components/SquadManager';
import type { Tournament, Match, Standing, Team } from '../types';
import { normalizeMatch } from '../types';

type Tab = 'matches' | 'standings' | 'teams' | 'settings';

const FORMAT_LABELS: Record<string, string> = {
  league: 'Liga',
  knockout: 'Puchar',
  groups_playoff: 'Grupy + Playoff',
  league_playoff: 'Liga + Playoff',
  swiss: 'Szwajcarski',
  multi_level: 'Multi-level',
};

export function TournamentDetail() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<Tab>('teams');
  const [loading, setLoading] = useState(true);

  // Team form state
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamCoach, setTeamCoach] = useState('');
  const [teamLogo, setTeamLogo] = useState<string | undefined>();
  const [teamSaving, setTeamSaving] = useState(false);

  // Squad manager
  const [squadTeam, setSquadTeam] = useState<Team | null>(null);

  // Referees
  const [ref1, setRef1] = useState('');
  const [ref2, setRef2] = useState('');
  const [ref3, setRef3] = useState('');
  const [refSaving, setRefSaving] = useState(false);

  // Match creation
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchSaving, setMatchSaving] = useState(false);

  const isDraft = tournament?.status === 'draft';

  useEffect(() => {
    if (!shareCode) return;
    loadTournament();
  }, [shareCode]);

  useEffect(() => {
    if (!tournament) return;
    const interval = setInterval(() => {
      loadMatches();
      loadStandings();
    }, 5000);
    return () => clearInterval(interval);
  }, [tournament]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const t = await tournamentsAPI.getByShareCode(shareCode!);
      const data = Array.isArray(t) ? t[0] : t;
      setTournament(data);
      if (data?.referees) {
        setRef1(data.referees[0] || '');
        setRef2(data.referees[1] || '');
        setRef3(data.referees[2] || '');
      }
      if (data?.id) {
        const [m, s, tm] = await Promise.all([
          tournamentsAPI.getMatches(data.id),
          tournamentsAPI.getStandings(data.id),
          tournamentsAPI.getTeams(data.id),
        ]);
        setMatches((Array.isArray(m) ? m : []).map(normalizeMatch));
        setStandings(Array.isArray(s) ? s : []);
        setTeams(Array.isArray(tm) ? tm : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!tournament?.id) return;
    try {
      const m = await tournamentsAPI.getMatches(tournament.id);
      setMatches((Array.isArray(m) ? m : []).map(normalizeMatch));
    } catch {}
  };

  const loadStandings = async () => {
    if (!tournament?.id) return;
    try {
      const s = await tournamentsAPI.getStandings(tournament.id);
      setStandings(Array.isArray(s) ? s : []);
    } catch {}
  };

  const loadTeams = async () => {
    if (!tournament?.id) return;
    try {
      const tm = await tournamentsAPI.getTeams(tournament.id);
      setTeams(Array.isArray(tm) ? tm : []);
    } catch {}
  };

  // Team CRUD
  const openTeamForm = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamName(team.name);
      setTeamCoach(team.coach_name || '');
      setTeamLogo(team.logo_url || undefined);
    } else {
      setEditingTeam(null);
      setTeamName('');
      setTeamCoach('');
      setTeamLogo(undefined);
    }
    setShowTeamForm(true);
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !tournament?.id) return;
    setTeamSaving(true);
    try {
      if (editingTeam) {
        await teamsAPI.update(editingTeam.id, { name: teamName.trim(), logo_url: teamLogo, coach_name: teamCoach.trim() || undefined });
      } else {
        await teamsAPI.create(tournament.id, { name: teamName.trim(), logo_url: teamLogo, coach_name: teamCoach.trim() || undefined });
      }
      setShowTeamForm(false);
      await loadTeams();
    } catch (err) {
      console.error('Team save error:', err);
      alert('Blad zapisywania druzyny: ' + (err instanceof Error ? err.message : err));
    } finally {
      setTeamSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await teamsAPI.delete(teamId);
      loadTeams();
    } catch {
      alert('Blad usuwania druzyny');
    }
  };

  // Referees
  const handleSaveReferees = async () => {
    if (!tournament?.id) return;
    setRefSaving(true);
    try {
      const referees = [ref1, ref2, ref3].map(r => r.trim()).filter(Boolean);
      await tournamentsAPI.updateReferees(tournament.id, referees);
      setTournament({ ...tournament, referees });
    } catch {
      alert('Blad zapisywania sedziow');
    } finally {
      setRefSaving(false);
    }
  };

  // Match CRUD
  const handleCreateMatch = async () => {
    if (!homeTeamId || !awayTeamId || !tournament?.id) return;
    setMatchSaving(true);
    try {
      await matchesAPI.create(tournament.id, { home_team_id: homeTeamId, away_team_id: awayTeamId });
      setHomeTeamId('');
      setAwayTeamId('');
      setShowMatchForm(false);
      loadMatches();
    } catch (err) {
      alert('Blad tworzenia meczu');
    } finally {
      setMatchSaving(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await matchesAPI.delete(matchId);
      loadMatches();
    } catch {
      alert('Blad usuwania meczu');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Ladowanie turnieju...</div>;
  if (!tournament) return <div style={{ textAlign: 'center', padding: 40 }}>Nie znaleziono turnieju</div>;

  const statusColors: Record<string, string> = { scheduled: '#6b7280', live: '#ef4444', completed: '#3b82f6' };
  const statusLabels: Record<string, string> = { scheduled: 'Zaplanowany', live: 'Na zywo', completed: 'Zakonczony' };
  const formatLabel = FORMAT_LABELS[tournament.format_type || tournament.format || ''] || tournament.format_type || tournament.format || '';

  const tabs: Tab[] = isDraft ? ['teams', 'settings', 'matches', 'standings'] : ['matches', 'standings', 'teams'];
  const tabLabels: Record<Tab, string> = { matches: 'Mecze', standings: 'Tabela', teams: 'Druzyny', settings: 'Ustawienia' };

  // If managing a squad, show SquadManager
  if (squadTeam) {
    return (
      <div>
        <button onClick={() => { setSquadTeam(null); loadTeams(); }} style={{ ...styles.backLink, marginBottom: 16 }}>
          &larr; Powrot do druzyn
        </button>
        <SquadManager teamId={squadTeam.id} teamName={squadTeam.name} onClose={() => { setSquadTeam(null); loadTeams(); }} />
      </div>
    );
  }

  return (
    <div>
      <Link to="/" style={styles.backLink}>&larr; Powrot do listy</Link>

      {/* Tournament header */}
      <div style={styles.card}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26 }}>{tournament.name}</h1>
        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
          {formatLabel} | Kod: {tournament.share_code}
          {isDraft && <span style={{ background: '#6b7280', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 11, marginLeft: 8 }}>Projekt</span>}
        </p>
        {tournament.referees && tournament.referees.length > 0 && (
          <p style={{ color: '#6b7280', fontSize: 13, margin: '6px 0 0' }}>
            Sedziowie: {tournament.referees.join(', ')}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '14px 0', border: 'none',
              background: tab === t ? '#2563eb' : 'white',
              color: tab === t ? 'white' : '#6b7280',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Teams Tab */}
      {tab === 'teams' && (
        <div>
          {isDraft && !showTeamForm && (
            <button onClick={() => openTeamForm()} style={{ ...styles.btnBlue, marginBottom: 16, width: '100%' }}>
              + Dodaj druzyne
            </button>
          )}

          {showTeamForm && (
            <form onSubmit={handleTeamSubmit} style={{ ...styles.card, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px' }}>{editingTeam ? 'Edytuj druzyne' : 'Nowa druzyna'}</h3>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Nazwa druzyny"
                style={styles.input}
                autoFocus
              />
              <input
                value={teamCoach}
                onChange={e => setTeamCoach(e.target.value)}
                placeholder="Trener (opcjonalnie)"
                style={styles.input}
              />
              <LogoPicker selectedUrl={teamLogo} onSelect={setTeamLogo} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={teamSaving || !teamName.trim()} style={styles.btnGreen}>
                  {teamSaving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
                <button type="button" onClick={() => setShowTeamForm(false)} style={styles.btnGray}>Anuluj</button>
              </div>
            </form>
          )}

          {teams.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Brak druzyn</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {teams.map((t) => (
                <div key={t.id} style={styles.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <TeamLogo logoUrl={t.logo_url} teamName={t.name} size={48} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</span>
                      {t.coach_name && <p style={{ color: '#6b7280', fontSize: 13, margin: '2px 0 0' }}>Trener: {t.coach_name}</p>}
                    </div>
                    {isDraft && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSquadTeam(t)} style={styles.btnSmallBlue}>Sklad</button>
                        <button onClick={() => openTeamForm(t)} style={styles.btnSmallPurple}>Edytuj</button>
                        <button onClick={() => handleDeleteTeam(t.id)} style={styles.btnSmallRed}>Usun</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab (draft only) */}
      {tab === 'settings' && isDraft && (
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px' }}>Ustawienia turnieju</h3>

          <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Format: {formatLabel}</p>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

          <h4 style={{ margin: '0 0 12px' }}>Sedziowie</h4>
          <input value={ref1} onChange={e => setRef1(e.target.value)} placeholder="Sedzia glowny" style={styles.input} />
          <input value={ref2} onChange={e => setRef2(e.target.value)} placeholder="Sedzia asystent 1" style={styles.input} />
          <input value={ref3} onChange={e => setRef3(e.target.value)} placeholder="Sedzia asystent 2" style={styles.input} />
          <button onClick={handleSaveReferees} disabled={refSaving} style={styles.btnGreen}>
            {refSaving ? 'Zapisywanie...' : 'Zapisz sedziow'}
          </button>
        </div>
      )}

      {/* Matches Tab */}
      {tab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Match creation (draft mode) */}
          {isDraft && teams.length >= 2 && !showMatchForm && (
            <button onClick={() => setShowMatchForm(true)} style={{ ...styles.btnBlue, width: '100%' }}>
              + Dodaj mecz
            </button>
          )}
          {isDraft && teams.length < 2 && (
            <p style={{ color: '#f59e0b', textAlign: 'center', fontSize: 14 }}>Dodaj co najmniej 2 druzyny aby tworzyc mecze</p>
          )}

          {showMatchForm && (
            <div style={{ ...styles.card, marginBottom: 0 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Nowy mecz</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                {/* Home team */}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Gospodarz</label>
                  <select
                    value={homeTeamId}
                    onChange={e => setHomeTeamId(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0 }}
                  >
                    <option value="">-- Wybierz --</option>
                    {teams.filter(t => t.id !== awayTeamId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <span style={{ fontWeight: 700, fontSize: 20, color: '#6b7280', paddingTop: 18 }}>vs</span>

                {/* Away team */}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' }}>Gosc</label>
                  <select
                    value={awayTeamId}
                    onChange={e => setAwayTeamId(e.target.value)}
                    style={{ ...styles.input, marginBottom: 0 }}
                  >
                    <option value="">-- Wybierz --</option>
                    {teams.filter(t => t.id !== homeTeamId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick team list for reference */}
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 6px', fontWeight: 600 }}>Dostepne druzyny:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {teams.map(t => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                      background: t.id === homeTeamId || t.id === awayTeamId ? '#dbeafe' : 'white',
                      border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (!homeTeamId) setHomeTeamId(t.id);
                      else if (!awayTeamId && t.id !== homeTeamId) setAwayTeamId(t.id);
                    }}
                    >
                      <TeamLogo logoUrl={t.logo_url} teamName={t.name} size={20} />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCreateMatch}
                  disabled={matchSaving || !homeTeamId || !awayTeamId}
                  style={{
                    ...styles.btnGreen,
                    opacity: (!homeTeamId || !awayTeamId) ? 0.5 : 1,
                  }}
                >
                  {matchSaving ? 'Tworzenie...' : 'Utworz mecz'}
                </button>
                <button onClick={() => { setShowMatchForm(false); setHomeTeamId(''); setAwayTeamId(''); }} style={styles.btnGray}>
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* Match list */}
          {matches.length === 0 && !showMatchForm ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Brak meczy</p>
          ) : (
            matches.map((m) => (
              <div key={m.id} style={{ position: 'relative' }}>
                <Link to={`/match/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={styles.matchCard}>
                    <div style={styles.matchTeams}>
                      <div style={styles.teamSide}>
                        <TeamLogo logoUrl={m.homeTeamLogo} teamName={m.homeTeamName || ''} size={32} />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{m.homeTeamName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                        <span style={{ fontSize: 22, fontWeight: 700 }}>{m.homeScore != null ? m.homeScore : '-'}</span>
                        <span style={{ color: '#9ca3af', margin: '0 4px' }}>:</span>
                        <span style={{ fontSize: 22, fontWeight: 700 }}>{m.awayScore != null ? m.awayScore : '-'}</span>
                      </div>
                      <div style={{ ...styles.teamSide, justifyContent: 'flex-end' }}>
                        <span style={{ fontWeight: 600, fontSize: 15, textAlign: 'right' }}>{m.awayTeamName}</span>
                        <TeamLogo logoUrl={m.awayTeamLogo} teamName={m.awayTeamName || ''} size={32} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 6 }}>
                      <span style={{ background: statusColors[m.status] || '#6b7280', color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>
                        {statusLabels[m.status] || m.status}
                      </span>
                    </div>
                  </div>
                </Link>
                {isDraft && m.status === 'scheduled' && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleDeleteMatch(m.id); }}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: '#dc2626', color: 'white', border: 'none',
                      width: 24, height: 24, borderRadius: '50%',
                      cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Usun mecz"
                  >
                    x
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Standings Tab */}
      {tab === 'standings' && (
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={th}>#</th>
                <th style={{ ...th, textAlign: 'left' }}>Druzyna</th>
                <th style={th}>M</th>
                <th style={th}>W</th>
                <th style={th}>R</th>
                <th style={th}>P</th>
                <th style={th}>GZ</th>
                <th style={th}>GS</th>
                <th style={th}>RB</th>
                <th style={{ ...th, fontWeight: 700 }}>Pkt</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.team_id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={td}>{s.position}</td>
                  <td style={{ ...td, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamLogo logoUrl={s.team_logo_url || (s as any).team_logo} teamName={s.team_name} size={24} />
                      {s.team_name}
                    </div>
                  </td>
                  <td style={td}>{s.wins + s.draws + s.losses}</td>
                  <td style={td}>{s.wins}</td>
                  <td style={td}>{s.draws}</td>
                  <td style={td}>{s.losses}</td>
                  <td style={td}>{s.goals_for}</td>
                  <td style={td}>{s.goals_against}</td>
                  <td style={td}>{s.goal_difference}</td>
                  <td style={{ ...td, fontWeight: 700, color: '#2563eb' }}>{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {standings.length === 0 && <p style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Brak danych</p>}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 8px', textAlign: 'center', fontSize: 13, color: '#6b7280', fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 8px', textAlign: 'center' };

const styles: Record<string, React.CSSProperties> = {
  backLink: { color: '#2563eb', textDecoration: 'none', fontSize: 14, display: 'inline-block', marginBottom: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 },
  tabs: { display: 'flex', gap: 0, marginBottom: 20, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginBottom: 10, boxSizing: 'border-box' as const },
  btnBlue: { background: '#2563eb', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 15 },
  btnGreen: { background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnGray: { background: '#6b7280', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  btnSmallBlue: { background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnSmallPurple: { background: '#7c3aed', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  btnSmallRed: { background: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  matchCard: { background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' },
  matchTeams: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  teamSide: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
};
