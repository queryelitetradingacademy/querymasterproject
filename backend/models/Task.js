const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  dueDate: { type: Date },
  priority: { type: String, enum: ['p1', 'p2', 'p3', 'p4'], default: 'p3' },
  completedAt: { type: Date }
}, { timestamps: true });

const reminderSchema = new mongoose.Schema({
  datetime: { type: Date, required: true },
  channels: [{
    type: String,
    enum: ['whatsapp', 'browser', 'inapp']
  }],
  sent: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true }
});

const activitySchema = new mongoose.Schema({
  action: { type: String },
  field: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String }, // Admin-configurable
  priority: {
    type: String,
    enum: ['p1', 'p2', 'p3', 'p4'],
    default: 'p3'
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'on_hold', 'done'],
    default: 'todo'
  },
  dueDate: { type: Date },
  completedAt: { type: Date },

  tags: [{ type: String }],

  // Recurring
  isRecurring: { type: Boolean, default: false },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'custom'],
  },
  recurringInterval: { type: Number }, // every N days if custom

  // Reminders
  reminderEnabled: { type: Boolean, default: false },
  reminders: [reminderSchema],

  // Subtasks
  subtasks: [subtaskSchema],

  // Links to other segments
  linkedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  linkedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  linkedSegment: {
    type: String,
    enum: ['queries', 'finance', 'none'],
    default: 'none'
  },

  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Activity log
  activityLog: [activitySchema],

  attachments: [{ name: String, url: String, uploadedAt: Date }],

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
