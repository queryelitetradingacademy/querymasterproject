const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('name email role');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
