const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
    },
    studentUniqueId: {
      type: String, // e.g. WH-2026-0001
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    courseFee: {
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
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer'],
      default: 'Cash',
    },
    transactionRef: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Pending Verification', 'Cancelled', 'Refunded'],
      default: 'Confirmed',
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    studentLoginCredentials: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      loginId: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
      generatedPassword: {
        type: String,
        default: '',
      },
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

admissionSchema.index({ admissionDate: -1 });

module.exports = mongoose.model('Admission', admissionSchema);
