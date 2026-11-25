const mongoose = require('mongoose');

const counsellingRecordSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    counsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    counsellingDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    interestedCourse: {
      type: String,
      required: true,
    },
    courseFee: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalQuotedFee: {
      type: Number,
      required: true,
    },
    customerDecision: {
      type: String,
      enum: [
        'Positive',
        'Considering',
        'Need Discussion with Parents',
        'Comparing Institutes',
        'Ready to Enroll',
        'Declined',
      ],
      default: 'Considering',
    },
    counsellingMode: {
      type: String,
      enum: ['In-Person at Campus', 'Phone Call', 'WhatsApp Video', 'Google Meet'],
      default: 'In-Person at Campus',
    },
    remarks: {
      type: String,
      default: '',
    },
    nextFollowUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

counsellingRecordSchema.index({ leadId: 1, counsellingDate: -1 });

module.exports = mongoose.model('CounsellingRecord', counsellingRecordSchema);
