const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Core
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String },

  // Book (which entity)
  book: {
    type: String,
    enum: ['personal', 'education_business', 'trading_business'],
    required: true
  },

  // Category (admin-configurable)
  category: { type: String },
  subcategory: { type: String },

  // Source/Expense head (admin-configurable)
  source: { type: String }, // for income
  expenseHead: { type: String }, // for expense

  // Payment
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'gpay', 'phonepe', 'paytm', 'razorpay', 'cheque', 'card', 'other'],
    default: 'upi'
  },
  paymentModeOther: { type: String },

  // Account
  account: { type: String }, // Which bank/wallet

  // Trading specific
  tradeType: {
    type: String,
    enum: ['intraday', 'swing', 'fno', 'lt_equity', 'mf', 'usdt', 'brokerage', 'other']
  },
  symbol: { type: String },
  buyPrice: { type: Number },
  sellPrice: { type: Number },
  quantity: { type: Number },
  brokerage: { type: Number },
  stt: { type: Number },
  netPnl: { type: Number },
  gainType: { type: String, enum: ['stcg', 'ltcg', 'speculative', 'non_speculative'] },

  // Tax
  tdsDeducted: { type: Number, default: 0 },
  gstApplicable: { type: Boolean, default: false },
  gstAmount: { type: Number },

  // Financial Year
  financialYear: { type: String }, // e.g. "2024-25"
  month: { type: Number }, // 1-12
  year: { type: Number },

  // Recurring
  isRecurring: { type: Boolean, default: false },
  recurringType: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },

  // Receipt
  receiptUrl: { type: String },

  // Reference
  referenceNumber: { type: String },
  notes: { type: String },

  // Link to student (if fee received)
  linkedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Auto-set FY and month/year
transactionSchema.pre('save', function (next) {
  const d = new Date(this.date);
  this.month = d.getMonth() + 1;
  this.year = d.getFullYear();
  // Indian FY: April (4) to March (3)
  const fyYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  this.financialYear = `${fyYear}-${String(fyYear + 1).slice(2)}`;
  next();
});

transactionSchema.index({ date: -1, book: 1, type: 1, financialYear: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
