const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['Meta', 'Website', 'Google Ads', 'WhatsApp', 'Custom'],
      default: 'Meta',
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    processedStatus: {
      type: String,
      enum: ['Received', 'Processed', 'Failed', 'Ignored', 'Retried'],
      default: 'Received',
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
    },
    metaLeadId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

webhookEventSchema.index({ platform: 1, processedStatus: 1, createdAt: -1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
