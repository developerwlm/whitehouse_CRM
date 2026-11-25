const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
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
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 50,
    },
    passMarks: {
      type: Number,
      required: true,
      default: 25,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

examinationSchema.index({ courseId: 1, isActive: 1 });

module.exports = mongoose.model('Examination', examinationSchema);
