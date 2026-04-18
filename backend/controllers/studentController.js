const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

exports.getStudents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc',
      traderKnowledge, conversionExpectation, howReached, fromDate, toDate } = req.query;

    let query = { isActive: true };
    if (status) query.status = status;
    if (traderKnowledge) query.traderKnowledge = traderKnowledge;
    if (conversionExpectation) query.conversionExpectation = conversionExpectation;
    if (howReached) query.howReached = howReached;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('followUps.doneBy', 'name');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user?._id };
    // STATUS LOGIC:
    // Public form → always lead (fresh unknown inquiry)
    // Team creates + converted=true → confirmed
    // Team creates + converted=false → pending (team is actively working)
    if (data.fromPublicForm) {
      data.status = 'lead';
    } else if (data.converted) {
      data.status = 'converted';
      data.convertedDate = new Date();
    } else {
      data.status = 'pending';
    }
    const student = await Student.create(data);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const existing = await Student.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

    const updateData = { ...req.body };

    if (updateData.converted === true) {
      updateData.status = 'converted';
      updateData.convertedDate = updateData.convertedDate || new Date();
    } else if (updateData.converted === false && existing.converted === true) {
      updateData.status = 'pending';
    } else if (!updateData.status) {
      delete updateData.status;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add installment — AUTO creates Finance transaction
exports.addInstallment = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const instNumber = student.installments.length + 1;
    student.installments.push({ ...req.body, number: instNumber });
    await student.save();

    // AUTO-CREATE Finance transaction
    await Transaction.create({
      type: 'income',
      amount: Number(req.body.amount),
      date: req.body.date || new Date(),
      book: 'education_business',
      category: 'course_fees',
      source: 'course_fees',
      description: `Fee Installment ${instNumber} — ${student.name}`,
      paymentMode: req.body.mode || 'upi',
      notes: `Auto from installment. Student: ${student.name} (${student.contact}). ${req.body.note || ''}`.trim(),
      linkedStudent: student._id,
      createdBy: req.user?._id
    });

    res.json({
      success: true,
      data: student,
      message: `Installment added & ₹${req.body.amount} auto-recorded in Finance`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Add follow-up — auto status update
exports.addFollowUp = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.followUps.push({
      ...req.body,
      number: student.followUps.length + 1,
      doneBy: req.user._id
    });

    // Auto-convert or auto-lose based on follow-up status
    if (req.body.status === 'converted') {
      student.converted = true;
      student.status = 'converted';
      student.convertedDate = new Date();
    } else if (req.body.status === 'lost') {
      student.status = 'lost';
    }

    await student.save();
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Public form — always lead
exports.publicFormSubmit = async (req, res) => {
  try {
    const student = await Student.create({ ...req.body, fromPublicForm: true, status: 'lead' });
    res.status(201).json({
      success: true,
      message: 'Query submitted successfully! We will contact you soon.',
      data: { id: student._id }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, leads, pending, converted, lost, veryGood] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Student.countDocuments({ isActive: true, status: 'lead' }),
      Student.countDocuments({ isActive: true, status: 'pending' }),
      Student.countDocuments({ isActive: true, status: 'converted' }),
      Student.countDocuments({ isActive: true, status: 'lost' }),
      Student.countDocuments({ isActive: true, conversionExpectation: 'very_good' })
    ]);
    res.json({ success: true, data: { total, leads, pending, converted, lost, veryGood } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
