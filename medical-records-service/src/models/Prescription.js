/**
 * Modèle Mongoose : Prescription
 */
const mongoose = require('mongoose');

const medicamentSchema = new mongoose.Schema(
  {
    nom:    { type: String, required: true },
    dosage: { type: String, required: true },
    duree:  { type: String, required: true }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId:     { type: Number, required: true, index: true },
    doctorId:      { type: Number, required: true, index: true },
    appointmentId: { type: Number, required: false, index: true },
    medicaments:   { type: [medicamentSchema], required: true, validate: v => v.length > 0 },
    dateCreation:  { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
