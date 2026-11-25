const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    currentWeek: {
      type: Number,
      default: 1,
    },
    completedWeeks: [
      {
        type: Number,
      },
    ],
    pendingWeeks: [
      {
        type: Number,
      },
    ],
    completedLessons: [
      {
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lesson',
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    pendingLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    assignmentCompletionPercent: {
      type: Number,
      default: 0,
    },
    testAverageScore: {
      type: Number,
      default: 0,
    },
    trainerRemarks: [
      {
        week: Number,
        remark: String,
        trainerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        trainerName: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    actualProgressPercent: {
      type: Number,
      default: 0,
    },
    expectedProgressPercent: {
      type: Number,
      default: 0,
    },
    isDelayed: {
      type: Boolean,
      default: false,
    },
    delayReason: {
      type: String,
      default: '',
    },
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentProgressSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
