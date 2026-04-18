const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', ctrl.getDashboardStats);

router.get('/users', ctrl.getUsers);
router.post('/users', ctrl.createUser);
router.put('/users/:id', ctrl.updateUser);
router.put('/users/:id/permissions', ctrl.updatePermissions);
router.put('/users/:id/reset-password', ctrl.resetUserPassword);
router.put('/users/:id/toggle-status', ctrl.toggleUserStatus);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/settings', ctrl.getSettings);
router.post('/settings', ctrl.createSetting);
router.put('/settings/:id', ctrl.updateSetting);
router.delete('/settings/:id', ctrl.deleteSetting);
router.post('/settings/:id/values', ctrl.addSettingValue);
router.delete('/settings/:id/values/:valueId', ctrl.removeSettingValue);

module.exports = router;
