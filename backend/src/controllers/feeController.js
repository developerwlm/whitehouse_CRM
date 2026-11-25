const { StudentFee, Student, Payment, Course } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Get student fee details
// @route GET /api/fees/student/:studentId
const getStudentFee = async (req, res) => {
  try {
    const { studentId } = req.params;
    let feeRecord = await StudentFee.findOne({ studentId }).populate('courseId', 'name courseCode fee');

    if (!feeRecord) {
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      const course = await Course.findById(student.courseId);
      const totalFee = course ? course.fee : 25000;

      feeRecord = await StudentFee.create({
        studentId: student._id,
        courseId: student.courseId,
        totalCourseFee: totalFee,
        discount: 0,
        finalFee: totalFee,
        advancePaid: 0,
        totalPaid: 0,
        outstandingBalance: totalFee,
        paymentStatus: 'Pending',
        installmentPlan: [
          {
            installmentNumber: 1,
            title: 'Full Course Fee',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            amount: totalFee,
            paidAmount: 0,
            status: 'Pending',
          },
        ],
      });
    }

    const payments = await Payment.find({ studentId }).sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        ...feeRecord.toObject(),
        payments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get pending fee reminders list
// @route GET /api/fees/pending-reminders
const getPendingFeeReminders = async (req, res) => {
  try {
    const pendingFees = await StudentFee.find({
      outstandingBalance: { $gt: 0 },
    })
      .populate('studentId', 'studentId name mobile email batchName courseName')
      .populate('courseId', 'name');

    res.json({
      success: true,
      count: pendingFees.length,
      data: pendingFees,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Send fee reminder notification to student
// @route POST /api/fees/send-reminder
const sendFeeReminder = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const fee = await StudentFee.findOne({ studentId });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    await createNotification({
      recipientId: student.userId || null,
      title: 'Fee Payment Reminder',
      message: `Dear ${student.name}, a payment of Rs. ${fee.outstandingBalance.toLocaleString('en-IN')} is outstanding towards your course fees. Please remit at your earliest convenience.`,
      type: 'fee',
      link: `/students/${student._id}`,
      relatedEntityId: fee._id,
      relatedEntityType: 'StudentFee',
    });

    res.json({ success: true, message: `Fee payment reminder sent to ${student.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudentFee,
  getPendingFeeReminders,
  sendFeeReminder,
};
