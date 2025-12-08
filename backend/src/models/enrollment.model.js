const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateInscription: { type: Date, default: Date.now },
  progression: { type: Number, default: 0 }, // pourcentage de complétion
  statut: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  derniereLecon: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null }
}, { timestamps: true });

// Index pour éviter les doublons
enrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
