const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
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
      required: true,
      index: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    passingMarks: {
      type: Number,
      default: 50,
    },
    instructions: {
      type: String,
      default: '',
    },
    referenceMaterialUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Published', 'Draft', 'Closed'],
      default: 'Published',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ batchId: 1, weekNumber: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
