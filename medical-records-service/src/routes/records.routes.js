const express = require('express');
const ctrl = require('../controllers/records.controller');
const { authenticate } = require('../middleware/keycloak');
const { hasRole } = require('../middleware/roles');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Dossiers médicaux
 */

/**
 * @swagger
 * /api/records:
 *   get:
 *     tags: [Records]
 *     summary: Liste tous les dossiers (ADMIN/DOCTOR)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', authenticate, hasRole('ADMIN', 'DOCTOR'), ctrl.list);

/**
 * @swagger
 * /api/records/patient/{patientId}:
 *   get:
 *     tags: [Records]
 *     summary: Récupère le dossier d'un patient
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: integer }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 *       404: { description: Pas de dossier }
 */
router.get('/patient/:patientId', authenticate, ctrl.getByPatient);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Récupère un dossier par id Mongo
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, ctrl.getById);

/**
 * @swagger
 * /api/records:
 *   post:
 *     tags: [Records]
 *     summary: Crée un nouveau dossier (DOCTOR/ADMIN)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, hasRole('ADMIN', 'DOCTOR'), ctrl.create);

router.put('/:id', authenticate, hasRole('ADMIN', 'DOCTOR'), ctrl.update);

/**
 * @swagger
 * /api/records/{id}/notes:
 *   post:
 *     tags: [Records]
 *     summary: Ajoute une note (DOCTOR/ADMIN)
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/notes', authenticate, hasRole('ADMIN', 'DOCTOR'), ctrl.addNote);

router.delete('/:id', authenticate, hasRole('ADMIN'), ctrl.delete);

module.exports = router;
