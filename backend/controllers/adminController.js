const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');

// User management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePermissions = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions: req.body.permissions },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// System settings
exports.getSettings = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const settings = await SystemSetting.find(query).sort({ category: 1, label: 1 });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const setting = await SystemSetting.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, upsert: false }
    );
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.createSetting = async (req, res) => {
  try {
    const setting = await SystemSetting.create({ ...req.body, updatedBy: req.user._id });
    res.status(201).json({ success: true, data: setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteSetting = async (req, res) => {
  try {
    await SystemSetting.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Setting deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSettingValue = async (req, res) => {
  try {
    const setting = await SystemSetting.findById(req.params.id);
    if (!setting) return res.status(404).json({ success: false, message: 'Setting not found' });
    setting.values.push(req.body);
    await setting.save();
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.removeSettingValue = async (req, res) => {
  try {
    const setting = await SystemSetting.findById(req.params.id);
    setting.values = setting.values.filter(v => v._id.toString() !== req.params.valueId);
    await setting.save();
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Task = require('../models/Task');
    const Transaction = require('../models/Transaction');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalStudents, pendingQueries, convertedStudents,
      totalTasks, overdueTasks, todayTasks,
      monthIncome, monthExpense
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Student.countDocuments({ isActive: true, status: 'pending' }),
      Student.countDocuments({ isActive: true, status: 'converted' }),
      Task.countDocuments({ isActive: true, status: { $ne: 'done' } }),
      Task.countDocuments({ isActive: true, status: { $ne: 'done' }, dueDate: { $lt: now } }),
      Task.countDocuments({ isActive: true, dueDate: { $gte: startOfMonth, $lte: endOfMonth } }),
      Transaction.aggregate([{ $match: { isActive: true, type: 'income', date: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { isActive: true, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    res.json({
      success: true, data: {
        queries: { total: totalStudents, pending: pendingQueries, converted: convertedStudents },
        tasks: { total: totalTasks, overdue: overdueTasks, thisMonth: todayTasks },
        finance: { income: monthIncome[0]?.total || 0, expense: monthExpense[0]?.total || 0, balance: (monthIncome[0]?.total || 0) - (monthExpense[0]?.total || 0) }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
