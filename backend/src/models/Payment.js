const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFee',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Payment amount must be greater than zero'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer'],
      required: true,
      default: 'UPI',
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    installmentNumber: {
      type: Number,
    },
    remarks: {
      type: String,
      default: '',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receivedByName: {
      type: String,
    },
    receiptPdfPath: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ studentId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
