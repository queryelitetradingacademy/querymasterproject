const mongoose = require('mongoose');

const taxDeductionSchema = new mongoose.Schema({
  financialYear: { type: String, required: true },
  section: { type: String, required: true }, // 80C, 80D, HRA, etc.
  description: { type: String },
  amount: { type: Number, required: true },
  maxLimit: { type: Number },
  proofDocument: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('TaxDeduction', taxDeductionSchema);
