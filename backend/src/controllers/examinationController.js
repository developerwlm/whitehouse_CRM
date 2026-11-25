const { Examination, Question, ExamAttempt, ExamResult, Student } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Create MCQ Examination (Trainer / Admin)
// @route POST /api/examinations
const createExamination = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      batchId,
      durationMinutes = 30,
      totalMarks = 50,
      passMarks = 25,
      scheduledDate,
      questions = [],
    } = req.body;

    const exam = await Examination.create({
      title,
      description,
      courseId,
      batchId: batchId || null,
      durationMinutes,
      totalMarks,
      passMarks,
      scheduledDate: new Date(scheduledDate),
      createdBy: req.user._id,
      isActive: true,
    });

    // Create questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await Question.create({
          examinationId: exam._id,
          questionText: q.questionText,
          options: q.options, // [{ optionKey: 'A', text: '...' }]
          correctOptionKey: q.correctOptionKey,
          marks: q.marks || Math.round(totalMarks / questions.length),
          explanation: q.explanation || '',
          order: i + 1,
        });
      }
    }

    await createNotification({
      roleTarget: 'all',
      title: 'New Examination Scheduled',
      message: `Exam "${title}" has been scheduled for ${new Date(scheduledDate).toLocaleDateString('en-IN')}`,
      type: 'exam',
      link: `/examinations/${exam._id}`,
      relatedEntityId: exam._id,
      relatedEntityType: 'Examination',
    });

    res.status(201).json({ success: true, message: 'Examination created with questions', data: exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get examinations list
// @route GET /api/examinations
const getExaminations = async (req, res) => {
  try {
    const { courseId, batchId, isActive } = req.query;
    const query = {};

    if (courseId) query.courseId = courseId;
    if (batchId) query.batchId = batchId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const exams = await Examination.find(query)
      .populate('courseId', 'name courseCode')
      .populate('batchId', 'name batchId')
      .populate('createdBy', 'name')
      .sort({ scheduledDate: -1 });

    res.json({ success: true, count: exams.length, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get examination with questions (for taking or reviewing)
// @route GET /api/examinations/:id
const getExaminationById = async (req, res) => {
  try {
    const exam = await Examination.findById(req.params.id)
      .populate('courseId', 'name courseCode')
      .populate('batchId', 'name batchId');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const questions = await Question.find({ examinationId: exam._id }).sort({ order: 1 });

    // If student is taking the exam, hide correctOptionKey
    const sanitizedQuestions = questions.map((q) => {
      const qObj = q.toObject();
      if (req.user.role === 'student') {
        delete qObj.correctOptionKey;
        delete qObj.explanation;
      }
      return qObj;
    });

    res.json({
      success: true,
      data: {
        ...exam.toObject(),
        questions: sanitizedQuestions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Submit examination answers and automatically evaluate MCQ marks
// @route POST /api/examinations/:id/submit
const submitExamAttempt = async (req, res) => {
  try {
    const { studentId, answers = [] } = req.body; // answers: [{ questionId, selectedOptionKey }]
    const examId = req.params.id;

    const exam = await Examination.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Retrieve all questions with correct answers
    const questions = await Question.find({ examinationId: exam._id });
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q._id.toString()] = q;
    });

    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const gradedAnswers = answers.map((ans) => {
      const q = questionMap[ans.questionId];
      if (!q) {
        return {
          questionId: ans.questionId,
          selectedOptionKey: ans.selectedOptionKey,
          isCorrect: false,
          marksAwarded: 0,
        };
      }

      const isCorrect = ans.selectedOptionKey && ans.selectedOptionKey.toUpperCase() === q.correctOptionKey.toUpperCase();
      const marksAwarded = isCorrect ? q.marks : 0;
      if (isCorrect) {
        correctCount++;
        totalScore += marksAwarded;
      } else {
        wrongCount++;
      }

      return {
        questionId: q._id,
        selectedOptionKey: ans.selectedOptionKey,
        isCorrect,
        marksAwarded,
      };
    });

    const percentage = exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100) : 0;
    const isPassed = totalScore >= exam.passMarks;

    // Save Attempt
    const attempt = await ExamAttempt.create({
      examinationId: exam._id,
      studentId: student._id,
      startTime: new Date(Date.now() - (exam.durationMinutes || 30) * 60 * 1000),
      submitTime: new Date(),
      status: 'Submitted',
      answers: gradedAnswers,
      totalScore,
      totalMarks: exam.totalMarks,
      percentage,
      isPassed,
    });

    // Save ExamResult
    const result = await ExamResult.create({
      attemptId: attempt._id,
      examinationId: exam._id,
      studentId: student._id,
      examTitle: exam.title,
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      score: totalScore,
      totalMarks: exam.totalMarks,
      passMarks: exam.passMarks,
      percentage,
      isPassed,
      publishedAt: new Date(),
    });

    await createNotification({
      recipientId: student.userId || null,
      title: 'Exam Result Published',
      message: `You scored ${totalScore}/${exam.totalMarks} (${percentage}%) in ${exam.title}. Result: ${isPassed ? 'PASSED' : 'NEEDS IMPROVEMENT'}`,
      type: 'exam',
      link: `/students/${student._id}`,
      relatedEntityId: result._id,
      relatedEntityType: 'ExamResult',
    });

    res.status(200).json({
      success: true,
      message: `Exam submitted! Score: ${totalScore}/${exam.totalMarks} (${percentage}%)`,
      data: {
        score: totalScore,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks,
        percentage,
        isPassed,
        correctCount,
        wrongCount,
        resultId: result._id,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createExamination,
  getExaminations,
  getExaminationById,
  submitExamAttempt,
};
