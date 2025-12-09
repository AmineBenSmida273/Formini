const User = require('../models/user.model');
const { sendInstructorApprovalNotification } = require('../services/emailService');
const { ADMIN_EMAIL, isMainAdminUser } = require('../utils/adminConfig');
const path = require('path');
const fs = require('fs');

// Récupérer tous les formateurs en attente d'approbation
exports.getPendingInstructors = async (req, res) => {
  try {
    const pendingInstructors = await User.find({
      role: 'instructor',
      statutInscription: 'pending'
    })
      .select('nom prenom email centreProfession cv dateDemande dateinscri')
      .sort({ dateDemande: -1 })
      .lean();

    res.json({
      instructors: pendingInstructors.map(instructor => ({
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email,
        centreProfession: instructor.centreProfession,
        cv: instructor.cv,
        dateDemande: instructor.dateDemande,
        dateinscri: instructor.dateinscri
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des formateurs',
      error: error.message
    });
  }
};

// Approuver un formateur
exports.approveInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un formateur' });
    }

    // Mettre à jour le statut
    instructor.statutInscription = 'approved';
    instructor.statut = 'active';
    instructor.isVerified = true; // Activer le compte
    await instructor.save();

    // Envoyer email de notification
    try {
      await sendInstructorApprovalNotification(instructor, true);
    } catch (err) {
      console.error('Erreur envoi email:', err);
    }

    res.json({
      message: 'Formateur approuvé avec succès',
      instructor: {
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de l\'approbation',
      error: error.message
    });
  }
};

// Rejeter un formateur
exports.rejectInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (instructor.role !== 'instructor') {
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un formateur' });
    }

    // Mettre à jour le statut
    instructor.statutInscription = 'rejected';
    instructor.statut = 'suspendue';
    await instructor.save();

    // Supprimer le CV si rejeté
    if (instructor.cv) {
      const cvPath = path.join(__dirname, '..', instructor.cv);
      if (fs.existsSync(cvPath)) {
        fs.unlinkSync(cvPath);
      }
    }

    // Envoyer email de notification
    try {
      await sendInstructorApprovalNotification(instructor, false);
    } catch (err) {
      console.error('Erreur envoi email:', err);
    }

    res.json({
      message: 'Formateur rejeté',
      instructor: {
        id: instructor._id,
        nom: instructor.nom,
        prenom: instructor.prenom,
        email: instructor.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du rejet',
      error: error.message
    });
  }
};

// Télécharger le CV d'un formateur
exports.downloadCV = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({ message: 'Formateur non trouvé' });
    }

    if (!instructor.cv) {
      return res.status(404).json({ message: 'CV non trouvé' });
    }

    const cvPath = path.join(__dirname, '..', instructor.cv);
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ message: 'Fichier CV introuvable' });
    }

    res.download(cvPath, `${instructor.prenom}_${instructor.nom}_CV.pdf`);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du téléchargement',
      error: error.message
    });
  }
};

// Changer le statut d'un utilisateur (suspendre/activer)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { statut } = req.body;

    if (!['active', 'suspendue'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre de suspendre ou modifier le compte admin principal
    if (isMainAdminUser(user)) {
      return res.status(403).json({ 
        message: `Impossible de modifier le compte administrateur principal (${ADMIN_EMAIL})` 
      });
    }

    // Ne pas permettre de suspendre un autre admin
    if (user.role === 'admin' && statut === 'suspendue') {
      return res.status(403).json({ message: 'Impossible de suspendre un administrateur' });
    }

    user.statut = statut;
    await user.save();

    res.json({
      message: `Utilisateur ${statut === 'active' ? 'activé' : 'suspendu'} avec succès`,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        statut: user.statut
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la modification du statut',
      error: error.message
    });
  }
};
