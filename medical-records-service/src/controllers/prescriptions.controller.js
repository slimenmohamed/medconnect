const Prescription = require('../models/Prescription');
const { publishPrescriptionCreated } = require('../config/rabbit');

exports.list = async (req, res) => {
  const items = await Prescription.find().sort({ dateCreation: -1 });
  res.json(items);
};

exports.getById = async (req, res) => {
  const p = await Prescription.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
};

exports.getByPatient = async (req, res) => {
  const patientId = Number(req.params.patientId);
  const list = await Prescription.find({ patientId }).sort({ dateCreation: -1 });
  res.json(list);
};

/**
 * Création d'une prescription par un DOCTOR.
 * Publie un événement RabbitMQ "prescription.created" : appointment-service
 * en déduit la fin de la consultation et passe le RDV à COMPLETED.
 */
exports.create = async (req, res) => {
  const payload = {
    ...req.body,
    patientId: Number(req.body.patientId),
    doctorId: Number(req.body.doctorId),
    appointmentId: req.body.appointmentId != null ? Number(req.body.appointmentId) : null,
    dateCreation: new Date()
  };
  const created = await Prescription.create(payload);

  publishPrescriptionCreated({
    prescriptionId: created._id.toString(),
    appointmentId: created.appointmentId,
    patientId: created.patientId,
    doctorId: created.doctorId
  });

  res.status(201).json(created);
};

exports.delete = async (req, res) => {
  const ok = await Prescription.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
};
