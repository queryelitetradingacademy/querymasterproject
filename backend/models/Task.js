const mongoose = require('mongoose');

const subtaskReminderSchema = new mongoose.Schema({
  datetime: { type: Date },
  channels: [{ type: String, enum: ['whatsapp', 'browser', 'inapp'] }],
  sent: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true }
});

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'on_hold', 'done'],
    default: 'todo'
  },
  priority: { type: String, enum: ['p1', 'p2', 'p3', 'p4'], default: 'p3' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  reminderEnabled: { type: Boolean, default: false },
  reminder: subtaskReminderSchema,
  order: { type: Number, default: 0 }
}, { timestamps: true });

const mainReminderSchema = new mongoose.Schema({
  datetime: { type: Date, required: true },
  channels: [{ type: String, enum: ['whatsapp', 'browser', 'inapp'] }],
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
  category: { type: String },
  priority: { type: String, enum: ['p1', 'p2', 'p3', 'p4'], default: 'p3' },
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
  recurringType: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
  recurringInterval: { type: Number },

  // Reminders
  reminderEnabled: { type: Boolean, default: false },
  reminders: [mainReminderSchema],

  // Subtasks — full details now
  subtasks: [subtaskSchema],

  // Links
  linkedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  linkedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  linkedSegment: { type: String, enum: ['queries', 'finance', 'none'], default: 'none' },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activityLog: [activitySchema],
  attachments: [{ name: String, url: String, uploadedAt: Date }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

taskSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Task', taskSchema);
