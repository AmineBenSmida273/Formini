const User = require('../models/user.model');
const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const Quiz = require('../models/quiz.model');
const QuizResult = require('../models/quizResult.model');
const Review = require('../models/review.model');
const Enrollment = require('../models/enrollment.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mdp, role } = req.body;

    // Vérifications manuelles supplémentaires
    if (!nom || !prenom || !email || !mdp) {
      return res.status(400).json({ 
        message: 'Tous les champs obligatoires doivent être remplis' 
      });
    }

    if (mdp.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Validation email basique
    const emailRegex = /^.+@.+\..+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide' 
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mdp, 12);

    // Créer le nouvel utilisateur avec TOUS les champs requis
    const user = new User({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      mdp: hashedPassword,
      role: role || 'student',
      pdp: null, // Explicitement null comme dans le validateur
      dateinscri: new Date(), // Date actuelle
      statut: 'active' // Statut par défaut
    });

    await user.save();

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        dateinscri: user.dateinscri
      }
    });

  } catch (error) {
    console.error('Erreur register détaillée:', error);
    
    // Gestion spécifique des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Erreur de validation',
        errors: errors 
      });
    }
    
    if (error.code === 121) { // Code d'erreur de validation MongoDB
      return res.status(400).json({ 
        message: 'Les données ne respectent pas le schéma de validation',
        error: error.errInfo?.details 
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mdp } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(mdp, user.mdp);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier que le compte est actif
    if (user.statut !== 'active') {
      return res.status(400).json({ message: 'Votre compte est suspendu' });
    }

    // Créer un token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
};

// =============== DASHBOARD STATISTICS ========================

// Statistiques pour Admin
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ statut: 'active' });
    const suspendedUsers = await User.countDocuments({ statut: 'suspendue' });
    
    // Statistiques sur les cours
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalReviews = await Review.countDocuments();
    
    // Calculer la note moyenne globale
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    // Utilisateurs récents (10 derniers)
    const recentUsers = await User.find()
      .select('nom prenom email role statut dateinscri')
      .sort({ dateinscri: -1 })
      .limit(10)
      .lean();

    res.json({
      stats: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalEnrollments,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      recentUsers: recentUsers.map(user => ({
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        statut: user.statut,
        dateinscri: user.dateinscri,
      })),
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
};

// Statistiques pour Étudiant
exports.getStudentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer les inscriptions de l'étudiant
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course', 'titre description image formateur')
      .populate('course.formateur', 'nom prenom')
      .lean();

    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter(e => e.statut === 'completed').length;
    const coursesInProgress = enrollments.filter(e => e.statut === 'active').length;

    // Calculer les heures totales d'apprentissage (somme des durées des leçons complétées)
    const totalHours = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.progression || 0) * 0.1; // Approximation basée sur la progression
    }, 0);

    // Calculer le score moyen des quiz
    const quizResults = await QuizResult.find({ student: userId }).lean();
    const averageScore = quizResults.length > 0
      ? Math.round((quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length) * 10) / 10
      : 0;

    // Certificats = cours complétés avec score >= 70%
    const certificates = enrollments.filter(e => {
      if (e.statut !== 'completed') return false;
      const courseQuizResults = quizResults.filter(qr => 
        qr.quiz && qr.quiz.toString() === e.course._id.toString()
      );
      return courseQuizResults.length > 0 && 
             courseQuizResults[courseQuizResults.length - 1].score >= 70;
    }).length;

    // Mes cours avec détails
    const myCourses = await Promise.all(enrollments.map(async (enrollment) => {
      const course = enrollment.course;
      if (!course) return null;
      
      // Récupérer les leçons du cours
      const lessons = await Lesson.find({ course: course._id }).lean();
      const totalLessons = lessons.length;
      const completedLessons = Math.floor((enrollment.progression / 100) * totalLessons);
      
      // Récupérer les quiz du cours
      const courseQuizzes = await Quiz.find({ course: course._id }).lean();
      
      // Récupérer la prochaine leçon
      const nextLesson = enrollment.derniereLecon 
        ? await Lesson.findById(enrollment.derniereLecon).lean()
        : lessons.length > 0 ? lessons[0] : null;

      // Calculer le total des heures du cours
      const courseHours = Math.round(lessons.reduce((sum, l) => sum + (l.dureeMinutes || 0), 0) / 60);

      return {
        id: course._id,
        title: course.titre,
        description: course.description,
        image: course.image,
        progress: enrollment.progression || 0,
        instructor: course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Inconnu',
        status: enrollment.statut === 'completed' ? 'Terminé' : 
                enrollment.statut === 'active' ? 'En cours' : 'Non commencé',
        hours: courseHours,
        nextLesson: nextLesson ? nextLesson.titre : null,
        totalLessons,
        completedLessons,
      };
    }));

    // Filtrer les valeurs null
    const validCourses = myCourses.filter(c => c !== null);

    // Activité récente (quiz complétés, cours complétés, avis laissés)
    const recentQuizResults = await QuizResult.find({ student: userId })
      .populate({
        path: 'quiz',
        select: 'titre course',
        populate: {
          path: 'course',
          select: 'titre'
        }
      })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const recentReviews = await Review.find({ student: userId })
      .populate('course', 'titre')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const recentActivity = [
      ...recentQuizResults.map(qr => ({
        id: qr._id,
        action: 'Quiz complété',
        course: qr.quiz?.course?.titre || 'Cours inconnu',
        date: qr.date,
        icon: '📊',
        score: qr.score
      })),
      ...recentReviews.map(rev => ({
        id: rev._id,
        action: 'Avis laissé',
        course: rev.course?.titre || 'Cours inconnu',
        date: rev.date || rev.createdAt,
        icon: '⭐',
        rating: rev.rating
      })),
      ...enrollments.filter(e => e.statut === 'completed' && e.course).map(e => ({
        id: e._id,
        action: 'Cours terminé',
        course: e.course?.titre || 'Cours inconnu',
        date: e.updatedAt || e.createdAt,
        icon: '✅'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    // Cours recommandés (basés sur les catégories des cours suivis)
    const enrolledCourseIds = enrollments.map(e => e.course._id);
    const enrolledCourses = await Course.find({ _id: { $in: enrolledCourseIds } })
      .select('categorie')
      .lean();
    const categories = [...new Set(enrolledCourses.map(c => c.categorie).filter(Boolean))];
    
    const recommendedCourses = await Course.find({
      _id: { $nin: enrolledCourseIds },
      categorie: { $in: categories }
    })
      .populate('formateur', 'nom prenom')
      .limit(3)
      .lean();

    const recommendedWithStats = await Promise.all(recommendedCourses.map(async (course) => {
      const enrollmentsCount = await Enrollment.countDocuments({ course: course._id });
      const reviews = await Review.find({ course: course._id }).lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        id: course._id,
        title: course.titre,
        instructor: course.formateur ? `${course.formateur.prenom} ${course.formateur.nom}` : 'Inconnu',
        rating: Math.round(avgRating * 10) / 10,
        students: enrollmentsCount
      };
    }));

    // Échéances à venir (basées sur les quiz à venir)
    const upcomingDeadlines = [];
    for (const enrollment of enrollments.filter(e => e.statut === 'active' && e.course)) {
      const courseQuizzes = await Quiz.find({ course: enrollment.course._id })
        .sort({ createdAt: 1 })
        .lean();
      
      if (courseQuizzes.length > 0) {
        const nextQuiz = courseQuizzes[0];
        upcomingDeadlines.push({
          course: enrollment.course.titre,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours par défaut
          type: 'Quiz'
        });
      }
    }

    res.json({
      stats: {
        coursesEnrolled,
        coursesCompleted,
        coursesInProgress,
        certificates,
        totalHours: Math.round(totalHours),
        averageScore
      },
      myCourses: validCourses,
      recentActivity,
      recommendedCourses: recommendedWithStats,
      upcomingDeadlines: upcomingDeadlines.slice(0, 5)
    });
  } catch (error) {
    console.error('Erreur getStudentStats:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
};

// Statistiques pour Formateur
exports.getInstructorStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Récupérer tous les cours du formateur
    const allCourses = await Course.find({ formateur: userId }).lean();
    const totalCourses = allCourses.length;
    const activeCourses = allCourses.length; // Tous les cours sont considérés actifs pour l'instant

    // Récupérer toutes les inscriptions pour les cours du formateur
    const courseIds = allCourses.map(c => c._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate('student', 'nom prenom email')
      .populate('course', 'titre')
      .lean();

    // Calculer le nombre d'étudiants uniques
    const uniqueStudents = new Set(enrollments.map(e => e.student._id.toString()));
    const totalStudents = uniqueStudents.size;
    const totalEnrollments = enrollments.length;

    // Calculer les revenus totaux (somme des prix des cours multipliés par le nombre d'inscriptions)
    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      const course = allCourses.find(c => c._id.toString() === enrollment.course._id.toString());
      return sum + (course?.prix || 0);
    }, 0);

    // Calculer la note moyenne de tous les cours
    const allReviews = await Review.find({ course: { $in: courseIds } }).lean();
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    // Mes cours avec statistiques détaillées
    const myCourses = await Promise.all(allCourses.map(async (course) => {
      const courseEnrollments = enrollments.filter(e => 
        e.course._id.toString() === course._id.toString()
      );
      const courseStudents = new Set(courseEnrollments.map(e => e.student._id.toString())).size;
      
      const courseReviews = allReviews.filter(r => 
        r.course.toString() === course._id.toString()
      );
      const courseRating = courseReviews.length > 0
        ? courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length
        : 0;

      const courseRevenue = courseEnrollments.length * (course.prix || 0);
      
      // Calculer le taux de complétion
      const completedEnrollments = courseEnrollments.filter(e => e.statut === 'completed').length;
      const completionRate = courseEnrollments.length > 0
        ? Math.round((completedEnrollments / courseEnrollments.length) * 100)
        : 0;

      return {
        id: course._id,
        title: course.titre,
        description: course.description,
        status: 'active',
        students: courseStudents,
        rating: Math.round(courseRating * 10) / 10,
        revenue: courseRevenue,
        enrollments: courseEnrollments.length,
        completionRate
      };
    }));

    // Inscriptions récentes (10 dernières)
    const recentEnrollments = enrollments
      .sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))
      .slice(0, 10)
      .map(enrollment => ({
        id: enrollment._id,
        studentName: `${enrollment.student.prenom} ${enrollment.student.nom}`,
        courseName: enrollment.course.titre,
        date: enrollment.dateInscription,
        status: enrollment.statut === 'active' ? 'active' : enrollment.statut
      }));

    res.json({
      stats: {
        totalCourses,
        activeCourses,
        totalStudents,
        totalRevenue: Math.round(totalRevenue),
        averageRating: Math.round(averageRating * 10) / 10,
        totalEnrollments
      },
      myCourses,
      recentEnrollments
    });
  } catch (error) {
    console.error('Erreur getInstructorStats:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
};
