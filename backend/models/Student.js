const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
  number: { type: Number },
  amount: { type: Number },
  date: { type: Date },
  mode: { type: String, default: 'upi' },
  note: { type: String },
  referenceNumber: { type: String },
  financeTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
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

const brokerSchema = new mongoose.Schema({
  brokerName: { type: String },
  accountNumber: { type: String },
  dpId: { type: String },
  clientCode: { type: String },
  linkedMobile: { type: String },
  openedDate: { type: Date },
  extraFields: { type: Map, of: String }, // expandable from admin
  notes: { type: String }
});

const studentSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true },
  email: { type: String, lowercase: true },
  city: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  referredBy: { type: String, default: 'self' },

  // Profile
  profileType: { type: String, enum: ['student', 'professional'], default: 'student' },
  studentDetail: { type: String },
  professionalDetail: { type: String },
  traderKnowledge: { type: String, enum: ['beginner', 'basic_knowledge', 'loss_making'], default: 'beginner' },

  // Query Info
  feeTold: { type: Number },
  discountTold: { type: Number },
  courseFeeDecided: { type: Number }, // actual fee after discount — used for tracking
  registrationDone: { type: Boolean, default: false },
  registrationAmount: { type: Number },
  conversionExpectation: { type: String, enum: ['poor', 'good', 'very_good'], default: 'good' },
  howReached: { type: String, enum: ['phone', 'office_visit', 'website_registration', 'meta_ad', 'instagram', 'whatsapp', 'referral', 'other'], default: 'phone' },
  howReachedOther: { type: String },
  visitCallDateTime: { type: Date },
  source: { type: String },
  remarks: { type: String },
  feeRemarks: { type: String }, // fee-pending specific remarks

  // Status
  status: { type: String, enum: ['lead', 'pending', 'converted', 'lost'], default: 'lead' },
  converted: { type: Boolean, default: false },
  convertedDate: { type: Date },

  // Course/Batch
  batch: { type: String },
  batchName: { type: String },
  courseType: { type: String, enum: ['live_batch', 'recorded', 'strategy', 'brokerage', 'other'], default: 'live_batch' },

  // Broker account
  brokerAccountOpened: { type: Boolean, default: false },
  brokerDetails: brokerSchema,

  // Financials
  totalFee: { type: Number },      // = courseFeeDecided (actual agreed fee)
  totalReceived: { type: Number, default: 0 },
  feePending: { type: Number, default: 0 },
  installments: [installmentSchema],

  // Follow ups
  followUps: [followUpSchema],

  // Dynamic fields from public form (admin-configured)
  dynamicFields: { type: Map, of: String },

  // Meta
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromPublicForm: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-calculate fee pending
studentSchema.pre('save', function (next) {
  if (this.installments && this.installments.length > 0) {
    this.totalReceived = this.installments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }
  if (this.totalFee != null) {
    this.feePending = (this.totalFee || 0) - (this.totalReceived || 0);
  }
  // courseFeeDecided sync
  if (this.courseFeeDecided && !this.totalFee) {
    this.totalFee = this.courseFeeDecided;
  }
  next();
});

studentSchema.index({ name: 'text', contact: 'text', email: 'text', city: 'text' });
studentSchema.index({ batchName: 1, status: 1 });

module.exports = mongoose.model('Student', studentSchema);
