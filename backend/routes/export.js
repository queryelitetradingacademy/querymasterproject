const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exportController');
const { protect, can } = require('../middleware/auth');

router.use(protect);
router.get('/queries', can('queries', 'export'), ctrl.exportQueries);
router.get('/finance', can('finance', 'export'), ctrl.exportFinance);
router.get('/tasks', can('tasks', 'export'), ctrl.exportTasks);

module.exports = router;
