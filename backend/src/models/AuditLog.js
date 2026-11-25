const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'system',
    },
    action: {
      type: String, // 'CREATE_LEAD', 'ASSIGN_LEAD', 'CONVERT_ADMISSION', etc.
      required: true,
      index: true,
    },
    module: {
      type: String, // 'LEADS', 'COUNSELLING', 'ADMISSIONS', 'STUDENTS', 'FEES', etc.
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
    },
    updatedData: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
