const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/taskController');
const { protect, can } = require('../middleware/auth');

router.use(protect);
router.get('/stats', ctrl.getStats);
router.get('/', can('tasks', 'view'), ctrl.getTasks);
router.post('/', can('tasks', 'create'), ctrl.createTask);
router.get('/:id', can('tasks', 'view'), ctrl.getTask);
router.put('/:id', can('tasks', 'edit'), ctrl.updateTask);
router.delete('/:id', can('tasks', 'delete'), ctrl.deleteTask);

// Subtasks
router.post('/:id/subtasks', can('tasks', 'edit'), ctrl.addSubtask);
router.put('/:id/subtasks/:subtaskId', can('tasks', 'edit'), ctrl.updateSubtask);
router.delete('/:id/subtasks/:subtaskId', can('tasks', 'delete'), ctrl.deleteSubtask);

module.exports = router;
