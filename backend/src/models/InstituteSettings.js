const mongoose = require('mongoose');

const instituteSettingsSchema = new mongoose.Schema(
  {
    instituteName: {
      type: String,
      default: 'Whitehouse Skill Development Institute',
    },
    tagline: {
      type: String,
      default: 'Empowering Creative Minds & Technical Skills',
    },
    address: {
      street: { type: String, default: '12, Bypass Road, Ponmeni' },
      city: { type: String, default: 'Madurai' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, default: '625004' },
      country: { type: String, default: 'India' },
    },
    phone: {
      type: String,
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'info@whitehouseinstitute.in',
    },
    website: {
      type: String,
      default: 'https://whitehouseinstitute.in',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    // Dynamic course assignment mappings (Staff 1 and Staff 2)
    courseAssignments: [
      {
        courseName: { type: String, required: true },
        assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedStaffName: { type: String },
      },
    ],
    // Certificate issuance criteria
    eligibilityCriteria: {
      minAttendancePercent: { type: Number, default: 75 },
      minAssignmentPercent: { type: Number, default: 60 },
      requireExamPassed: { type: Boolean, default: true },
      requireFeesCleared: { type: Boolean, default: true },
    },
    leadStatuses: [
      {
        type: String,
      },
    ],
    notificationPreferences: {
      emailAlerts: { type: Boolean, default: true },
      inAppAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InstituteSettings', instituteSettingsSchema);
