const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  name: { type: String, required: true },       // GPay, PhonePe, Cash, HDFC, etc.
  key: { type: String, required: true, unique: true }, // gpay, phonepe, cash, hdfc_bank
  type: { type: String, enum: ['upi', 'cash', 'bank', 'card', 'crypto', 'other'], default: 'upi' },
  openingBalance: { type: Number, default: 0 },
  openingDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '💳' },
  notes: { type: String },
  book: { type: String, enum: ['personal', 'education_business', 'trading_business', 'all'], default: 'all' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
