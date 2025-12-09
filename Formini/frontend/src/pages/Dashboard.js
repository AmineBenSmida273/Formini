import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import AdminDashboard from './dashboards/AdminDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import InstructorDashboard from './dashboards/InstructorDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const { isAuthenticated, user: userData } = authService.checkAuth();
        
        if (!isAuthenticated || !userData) {
          setError('Session expirée. Veuillez vous reconnecter.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setUser(userData);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'utilisateur:', err);
        setError('Erreur lors du chargement des données utilisateur.');
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <h2>⚠️ Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')} style={styles.button}>
          Retour à la connexion
        </button>
      </div>
    );
  }

  // Rediriger vers le dashboard approprié selon le rôle
  if (user?.role === 'admin') {
    return <AdminDashboard user={user} />;
  } else if (user?.role === 'instructor') {
    return <InstructorDashboard user={user} />;
  } else if (user?.role === 'student') {
    return <StudentDashboard user={user} />;
  }

  return (
    <div style={styles.error}>
      <h2>Rôle non reconnu</h2>
      <p>Votre rôle ({user?.role}) n'est pas reconnu par le système.</p>
      <button onClick={() => navigate('/login')} style={styles.button}>
        Retour à la connexion
      </button>
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  spinner: {
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    textAlign: 'center',
  },
  button: {
    padding: '12px 24px',
    background: 'white',
    color: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '20px',
    transition: 'transform 0.2s',
  },
};

// Animation CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

