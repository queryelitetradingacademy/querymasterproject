const express = require('express');
const router = express.Router();
const FormField = require('../models/FormField');
const { protect, adminOnly } = require('../middleware/auth');

// Public — get active fields for rendering public form
router.get('/public', async (req, res) => {
  try {
    const fields = await FormField.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: fields });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Protected — admin manages fields
router.use(protect, adminOnly);

router.get('/', async (req, res) => {
  try {
    const fields = await FormField.find().sort({ order: 1 });
    res.json({ success: true, data: fields });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const count = await FormField.countDocuments();
    const field = await FormField.create({ ...req.body, order: count, updatedBy: req.user._id });
    res.status(201).json({ success: true, data: field });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const field = await FormField.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    );
    res.json({ success: true, data: field });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/reorder/bulk', async (req, res) => {
  try {
    const { fields } = req.body; // array of {id, order}
    await Promise.all(fields.map(f => FormField.findByIdAndUpdate(f.id, { order: f.order })));
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const field = await FormField.findById(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: 'Field not found' });
    if (field.isDefault) return res.status(400).json({ success: false, message: 'Default fields cannot be deleted' });
    await FormField.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Field deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
