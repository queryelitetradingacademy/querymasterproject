const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['dropdown_options', 'boolean', 'string', 'number', 'json'],
    default: 'dropdown_options'
  },
  category: {
    type: String,
    enum: ['queries', 'tasks', 'finance', 'system', 'notifications'],
    required: true
  },
  values: [{ label: String, value: String, color: String, isActive: { type: Boolean, default: true } }],
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  isEditable: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
