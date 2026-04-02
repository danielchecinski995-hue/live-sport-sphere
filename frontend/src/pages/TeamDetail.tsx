import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamsAPI } from '../services/api';
import { TeamLogo } from '../components/TeamLogo';
import type { Player } from '../types';

interface TeamData {
  id: string;
  name: string;
  logo_url?: string;
  players: Player[];
}

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    loadTeam();
  }, [teamId]);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await teamsAPI.getById(teamId!, true);
      setTeam(data.data || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Ladowanie druzyny...</div>;
  if (!team) return <div style={{ textAlign: 'center', padding: 40 }}>Nie znaleziono druzyny</div>;

  return (
    <div>
      <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 14, display: 'inline-block', marginBottom: 16 }}>
        &larr; Powrot
      </Link>

      {/* Team Header */}
      <div style={styles.header}>
        <TeamLogo logoUrl={team.logo_url} teamName={team.name} size={80} />
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>{team.name}</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
            {team.players?.length || 0} zawodnikow
          </p>
        </div>
      </div>

      {/* Players */}
      <div style={styles.section}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Zawodnicy</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {team.players?.length === 0 && (
            <p style={{ color: '#6b7280' }}>Brak zawodnikow</p>
          )}
          {team.players?.map((p) => (
            <div key={p.id} style={styles.playerCard}>
              <div style={styles.jerseyCircle}>
                {p.jersey_number || '-'}
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{p.first_name} {p.last_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'white',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  section: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 8,
    background: '#f9fafb',
  },
  jerseyCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
  },
};
