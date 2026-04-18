// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile, changePassword, savePushSubscription } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/push-subscription', protect, savePushSubscription);

module.exports = router;
