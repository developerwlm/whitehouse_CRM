const mongoose = require('mongoose');

const syllabusWeekSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    learningObjectives: [
      {
        type: String,
        trim: true,
      },
    ],
    isPracticalProject: {
      type: Boolean,
      default: false,
    },
    isFinalAssessment: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

syllabusWeekSchema.index({ courseId: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusWeek', syllabusWeekSchema);
