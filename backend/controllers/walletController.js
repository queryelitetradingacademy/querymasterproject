const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Map payment modes to wallet keys
const modeToWalletKey = (mode) => {
  const map = { gpay: 'gpay', phonepe: 'phonepe', paytm: 'paytm', cash: 'cash', upi: 'upi', bank_transfer: 'bank', razorpay: 'razorpay', card: 'card', usdt: 'usdt' };
  return map[mode] || mode;
};

exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ isActive: true }).sort({ name: 1 });

    // Calculate current balance for each wallet
    const walletsWithBalance = await Promise.all(wallets.map(async (wallet) => {
      const walletKey = wallet.key;

      // Sum all income transactions with this payment mode
      const incomeAgg = await Transaction.aggregate([
        { $match: { isActive: true, type: 'income', paymentMode: walletKey } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Sum all expense transactions with this payment mode
      const expenseAgg = await Transaction.aggregate([
        { $match: { isActive: true, type: 'expense', paymentMode: walletKey } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const income = incomeAgg[0]?.total || 0;
      const expense = expenseAgg[0]?.total || 0;
      const currentBalance = (wallet.openingBalance || 0) + income - expense;

      return {
        ...wallet.toObject(),
        income,
        expense,
        currentBalance
      };
    }));

    res.json({ success: true, data: walletsWithBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createWallet = async (req, res) => {
  try {
    const wallet = await Wallet.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: wallet });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: wallet });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteWallet = async (req, res) => {
  try {
    await Wallet.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Wallet deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
