import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import SignIn from './pages/SignIn';
import MFAVerification from './pages/MFAVerification';
import GoogleSuccess from './pages/GoogleSuccess';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/verify-mfa" element={<MFAVerification />} />
        <Route path="/google-success" element={<GoogleSuccess />} />
        
        {/* Routes protégées */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <div>Profil à créer</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <ProtectedRoute>
              <div>Cours à créer</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Route 404 */}
        <Route path="*" element={<div style={styles.notFound}>
          <h1>404 - Page non trouvée</h1>
          <p>La page que vous recherchez n'existe pas.</p>
          <a href="/" style={styles.homeLink}>Retour à l'accueil</a>
        </div>} />
      </Routes>
    </Router>
  );
}

const styles = {
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    background: 'linear-gradient(135deg, #fb923c, #ffdab2)',
    color: 'white',
  },
  homeLink: {
    color: '#1f2937',
    background: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: '20px',
    transition: 'transform 0.3s',
  },
};

// Styles dynamiques pour les liens
const styleElement = document.createElement('style');
styleElement.textContent = `
  .home-link:hover {
    transform: translateY(-2px);
  }
`;
document.head.appendChild(styleElement);

export default App;