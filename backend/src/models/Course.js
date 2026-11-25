const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    durationWeeks: {
      type: Number,
      required: true,
      default: 12,
    },
    durationMonths: {
      type: Number,
      default: 3,
    },
    totalHours: {
      type: Number,
      default: 120,
    },
    fee: {
      type: Number,
      required: true,
    },
    assignedTrainers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    defaultAssignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    syllabusOverview: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
