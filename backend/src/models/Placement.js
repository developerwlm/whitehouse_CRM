const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
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
    courseName: {
      type: String,
      required: true,
    },
    jobStatus: {
      type: String,
      enum: [
        'Job Seeking',
        'Interview Scheduled',
        'Selected',
        'Placed',
        'Higher Studies',
        'Self Employed',
      ],
      default: 'Job Seeking',
      index: true,
    },
    company: {
      type: String,
      default: '',
    },
    jobRole: {
      type: String,
      default: '',
    },
    workLocation: {
      type: String,
      default: '',
    },
    interviewDate: {
      type: Date,
    },
    placementDate: {
      type: Date,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    portfolioUrl: {
      type: String,
      default: '',
    },
    salaryPackageAnnual: {
      type: Number,
      default: null,
    },
    voluntarySalaryReported: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

placementSchema.index({ jobStatus: 1, placementDate: -1 });

module.exports = mongoose.model('Placement', placementSchema);
