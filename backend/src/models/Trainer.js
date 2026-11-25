const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceYears: {
      type: Number,
      default: 3,
    },
    qualification: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    activeBatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    rating: {
      type: Number,
      default: 4.8,
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trainer', trainerSchema);
