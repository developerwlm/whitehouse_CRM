const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    examinationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Examination',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        optionKey: { type: String, required: true }, // 'A', 'B', 'C', 'D'
        text: { type: String, required: true },
      },
    ],
    correctOptionKey: {
      type: String,
      required: true, // 'A', 'B', 'C', or 'D'
    },
    marks: {
      type: Number,
      default: 5,
    },
    explanation: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ examinationId: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
