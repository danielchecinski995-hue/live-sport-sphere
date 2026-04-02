import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tournamentsAPI } from '../services/api';
import type { Tournament } from '../types';

export function Dashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const [pub, my] = await Promise.all([
        tournamentsAPI.getPublic(),
        tournamentsAPI.getAll(),
      ]);
      setTournaments(Array.isArray(pub) ? pub : []);
      setMyTournaments(Array.isArray(my) ? my : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Blad ladowania');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      await tournamentsAPI.create({ name: newName, format_type: 'league', config: { points: { win: 3, draw: 1, loss: 0 } } });
      setNewName('');
      setShowCreate(false);
      loadTournaments();
    } catch (err) {
      alert('Blad tworzenia turnieju');
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await tournamentsAPI.updateStatus(id, 'active');
      loadTournaments();
    } catch {
      alert('Blad aktywacji');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#6b7280',
      active: '#10b981',
      completed: '#3b82f6',
    };
    const labels: Record<string, string> = {
      draft: 'Projekt',
      active: 'Aktywny',
      completed: 'Zakonczony',
    };
    return (
      <span style={{
        background: colors[status] || '#6b7280',
        color: 'white',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Ladowanie turniejow...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: 12, borderRadius: 8, marginBottom: 20, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Create Tournament */}
      <div style={{ marginBottom: 30 }}>
        {!showCreate ? (
          <button onClick={() => setShowCreate(true)} style={styles.createBtn}>
            + Utworz Nowy Turniej
          </button>
        ) : (
          <form onSubmit={handleCreate} style={styles.form}>
            <h3 style={{ margin: '0 0 12px' }}>Nowy Turniej</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwa turnieju"
              style={styles.input}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creating || !newName.trim()} style={styles.submitBtn}>
                {creating ? 'Tworzenie...' : 'Utworz'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setNewName(''); }} style={styles.cancelBtn}>
                Anuluj
              </button>
            </div>
          </form>
        )}
      </div>

      {/* My Tournaments */}
      {myTournaments.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={styles.sectionTitle}>Moje Turnieje ({myTournaments.length})</h2>
          <div style={styles.grid}>
            {myTournaments.map((t) => (
              <div key={t.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{t.name}</h3>
                  {statusBadge(t.status)}
                </div>
                {t.description && <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0' }}>{t.description}</p>}
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0' }}>Kod: {t.share_code}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {t.status === 'draft' && (
                    <button onClick={() => handleActivate(t.id)} style={styles.activateBtn}>Aktywuj</button>
                  )}
                  <Link to={`/tournament/${t.share_code}`} style={styles.detailLink}>Szczegoly</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Public Tournaments */}
      <section>
        <h2 style={styles.sectionTitle}>Publiczne Turnieje ({tournaments.length})</h2>
        {tournaments.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Brak dostepnych turniejow</p>
        ) : (
          <div style={styles.grid}>
            {tournaments.map((t) => (
              <Link key={t.id} to={`/tournament/${t.share_code}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ ...styles.card, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{t.name}</h3>
                    {statusBadge(t.status)}
                  </div>
                  {t.description && <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>}
                  <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0' }}>
                    {t.format === 'league' ? 'Liga' : 'Puchar'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sectionTitle: { fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#1f2937' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 },
  card: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  createBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  form: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, marginBottom: 12, boxSizing: 'border-box' as const },
  submitBtn: { background: '#10b981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  cancelBtn: { background: '#6b7280', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' },
  activateBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  detailLink: { background: '#7c3aed', color: 'white', padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
};
