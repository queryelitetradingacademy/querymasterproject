const Transaction = require('../models/Transaction');
const Investment = require('../models/Investment');
const TaxDeduction = require('../models/TaxDeduction');

// Transactions
exports.getTransactions = async (req, res) => {
  try {
    const { book, type, category, financialYear, month, year, page = 1, limit = 50,
      fromDate, toDate, search, tradeType } = req.query;

    let query = { isActive: true };
    if (book) query.book = book;
    if (type) query.type = type;
    if (category) query.category = category;
    if (financialYear) query.financialYear = financialYear;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (tradeType) query.tradeType = tradeType;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    if (search) query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { source: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('createdBy', 'name')
      .populate('linkedStudent', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: transactions, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const tx = await Transaction.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Summary stats
exports.getSummary = async (req, res) => {
  try {
    const { book, financialYear, month, year } = req.query;
    let match = { isActive: true };
    if (book) match.book = book;
    if (financialYear) match.financialYear = financialYear;
    if (month) match.month = Number(month);
    if (year) match.year = Number(year);

    const pipeline = [
      { $match: match },
      { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ];

    const result = await Transaction.aggregate(pipeline);
    const income = result.find(r => r._id === 'income') || { total: 0, count: 0 };
    const expense = result.find(r => r._id === 'expense') || { total: 0, count: 0 };

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Monthly trend
    const monthlyTrend = await Transaction.aggregate([
      { $match: { isActive: true, ...(book ? { book } : {}), ...(financialYear ? { financialYear } : {}) } },
      { $group: { _id: { month: '$month', year: '$year', type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        income: income.total,
        expense: expense.total,
        balance: income.total - expense.total,
        incomeCount: income.count,
        expenseCount: expense.count,
        categoryBreakdown,
        monthlyTrend
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Investments
exports.getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ isActive: true }).sort({ type: 1 });
    const totalInvested = investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
    const totalCurrent = investments.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);
    res.json({ success: true, data: investments, totalInvested, totalCurrent, totalGainLoss: totalCurrent - totalInvested });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createInvestment = async (req, res) => {
  try {
    const inv = await Investment.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: inv });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateInvestment = async (req, res) => {
  try {
    const inv = await Investment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: inv });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteInvestment = async (req, res) => {
  try {
    await Investment.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Investment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Tax Deductions
exports.getTaxDeductions = async (req, res) => {
  try {
    const { financialYear } = req.query;
    const query = financialYear ? { financialYear } : {};
    const deductions = await TaxDeduction.find(query).sort({ section: 1 });
    const totalDeductions = deductions.reduce((s, d) => s + (d.amount || 0), 0);
    res.json({ success: true, data: deductions, totalDeductions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTaxDeduction = async (req, res) => {
  try {
    const ded = await TaxDeduction.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: ded });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTaxDeduction = async (req, res) => {
  try {
    const ded = await TaxDeduction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: ded });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTaxDeduction = async (req, res) => {
  try {
    await TaxDeduction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deduction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Net worth
exports.getNetWorth = async (req, res) => {
  try {
    const investments = await Investment.find({ isActive: true });
    const totalAssets = investments.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);

    // Get liability transactions
    const liabilities = await Transaction.aggregate([
      { $match: { isActive: true, category: 'liability' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalLiabilities = liabilities[0]?.total || 0;

    res.json({ success: true, data: { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
