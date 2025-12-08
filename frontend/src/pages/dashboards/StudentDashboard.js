import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, dashboardService } from '../../services/api';

export default function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    certificates: 0,
    totalHours: 0,
    averageScore: 0,
  });
  const [myCourses, setMyCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [progressData, setProgressData] = useState([]);
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

  useEffect(() => {
    generateProgressData();
  }, [selectedTimeframe, myCourses]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardService.getStudentStats();
      const data = response.data;

      // Utiliser les données réelles de la base de données
      setStats(data.stats || {
        coursesEnrolled: 0,
        coursesCompleted: 0,
        coursesInProgress: 0,
        certificates: 0,
        totalHours: 0,
        averageScore: 0,
      });
      
      setMyCourses(data.myCourses || []);
      setRecentActivity(data.recentActivity || []);
      setRecommendedCourses(data.recommendedCourses || []);
      setUpcomingDeadlines(data.upcomingDeadlines || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du dashboard');
      setLoading(false);
    }
  };

  const generateProgressData = () => {
    // Générer des données de progression pour le graphique
    const days = selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        hours: Math.floor(Math.random() * 3) + 1,
        lessons: Math.floor(Math.random() * 2) + 1,
      });
    }
    
    setProgressData(data);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getCompletionRate = () => {
    if (stats.coursesEnrolled === 0) return 0;
    return ((stats.coursesCompleted / stats.coursesEnrolled) * 100).toFixed(1);
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const diff = deadline - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getMaxProgressValue = () => {
    if (progressData.length === 0) return 5;
    return Math.max(...progressData.map(d => Math.max(d.hours, d.lessons)));
  };

  if (loading && myCourses.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  const maxProgressValue = getMaxProgressValue();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>🎓 Mon Tableau de Bord</h1>
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
              <span style={styles.welcome}>Bonjour, {user?.prenom} {user?.nom}</span>
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
                <h3 style={styles.statValue}>{stats.coursesEnrolled}</h3>
                <p style={styles.statLabel}>Cours Inscrits</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.coursesEnrolled / 20) * 100}%`, 
                    background: '#3b82f6'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.coursesCompleted}</h3>
                <p style={styles.statLabel}>Cours Terminés</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getCompletionRate()}%`, 
                    background: '#10b981'
                  }}></div>
                </div>
                <p style={styles.statSubtext}>{getCompletionRate()}% de complétion</p>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🔄</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.coursesInProgress}</h3>
                <p style={styles.statLabel}>En Cours</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.coursesInProgress / stats.coursesEnrolled) * 100}%`, 
                    background: '#f59e0b'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🏆</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.certificates}</h3>
                <p style={styles.statLabel}>Certificats</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.certificates / stats.coursesCompleted) * 100}%`, 
                    background: '#8b5cf6'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏱️</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalHours}h</h3>
                <p style={styles.statLabel}>Heures d'Apprentissage</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${(stats.totalHours / 200) * 100}%`, 
                    background: '#ec4899'
                  }}></div>
                </div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⭐</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.averageScore}%</h3>
                <p style={styles.statLabel}>Score Moyen</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${stats.averageScore}%`, 
                    background: '#f59e0b'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Graphique de progression */}
        {progressData.length > 0 && (
          <section style={styles.chartSection}>
            <div style={styles.chartHeader}>
              <h2 style={styles.sectionTitle}>📈 Ma Progression</h2>
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
                {progressData.map((data, index) => (
                  <div key={index} style={styles.chartBar}>
                    <div style={styles.chartBars}>
                      <div 
                        style={{
                          ...styles.chartBarItem,
                          height: `${(data.hours / maxProgressValue) * 100}%`,
                          background: '#3b82f6',
                          title: `${data.hours}h`
                        }}
                      ></div>
                      <div 
                        style={{
                          ...styles.chartBarItem,
                          height: `${(data.lessons / maxProgressValue) * 100}%`,
                          background: '#10b981',
                          title: `${data.lessons} leçons`
                        }}
                      ></div>
                    </div>
                    <span style={styles.chartLabel}>{data.date}</span>
                  </div>
                ))}
              </div>
              <div style={styles.chartLegend}>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendColor, background: '#3b82f6'}}></div>
                  <span>Heures</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{...styles.legendColor, background: '#10b981'}}></div>
                  <span>Leçons</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Échéances à venir */}
        {upcomingDeadlines.length > 0 && (
          <section style={styles.deadlinesSection}>
            <h2 style={styles.sectionTitle}>⏰ Échéances à Venir</h2>
            <div style={styles.deadlinesList}>
              {upcomingDeadlines.map((deadline, index) => {
                const daysLeft = getDaysUntilDeadline(deadline.deadline);
                return (
                  <div key={index} style={styles.deadlineCard}>
                    <div style={styles.deadlineIcon}>📅</div>
                    <div style={styles.deadlineContent}>
                      <h4 style={styles.deadlineCourse}>{deadline.course}</h4>
                      <p style={styles.deadlineType}>{deadline.type}</p>
                      <p style={styles.deadlineDate}>
                        {deadline.deadline.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div style={{
                      ...styles.deadlineBadge,
                      background: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#10b981'
                    }}>
                      {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Mes Cours */}
        <section style={styles.coursesSection}>
          <h2 style={styles.sectionTitle}>📖 Mes Cours</h2>
          <div style={styles.coursesGrid}>
            {myCourses.length > 0 ? myCourses.map((course) => (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    background: course.status === 'Terminé' ? '#10b981' : 
                                course.status === 'En cours' ? '#3b82f6' : '#6b7280'
                  }}>
                    {course.status}
                  </span>
                </div>
                <p style={styles.courseInstructor}>Par {course.instructor}</p>
                {course.hours && (
                  <p style={styles.courseHours}>⏱️ {course.hours} heures</p>
                )}
                {course.nextLesson && (
                  <p style={styles.nextLesson}>Prochaine leçon: {course.nextLesson}</p>
                )}
                {course.completedLessons !== undefined && course.totalLessons !== undefined && (
                  <p style={styles.lessonProgress}>
                    📚 Leçons: {course.completedLessons}/{course.totalLessons}
                  </p>
                )}
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div 
                      style={{
                        ...styles.progressFill,
                        width: `${course.progress}%`,
                        background: course.progress === 100 ? '#10b981' : '#3b82f6'
                      }}
                    ></div>
                  </div>
                  <span style={styles.progressText}>{course.progress}%</span>
                </div>
                <button style={styles.continueBtn}>
                  {course.progress === 0 ? 'Commencer' : course.progress === 100 ? 'Revoir' : 'Continuer'}
                </button>
              </div>
            )) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Aucun cours inscrit pour le moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Cours Recommandés */}
        {recommendedCourses.length > 0 && (
          <section style={styles.recommendedSection}>
            <h2 style={styles.sectionTitle}>💡 Cours Recommandés pour Vous</h2>
            <div style={styles.recommendedGrid}>
              {recommendedCourses.map((course) => (
                <div key={course.id} style={styles.recommendedCard}>
                  <h4 style={styles.recommendedTitle}>{course.title}</h4>
                  <p style={styles.recommendedInstructor}>Par {course.instructor}</p>
                  <div style={styles.recommendedStats}>
                    <span>⭐ {course.rating}</span>
                    <span>👥 {course.students}</span>
                  </div>
                  <button style={styles.recommendedBtn}>Voir le cours</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activité Récente */}
        <section style={styles.activitySection}>
          <h2 style={styles.sectionTitle}>🕐 Activité Récente</h2>
          <div style={styles.activityList}>
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity.id} style={styles.activityItem}>
                <div style={styles.activityIcon}>{activity.icon || '📝'}</div>
                <div style={styles.activityContent}>
                  <p style={styles.activityText}>
                    <strong>{activity.action}</strong> - {activity.course}
                    {activity.score !== undefined && ` (Score: ${activity.score}%)`}
                    {activity.rating !== undefined && ` (Note: ${activity.rating}/5)`}
                  </p>
                  <p style={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>Aucune activité récente</p>
              </div>
            )}
          </div>
        </section>

        {/* Actions Rapides */}
        <section style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>⚡ Actions Rapides</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionBtn} onClick={() => alert('Explorer les cours - À implémenter')}>
              🔍 Explorer les Cours
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Mes certificats - À implémenter')}>
              🏆 Mes Certificats
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Profil - À implémenter')}>
              👤 Mon Profil
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
    background: '#3b82f6',
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
    height: '250px',
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
  chartBars: {
    display: 'flex',
    gap: '4px',
    alignItems: 'flex-end',
    height: '100%',
    width: '100%',
  },
  chartBarItem: {
    flex: 1,
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
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4b5563',
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px',
  },
  deadlinesSection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  deadlinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  deadlineCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  deadlineIcon: {
    fontSize: '32px',
  },
  deadlineContent: {
    flex: 1,
  },
  deadlineCourse: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  deadlineType: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  deadlineDate: {
    margin: 0,
    fontSize: '12px',
    color: '#9ca3af',
  },
  deadlineBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
  },
  coursesSection: {
    marginBottom: '40px',
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
  courseInstructor: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  courseHours: {
    margin: '0 0 5px 0',
    fontSize: '13px',
    color: '#4b5563',
  },
  nextLesson: {
    margin: '0 0 5px 0',
    fontSize: '13px',
    color: '#3b82f6',
    fontWeight: '500',
  },
  deadlineInfo: {
    margin: '0 0 15px 0',
    fontSize: '13px',
    color: '#ef4444',
    fontWeight: '500',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
    minWidth: '45px',
  },
  continueBtn: {
    width: '100%',
    padding: '12px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s',
  },
  recommendedSection: {
    marginBottom: '40px',
  },
  recommendedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  recommendedCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  recommendedTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendedInstructor: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  recommendedStats: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#4b5563',
  },
  recommendedBtn: {
    width: '100%',
    padding: '10px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  activityIcon: {
    fontSize: '32px',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    color: '#1f2937',
  },
  activityDate: {
    margin: 0,
    fontSize: '12px',
    color: '#6b7280',
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
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  emptyText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  lessonProgress: {
    margin: '0 0 5px 0',
    fontSize: '13px',
    color: '#4b5563',
  },
};
