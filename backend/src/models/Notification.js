const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    roleTarget: {
      type: String,
      enum: ['admin', 'staff', 'trainer', 'student', 'all'],
      default: 'all',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'lead',
        'assignment',
        'counselling',
        'admission',
        'attendance',
        'progress',
        'exam',
        'fee',
        'certificate',
        'placement',
        'system',
      ],
      default: 'system',
      index: true,
    },
    link: {
      type: String,
      default: '',
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedEntityType: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
