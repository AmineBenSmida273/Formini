const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const User = require('../models/user.model');
const fs = require('fs');
const path = require('path');

// Créer un nouveau cours
exports.createCourse = async (req, res) => {
    try {
        const { titre, description, categorie, programme, niveau, prix, duree, objectifs, prerequis } = req.body;

        // Si une image est uploadée
        let imagePath = 'default-course.jpg';
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, '/'); // Normaliser le chemin
        }

        const course = new Course({
            titre,
            description,
            categorie,
            programme,
            niveau,
            prix,
            duree,
            objectifs: typeof objectifs === 'string' ? JSON.parse(objectifs) : objectifs,
            prerequis: typeof prerequis === 'string' ? JSON.parse(prerequis) : prerequis,
            image: imagePath,
            formateur: req.user.userId // Issu du token
        });

        await course.save();

        res.status(201).json({
            message: 'Cours créé avec succès',
            course
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la création du cours',
            error: error.message
        });
    }
};

// Récupérer tous les cours (avec filtres optionnels)
exports.getAllCourses = async (req, res) => {
    try {
        const { categorie, niveau, search } = req.query;
        let query = { statut: 'approuvé' }; // Par défaut, seulement les cours approuvés pour le public

        // Si admin ou formateur demande ses propres cours, on peut ajuster
        if (req.user && req.user.role === 'admin') {
            delete query.statut; // Admin voit tout
        }

        if (categorie) query.categorie = categorie;
        if (niveau) query.niveau = niveau;
        if (search) {
            query.$text = { $search: search };
        }

        const courses = await Course.find(query)
            .populate('formateur', 'nom prenom')
            .lean();

        res.json(courses);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la récupération des cours',
            error: error.message
        });
    }
};

// Récupérer un cours spécifique avec ses leçons
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('formateur', 'nom prenom bio pdp')
            .populate({
                path: 'avis.etudiant',
                select: 'nom prenom pdp'
            })
            .lean();

        if (!course) {
            return res.status(404).json({ message: 'Cours non trouvé' });
        }

        // Récupérer les leçons associées
        const lessons = await Lesson.find({ course: course._id }).sort({ ordre: 1 }).lean();

        res.json({
            ...course,
            lessons
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la récupération du cours',
            error: error.message
        });
    }
};

// Mettre à jour un cours
exports.updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Vérifier les droits (formateur propriétaire ou admin)
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        if (course.formateur.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, '/');
            // Optionnel: supprimer l'ancienne image si ce n'est pas celle par défaut
        }

        // Parse JSON strings if form-data
        if (typeof updateData.objectifs === 'string') updateData.objectifs = JSON.parse(updateData.objectifs);
        if (typeof updateData.prerequis === 'string') updateData.prerequis = JSON.parse(updateData.prerequis);

        const updatedCourse = await Course.findByIdAndUpdate(id, updateData, { new: true });

        res.json({
            message: 'Cours mis à jour avec succès',
            course: updatedCourse
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la mise à jour du cours',
            error: error.message
        });
    }
};

// Supprimer un cours
exports.deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        if (course.formateur.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Supprimer les leçons associées
        await Lesson.deleteMany({ course: id });

        // Supprimer le cours
        await Course.findByIdAndDelete(id);

        res.json({ message: 'Cours et leçons associés supprimés avec succès' });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la suppression du cours',
            error: error.message
        });
    }
};

// Récupérer les cours du formateur connecté
exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Course.find({ formateur: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        // Pour chaque cours, compter les étudiants et leçons
        const detailedCourses = await Promise.all(courses.map(async (c) => {
            const lessonsCount = await Lesson.countDocuments({ course: c._id });
            // Students count logic logic can be added here if needed, or rely on etudiantsInscrits array length if maintained
            return {
                ...c,
                lessonsCount,
                studentsCount: c.etudiantsInscrits ? c.etudiantsInscrits.length : 0
            };
        }));

        res.json(detailedCourses);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de la récupération de vos cours',
            error: error.message
        });
    }
};
