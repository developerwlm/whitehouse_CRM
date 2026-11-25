const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    syllabusWeekId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SyllabusWeek',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lessonNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    resources: [
      {
        title: String,
        url: String,
        resourceType: { type: String, enum: ['PDF', 'Video', 'Link', 'Exercise'], default: 'Link' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ syllabusWeekId: 1, lessonNumber: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
