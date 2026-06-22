/**
 * Modèle Mongoose : MedicalRecord
 * Un patient = un dossier médical (clé unique sur patientId).
 */
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    auteurId: String,        // keycloakId du médecin
    contenu: String,
    date:    { type: Date, default: Date.now }
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId:     { type: Number, required: true, unique: true, index: true },
    antecedents:   { type: String, default: '' },
    allergies:     { type: String, default: '' },
    groupeSanguin: { type: String, default: '' },
    notes:         { type: [noteSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
