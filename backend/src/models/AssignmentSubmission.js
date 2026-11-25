const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submissionUrl: {
      type: String,
      default: '',
    },
    projectFileUrl: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    evaluationStatus: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Evaluated', 'Resubmission Requested'],
      default: 'Submitted',
      index: true,
    },
    marksObtained: {
      type: Number,
      default: null,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    evaluatedAt: {
      type: Date,
    },
    trainerRemarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
