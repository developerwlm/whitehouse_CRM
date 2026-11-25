const { ExamResult, Examination, Student } = require('../models');

// @desc Get results for a student or batch
// @route GET /api/results
const getResults = async (req, res) => {
  try {
    const { studentId, examinationId } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (examinationId) query.examinationId = examinationId;

    if (req.user.role === 'student' && req.currentStudent) {
      query.studentId = req.currentStudent._id;
    }

    const results = await ExamResult.find(query)
      .populate('studentId', 'studentId name status photoUrl')
      .populate('examinationId', 'title scheduledDate totalMarks passMarks')
      .sort({ publishedAt: -1 });

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getResults };
