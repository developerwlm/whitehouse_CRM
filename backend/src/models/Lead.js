const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    interestedCourse: {
      type: String,
      required: [true, 'Interested course is required'],
      trim: true,
      index: true,
    },
    courseRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    leadSource: {
      type: String,
      enum: [
        'Facebook Ads',
        'Instagram Ads',
        'Website enquiries',
        'Manual entry',
        'Google Ads',
        'WhatsApp enquiries',
        'Meta Ads',
        'Referral',
        'Other',
      ],
      default: 'Manual entry',
      index: true,
    },
    campaignName: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    websiteForm: {
      type: String,
      default: '',
      index: true,
    },
    adName: {
      type: String,
      default: '',
    },
    metaLeadId: {
      type: String,
      sparse: true,
      index: true,
    },
    metaFormId: {
      type: String,
    },
    enquiryDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    leadStatus: {
      type: String,
      enum: [
        'New Lead',
        'Contacted',
        'Interested',
        'Follow-up Pending',
        'Counselling Scheduled',
        'Visited Institute',
        'Admission Confirmed',
        'Not Interested',
        'No Response',
        'Lost',
      ],
      default: 'New Lead',
      index: true,
    },
    followUpDate: {
      type: Date,
      index: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOfLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    isConverted: {
      type: Boolean,
      default: false,
    },
    convertedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    counsellingCount: {
      type: Number,
      default: 0,
    },
    lastContactedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ mobileNumber: 1, email: 1 });
leadSchema.index({ assignedStaff: 1, leadStatus: 1 });
leadSchema.index({ interestedCourse: 1, leadStatus: 1 });

module.exports = mongoose.model('Lead', leadSchema);
