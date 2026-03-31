/**
 * Auth Page - Login & Register
 */

import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, signInWithGoogle, error, clearError } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch {
      // Error handled by context
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled by context
    }
    setSubmitting(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Live Sport Sphere</h1>
        <h2 style={styles.title}>{isLogin ? 'Zaloguj sie' : 'Stworz konto'}</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Imie i nazwisko"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Haslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            minLength={6}
          />
          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? 'Ladowanie...' : isLogin ? 'Zaloguj sie' : 'Zarejestruj sie'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>lub</span>
        </div>

        <button onClick={handleGoogleSignIn} style={styles.googleButton} disabled={submitting}>
          Kontynuuj z Google
        </button>

        <p style={styles.toggle}>
          {isLogin ? 'Nie masz konta?' : 'Masz juz konto?'}{' '}
          <button onClick={toggleMode} style={styles.toggleButton}>
            {isLogin ? 'Zarejestruj sie' : 'Zaloguj sie'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    textAlign: 'center',
    color: '#2563eb',
    fontSize: '24px',
    margin: '0 0 8px 0',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    fontSize: '18px',
    margin: '0 0 24px 0',
    fontWeight: 'normal',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '4px',
  },
  divider: {
    textAlign: 'center',
    margin: '20px 0',
    position: 'relative',
    borderTop: '1px solid #eee',
  },
  dividerText: {
    background: 'white',
    padding: '0 12px',
    color: '#999',
    position: 'relative',
    top: '-10px',
  },
  googleButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#333',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 'inherit',
  },
};
