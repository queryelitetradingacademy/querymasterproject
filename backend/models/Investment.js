const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['stock', 'mutual_fund', 'crypto', 'usdt', 'fd', 'ppf', 'epf', 'nps', 'real_estate', 'gold', 'other'],
    required: true
  },
  symbol: { type: String },
  units: { type: Number },
  buyPrice: { type: Number },
  currentPrice: { type: Number },
  investedAmount: { type: Number },
  currentValue: { type: Number },
  gainLoss: { type: Number },
  gainLossPercent: { type: Number },
  purchaseDate: { type: Date },
  notes: { type: String },
  book: { type: String, enum: ['personal', 'education_business', 'trading_business'], default: 'personal' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);
