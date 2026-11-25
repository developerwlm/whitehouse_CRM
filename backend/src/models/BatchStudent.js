const mongoose = require('mongoose');

const batchStudentSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Transferred', 'Completed', 'Dropped'],
      default: 'Active',
      index: true,
    },
    transferHistory: [
      {
        fromBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        toBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        transferredAt: { type: Date, default: Date.now },
        transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

batchStudentSchema.index({ batchId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('BatchStudent', batchStudentSchema);
