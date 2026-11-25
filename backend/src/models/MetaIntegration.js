const mongoose = require('mongoose');

const metaIntegrationSchema = new mongoose.Schema(
  {
    pageId: {
      type: String,
      required: true,
      trim: true,
    },
    pageName: {
      type: String,
      required: true,
      trim: true,
    },
    appId: {
      type: String,
      trim: true,
    },
    appSecret: {
      type: String,
      select: false, // Never expose in frontend
    },
    pageAccessToken: {
      type: String,
      required: true,
      select: false, // Protected, never exposed in full
    },
    webhookVerifyToken: {
      type: String,
      default: 'WHITEHOUSE_CRM_META_VERIFY_TOKEN_2026',
      select: false,
    },
    subscribedForms: [
      {
        formId: { type: String, required: true },
        formName: { type: String, default: '' },
        targetCourse: { type: String, default: '' },
        campaignName: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },
    lastSyncStatus: {
      type: String,
      enum: ['Never Connected', 'Connected & Active', 'Sync Failed', 'Token Expired'],
      default: 'Never Connected',
    },
    lastError: {
      type: String,
      default: '',
    },
    syncStats: {
      totalReceived: { type: Number, default: 0 },
      totalSaved: { type: Number, default: 0 },
      totalDuplicates: { type: Number, default: 0 },
      totalFailed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MetaIntegration', metaIntegrationSchema);
