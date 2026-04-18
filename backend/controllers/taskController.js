const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 50,
      assignedTo, fromDate, toDate, linkedSegment } = req.query;

    let query = { isActive: true };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (linkedSegment) query.linkedSegment = linkedSegment;
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) query.dueDate.$gte = new Date(fromDate);
      if (toDate) query.dueDate.$lte = new Date(toDate);
    }
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .populate('linkedStudent', 'name contact')
      .sort({ dueDate: 1, priority: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: tasks, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('linkedStudent', 'name contact city')
      .populate('activityLog.by', 'name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id, assignedTo: req.body.assignedTo || req.user._id });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Log activity
    const changes = [];
    if (req.body.status && req.body.status !== task.status) {
      changes.push({ action: 'Status changed', field: 'status', oldValue: task.status, newValue: req.body.status, by: req.user._id });
    }
    if (req.body.priority && req.body.priority !== task.priority) {
      changes.push({ action: 'Priority changed', field: 'priority', oldValue: task.priority, newValue: req.body.priority, by: req.user._id });
    }

    Object.assign(task, req.body);
    if (req.body.status === 'done') task.completedAt = new Date();
    task.activityLog.push(...changes);
    await task.save();

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });
    Object.assign(subtask, req.body);
    if (req.body.status === 'done') subtask.completedAt = new Date();
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, todo, inProgress, onHold, done, overdue] = await Promise.all([
      Task.countDocuments({ isActive: true }),
      Task.countDocuments({ isActive: true, status: 'todo' }),
      Task.countDocuments({ isActive: true, status: 'in_progress' }),
      Task.countDocuments({ isActive: true, status: 'on_hold' }),
      Task.countDocuments({ isActive: true, status: 'done' }),
      Task.countDocuments({ isActive: true, status: { $ne: 'done' }, dueDate: { $lt: new Date() } })
    ]);
    res.json({ success: true, data: { total, todo, inProgress, onHold, done, overdue } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
