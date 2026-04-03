import { useState, useEffect } from 'react';
import { teamsAPI, playersAPI } from '../services/api';
import type { Player } from '../types';

interface SquadManagerProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
}

export function SquadManager({ teamId, teamName, onClose }: SquadManagerProps) {
  const [players, setPlayers] = useState<(Player & { jersey_number?: number; is_starter?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jerseyNum, setJerseyNum] = useState('');
  const [isStarter, setIsStarter] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlayers(); }, [teamId]);

  const loadPlayers = async () => {
    try {
      const data = await teamsAPI.getPlayers(teamId);
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      // Create player globally first
      const result = await playersAPI.create({ first_name: firstName.trim(), last_name: lastName.trim() });
      const playerId = result.data?.id || result.id;
      // Add to team with jersey/starter
      await teamsAPI.addPlayer(teamId, {
        player_id: playerId,
        jersey_number: jerseyNum ? parseInt(jerseyNum) : undefined,
        is_starter: isStarter,
      });
      setFirstName('');
      setLastName('');
      setJerseyNum('');
      setIsStarter(true);
      setShowAdd(false);
      loadPlayers();
    } catch (err) {
      alert('Blad dodawania zawodnika');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (playerId: string) => {
    try {
      await teamsAPI.removePlayer(teamId, playerId);
      loadPlayers();
    } catch {
      alert('Blad usuwania');
    }
  };

  const handleToggleStarter = async (p: Player & { jersey_number?: number; is_starter?: boolean }) => {
    try {
      await teamsAPI.updatePlayer(teamId, p.id, {
        jersey_number: p.jersey_number,
        is_starter: !p.is_starter,
      });
      loadPlayers();
    } catch {
      alert('Blad aktualizacji');
    }
  };

  const starters = players.filter(p => p.is_starter);
  const reserves = players.filter(p => !p.is_starter);

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Sklad: {teamName}</h3>
        <button onClick={onClose} style={btnGray}>Zamknij</button>
      </div>

      {loading ? <p>Ladowanie...</p> : (
        <>
          {starters.length > 0 && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', margin: '0 0 6px' }}>Podstawowy sklad ({starters.length})</p>
              {starters.map(p => renderPlayer(p, handleRemove, handleToggleStarter))}
            </>
          )}

          {reserves.length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '12px 0' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>Rezerwowi ({reserves.length})</p>
              {reserves.map(p => renderPlayer(p, handleRemove, handleToggleStarter))}
            </>
          )}

          {players.length === 0 && <p style={{ color: '#9ca3af', fontSize: 14 }}>Brak zawodnikow. Dodaj pierwszego!</p>}

          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} style={{ ...btnBlue, marginTop: 12, width: '100%' }}>
              + Dodaj zawodnika
            </button>
          ) : (
            <form onSubmit={handleAddPlayer} style={{ marginTop: 12, background: '#f9fafb', padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Imie" style={input} autoFocus />
                <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nazwisko" style={input} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input value={jerseyNum} onChange={e => setJerseyNum(e.target.value.replace(/\D/g, ''))} placeholder="Numer" style={{ ...input, width: 80 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={isStarter} onChange={e => setIsStarter(e.target.checked)} />
                  Podstawowy sklad
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving || !firstName.trim() || !lastName.trim()} style={btnGreen}>
                  {saving ? 'Dodawanie...' : 'Dodaj'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} style={btnGray}>Anuluj</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function renderPlayer(
  p: Player & { jersey_number?: number; is_starter?: boolean },
  onRemove: (id: string) => void,
  onToggle: (p: Player & { jersey_number?: number; is_starter?: boolean }) => void
) {
  return (
    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, marginBottom: 4, background: '#f9fafb' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: p.is_starter ? '#2563eb' : '#9ca3af',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {p.jersey_number || '-'}
      </div>
      <span style={{ flex: 1, fontSize: 14 }}>{p.first_name} {p.last_name}</span>
      <button onClick={() => onToggle(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
        {p.is_starter ? 'Na rezerwe' : 'Do skladu'}
      </button>
      <button onClick={() => onRemove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14 }}>
        x
      </button>
    </div>
  );
}

const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box', width: '100%' };
const btnBlue: React.CSSProperties = { background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnGreen: React.CSSProperties = { background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const btnGray: React.CSSProperties = { background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
