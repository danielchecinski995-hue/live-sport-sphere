import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>Live Sport Sphere</Link>
        <div style={styles.links}>
          <Link
            to="/"
            style={{ ...styles.link, ...(isActive('/') ? styles.activeLink : {}) }}
          >
            Turnieje
          </Link>
          <Link
            to="/referee"
            style={{ ...styles.link, ...(isActive('/referee') ? styles.activeLink : {}) }}
          >
            Tryb Sedziego
          </Link>
          <span style={styles.user}>{user?.displayName || user?.email}</span>
          <button onClick={signOut} style={styles.logoutBtn}>
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: '#1e3a5f',
    padding: '0 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: 20,
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  link: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: 14,
    padding: '6px 12px',
    borderRadius: 6,
    transition: 'all 0.2s',
  },
  activeLink: {
    color: 'white',
    background: 'rgba(255,255,255,0.15)',
  },
  user: {
    color: '#94a3b8',
    fontSize: 13,
  },
  logoutBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
};
