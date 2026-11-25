const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
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
    studentUniqueId: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
      required: true,
    },
    grade: {
      type: String,
      enum: ['Distinction', 'First Class', 'Second Class', 'Pass'],
      default: 'First Class',
    },
    // Workflow tracking
    trainerRecommendation: {
      isRecommended: { type: Boolean, default: false },
      recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      recommendedByName: String,
      recommendedAt: Date,
      remarks: String,
    },
    adminApprovalStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'],
      default: 'Draft',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    eligibilitySnapshot: {
      attendancePercent: Number,
      attendancePassed: Boolean,
      assignmentPercent: Number,
      assignmentPassed: Boolean,
      examAveragePercent: Number,
      examPassed: Boolean,
      feeCleared: Boolean,
      allRequirementsMet: Boolean,
    },
    verificationHash: {
      type: String,
      required: true,
      unique: true,
    },
    qrVerificationUrl: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ studentId: 1, courseId: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
