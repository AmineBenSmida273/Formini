const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Routes publiques
router.get('/', courseController.getAllCourses);
router.get('/categories', courseController.getCourseCategories); // Must be before /:id to avoid conflict
router.get('/:id', courseController.getCourseById);

// Routes protégées (Formateur / Admin)
// Note: 'upload.single('image')' assumes multer is set up. If not, we might need to fix this.
// For now, I'll assume standard upload setup or handle it if missing.

router.post('/', verifyToken, verifyRole('instructor', 'admin'), courseController.createCourse);
router.put('/:id', verifyToken, verifyRole('instructor', 'admin'), courseController.updateCourse);
router.delete('/:id', verifyToken, verifyRole('instructor', 'admin'), courseController.deleteCourse);

// Routes spécifiques
router.get('/instructor/my-courses', verifyToken, verifyRole('instructor'), courseController.getMyCourses);

module.exports = router;
