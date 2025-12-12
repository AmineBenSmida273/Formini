import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import SignIn from './pages/SignIn';
import MFAVerification from './pages/MFAVerification';
import GoogleSuccess from './pages/GoogleSuccess';
import Dashboard from './pages/Dashboard';
import AdminCourses from './pages/dashboards/AdminCourses';
import AdminSettings from './pages/dashboards/AdminSettings';
import AdminReports from './pages/dashboards/AdminReports';
import InstructorCourses from './pages/dashboards/InstructorCourses';
import InstructorAnalytics from './pages/dashboards/InstructorAnalytics';
import CourseCatalog from './pages/courses/CourseCatalog';
import CourseDetails from './pages/courses/CourseDetails';
import CreateCourse from './pages/CreateCourse';
import InstructorSettings from './pages/InstructorSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/verify-mfa" element={<MFAVerification />} />
          <Route path="/google-success" element={<GoogleSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <AdminCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/courses"
            element={
              <ProtectedRoute>
                <InstructorCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/analytics"
            element={
              <ProtectedRoute>
                <InstructorAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <AdminReports />
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
          <Route
            path="/create-course"
            element={
              <ProtectedRoute>
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor-settings"
            element={
              <ProtectedRoute>
                <InstructorSettings />
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
    </ThemeProvider>
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