const mongoose = require('mongoose');

const leadActivitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'status_change',
        'call',
        'whatsapp',
        'note',
        'assignment',
        'counselling',
        'admission',
        'email',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    callOutcome: {
      type: String,
      enum: ['Connected', 'Busy', 'Ringing Unanswered', 'Switched Off', 'Invalid Number', 'Requested Callback'],
    },
    durationMinutes: Number,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

leadActivitySchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('LeadActivity', leadActivitySchema);
