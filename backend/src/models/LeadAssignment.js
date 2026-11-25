const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    previousStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignmentRule: {
      type: String, // 'course_auto_allocation', 'manual_reassignment', 'admin_override'
      default: 'course_auto_allocation',
    },
    reason: {
      type: String,
      default: '',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

leadAssignmentSchema.index({ assignedTo: 1, assignedAt: -1 });

module.exports = mongoose.model('LeadAssignment', leadAssignmentSchema);
