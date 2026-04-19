const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { protect, can } = require('../middleware/auth');

// Public
router.post('/public-form', ctrl.publicFormSubmit);

// Protected
router.use(protect);
router.get('/stats', ctrl.getStats);
router.get('/batch-summary', can('queries', 'view'), ctrl.getBatchSummary);
router.get('/', can('queries', 'view'), ctrl.getStudents);
router.post('/', can('queries', 'create'), ctrl.createStudent);
router.get('/:id', can('queries', 'view'), ctrl.getStudent);
router.put('/:id', can('queries', 'edit'), ctrl.updateStudent);
router.delete('/:id', can('queries', 'delete'), ctrl.deleteStudent);

// Installments
router.post('/:id/installments', can('queries', 'edit'), ctrl.addInstallment);
router.put('/:id/installments/:instId', can('queries', 'edit'), ctrl.updateInstallment);
router.delete('/:id/installments/:instId', can('queries', 'edit'), ctrl.deleteInstallment);

// Follow-ups
router.post('/:id/followups', can('queries', 'edit'), ctrl.addFollowUp);

// Broker
router.put('/:id/broker', can('queries', 'edit'), ctrl.updateBroker);

module.exports = router;
