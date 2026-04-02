import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentsAPI } from '../services/api';
import { TeamLogo } from '../components/TeamLogo';
import type { Tournament, Match, Standing, Team } from '../types';
import { normalizeMatch } from '../types';

type Tab = 'matches' | 'standings' | 'teams';

export function TournamentDetail() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<Tab>('matches');
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Ladowanie turnieju...</div>;
  if (!tournament) return <div style={{ textAlign: 'center', padding: 40 }}>Nie znaleziono turnieju</div>;

  const statusColors: Record<string, string> = { scheduled: '#6b7280', live: '#ef4444', completed: '#3b82f6' };
  const statusLabels: Record<string, string> = { scheduled: 'Zaplanowany', live: 'Na zywo', completed: 'Zakonczony' };

  return (
    <div>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, display: 'inline-block', marginBottom: 16 }}>
        &larr; Powrot do listy
      </Link>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 26 }}>{tournament.name}</h1>
        {tournament.description && <p style={{ color: '#6b7280', margin: '4px 0' }}>{tournament.description}</p>}
        <p style={{ color: '#9ca3af', fontSize: 13 }}>
          {tournament.format === 'league' ? 'Liga' : 'Puchar'} | Kod: {tournament.share_code}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {(['matches', 'standings', 'teams'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '14px 0',
              border: 'none',
              background: tab === t ? '#2563eb' : 'white',
              color: tab === t ? 'white' : '#6b7280',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {t === 'matches' ? 'Mecze' : t === 'standings' ? 'Tabela' : 'Druzyny'}
          </button>
        ))}
      </div>

      {/* Matches Tab */}
      {tab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {matches.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>Brak meczy</p>
          ) : (
            matches.map((m) => (
              <Link key={m.id} to={`/match/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={cardStyles.matchCard}>
                  <div style={cardStyles.matchTeams}>
                    <div style={cardStyles.teamSide}>
                      <TeamLogo logoUrl={m.homeTeamLogo} teamName={m.homeTeamName || ''} size={32} />
                      <span style={cardStyles.teamName}>{m.homeTeamName}</span>
                    </div>
                    <div style={cardStyles.score}>
                      <span style={{ fontSize: 22, fontWeight: 700 }}>
                        {m.homeScore != null ? m.homeScore : '-'}
                      </span>
                      <span style={{ color: '#9ca3af', margin: '0 4px' }}>:</span>
                      <span style={{ fontSize: 22, fontWeight: 700 }}>
                        {m.awayScore != null ? m.awayScore : '-'}
                      </span>
                    </div>
                    <div style={{ ...cardStyles.teamSide, justifyContent: 'flex-end' }}>
                      <span style={{ ...cardStyles.teamName, textAlign: 'right' as const }}>{m.awayTeamName}</span>
                      <TeamLogo logoUrl={m.awayTeamLogo} teamName={m.awayTeamName || ''} size={32} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 6 }}>
                    <span style={{
                      background: statusColors[m.status] || '#6b7280',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontSize: 11,
                    }}>
                      {statusLabels[m.status] || m.status}
                    </span>
                    {m.matchDate && (
                      <span style={{ color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>
                        {new Date(m.matchDate).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
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
                <th style={{ ...th, textAlign: 'left' as const }}>Druzyna</th>
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
                  <td style={{ ...td, textAlign: 'left' as const }}>
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

      {/* Teams Tab */}
      {tab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {teams.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Brak druzyn</p>
          ) : (
            teams.map((t) => (
              <Link key={t.id} to={`/team/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <TeamLogo logoUrl={t.logo_url} teamName={t.name} size={48} />
                  <span style={{ fontWeight: 600, fontSize: 16 }}>{t.name}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 8px', textAlign: 'center', fontSize: 13, color: '#6b7280', fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 8px', textAlign: 'center' };

const cardStyles: Record<string, React.CSSProperties> = {
  matchCard: { background: 'white', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' },
  matchTeams: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  teamSide: { display: 'flex', alignItems: 'center', gap: 10, flex: 1 },
  teamName: { fontWeight: 600, fontSize: 15 },
  score: { display: 'flex', alignItems: 'center', padding: '0 16px' },
};
