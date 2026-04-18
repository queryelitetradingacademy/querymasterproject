const ExcelJS = require('exceljs');
const Student = require('../models/Student');
const Task = require('../models/Task');
const Transaction = require('../models/Transaction');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const styleHeader = (ws, row, color = '1e3a5f') => {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  ws.getRow(row.number).height = 20;
};

const styleDataRow = (ws, rowNum, isEven) => {
  const row = ws.getRow(rowNum);
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF0F4F8' : 'FFFFFFFF' } };
    cell.border = { top: { style: 'hair' }, bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
};

const highlightCell = (cell, color) => {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
};

// --- QUERIES EXPORT ---
const buildQuerySheet = async (ws, students, sheetTitle) => {
  ws.mergeCells('A1:T1');
  const titleCell = ws.getCell('A1');
  titleCell.value = sheetTitle;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = [
    'S.No', 'Name', 'Contact', 'Email', 'City', 'Gender', 'Profile',
    'Trader Level', 'Referred By', 'Source', 'Fee Told', 'Discount',
    'Reg Done', 'Reg Amount', 'How Reached', 'Visit/Call Date',
    'Conversion Expectation', 'Status', 'Converted', 'Remarks'
  ];
  const headerRow = ws.addRow(headers);
  styleHeader(ws, headerRow);

  ws.columns = [
    { width: 6 }, { width: 22 }, { width: 16 }, { width: 24 }, { width: 14 },
    { width: 10 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 16 },
    { width: 12 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 18 },
    { width: 20 }, { width: 22 }, { width: 12 }, { width: 12 }, { width: 28 }
  ];

  students.forEach((s, i) => {
    const row = ws.addRow([
      i + 1, s.name, s.contact, s.email || '', s.city || '',
      s.gender || '', s.profileType || '', s.traderKnowledge || '',
      s.referredBy || 'self', s.source || '',
      s.feeTold || 0, s.discountTold || 0,
      s.registrationDone ? 'Yes' : 'No', s.registrationAmount || 0,
      s.howReached || '', s.visitCallDateTime ? new Date(s.visitCallDateTime).toLocaleString('en-IN') : '',
      s.conversionExpectation || '', s.status || '',
      s.converted ? 'Yes' : 'No', s.remarks || ''
    ]);
    styleDataRow(ws, row.number, i % 2 === 0);
    // Highlight very_good conversion
    if (s.conversionExpectation === 'very_good') {
      highlightCell(ws.getCell(`Q${row.number}`), 'C8F7C5');
      ws.getCell(`Q${row.number}`).font = { bold: true, color: { argb: 'FF155724' } };
    }
    if (s.converted) {
      highlightCell(ws.getCell(`S${row.number}`), 'C8F7C5');
    }
  });

  // Freeze top rows
  ws.views = [{ state: 'frozen', ySplit: 2 }];
  ws.autoFilter = { from: 'A2', to: `T2` };
};

const buildConfirmedSheet = async (ws, students) => {
  ws.mergeCells('A1:M1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Confirmed Students — Fee Tracker';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = ['S.No', 'Name', 'Contact', 'City', 'Batch/Course', 'Total Fee', 'Inst. 1', 'Inst. 2', 'Inst. 3', 'Total Received', 'Fee Pending', 'Converted Date', 'Remarks'];
  const headerRow = ws.addRow(headers);
  styleHeader(ws, headerRow, '155724');
  ws.columns = [{ width: 6 }, { width: 22 }, { width: 16 }, { width: 14 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 18 }, { width: 28 }];

  students.forEach((s, i) => {
    const insts = s.installments || [];
    const row = ws.addRow([
      i + 1, s.name, s.contact, s.city || '', s.batchName || s.courseType || '',
      s.totalFee || 0, insts[0]?.amount || 0, insts[1]?.amount || 0, insts[2]?.amount || 0,
      s.totalReceived || 0, s.feePending || 0,
      s.convertedDate ? new Date(s.convertedDate).toLocaleDateString('en-IN') : '', s.remarks || ''
    ]);
    styleDataRow(ws, row.number, i % 2 === 0);
    if (s.feePending > 0) highlightCell(ws.getCell(`K${row.number}`), 'FFE0E0');
  });
  ws.views = [{ state: 'frozen', ySplit: 2 }];
};

const buildPendingSheet = async (ws, students) => {
  ws.mergeCells('A1:K1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Pending Queries — Follow-Up Tracker';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = ['S.No', 'Name', 'Contact', 'City', 'Fee Told', 'Follow-Up 1', 'Status 1', 'Follow-Up 2', 'Status 2', 'Follow-Up 3', 'Status 3'];
  const headerRow = ws.addRow(headers);
  styleHeader(ws, headerRow, '7B3F00');
  ws.columns = [{ width: 6 }, { width: 22 }, { width: 16 }, { width: 14 }, { width: 12 }, { width: 22 }, { width: 16 }, { width: 22 }, { width: 16 }, { width: 22 }, { width: 16 }];

  students.forEach((s, i) => {
    const fu = s.followUps || [];
    const row = ws.addRow([
      i + 1, s.name, s.contact, s.city || '', s.feeTold || 0,
      fu[0] ? `${fu[0].note || ''} (${fu[0].date ? new Date(fu[0].date).toLocaleDateString('en-IN') : ''})` : '',
      fu[0]?.status || '',
      fu[1] ? `${fu[1].note || ''} (${fu[1].date ? new Date(fu[1].date).toLocaleDateString('en-IN') : ''})` : '',
      fu[1]?.status || '',
      fu[2] ? `${fu[2].note || ''} (${fu[2].date ? new Date(fu[2].date).toLocaleDateString('en-IN') : ''})` : '',
      fu[2]?.status || ''
    ]);
    styleDataRow(ws, row.number, i % 2 === 0);
  });
  ws.views = [{ state: 'frozen', ySplit: 2 }];
};

// --- FINANCE EXPORT ---
const buildFinanceSheet = async (ws, transactions, title) => {
  ws.mergeCells('A1:L1');
  const titleCell = ws.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1e3a5f' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  const headers = ['S.No', 'Date', 'Type', 'Book', 'Category', 'Source/Head', 'Amount (₹)', 'Payment Mode', 'Account', 'TDS', 'Reference', 'Notes'];
  const headerRow = ws.addRow(headers);
  styleHeader(ws, headerRow, '0d3b6e');
  ws.columns = [{ width: 6 }, { width: 14 }, { width: 10 }, { width: 20 }, { width: 18 }, { width: 22 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 10 }, { width: 18 }, { width: 28 }];

  let totalIncome = 0, totalExpense = 0;
  transactions.forEach((t, i) => {
    const row = ws.addRow([
      i + 1, new Date(t.date).toLocaleDateString('en-IN'),
      t.type, t.book, t.category || '', t.source || t.expenseHead || '',
      t.amount, t.paymentMode || '', t.account || '',
      t.tdsDeducted || 0, t.referenceNumber || '', t.notes || ''
    ]);
    styleDataRow(ws, row.number, i % 2 === 0);
    const amtCell = ws.getCell(`G${row.number}`);
    if (t.type === 'income') {
      totalIncome += t.amount;
      amtCell.font = { color: { argb: 'FF155724' }, bold: true };
    } else {
      totalExpense += t.amount;
      amtCell.font = { color: { argb: 'FF721C24' }, bold: true };
    }
  });

  // Summary row
  ws.addRow([]);
  const sumRow = ws.addRow(['', '', '', '', '', 'TOTAL INCOME', totalIncome, '', '', '', '', '']);
  styleHeader(ws, sumRow, '155724');
  const expRow = ws.addRow(['', '', '', '', '', 'TOTAL EXPENSE', totalExpense, '', '', '', '', '']);
  styleHeader(ws, expRow, '721C24');
  const balRow = ws.addRow(['', '', '', '', '', 'BALANCE', totalIncome - totalExpense, '', '', '', '', '']);
  styleHeader(ws, balRow, '0d3b6e');
  ws.views = [{ state: 'frozen', ySplit: 2 }];
  ws.autoFilter = { from: 'A2', to: 'L2' };
};

// EXPORT HANDLERS
exports.exportQueries = async (req, res) => {
  try {
    const { month, year, type = 'monthly' } = req.query;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'QueryMaster';
    wb.created = new Date();

    if (type === 'yearly') {
      for (let m = 0; m < 12; m++) {
        const d1 = new Date(year, m, 1), d2 = new Date(year, m + 1, 0);
        const students = await Student.find({ isActive: true, createdAt: { $gte: d1, $lte: d2 } }).lean();
        const ws = wb.addWorksheet(MONTHS[m]);
        await buildQuerySheet(ws, students, `Queries — ${MONTHS[m]} ${year}`);
      }
      // Consolidated
      const allStudents = await Student.find({ isActive: true, createdAt: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) } }).lean();
      const wsAll = wb.addWorksheet('All Queries');
      await buildQuerySheet(wsAll, allStudents, `All Queries — ${year}`);
      const wsConf = wb.addWorksheet('Confirmed');
      await buildConfirmedSheet(wsConf, allStudents.filter(s => s.converted));
      const wsPend = wb.addWorksheet('Pending');
      await buildPendingSheet(wsPend, allStudents.filter(s => s.status === 'pending'));
    } else {
      const d1 = new Date(year, month - 1, 1), d2 = new Date(year, month, 0);
      const students = await Student.find({ isActive: true, createdAt: { $gte: d1, $lte: d2 } }).lean();
      const ws = wb.addWorksheet('Queries');
      await buildQuerySheet(ws, students, `Queries — ${MONTHS[month - 1]} ${year}`);
      const wsConf = wb.addWorksheet('Confirmed');
      await buildConfirmedSheet(wsConf, students.filter(s => s.converted));
      const wsPend = wb.addWorksheet('Pending');
      await buildPendingSheet(wsPend, students.filter(s => s.status === 'pending'));
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Queries_${type}_${year}${month ? '_' + month : ''}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportFinance = async (req, res) => {
  try {
    const { month, year, type = 'monthly', book } = req.query;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'QueryMaster';

    const books = book ? [book] : ['personal', 'education_business', 'trading_business'];

    if (type === 'yearly') {
      for (const b of books) {
        for (let m = 0; m < 12; m++) {
          const d1 = new Date(year, m, 1), d2 = new Date(year, m + 1, 0);
          const txns = await Transaction.find({ isActive: true, book: b, date: { $gte: d1, $lte: d2 } }).lean();
          if (txns.length) {
            const ws = wb.addWorksheet(`${b}_${MONTHS[m]}`);
            await buildFinanceSheet(ws, txns, `${b} — ${MONTHS[m]} ${year}`);
          }
        }
        const allTxns = await Transaction.find({ isActive: true, book: b, year: Number(year) }).lean();
        const ws = wb.addWorksheet(`${b}_Summary`);
        await buildFinanceSheet(ws, allTxns, `${b} — Full Year ${year}`);
      }
    } else {
      for (const b of books) {
        const d1 = new Date(year, month - 1, 1), d2 = new Date(year, month, 0);
        const txns = await Transaction.find({ isActive: true, book: b, date: { $gte: d1, $lte: d2 } }).lean();
        const ws = wb.addWorksheet(b);
        await buildFinanceSheet(ws, txns, `${b} — ${MONTHS[month - 1]} ${year}`);
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Finance_${type}_${year}${month ? '_' + month : ''}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportTasks = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tasks');

    let query = { isActive: true };
    if (status) query.status = status;
    if (month && year) {
      query.createdAt = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    }
    const tasks = await Task.find(query).populate('assignedTo', 'name').lean();

    ws.mergeCells('A1:J1');
    ws.getCell('A1').value = 'Task Report';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = ['S.No', 'Title', 'Category', 'Priority', 'Status', 'Due Date', 'Assigned To', 'Subtasks', 'Linked To', 'Created'];
    const headerRow = ws.addRow(headers);
    styleHeader(ws, headerRow);
    ws.columns = [{ width: 6 }, { width: 30 }, { width: 18 }, { width: 10 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 10 }, { width: 20 }, { width: 16 }];

    tasks.forEach((t, i) => {
      const row = ws.addRow([
        i + 1, t.title, t.category || '', t.priority || '', t.status,
        t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '',
        t.assignedTo?.name || '', t.subtasks?.length || 0,
        t.linkedSegment !== 'none' ? t.linkedSegment : '',
        new Date(t.createdAt).toLocaleDateString('en-IN')
      ]);
      styleDataRow(ws, row.number, i % 2 === 0);
      if (t.status === 'done') ws.getCell(`E${row.number}`).font = { color: { argb: 'FF155724' } };
      if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done') {
        highlightCell(ws.getCell(`F${row.number}`), 'FFE0E0');
      }
    });

    ws.views = [{ state: 'frozen', ySplit: 2 }];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Tasks.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
