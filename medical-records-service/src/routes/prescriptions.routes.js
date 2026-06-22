const express = require('express');
const ctrl = require('../controllers/prescriptions.controller');
const { authenticate } = require('../middleware/keycloak');
const { hasRole } = require('../middleware/roles');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Prescriptions médicales
 */

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Liste toutes les prescriptions (ADMIN/DOCTOR)
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authenticate, hasRole('ADMIN', 'DOCTOR'), ctrl.list);

/**
 * @swagger
 * /api/prescriptions/patient/{patientId}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Prescriptions d'un patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: integer }
 *     security: [{ bearerAuth: [] }]
 */
router.get('/patient/:patientId', authenticate, ctrl.getByPatient);

/**
 * @swagger
 * /api/prescriptions/{id}:
 *   get:
 *     tags: [Prescriptions]
 *     summary: Prescription par id
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, ctrl.getById);

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     tags: [Prescriptions]
 *     summary: Crée une prescription (DOCTOR)
 *     description: Publie un événement RabbitMQ "prescription.created"
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, hasRole('DOCTOR', 'ADMIN'), ctrl.create);

router.delete('/:id', authenticate, hasRole('ADMIN'), ctrl.delete);

module.exports = router;
