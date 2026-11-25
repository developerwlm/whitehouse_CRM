const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classDate: {
      type: Date,
      required: true,
      index: true,
    },
    // Normalized date string (YYYY-MM-DD) for duplicate prevention
    dateString: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      default: 'Present',
      required: true,
    },
    sessionTopic: {
      type: String,
      default: '',
    },
    remarks: {
      type: String,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same student on the same class date session
attendanceSchema.index({ studentId: 1, batchId: 1, dateString: 1 }, { unique: true });
attendanceSchema.index({ batchId: 1, dateString: 1 });
attendanceSchema.index({ courseId: 1, dateString: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
