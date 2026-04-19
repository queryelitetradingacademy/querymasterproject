const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

exports.getStudents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc',
      traderKnowledge, conversionExpectation, howReached, fromDate, toDate, batchName } = req.query;

    let query = { isActive: true };
    if (status) query.status = status;
    if (traderKnowledge) query.traderKnowledge = traderKnowledge;
    if (conversionExpectation) query.conversionExpectation = conversionExpectation;
    if (howReached) query.howReached = howReached;
    if (batchName) query.batchName = batchName;
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

// Batch summary — total/received/pending per batch
exports.getBatchSummary = async (req, res) => {
  try {
    const summary = await Student.aggregate([
      { $match: { isActive: true, status: 'converted' } },
      {
        $group: {
          _id: '$batchName',
          totalStudents: { $sum: 1 },
          totalFee: { $sum: '$totalFee' },
          totalReceived: { $sum: '$totalReceived' },
          totalPending: { $sum: '$feePending' },
          students: { $push: { _id: '$_id', name: '$name', contact: '$contact', totalFee: '$totalFee', totalReceived: '$totalReceived', feePending: '$feePending', feeRemarks: '$feeRemarks', brokerAccountOpened: '$brokerAccountOpened' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, data: summary });
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
    // Sync courseFeeDecided → totalFee
    if (data.courseFeeDecided) data.totalFee = data.courseFeeDecided;

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
    if (updateData.courseFeeDecided) updateData.totalFee = updateData.courseFeeDecided;

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

// ADD installment — auto-creates finance transaction
exports.addInstallment = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const instNumber = student.installments.length + 1;

    // Create finance transaction first
    const tx = await Transaction.create({
      type: 'income',
      amount: Number(req.body.amount),
      date: req.body.date || new Date(),
      book: 'education_business',
      category: 'course_fees',
      source: 'course_fees',
      description: `Installment ${instNumber} — ${student.name} (${student.batchName || 'No Batch'})`,
      paymentMode: req.body.mode || 'upi',
      notes: `Student: ${student.name} | Contact: ${student.contact} | Batch: ${student.batchName || '-'} | Inst #${instNumber}. ${req.body.note || ''}`.trim(),
      linkedStudent: student._id,
      referenceNumber: req.body.referenceNumber || '',
      createdBy: req.user?._id
    });

    student.installments.push({
      ...req.body,
      number: instNumber,
      financeTransactionId: tx._id
    });
    await student.save();

    res.json({ success: true, data: student, message: `Installment ${instNumber} added & auto-recorded in Finance ✅` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// UPDATE installment — syncs finance transaction
exports.updateInstallment = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const inst = student.installments.id(req.params.instId);
    if (!inst) return res.status(404).json({ success: false, message: 'Installment not found' });

    // Update linked finance transaction
    if (inst.financeTransactionId) {
      await Transaction.findByIdAndUpdate(inst.financeTransactionId, {
        amount: Number(req.body.amount) || inst.amount,
        date: req.body.date || inst.date,
        paymentMode: req.body.mode || inst.mode,
        notes: `[UPDATED] Student: ${student.name} | Batch: ${student.batchName || '-'} | Inst #${inst.number}. ${req.body.note || ''}`.trim()
      });
    }

    Object.assign(inst, req.body);
    await student.save();
    res.json({ success: true, data: student, message: 'Installment updated & Finance synced ✅' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE installment — removes finance transaction
exports.deleteInstallment = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const inst = student.installments.id(req.params.instId);
    if (!inst) return res.status(404).json({ success: false, message: 'Installment not found' });

    // Remove linked finance transaction
    if (inst.financeTransactionId) {
      await Transaction.findByIdAndUpdate(inst.financeTransactionId, { isActive: false });
    }

    student.installments.pull(req.params.instId);
    // Renumber remaining installments
    student.installments.forEach((inst, i) => { inst.number = i + 1; });
    await student.save();

    res.json({ success: true, data: student, message: 'Installment deleted & Finance updated ✅' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Add follow-up
exports.addFollowUp = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.followUps.push({ ...req.body, number: student.followUps.length + 1, doneBy: req.user._id });

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

// Update broker details
exports.updateBroker = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { brokerAccountOpened: req.body.brokerAccountOpened, brokerDetails: req.body.brokerDetails },
      { new: true }
    );
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Public form
exports.publicFormSubmit = async (req, res) => {
  try {
    // Separate known fields from dynamic fields
    const knownFields = ['name', 'contact', 'email', 'city', 'remarks', 'howReached'];
    const dynamicFields = {};
    const mainData = {};

    Object.keys(req.body).forEach(key => {
      if (knownFields.includes(key)) {
        mainData[key] = req.body[key];
      } else {
        dynamicFields[key] = req.body[key];
      }
    });

    const student = await Student.create({
      ...mainData,
      dynamicFields,
      fromPublicForm: true,
      status: 'lead',
      howReached: 'website_registration'
    });
    res.status(201).json({ success: true, message: 'Query submitted successfully! We will contact you soon.' });
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
