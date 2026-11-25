const { StudentProgress, Student, Course, Batch, SyllabusWeek, Lesson } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Get student progress record
// @route GET /api/progress/student/:studentId
const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    let progress = await StudentProgress.findOne({ studentId })
      .populate('courseId', 'name courseCode durationWeeks')
      .populate('batchId', 'name batchId startDate endDate')
      .populate('completedLessons.lessonId')
      .populate('completedLessons.verifiedBy', 'name');

    if (!progress) {
      // Initialize if not exists
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      const weeks = await SyllabusWeek.find({ courseId: student.courseId });
      progress = await StudentProgress.create({
        studentId: student._id,
        courseId: student.courseId,
        batchId: student.batchId,
        currentWeek: 1,
        completedWeeks: [],
        pendingWeeks: weeks.map((w) => w.weekNumber),
        actualProgressPercent: 0,
        expectedProgressPercent: 10,
        isDelayed: false,
      });
    }

    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update lesson completion / week progress by Trainer or Admin
// @route POST /api/progress/update-lesson
const updateLessonProgress = async (req, res) => {
  try {
    const { studentId, lessonId, isCompleted, weekNumber } = req.body;

    const progress = await StudentProgress.findOne({ studentId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    // Toggle completed lesson
    const existingIndex = progress.completedLessons.findIndex(
      (l) => l.lessonId && l.lessonId.toString() === lessonId
    );

    if (isCompleted && existingIndex === -1) {
      progress.completedLessons.push({
        lessonId,
        completedAt: new Date(),
        verifiedBy: req.user._id,
      });
    } else if (!isCompleted && existingIndex > -1) {
      progress.completedLessons.splice(existingIndex, 1);
    }

    // Check week completion
    const course = await Course.findById(progress.courseId);
    const totalWeeks = course ? course.durationWeeks || 12 : 12;

    if (weekNumber) {
      progress.currentWeek = weekNumber;
      if (!progress.completedWeeks.includes(weekNumber) && isCompleted) {
        progress.completedWeeks.push(weekNumber);
      }
    }

    // Calculate actual progress percentage
    const completedWeeksCount = progress.completedWeeks.length;
    progress.actualProgressPercent = Math.min(100, Math.round((completedWeeksCount / totalWeeks) * 100));

    // Calculate expected progress based on enrollment date / batch start date
    const student = await Student.findById(studentId);
    if (student) {
      const admissionTime = new Date(student.admissionDate).getTime();
      const now = Date.now();
      const weeksElapsed = Math.max(1, Math.floor((now - admissionTime) / (7 * 24 * 60 * 60 * 1000)));
      progress.expectedProgressPercent = Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100));

      // Delayed learning check
      if (progress.expectedProgressPercent - progress.actualProgressPercent >= 20) {
        progress.isDelayed = true;
        progress.delayReason = `Behind expected syllabus schedule by ~${weeksElapsed - completedWeeksCount} weeks`;

        await createNotification({
          roleTarget: 'trainer',
          title: 'Student Learning Delay Detected',
          message: `${student.name} (${student.studentId}) is behind schedule (${progress.actualProgressPercent}% actual vs ${progress.expectedProgressPercent}% expected).`,
          type: 'progress',
          link: `/students/${student._id}`,
          relatedEntityId: student._id,
          relatedEntityType: 'Student',
        });
      } else {
        progress.isDelayed = false;
        progress.delayReason = '';
      }
    }

    progress.lastEvaluatedAt = new Date();
    await progress.save();

    res.json({ success: true, message: 'Progress updated', data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Add trainer remark on student progress
// @route POST /api/progress/add-remark
const addTrainerRemark = async (req, res) => {
  try {
    const { studentId, weekNumber, remark } = req.body;
    const progress = await StudentProgress.findOne({ studentId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    progress.trainerRemarks.push({
      week: weekNumber || progress.currentWeek,
      remark,
      trainerId: req.user._id,
      trainerName: req.user.name,
      date: new Date(),
    });

    await progress.save();
    res.status(201).json({ success: true, message: 'Remark saved', data: progress.trainerRemarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Compare batch-wise, course-wise, and student-wise progress (Admin / Trainer)
// @route GET /api/progress/comparison
const compareProgress = async (req, res) => {
  try {
    const { courseId, batchId } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (batchId) query.batchId = batchId;

    const progressRecords = await StudentProgress.find(query)
      .populate('studentId', 'studentId name status photoUrl')
      .populate('courseId', 'name courseCode durationWeeks')
      .populate('batchId', 'name batchId');

    const totalStudents = progressRecords.length;
    const delayedCount = progressRecords.filter((p) => p.isDelayed).length;
    const avgProgress =
      totalStudents > 0
        ? Math.round(progressRecords.reduce((acc, p) => acc + (p.actualProgressPercent || 0), 0) / totalStudents)
        : 0;

    res.json({
      success: true,
      stats: {
        totalStudents,
        delayedStudentsCount: delayedCount,
        averageProgressPercent: avgProgress,
      },
      data: progressRecords,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudentProgress,
  updateLessonProgress,
  addTrainerRemark,
  compareProgress,
};
