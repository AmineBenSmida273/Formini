const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titre: { 
    type: String, 
    required: [true, 'Le titre du cours est requis'],
    trim: true,
    minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: { 
    type: String, 
    required: [true, 'La description est requise'],
    minlength: [20, 'La description doit contenir au moins 20 caractères']
  },
  categorie: { 
    type: String, 
    required: [true, 'La catégorie est requise']
  },
  formateur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  programme: { 
    type: String, 
    required: [true, 'Le programme du cours est requis']
  },
  image: { 
    type: String, 
    default: 'default-course.jpg' 
  },
  niveau: { 
    type: String, 
    enum: {
      values: ['débutant', 'intermédiaire', 'avancé'],
      message: 'Le niveau doit être débutant, intermédiaire ou avancé'
    }, 
    default: 'débutant' 
  },
  prix: { 
    type: Number, 
    min: [0, 'Le prix ne peut pas être négatif'],
    default: 0 
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvé', 'rejeté'],
    default: 'en_attente'
  },
  dateCreation: { 
    type: Date, 
    default: Date.now 
  },
  dateApprobation: {
    type: Date
  },
  approuvePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duree: {
    type: Number, // Durée en heures
    min: [1, 'La durée minimale est de 1 heure'],
    required: [true, 'La durée du cours est requise']
  },
  objectifs: [{
    type: String,
    required: [true, 'Au moins un objectif est requis']
  }],
  prerequis: [{
    type: String
  }],
  etudiantsInscrits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  chapitres: [{
    titre: {
      type: String,
      required: [true, 'Le titre du chapitre est requis']
    },
    contenu: {
      type: String,
      required: [true, 'Le contenu du chapitre est requis']
    },
    duree: {
      type: Number, // Durée en minutes
      required: [true, 'La durée du chapitre est requise']
    },
    ressources: [{
      type: String // URLs des ressources (PDF, vidéos, etc.)
    }]
  }],
  notesMoyennes: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  avis: [{
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    commentaire: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les recherches par titre, catégorie et niveau
courseSchema.index({ titre: 'text', categorie: 'text' });

// Middleware pour mettre à jour la date d'approbation
courseSchema.pre('save', function(next) {
  if (this.isModified('statut') && this.statut === 'approuvé') {
    this.dateApprobation = Date.now();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
