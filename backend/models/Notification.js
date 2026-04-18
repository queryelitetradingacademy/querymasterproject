const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['task_reminder', 'task_due', 'query_followup', 'tax_reminder', 'system', 'info'],
    default: 'info'
  },
  relatedTo: {
    segment: { type: String, enum: ['queries', 'tasks', 'finance', 'admin'] },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  isRead: { type: Boolean, default: false },
  channels: [{ type: String, enum: ['whatsapp', 'browser', 'inapp'] }],
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
