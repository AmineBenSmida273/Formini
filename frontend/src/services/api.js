import axios from 'axios';

const API_URL = 'https://formini-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Anciennes routes (à garder pour compatibilité)
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/auth/login', credentials), // Route pour admin sans MFA
  
  // NOUVELLES ROUTES MFA
  registerWithMFA: (userData) => {
    // Si FormData (avec fichier), ne pas utiliser JSON
    if (userData instanceof FormData) {
      return api.post('/auth/register-mfa', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/auth/register-mfa', userData);
  },
  verifyMFA: (data) => api.post('/auth/verify-mfa', data),
  resendVerificationCode: (data) => api.post('/auth/resend-verification', data),
  loginWithMFA: (credentials) => api.post('/auth/login-mfa', credentials),
  facebookLogin: (accessToken) => api.post('/auth/facebook-login', { accessToken }),
  
  // Fonction utilitaire pour vérifier si l'utilisateur est connecté
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      isAuthenticated: !!token,
      user: user ? JSON.parse(user) : null
    };
  },
  
  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingVerificationEmail');
  }
};

// Service utilisateur (pour plus tard)
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
};

// Service cours (pour plus tard)
export const courseService = {
  getAllCourses: () => api.get('/courses'),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
};

// Service dashboard
export const dashboardService = {
  getAdminStats: () => api.get('/users/dashboard/admin'),
  getStudentStats: () => api.get('/users/dashboard/student'),
  getInstructorStats: () => api.get('/users/dashboard/instructor'),
};

// Service admin
export const adminService = {
  getPendingInstructors: () => api.get('/users/admin/pending-instructors'),
  approveInstructor: (instructorId) => api.post(`/users/admin/approve-instructor/${instructorId}`),
  rejectInstructor: (instructorId) => api.post(`/users/admin/reject-instructor/${instructorId}`),
  downloadCV: (instructorId) => api.get(`/users/admin/instructor/${instructorId}/cv`, { responseType: 'blob' }),
  toggleUserStatus: (userId, statut) => api.put(`/users/admin/user/${userId}/status`, { statut }),
};

export default api;
