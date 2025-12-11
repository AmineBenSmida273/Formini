const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  etudiantid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coursid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  dateinscription: {
    type: Date,
    default: Date.now
  },
  progression: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  statut: {
    type: String,
    enum: ['en_cours', 'terminé', 'abandonné'],
    default: 'en_cours'
  },
  derniereactivite: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
enrollmentSchema.index({ etudiantid: 1, coursid: 1 }, { unique: true });
enrollmentSchema.index({ coursid: 1 });
enrollmentSchema.index({ dateinscription: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
