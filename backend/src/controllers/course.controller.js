const Course = require('../models/course.model');
const Lesson = require('../models/lesson.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
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
        let query = {};

        // Si admin, voir tous les cours, sinon seulement les approuvés
        if (!req.user || req.user.role !== 'admin') {
            query.statut = 'approuvé';
        }

        if (categorie) query.categorie = categorie;
        if (niveau) query.niveau = niveau;
        if (search) {
            query.$or = [
                { titre: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Utiliser la collection MongoDB directement car elle utilise "formateurid"
        const db = mongoose.connection.db;
        const courses = await db.collection('courses').find(query).toArray();

        // Peupler manuellement les informations du formateur
        const coursesWithInstructor = await Promise.all(courses.map(async (course) => {
            if (course.formateurid) {
                const instructor = await User.findById(course.formateurid).select('nom prenom email').lean();
                return {
                    ...course,
                    formateur: instructor
                };
            }
            return course;
        }));

        res.json(coursesWithInstructor);
    } catch (error) {
        console.error('Erreur getAllCourses:', error);
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

        // Utiliser MongoDB directement
        const db = mongoose.connection.db;
        const ObjectId = mongoose.Types.ObjectId;

        const course = await db.collection('courses').findOne({ _id: new ObjectId(id) });

        if (!course) return res.status(404).json({ message: 'Cours non trouvé' });

        // Vérifier les droits (formateur propriétaire ou admin)
        if (req.user && course.formateurid && course.formateurid.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Mettre à jour le cours
        await db.collection('courses').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedCourse = await db.collection('courses').findOne({ _id: new ObjectId(id) });

        res.json({
            message: 'Cours mis à jour avec succès',
            course: updatedCourse
        });
    } catch (error) {
        console.error('Erreur updateCourse:', error);
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
