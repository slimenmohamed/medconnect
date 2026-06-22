const MedicalRecord = require('../models/MedicalRecord');
const Prescription  = require('../models/Prescription');

exports.list = async (req, res) => {
  const records = await MedicalRecord.find();
  res.json(records);
};

exports.getById = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json(record);
};

/** Utilisé par appointment-service via Feign. */
exports.getByPatient = async (req, res) => {
  const patientId = Number(req.params.patientId);
  const record = await MedicalRecord.findOne({ patientId });
  if (!record) return res.status(404).json({ error: 'No record for patient', patientId });
  res.json(record);
};

exports.create = async (req, res) => {
  const payload = { ...req.body, patientId: Number(req.body.patientId) };
  const existing = await MedicalRecord.findOne({ patientId: payload.patientId });
  if (existing) return res.status(409).json({ error: 'Record already exists', id: existing._id });
  const record = await MedicalRecord.create(payload);
  res.status(201).json(record);
};

exports.update = async (req, res) => {
  const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) return res.status(404).json({ error: 'Not found' });
  res.json(record);
};

exports.addNote = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Not found' });
  record.notes.push({
    auteurId: req.user?.sub || 'unknown',
    contenu: req.body.contenu,
    date: new Date()
  });
  await record.save();
  res.json(record);
};

exports.delete = async (req, res) => {
  const ok = await MedicalRecord.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};

/**
 * SCENARIO SYNC #3 (Feign): purge complete du patient.
 * Appele par appointment-service quand un patient est supprime cote MySQL.
 * On supprime dossier + prescriptions associees pour garantir la coherence
 * cross-database.
 */
exports.purgePatient = async (req, res) => {
  const patientId = Number(req.params.patientId);
  if (Number.isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patientId' });
  }
  const [delRecords, delPrescriptions] = await Promise.all([
    MedicalRecord.deleteMany({ patientId }),
    Prescription.deleteMany({ patientId })
  ]);
  console.log(`[Feign SYNC #3] Purge patient ${patientId} -> records=${delRecords.deletedCount}, prescriptions=${delPrescriptions.deletedCount}`);
  res.json({
    status: 'purged',
    patientId,
    deletedRecords: delRecords.deletedCount,
    deletedPrescriptions: delPrescriptions.deletedCount
  });
};
