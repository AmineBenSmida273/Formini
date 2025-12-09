import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, dashboardService } from '../../services/api';

export default function InstructorDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalEnrollments: 0,
  });
  const [myCourses, setMyCourses] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [studentEngagement, setStudentEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [sortBy, setSortBy] = useState('recent');
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardData();
      }, 30000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardService.getInstructorStats();
      const data = response.data;

      // Utiliser les données réelles de la base de données
      setStats(data.stats || {
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalEnrollments: 0,
      });
      
      setMyCourses(data.myCourses || []);
      setRecentEnrollments(data.recentEnrollments || []);
      setRevenueData(data.revenueTimeline || []);
      setStudentEngagement(data.engagementByCourse || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du dashboard');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getMaxRevenueValue = (series) => {
    if (!series || series.length === 0) return 1;
    return Math.max(...series.map(d => d.revenue), 1);
  };

  const getMaxEngagementValue = () => {
    if (studentEngagement.length === 0) return 1;
    return Math.max(...studentEngagement.map(e => e.students || 0), 1);
  };

  const sortedCourses = [...myCourses].sort((a, b) => {
    switch (sortBy) {
      case 'students':
        return (b.students || 0) - (a.students || 0);
      case 'revenue':
        return (b.revenue || 0) - (a.revenue || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return new Date(b.id) - new Date(a.id);
    }
  });

  if (loading && myCourses.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error && myCourses.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>
          <h2>⚠️ Erreur</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} style={styles.retryBtn}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const revenueWindow = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'quarter' ? 30 : 30;
  const displayedRevenue = revenueData.slice(-revenueWindow);
  const maxRevenueValue = getMaxRevenueValue(displayedRevenue);
  const maxEngagementValue = getMaxEngagementValue();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>👨‍🏫 Dashboard Formateur</h1>
            <p style={styles.subtitle}>
              {autoRefresh && <span style={styles.autoRefreshBadge}>🔄 Auto-actualisation</span>}
            </p>
          </div>
          <div style={styles.headerActions}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={styles.toggle}
              />
              Auto-refresh
            </label>
            <button onClick={fetchDashboardData} style={styles.refreshBtn} title="Actualiser">
              🔄
            </button>
            <div style={styles.userInfo}>
              <span style={styles.welcome}>Bienvenue, {user?.prenom} {user?.nom}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>Déconnexion</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Statistiques */}
        <section style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>📊 Mes Statistiques</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📚</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalCourses}</h3>
                <p style={styles.statLabel}>Total Cours</p>
                <p style={styles.statSubtext}>{stats.activeCourses} actifs</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.activeCourses / stats.totalCourses) * 100}%`, 
                    background: '#f97316'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalStudents}</h3>
                <p style={styles.statLabel}>Étudiants Totaux</p>
                <p style={styles.statSubtext}>{stats.totalEnrollments} inscriptions</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.totalStudents / 500) * 100}%`, 
                    background: '#10b981'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalRevenue.toLocaleString('fr-FR')} €</h3>
                <p style={styles.statLabel}>Revenus Totaux</p>
                <p style={styles.statSubtext}>Moyenne: {(stats.totalRevenue / stats.totalCourses).toFixed(0)} €/cours</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.totalRevenue / 20000) * 100}%`, 
                    background: '#f59e0b'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.averageRating.toFixed(1)}</h3>
                <p style={styles.statLabel}>Note Moyenne</p>
                <p style={styles.statSubtext}>Sur 5.0</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.averageRating / 5) * 100}%`, 
                    background: '#f97316'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Graphique de revenus */}
        {revenueData.length > 0 && (
          <section style={styles.chartSection}>
            <div style={styles.chartHeader}>
              <h2 style={styles.sectionTitle}>💰 Évolution des Revenus</h2>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                style={styles.timeframeSelect}
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">90 derniers jours</option>
              </select>
            </div>
            <div style={styles.chartContainer}>
              <div style={styles.chart}>
                {displayedRevenue.map((data, index) => (
                  <div key={index} style={styles.chartBar}>
                    <div 
                      style={{
                        ...styles.chartBarItem,
                        height: `${(data.revenue / maxRevenueValue) * 100}%`,
                        background: '#f59e0b',
                        title: `${data.revenue} €`
                      }}
                    ></div>
                    <span style={styles.chartLabel}>{data.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Engagement des étudiants */}
        {studentEngagement.length > 0 && (
          <section style={styles.engagementSection}>
            <h2 style={styles.sectionTitle}>📈 Engagement des Étudiants par Cours</h2>
            <div style={styles.engagementContainer}>
              {studentEngagement.map((engagement) => (
                <div key={engagement.courseId} style={styles.engagementCard}>
                  <h4 style={styles.engagementCourseName}>{engagement.title}</h4>
                  <div style={styles.engagementStats}>
                    <div style={styles.engagementStat}>
                      <span style={styles.engagementStatLabel}>Étudiants actifs:</span>
                      <span style={styles.engagementStatValue}>{engagement.students}</span>
                    </div>
                    <div style={styles.engagementStat}>
                      <span style={styles.engagementStatLabel}>Taux de complétion:</span>
                      <span style={styles.engagementStatValue}>{engagement.completionRate}%</span>
                    </div>
                  </div>
                  <div style={styles.engagementBar}>
                    <div 
                      style={{
                        ...styles.engagementBarFill,
                        width: `${(engagement.students / maxEngagementValue) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mes Cours */}
        <section style={styles.coursesSection}>
          <div style={styles.coursesHeader}>
            <h2 style={styles.sectionTitle}>📖 Mes Cours</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="recent">Plus récents</option>
              <option value="students">Plus d'étudiants</option>
              <option value="revenue">Plus de revenus</option>
              <option value="rating">Meilleure note</option>
            </select>
          </div>
          {sortedCourses.length > 0 ? (
            <div style={styles.coursesGrid}>
                  {sortedCourses.length > 0 ? sortedCourses.map((course) => (
                    <div key={course.id} style={styles.courseCard}>
                      <div style={styles.courseHeader}>
                        <h3 style={styles.courseTitle}>{course.title}</h3>
                        <span style={{
                          ...styles.statusBadge,
                          background: course.status === 'active' ? '#10b981' : '#6b7280'
                        }}>
                          {course.status === 'active' ? 'Actif' : 'Brouillon'}
                        </span>
                      </div>
                      <p style={styles.courseDescription}>{course.description || 'Aucune description'}</p>
                      <div style={styles.courseStats}>
                        <div style={styles.courseStat}>
                          <span style={styles.courseStatIcon}>👥</span>
                          <span style={styles.courseStatText}>{course.students || 0} étudiants</span>
                        </div>
                        <div style={styles.courseStat}>
                          <span style={styles.courseStatIcon}>⭐</span>
                          <span style={styles.courseStatText}>{course.rating ? course.rating.toFixed(1) : 'N/A'} / 5</span>
                        </div>
                        <div style={styles.courseStat}>
                          <span style={styles.courseStatIcon}>💰</span>
                          <span style={styles.courseStatText}>{course.revenue || 0} €</span>
                        </div>
                        <div style={styles.courseStat}>
                          <span style={styles.courseStatIcon}>📊</span>
                          <span style={styles.courseStatText}>{course.enrollments || 0} inscriptions</span>
                        </div>
                        <div style={styles.courseStat}>
                          <span style={styles.courseStatIcon}>✅</span>
                          <span style={styles.courseStatText}>{course.completionRate || 0}% complétion</span>
                        </div>
                      </div>
                      {course.completionRate > 0 && (
                        <div style={styles.completionBar}>
                          <div 
                            style={{
                              ...styles.completionBarFill,
                              width: `${course.completionRate}%`,
                            }}
                          ></div>
                        </div>
                      )}
                      <div style={styles.courseActions}>
                        <button style={styles.editBtn}>Modifier</button>
                        <button style={styles.viewBtn}>Voir les détails</button>
                      </div>
                    </div>
                  )) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyIcon}>📚</div>
                      <p style={styles.emptyText}>Vous n'avez pas encore créé de cours</p>
                      <button style={styles.createBtn} onClick={() => alert('Créer un cours - À implémenter')}>
                        ➕ Créer mon premier cours
                      </button>
                    </div>
                  )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📚</div>
              <p style={styles.emptyText}>Vous n'avez pas encore créé de cours</p>
              <button style={styles.createBtn} onClick={() => alert('Créer un cours - À implémenter')}>
                ➕ Créer mon premier cours
              </button>
            </div>
          )}
        </section>

        {/* Inscriptions Récentes */}
        <section style={styles.enrollmentsSection}>
          <h2 style={styles.sectionTitle}>🕐 Inscriptions Récentes</h2>
          {recentEnrollments.length > 0 ? (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Étudiant</th>
                    <th style={styles.th}>Cours</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} style={styles.tr}>
                      <td style={styles.td}>{enrollment.studentName}</td>
                      <td style={styles.td}>{enrollment.courseName}</td>
                      <td style={styles.td}>
                        {new Date(enrollment.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: enrollment.status === 'active' ? '#10b981' : '#6b7280'
                        }}>
                          {enrollment.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👥</div>
              <p style={styles.emptyText}>Aucune inscription récente</p>
            </div>
          )}
        </section>

        {/* Actions Rapides */}
        <section style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>⚡ Actions Rapides</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionBtn} onClick={() => alert('Créer un cours - À implémenter')}>
              ➕ Créer un Cours
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Gérer mes cours - À implémenter')}>
              📚 Gérer mes Cours
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Analytiques - À implémenter')}>
              📊 Voir les Analytiques
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Paramètres - À implémenter')}>
              ⚙️ Paramètres
            </button>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffdab2ff, #fb923c)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: 'white',
  },
  spinner: {
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ffdab2ff, #fb923c)',
  },
  error: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  retryBtn: {
    padding: '10px 20px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '20px',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px 40px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#1f2937',
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  autoRefreshBadge: {
    padding: '4px 8px',
    background: '#10b981',
    color: 'white',
    borderRadius: '4px',
    fontSize: '12px',
    animation: 'pulse 2s infinite',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4b5563',
    cursor: 'pointer',
  },
  toggle: {
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '8px 12px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'transform 0.2s',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  welcome: {
    fontSize: '16px',
    color: '#4b5563',
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  statsSection: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: 'white',
    marginBottom: '20px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s',
  },
  statIcon: {
    fontSize: '48px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  statSubtext: {
    margin: '5px 0 0 0',
    fontSize: '12px',
    color: '#9ca3af',
  },
  statProgress: {
    marginTop: '10px',
    height: '4px',
    background: '#e5e7eb',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  chartSection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  timeframeSelect: {
    padding: '8px 12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
  },
  chartContainer: {
    marginTop: '20px',
  },
  chart: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '300px',
    gap: '10px',
    marginBottom: '20px',
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  chartBarItem: {
    width: '100%',
    minHeight: '4px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.5s ease',
    cursor: 'pointer',
  },
  chartLabel: {
    marginTop: '10px',
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center',
  },
  engagementSection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  engagementContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  engagementCard: {
    padding: '20px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  engagementCourseName: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  engagementStats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  engagementStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  engagementStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  engagementStatValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  engagementBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  engagementBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c)',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  coursesSection: {
    marginBottom: '40px',
  },
  coursesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sortSelect: {
    padding: '8px 12px',
    border: '2px solid white',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    cursor: 'pointer',
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  courseCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s',
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '10px',
  },
  courseTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px',
  },
  courseDescription: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  courseStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '15px',
    padding: '15px 0',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
  },
  courseStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4b5563',
  },
  courseStatIcon: {
    fontSize: '18px',
  },
  courseStatText: {
    fontSize: '14px',
  },
  completionBar: {
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '15px',
  },
  completionBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c)',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  courseActions: {
    display: 'flex',
    gap: '10px',
  },
  editBtn: {
    flex: 1,
    padding: '10px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  viewBtn: {
    flex: 1,
    padding: '10px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  enrollmentsSection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #e5e7eb',
    color: '#1f2937',
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    color: '#4b5563',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '60px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '20px',
  },
  createBtn: {
    padding: '12px 24px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: '40px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  actionBtn: {
    padding: '16px 24px',
    background: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s',
    color: '#1f2937',
  },
};
