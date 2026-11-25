const { Payment, StudentFee, Student, Course } = require('../models');
const { generateReceiptNumber } = require('../utils/idGenerator');
const { generateReceiptPDFBuffer } = require('../services/pdfService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Record a fee payment
// @route POST /api/payments
const recordPayment = async (req, res) => {
  try {
    const { studentId, amount, paymentMode = 'Cash', transactionReference = '', installmentNumber, remarks = '' } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount greater than zero.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const feeRecord = await StudentFee.findOne({ studentId: student._id });
    if (!feeRecord) {
      return res.status(404).json({ success: false, message: 'Fee record not found for this student.' });
    }

    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      receiptNumber,
      studentId: student._id,
      studentFeeId: feeRecord._id,
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMode,
      transactionReference,
      installmentNumber: installmentNumber ? Number(installmentNumber) : undefined,
      remarks,
      receivedBy: req.user._id,
      receivedByName: req.user.name,
    });

    // Update fee record calculations
    feeRecord.totalPaid += paymentAmount;
    feeRecord.outstandingBalance = Math.max(0, feeRecord.finalFee - feeRecord.totalPaid);
    feeRecord.lastPaymentDate = new Date();

    if (feeRecord.outstandingBalance === 0) {
      feeRecord.paymentStatus = 'Paid';
    } else {
      feeRecord.paymentStatus = 'Partial';
    }

    // Update installment status if applicable
    if (installmentNumber && feeRecord.installmentPlan) {
      const inst = feeRecord.installmentPlan.find((i) => i.installmentNumber === Number(installmentNumber));
      if (inst) {
        inst.paidAmount = (inst.paidAmount || 0) + paymentAmount;
        if (inst.paidAmount >= inst.amount) {
          inst.status = 'Paid';
        } else {
          inst.status = 'Partial';
        }
        inst.paidDate = new Date();
      }
    }

    await feeRecord.save();

    await createNotification({
      roleTarget: 'all',
      title: 'Fee Payment Received',
      message: `Rs. ${paymentAmount.toLocaleString('en-IN')} received for ${student.name} (${student.studentId}) via ${paymentMode}. Receipt: ${receiptNumber}`,
      type: 'fee',
      link: `/students/${student._id}`,
      relatedEntityId: payment._id,
      relatedEntityType: 'Payment',
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RECORD_PAYMENT',
      module: 'PAYMENTS',
      targetId: payment._id.toString(),
      description: `Recorded payment ${receiptNumber} of Rs. ${paymentAmount} for student ${student.studentId}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: `Payment of Rs. ${paymentAmount.toLocaleString('en-IN')} recorded successfully. Receipt No: ${receiptNumber}`,
      data: {
        payment,
        feeSummary: {
          finalFee: feeRecord.finalFee,
          totalPaid: feeRecord.totalPaid,
          outstandingBalance: feeRecord.outstandingBalance,
          paymentStatus: feeRecord.paymentStatus,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Generate & download official PDF receipt
// @route GET /api/payments/:id/receipt-pdf
const downloadReceiptPdf = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const student = await Student.findById(payment.studentId);
    const feeRecord = await StudentFee.findById(payment.studentFeeId);

    const pdfBuffer = await generateReceiptPDFBuffer({
      payment,
      student: student || { name: 'Student', studentId: 'WH-XXXX', mobile: '' },
      studentFee: feeRecord || { totalCourseFee: payment.amount, finalFee: payment.amount, totalPaid: payment.amount, outstandingBalance: 0 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${payment.receiptNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get payment history
// @route GET /api/payments
const getPayments = async (req, res) => {
  try {
    const { studentId, paymentMode, startDate, endDate } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (paymentMode) query.paymentMode = paymentMode;

    if (startDate && endDate) {
      query.paymentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'studentId name mobile courseName')
      .populate('receivedBy', 'name staffIdentifier')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  recordPayment,
  downloadReceiptPdf,
  getPayments,
};
