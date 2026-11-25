const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamAttempt',
      required: true,
      unique: true,
    },
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
    examTitle: String,
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    wrongCount: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    isPassed: {
      type: Boolean,
      required: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index({ studentId: 1, examinationId: 1 });

module.exports = mongoose.model('ExamResult', examResultSchema);
