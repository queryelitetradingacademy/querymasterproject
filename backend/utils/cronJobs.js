const cron = require('node-cron');
const Task = require('../models/Task');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Every 15 minutes — check task reminders
cron.schedule('*/15 * * * *', async () => {
  try {
    const now = new Date();
    const in15 = new Date(now.getTime() + 15 * 60000);

    const tasks = await Task.find({
      isActive: true,
      status: { $ne: 'done' },
      reminderEnabled: true,
      'reminders.sent': false,
      'reminders.enabled': true,
      'reminders.datetime': { $gte: now, $lte: in15 }
    }).populate('assignedTo');

    for (const task of tasks) {
      for (const reminder of task.reminders) {
        if (!reminder.sent && reminder.enabled && reminder.datetime >= now && reminder.datetime <= in15) {
          const user = task.assignedTo;
          if (user) {
            await Notification.create({
              user: user._id,
              title: `⏰ Task Reminder: ${task.title}`,
              message: `Your task "${task.title}" is due soon${task.dueDate ? ` on ${new Date(task.dueDate).toLocaleDateString('en-IN')}` : ''}.`,
              type: 'task_reminder',
              relatedTo: { segment: 'tasks', id: task._id },
              channels: reminder.channels
            });
          }
          reminder.sent = true;
        }
      }
      await task.save();
    }
  } catch (err) {
    console.error('Cron reminder error:', err.message);
  }
});

// Daily 9am — overdue task alerts
cron.schedule('0 9 * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const overdueTasks = await Task.find({
      isActive: true,
      status: { $nin: ['done', 'on_hold'] },
      dueDate: { $lt: new Date(), $gt: yesterday }
    }).populate('assignedTo');

    for (const task of overdueTasks) {
      if (task.assignedTo) {
        await Notification.create({
          user: task.assignedTo._id,
          title: `🚨 Overdue Task: ${task.title}`,
          message: `Task "${task.title}" was due on ${new Date(task.dueDate).toLocaleDateString('en-IN')} and is still pending.`,
          type: 'task_due',
          relatedTo: { segment: 'tasks', id: task._id },
          channels: ['inapp']
        });
      }
    }
  } catch (err) {
    console.error('Cron overdue error:', err.message);
  }
});

// Daily 10am — advance tax reminders (15th of Mar, Jun, Sep, Dec)
cron.schedule('0 10 * * *', async () => {
  try {
    const now = new Date();
    const taxDates = [
      { month: 5, day: 15, label: 'Q1 Advance Tax (15% due)' },
      { month: 8, day: 15, label: 'Q2 Advance Tax (45% due)' },
      { month: 11, day: 15, label: 'Q3 Advance Tax (75% due)' },
      { month: 2, day: 15, label: 'Q4 Advance Tax (100% due)' }
    ];

    for (const td of taxDates) {
      const daysUntil = Math.ceil((new Date(now.getFullYear(), td.month, td.day) - now) / 86400000);
      if ([30, 15, 7, 3, 1].includes(daysUntil)) {
        const admins = await User.find({ role: 'admin', isActive: true });
        for (const admin of admins) {
          await Notification.create({
            user: admin._id,
            title: `📅 ${td.label}`,
            message: `Advance tax deadline in ${daysUntil} day(s): ${td.label}`,
            type: 'tax_reminder',
            relatedTo: { segment: 'finance' },
            channels: ['inapp']
          });
        }
      }
    }
  } catch (err) {
    console.error('Cron tax reminder error:', err.message);
  }
});

console.log('✅ Cron jobs initialized');
