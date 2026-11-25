const mongoose = require('mongoose');

const installmentItemSchema = new mongoose.Schema({
  installmentNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
    default: 'Pending',
  },
  paidDate: Date,
});

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    totalCourseFee: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalFee: {
      type: Number,
      required: true,
    },
    advancePaid: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending', 'Overdue'],
      default: 'Pending',
      index: true,
    },
    installmentPlan: [installmentItemSchema],
    lastPaymentDate: {
      type: Date,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studentFeeSchema.methods.recalculate = function () {
  this.finalFee = Math.max(0, this.totalCourseFee - (this.discount || 0));
  this.outstandingBalance = Math.max(0, this.finalFee - this.totalPaid);
  if (this.outstandingBalance === 0 && this.finalFee > 0) {
    this.paymentStatus = 'Paid';
  } else if (this.totalPaid > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Pending';
  }
};

module.exports = mongoose.model('StudentFee', studentFeeSchema);
