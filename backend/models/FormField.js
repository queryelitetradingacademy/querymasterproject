const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldName: { type: String, required: true },
  fieldType: {
    type: String,
    enum: ['text', 'email', 'tel', 'textarea', 'select', 'date', 'number'],
    default: 'text'
  },
  placeholder: { type: String },
  isRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  options: [{ label: String, value: String }], // for select fields
  isDefault: { type: Boolean, default: false }, // default fields cant be deleted
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FormField', formFieldSchema);
