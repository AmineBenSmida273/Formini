const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  titre: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  categorie: { type: String, default: null },
  formateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programme: { type: String, default: '' },
  image: { type: String, default: null },
  niveau: { type: String, enum: ['debutant', 'intermediaire', 'avance'], default: 'debutant' },
  prix: { type: Number, default: 0 },
  dateCreation: { type: Date, default: Date.now },
  chapitres: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
