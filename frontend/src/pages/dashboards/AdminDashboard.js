import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, dashboardService, adminService } from '../../services/api';

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    activeUsers: 0,
    suspendedUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userTrends, setUserTrends] = useState([]);
  const [courseTrends, setCourseTrends] = useState([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDashboardData();
      }, 30000); // Refresh toutes les 30 secondes
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, allUsers]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardService.getAdminStats();
      const data = response.data;

      setStats(data.stats || {
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalAdmins: 0,
        activeUsers: 0,
        suspendedUsers: 0,
      });
      
      setRecentUsers(data.recentUsers || []);
      setAllUsers(data.recentUsers || []);
      setPendingInstructors(data.pendingInstructors || []);
      setUserTrends(data.userTrends || []);
      setCourseTrends(data.courseTrends || []);
      setEnrollmentTrends(data.enrollmentTrends || []);
      setRoleDistribution(data.stats?.roleDistribution || []);
      setCategoryDistribution(data.stats?.categoryDistribution || []);
      setLastUpdate(new Date());

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du dashboard');
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];

    if (searchTerm) {
      filtered = filtered.filter(user => 
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.statut === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspendue' : 'active';
      await adminService.toggleUserStatus(userId, newStatus);
      alert(`✅ Utilisateur ${newStatus === 'active' ? 'activé' : 'suspendu'} avec succès`);
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveInstructor = async (instructorId) => {
    try {
      await adminService.approveInstructor(instructorId);
      alert('✅ Formateur approuvé avec succès');
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectInstructor = async (instructorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rejeter ce formateur ?')) {
      return;
    }
    try {
      await adminService.rejectInstructor(instructorId);
      alert('✅ Formateur rejeté');
      fetchDashboardData();
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadCV = async (instructorId, instructorName) => {
    try {
      const response = await adminService.downloadCV(instructorId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${instructorName}_CV.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('❌ Erreur lors du téléchargement du CV');
    }
  };

  const getRolePercentage = (roleCount, total) => {
    return total > 0 ? ((roleCount / total) * 100).toFixed(1) : 0;
  };

  const getMaxValue = (trends, keys) => {
    if (!trends || trends.length === 0) return 1;
    return Math.max(
      ...trends.map(t => Math.max(...keys.map(k => t[k] || 0))),
      1
    );
  };

  if (loading && recentUsers.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (error && recentUsers.length === 0) {
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

  const maxUserTrendValue = getMaxValue(userTrends, ['students', 'instructors', 'admins']);
  const maxEnrollmentValue = getMaxValue(enrollmentTrends, ['enrollments']);
  const maxCourseTrendValue = getMaxValue(courseTrends, ['courses']);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>📊 Dashboard Administrateur</h1>
            <p style={styles.subtitle}>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
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
          <h2 style={styles.sectionTitle}>📈 Statistiques Globales</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalUsers}</h3>
                <p style={styles.statLabel}>Total Utilisateurs</p>
                <div style={styles.statProgress}>
                  <div style={{...styles.statProgressBar, width: '100%', background: '#f97316'}}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎓</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalStudents}</h3>
                <p style={styles.statLabel}>Étudiants ({getRolePercentage(stats.totalStudents, stats.totalUsers)}%)</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getRolePercentage(stats.totalStudents, stats.totalUsers)}%`, 
                    background: '#10b981'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👨‍🏫</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalInstructors}</h3>
                <p style={styles.statLabel}>Formateurs ({getRolePercentage(stats.totalInstructors, stats.totalUsers)}%)</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getRolePercentage(stats.totalInstructors, stats.totalUsers)}%`, 
                    background: '#f59e0b'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⚙️</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.totalAdmins}</h3>
                <p style={styles.statLabel}>Administrateurs ({getRolePercentage(stats.totalAdmins, stats.totalUsers)}%)</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getRolePercentage(stats.totalAdmins, stats.totalUsers)}%`, 
                    background: '#ef4444'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.activeUsers}</h3>
                <p style={styles.statLabel}>Utilisateurs Actifs</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getRolePercentage(stats.activeUsers, stats.totalUsers)}%`, 
                    background: '#10b981'
                  }}></div>
                </div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⛔</div>
              <div style={styles.statContent}>
                <h3 style={styles.statValue}>{stats.suspendedUsers}</h3>
                <p style={styles.statLabel}>Comptes Suspendus</p>
                <div style={styles.statProgress}>
                  <div style={{
                    ...styles.statProgressBar, 
                    width: `${getRolePercentage(stats.suspendedUsers, stats.totalUsers)}%`, 
                    background: '#ef4444'
                  }}></div>
                </div>
              </div>
            </div>

            {stats.pendingInstructors !== undefined && stats.pendingInstructors > 0 && (
              <div style={styles.statCard}>
                <div style={styles.statIcon}>⏳</div>
                <div style={styles.statContent}>
                  <h3 style={styles.statValue}>{stats.pendingInstructors}</h3>
                  <p style={styles.statLabel}>Formateurs en Attente</p>
                  <div style={styles.statProgress}>
                    <div style={{
                      ...styles.statProgressBar, 
                      width: `${(stats.pendingInstructors / Math.max(stats.totalInstructors, 1)) * 100}%`, 
                      background: '#f59e0b'
                    }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Graphiques de tendances réelles */}
        {(userTrends.length > 0 || enrollmentTrends.length > 0 || courseTrends.length > 0) && (
          <section style={styles.chartSection}>
            <h2 style={styles.sectionTitle}>📊 Tendances réelles (7 derniers jours)</h2>
            <div style={styles.chartGrid}>
              {userTrends.length > 0 && (
                <div style={styles.chartCard}>
                  <h3 style={styles.chartCardTitle}>Évolution des utilisateurs</h3>
                  <div style={styles.chartContainer}>
                    <div style={styles.chart}>
                      {userTrends.map((trend, index) => (
                        <div key={index} style={styles.chartBar}>
                          <div style={styles.chartBars}>
                            <div 
                              style={{
                                ...styles.chartBarItem,
                                height: `${(trend.students / maxUserTrendValue) * 100}%`,
                                background: '#10b981',
                                title: `${trend.students} étudiants`
                              }}
                            ></div>
                            <div 
                              style={{
                                ...styles.chartBarItem,
                                height: `${(trend.instructors / maxUserTrendValue) * 100}%`,
                                background: '#f59e0b',
                                title: `${trend.instructors} formateurs`
                              }}
                            ></div>
                            <div 
                              style={{
                                ...styles.chartBarItem,
                                height: `${(trend.admins / maxUserTrendValue) * 100}%`,
                                background: '#ef4444',
                                title: `${trend.admins} admins`
                              }}
                            ></div>
                          </div>
                          <span style={styles.chartLabel}>{trend.date}</span>
                        </div>
                      ))}
                    </div>
                    <div style={styles.chartLegend}>
                      <div style={styles.legendItem}>
                        <div style={{...styles.legendColor, background: '#10b981'}}></div>
                        <span>Étudiants</span>
                      </div>
                      <div style={styles.legendItem}>
                        <div style={{...styles.legendColor, background: '#f59e0b'}}></div>
                        <span>Formateurs</span>
                      </div>
                      <div style={styles.legendItem}>
                        <div style={{...styles.legendColor, background: '#ef4444'}}></div>
                        <span>Admins</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {enrollmentTrends.length > 0 && (
                <div style={styles.chartCard}>
                  <h3 style={styles.chartCardTitle}>Inscriptions aux cours</h3>
                  <div style={styles.chartContainer}>
                    <div style={styles.chart}>
                      {enrollmentTrends.map((trend, index) => (
                        <div key={index} style={styles.chartBar}>
                          <div 
                            style={{
                              ...styles.chartBarItem,
                              height: `${(trend.enrollments / maxEnrollmentValue) * 100}%`,
                              background: '#3b82f6',
                              title: `${trend.enrollments} inscriptions`
                            }}
                          ></div>
                          <span style={styles.chartLabel}>{trend.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.chartGrid}>
              {courseTrends.length > 0 && (
                <div style={styles.chartCard}>
                  <h3 style={styles.chartCardTitle}>Nouveaux cours publiés</h3>
                  <div style={styles.chartContainer}>
                    <div style={styles.chart}>
                      {courseTrends.map((trend, index) => (
                        <div key={index} style={styles.chartBar}>
                          <div 
                            style={{
                              ...styles.chartBarItem,
                              height: `${(trend.courses / maxCourseTrendValue) * 100}%`,
                              background: '#f97316',
                              title: `${trend.courses} cours`
                            }}
                          ></div>
                          <span style={styles.chartLabel}>{trend.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {roleDistribution.length > 0 && (
                <div style={styles.chartCard}>
                  <h3 style={styles.chartCardTitle}>Répartition des rôles</h3>
                  <div style={styles.miniList}>
                    {roleDistribution.map((role) => (
                      <div key={role.role} style={styles.miniRow}>
                        <div style={styles.miniLabel}>{role.role}</div>
                        <div style={styles.miniValue}>{role.count}</div>
                        <div style={styles.miniBar}>
                          <div 
                            style={{
                              ...styles.miniFill,
                              width: `${getRolePercentage(role.count, stats.totalUsers)}%`,
                              background: role.role === 'admin' ? '#ef4444' : role.role === 'instructor' ? '#f59e0b' : '#10b981'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {categoryDistribution.length > 0 && (
                <div style={styles.chartCard}>
                  <h3 style={styles.chartCardTitle}>Cours par catégorie</h3>
                  <div style={styles.miniList}>
                    {categoryDistribution.map((cat) => (
                      <div key={cat.category} style={styles.miniRow}>
                        <div style={styles.miniLabel}>{cat.category}</div>
                        <div style={styles.miniValue}>{cat.count}</div>
                        <div style={styles.miniBar}>
                          <div 
                            style={{
                              ...styles.miniFill,
                              width: `${(cat.count / Math.max(stats.totalCourses, 1)) * 100}%`,
                              background: '#3b82f6'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Formateurs en attente */}
        {pendingInstructors.length > 0 && (
          <section style={styles.pendingSection}>
            <h2 style={styles.sectionTitle}>
              ⏳ Formateurs en Attente d'Approbation ({pendingInstructors.length})
            </h2>
            <div style={styles.pendingGrid}>
              {pendingInstructors.map((instructor) => (
                <div key={instructor.id} style={styles.pendingCard}>
                  <div style={styles.pendingHeader}>
                    <h3 style={styles.pendingName}>
                      {instructor.prenom} {instructor.nom}
                    </h3>
                    <span style={styles.pendingBadge}>En attente</span>
                  </div>
                  <p style={styles.pendingEmail}>📧 {instructor.email}</p>
                  <p style={styles.pendingCentre}>
                    🏢 {instructor.centreProfession || 'Non spécifié'}
                  </p>
                  <p style={styles.pendingDate}>
                    📅 Demande: {new Date(instructor.dateDemande).toLocaleDateString('fr-FR')}
                  </p>
                  <div style={styles.pendingActions}>
                    <button
                      style={styles.downloadBtn}
                      onClick={() => handleDownloadCV(instructor.id, `${instructor.prenom}_${instructor.nom}`)}
                    >
                      📄 Voir CV
                    </button>
                    <button
                      style={styles.approveBtn}
                      onClick={() => handleApproveInstructor(instructor.id)}
                    >
                      ✅ Approuver
                    </button>
                    <button
                      style={styles.rejectBtn}
                      onClick={() => handleRejectInstructor(instructor.id)}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtres et recherche */}
        <section style={styles.filtersSection}>
          <h2 style={styles.sectionTitle}>🔍 Gestion des Utilisateurs</h2>
          <div style={styles.filtersContainer}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="🔍 Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Tous les rôles</option>
                <option value="student">Étudiants</option>
                <option value="instructor">Formateurs</option>
                <option value="admin">Administrateurs</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="suspendue">Suspendus</option>
              </select>
            </div>
          </div>
        </section>

        {/* Utilisateurs */}
        <section style={styles.recentSection}>
          <h2 style={styles.sectionTitle}>
            👥 Utilisateurs {filteredUsers.length !== allUsers.length && `(${filteredUsers.length} sur ${allUsers.length})`}
          </h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Rôle</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Date d'inscription</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>{user.prenom} {user.nom}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: user.role === 'admin' ? '#f97316' : user.role === 'instructor' ? '#f97316' : '#10b981'
                        }}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Formateur' : 'Étudiant'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: user.statut === 'active' ? '#10b981' : '#ef4444'
                        }}>
                          {user.statut === 'active' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(user.dateinscri).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.actionBtnSmall}
                          onClick={() => alert(`Voir détails de ${user.prenom} ${user.nom}`)}
                        >
                          👁️
                        </button>
                        <button 
                          style={{
                            ...styles.actionBtnSmall,
                            background: user.statut === 'active' ? '#ef4444' : '#10b981'
                          }}
                          onClick={() => toggleUserStatus(user.id, user.statut)}
                        >
                          {user.statut === 'active' ? '⛔' : '✅'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{...styles.td, textAlign: 'center', padding: '40px'}}>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Actions Rapides */}
        <section style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>⚡ Actions Rapides</h2>
          <div style={styles.actionsGrid}>
            <button style={styles.actionBtn} onClick={() => alert('Gestion des utilisateurs - À implémenter')}>
              👥 Gérer les Utilisateurs
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Gestion des cours - À implémenter')}>
              📚 Gérer les Cours
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Rapports - À implémenter')}>
              📊 Voir les Rapports
            </button>
            <button style={styles.actionBtn} onClick={() => alert('Paramètres - À implémenter')}>
              ⚙️ Paramètres Système
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
        
        /* Effets hover professionnels */
        [style*="statCard"]:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08) !important;
        }
        
        [style*="actionBtn"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12) !important;
          border-color: rgba(249, 115, 22, 0.3) !important;
        }
        
        [style*="approveBtn"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35) !important;
        }
        
        [style*="rejectBtn"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35) !important;
        }
        
        [style*="downloadBtn"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35) !important;
        }
        
        [style*="refreshBtn"]:hover {
          transform: rotate(180deg) scale(1.1) !important;
        }
        
        [style*="logoutBtn"]:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35) !important;
        }
        
        [style*="pendingCard"]:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 24px rgba(251, 191, 36, 0.25) !important;
        }
        
        [style*="searchInput"]:focus,
        [style*="filterSelect"]:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1) !important;
          background: white !important;
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
    padding: '48px',
    borderRadius: '16px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(249, 115, 22, 0.1)',
    maxWidth: '500px',
  },
  retryBtn: {
    padding: '12px 24px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '24px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.98)',
    padding: '24px 48px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    backdropFilter: 'blur(10px)',
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
    padding: '10px 14px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
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
    padding: '12px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
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
    borderRadius: '16px',
    padding: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid rgba(249, 115, 22, 0.08)',
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
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(249, 115, 22, 0.08)',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
    fontSize: '12px',
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
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '10px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(249, 115, 22, 0.08)',
  },
  chartCardTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 700,
    color: '#1f2937',
  },
  miniList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  miniRow: {
    display: 'grid',
    gridTemplateColumns: '120px 60px 1fr',
    alignItems: 'center',
    gap: '8px',
  },
  miniLabel: {
    fontWeight: 600,
    color: '#374151',
    textTransform: 'capitalize',
  },
  miniValue: {
    fontWeight: 700,
    color: '#111827',
  },
  miniBar: {
    background: '#f3f4f6',
    borderRadius: '999px',
    height: '10px',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },
  filtersSection: {
    marginBottom: '40px',
  },
  filtersContainer: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    border: '1px solid rgba(249, 115, 22, 0.08)',
  },
  searchContainer: {
    flex: 1,
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 18px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#f8fafc',
  },
  filterGroup: {
    display: 'flex',
    gap: '10px',
  },
  filterSelect: {
    padding: '14px 18px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    background: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: '500',
  },
  recentSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    marginBottom: '40px',
    border: '1px solid rgba(249, 115, 22, 0.08)',
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
    transition: 'background 0.2s',
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
  actionBtnSmall: {
    padding: '6px 12px',
    margin: '0 4px',
                    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s',
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
    padding: '18px 28px',
    background: 'white',
    border: '1.5px solid rgba(249, 115, 22, 0.15)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1f2937',
  },
  pendingSection: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(249, 115, 22, 0.08)',
  },
  pendingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  pendingCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '1.5px solid #fbbf24',
    borderRadius: '16px',
    padding: '24px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.15)',
  },
  pendingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  pendingName: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
  },
  pendingBadge: {
    padding: '4px 12px',
    background: '#f59e0b',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  pendingEmail: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#4b5563',
  },
  pendingCentre: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#4b5563',
  },
  pendingDate: {
    margin: '5px 0 15px 0',
    fontSize: '12px',
    color: '#6b7280',
  },
  pendingActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  downloadBtn: {
    flex: 1,
    padding: '12px 16px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.2)',
  },
  approveBtn: {
    flex: 1,
    padding: '12px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
  },
  rejectBtn: {
    flex: 1,
    padding: '12px 16px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
  },
};
