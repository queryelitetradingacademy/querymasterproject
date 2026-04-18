const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  number: { type: Number },
  amount: { type: Number },
  date: { type: Date },
  mode: { type: String },
  note: { type: String }
}, { timestamps: true });

const followUpSchema = new mongoose.Schema({
  number: { type: Number },
  date: { type: Date },
  note: { type: String },
  status: {
    type: String,
    enum: ['interested', 'not_interested', 'callback', 'no_response', 'converted', 'lost'],
    default: 'callback'
  },
  doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true },
  email: { type: String, lowercase: true },
  city: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },

  // Reference
  referredBy: { type: String, default: 'self' },

  // Profile
  profileType: {
    type: String,
    enum: ['student', 'professional'],
    default: 'student'
  },
  studentDetail: { type: String }, // e.g. "Class 12" or "Graduation"
  professionalDetail: { type: String }, // e.g. "Software Engineer"

  traderKnowledge: {
    type: String,
    enum: ['beginner', 'basic_knowledge', 'loss_making'],
    default: 'beginner'
  },

  // Query / Lead Info
  feeTold: { type: Number },
  discountTold: { type: Number },
  registrationDone: { type: Boolean, default: false },
  registrationAmount: { type: Number },

  conversionExpectation: {
    type: String,
    enum: ['poor', 'good', 'very_good'],
    default: 'good'
  },

  howReached: {
    type: String,
    enum: ['phone', 'office_visit', 'website_registration', 'meta_ad', 'instagram', 'whatsapp', 'referral', 'other'],
    default: 'phone'
  },
  howReachedOther: { type: String },

  visitCallDateTime: { type: Date },

  source: { type: String }, // Admin-configurable source

  remarks: { type: String },

  // Status
  status: {
    type: String,
    enum: ['lead', 'pending', 'converted', 'lost'],
    default: 'lead'
  },

  // Conversion
  converted: { type: Boolean, default: false },
  convertedDate: { type: Date },

  // Course/Batch
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'SystemSetting' },
  batchName: { type: String },
  courseType: {
    type: String,
    enum: ['live_batch', 'recorded', 'strategy', 'brokerage', 'other'],
    default: 'live_batch'
  },

  // Financials (confirmed students)
  totalFee: { type: Number },
  totalReceived: { type: Number, default: 0 },
  feePending: { type: Number, default: 0 },
  installments: [installmentSchema],

  // Follow ups (pending students)
  followUps: [followUpSchema],

  // Meta
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Public form flag
  fromPublicForm: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-calculate fee pending
studentSchema.pre('save', function (next) {
  if (this.totalFee && this.installments) {
    this.totalReceived = this.installments.reduce((sum, i) => sum + (i.amount || 0), 0);
    this.feePending = this.totalFee - this.totalReceived;
  }
  next();
});

// Text search index
studentSchema.index({ name: 'text', contact: 'text', email: 'text', city: 'text' });

module.exports = mongoose.model('Student', studentSchema);
