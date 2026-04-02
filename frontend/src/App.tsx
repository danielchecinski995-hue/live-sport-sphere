import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { TournamentDetail } from './pages/TournamentDetail';
import { MatchDetail } from './pages/MatchDetail';
import { TeamDetail } from './pages/TeamDetail';
import { RefereeDashboard } from './pages/RefereeDashboard';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <div style={styles.appContainer}>
      <Navbar />
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tournament/:shareCode" element={<TournamentDetail />} />
          <Route path="/match/:matchId" element={<MatchDetail />} />
          <Route path="/team/:teamId" element={<TeamDetail />} />
          <Route path="/referee" element={<RefereeDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    background: '#f3f4f6',
    fontFamily: 'Arial, sans-serif',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px',
  },
};

export default App;
