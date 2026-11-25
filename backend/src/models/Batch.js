const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    classTimings: {
      startTime: { type: String, default: '10:00 AM' },
      endTime: { type: String, default: '01:00 PM' },
    },
    trainingDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    ],
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentCapacity: {
      type: Number,
      default: 25,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Ongoing',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

batchSchema.index({ courseId: 1, status: 1 });
batchSchema.index({ trainerId: 1, status: 1 });

module.exports = mongoose.model('Batch', batchSchema);
