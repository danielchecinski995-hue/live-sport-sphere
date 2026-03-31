/**
 * Live Sport Sphere - Main App Component
 */

import { useState, useEffect } from 'react';
import { tournamentsAPI } from './services/api';
import { useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';

interface Tournament {
  id: string;
  name: string;
  format_type: string;
  share_code: string;
  status: string;
  created_at: string;
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [publicTournaments, setPublicTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show auth page if not logged in
  if (authLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Ladowanie...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [creating, setCreating] = useState(false);

  // Load tournaments on mount
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const [myData, publicData] = await Promise.all([
        tournamentsAPI.getAll(),
        tournamentsAPI.getPublic(),
      ]);
      setTournaments(myData.data || []);
      setPublicTournaments(publicData.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTournamentName.trim()) return;

    try {
      setCreating(true);
      await tournamentsAPI.create({
        name: newTournamentName,
        format_type: 'league',
        config: {
          points: { win: 3, draw: 1, loss: 0 },
        },
      });

      setNewTournamentName('');
      setShowCreateForm(false);
      loadTournaments(); // Reload list
    } catch (err) {
      alert('Failed to create tournament: ' + (err instanceof Error ? err.message : ''));
    } finally {
      setCreating(false);
    }
  };

  const handleActivateTournament = async (id: string) => {
    try {
      await tournamentsAPI.updateStatus(id, 'active');
      loadTournaments();
    } catch (err) {
      alert('Failed to activate tournament');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Live Sport Sphere</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Live Sport Sphere</h1>
          <p style={{ margin: '4px 0 0', color: '#666' }}>Witaj, {user.displayName || user.email}</p>
        </div>
        <button
          onClick={signOut}
          style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Wyloguj
        </button>
      </div>

      {error && (
        <div style={{ background: '#ffebee', padding: '10px', marginBottom: '20px', border: '1px solid #f44336' }}>
          Error: {error}
        </div>
      )}

      {/* Create Tournament Button */}
      <div style={{ marginBottom: '30px' }}>
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            + Utwórz Nowy Turniej
          </button>
        ) : (
          <form onSubmit={handleCreateTournament} style={{ border: '1px solid #ccc', padding: '15px', background: '#f9f9f9' }}>
            <h3>Nowy Turniej</h3>
            <input
              type="text"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              placeholder="Nazwa turnieju (np. Turniej Orlika 2025)"
              style={{ width: '100%', padding: '8px', marginBottom: '10px', fontSize: '14px' }}
              autoFocus
            />
            <div>
              <button
                type="submit"
                disabled={creating || !newTournamentName.trim()}
                style={{
                  padding: '8px 16px',
                  background: creating ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  marginRight: '10px',
                }}
              >
                {creating ? 'Tworzenie...' : 'Utwórz'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTournamentName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Anuluj
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Tournaments */}
      <div style={{ marginBottom: '40px' }}>
        <h2>Moje Turnieje ({tournaments.length})</h2>
        {tournaments.length === 0 ? (
          <p style={{ color: '#666' }}>Nie masz jeszcze żadnych turniejów. Utwórz pierwszy!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  background: '#fff',
                }}
              >
                <h3 style={{ margin: '0 0 10px 0' }}>{tournament.name}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Kod udostępniania:</strong> {tournament.share_code}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    background: tournament.status === 'active' ? '#4CAF50' : '#ff9800',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '3px',
                  }}>
                    {tournament.status}
                  </span>
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Format:</strong> {tournament.format_type}
                </p>
                <div style={{ marginTop: '10px' }}>
                  {tournament.status === 'draft' && (
                    <button
                      onClick={() => handleActivateTournament(tournament.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        marginRight: '10px',
                      }}
                    >
                      Aktywuj Turniej
                    </button>
                  )}
                  <a
                    href={`/tournament/${tournament.share_code}`}
                    style={{
                      padding: '6px 12px',
                      background: '#9C27B0',
                      color: 'white',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Zobacz Szczegóły
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Tournaments */}
      <div>
        <h2>Publiczne Turnieje ({publicTournaments.length})</h2>
        {publicTournaments.length === 0 ? (
          <p style={{ color: '#666' }}>Brak aktywnych publicznych turniejów.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {publicTournaments.map((tournament) => (
              <div
                key={tournament.id}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  background: '#f5f5f5',
                }}
              >
                <h3 style={{ margin: '0 0 10px 0' }}>{tournament.name}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                  <strong>Kod:</strong> {tournament.share_code}
                </p>
                <a
                  href={`/tournament/${tournament.share_code}`}
                  style={{
                    padding: '6px 12px',
                    background: '#9C27B0',
                    color: 'white',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginTop: '10px',
                  }}
                >
                  Zobacz Turniej
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
