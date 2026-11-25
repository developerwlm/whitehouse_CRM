const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema(
  {
    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submitTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['In Progress', 'Submitted', 'Timed Out'],
      default: 'In Progress',
      index: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
        },
        selectedOptionKey: String,
        isCorrect: Boolean,
        marksAwarded: Number,
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

examAttemptSchema.index({ examinationId: 1, studentId: 1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
