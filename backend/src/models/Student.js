const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    altMobile: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    address: {
      street: String,
      city: { type: String, default: 'Madurai' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    qualification: {
      type: String,
      default: '',
    },
    parentContact: {
      parentName: String,
      relationship: String,
      phone: String,
      occupation: String,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    batchName: {
      type: String,
      default: '',
    },
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    trainerName: {
      type: String,
      default: '',
    },
    courseDurationWeeks: {
      type: Number,
      default: 12,
    },
    status: {
      type: String,
      enum: ['Active', 'On Hold', 'Completed', 'Discontinued', 'Transferred', 'Alumni'],
      default: 'Active',
      index: true,
    },
    documents: [
      {
        name: String,
        url: String,
        documentType: String, // 'Aadhaar', 'Certificate', 'Resume', 'Photo'
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    originalLeadNumber: {
      type: String,
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admission',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedPassword: {
      type: String,
      default: '',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ mobile: 1, email: 1 });
studentSchema.index({ courseId: 1, status: 1 });
studentSchema.index({ batchId: 1, status: 1 });
studentSchema.index({ trainerId: 1, status: 1 });

module.exports = mongoose.model('Student', studentSchema);
