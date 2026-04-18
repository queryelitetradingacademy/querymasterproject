const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { protect, can } = require('../middleware/auth');

// Public route - no auth needed
router.post('/public-form', ctrl.publicFormSubmit);

// Protected routes
router.use(protect);
router.get('/stats', ctrl.getStats);
router.get('/', can('queries', 'view'), ctrl.getStudents);
router.post('/', can('queries', 'create'), ctrl.createStudent);
router.get('/:id', can('queries', 'view'), ctrl.getStudent);
router.put('/:id', can('queries', 'edit'), ctrl.updateStudent);
router.delete('/:id', can('queries', 'delete'), ctrl.deleteStudent);
router.post('/:id/installments', can('queries', 'edit'), ctrl.addInstallment);
router.post('/:id/followups', can('queries', 'edit'), ctrl.addFollowUp);

module.exports = router;
