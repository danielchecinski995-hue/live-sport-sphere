import { useState } from 'react';

const SHIELD_COLORS = [
  { bg: '#dc2626', stripe: '#991b1b', name: 'Czerwony' },
  { bg: '#2563eb', stripe: '#1d4ed8', name: 'Niebieski' },
  { bg: '#16a34a', stripe: '#15803d', name: 'Zielony' },
  { bg: '#f59e0b', stripe: '#d97706', name: 'Zloty' },
  { bg: '#7c3aed', stripe: '#6d28d9', name: 'Fioletowy' },
  { bg: '#ec4899', stripe: '#db2777', name: 'Rozowy' },
  { bg: '#06b6d4', stripe: '#0891b2', name: 'Turkusowy' },
  { bg: '#ea580c', stripe: '#c2410c', name: 'Pomaranczowy' },
  { bg: '#1f2937', stripe: '#111827', name: 'Czarny' },
  { bg: '#f8fafc', stripe: '#e2e8f0', name: 'Bialy' },
  { bg: '#dc2626', stripe: '#2563eb', name: 'Czerwono-niebieski' },
  { bg: '#2563eb', stripe: '#f59e0b', name: 'Niebiesko-zloty' },
  { bg: '#16a34a', stripe: '#f8fafc', name: 'Zielono-bialy' },
  { bg: '#1f2937', stripe: '#f59e0b', name: 'Czarno-zloty' },
  { bg: '#dc2626', stripe: '#f8fafc', name: 'Czerwono-bialy' },
  { bg: '#7c3aed', stripe: '#f59e0b', name: 'Fioletowo-zloty' },
  { bg: '#ea580c', stripe: '#1f2937', name: 'Pomaranczowo-czarny' },
  { bg: '#06b6d4', stripe: '#f8fafc', name: 'Turkusowo-bialy' },
  { bg: '#16a34a', stripe: '#dc2626', name: 'Zielono-czerwony' },
  { bg: '#2563eb', stripe: '#dc2626', name: 'Niebiesko-czerwony' },
];

function shieldSvg(bg: string, stripe: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><path d="M50 2 L95 20 L95 65 Q95 100 50 118 Q5 100 5 65 L5 20 Z" fill="${bg}" stroke="#333" stroke-width="2"/><path d="M50 2 L50 118 L5 100 Q5 65 5 65 L5 20 Z" fill="${bg}" opacity="0.9"/><path d="M50 2 L95 20 L95 65 Q95 100 50 118 Z" fill="${stripe}" opacity="0.7"/><circle cx="50" cy="55" r="18" fill="white" opacity="0.3"/><path d="M50 42 L53 51 L62 51 L55 57 L58 66 L50 61 L42 66 L45 57 L38 51 L47 51 Z" fill="white" opacity="0.6"/></svg>`)}`;
}

const LOGOS = SHIELD_COLORS.map(c => ({
  url: shieldSvg(c.bg, c.stripe),
  name: c.name,
}));

interface LogoPickerProps {
  selectedUrl?: string;
  onSelect: (url: string | undefined) => void;
}

export function LogoPicker({ selectedUrl, onSelect }: LogoPickerProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {selectedUrl ? (
          <img src={selectedUrl} alt="herb" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
            Brak
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          Wybierz herb
        </button>
        {selectedUrl && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            Usun
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#374151' }}>Wybierz herb druzyny:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, maxWidth: 400 }}>
        {LOGOS.map((logo, i) => (
          <div
            key={i}
            onClick={() => { onSelect(logo.url); setOpen(false); }}
            title={logo.name}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              border: selectedUrl === logo.url ? '3px solid #2563eb' : '2px solid #e5e7eb',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              transition: 'border-color 0.15s',
            }}
          >
            <img src={logo.url} alt={logo.name} style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ marginTop: 8, background: '#6b7280', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
      >
        Anuluj
      </button>
    </div>
  );
}
