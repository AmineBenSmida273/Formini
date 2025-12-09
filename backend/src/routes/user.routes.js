const express = require('express');
const router = express.Router();

// CORRECTION : Chemin relatif correct
const userController = require('../controllers/user.controller');
const adminController = require('../controllers/admin.controller');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware');

// Route d'inscription
router.post('/register', userController.register);

// Route de connexion
router.post('/login', userController.login);

// Routes pour les dashboards (nécessitent une authentification)
router.get('/dashboard/admin', verifyToken, verifyRole('admin'), userController.getAdminStats);
router.get('/dashboard/student', verifyToken, verifyRole('student'), userController.getStudentStats);
router.get('/dashboard/instructor', verifyToken, verifyRole('instructor'), userController.getInstructorStats);

// Routes admin pour gérer les formateurs
router.get('/admin/pending-instructors', verifyToken, verifyRole('admin'), adminController.getPendingInstructors);
router.post('/admin/approve-instructor/:instructorId', verifyToken, verifyRole('admin'), adminController.approveInstructor);
router.post('/admin/reject-instructor/:instructorId', verifyToken, verifyRole('admin'), adminController.rejectInstructor);
router.get('/admin/instructor/:instructorId/cv', verifyToken, verifyRole('admin'), adminController.downloadCV);
router.put('/admin/user/:userId/status', verifyToken, verifyRole('admin'), adminController.toggleUserStatus);

module.exports = router;
