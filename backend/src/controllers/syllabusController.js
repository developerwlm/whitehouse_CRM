const { SyllabusWeek, Lesson, Course } = require('../models');

// @desc Get full syllabus structure for a course
// @route GET /api/syllabus/course/:courseId
const getSyllabusForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const weeks = await SyllabusWeek.find({ courseId }).sort({ weekNumber: 1 });

    const weeksWithLessons = await Promise.all(
      weeks.map(async (w) => {
        const lessons = await Lesson.find({ syllabusWeekId: w._id }).sort({ lessonNumber: 1 });
        return {
          ...w.toObject(),
          lessons,
        };
      })
    );

    res.json({ success: true, count: weeksWithLessons.length, data: weeksWithLessons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create or update a syllabus week
// @route POST /api/syllabus/weeks
const saveSyllabusWeek = async (req, res) => {
  try {
    const { courseId, weekNumber, title, description, learningObjectives, isPracticalProject, isFinalAssessment } = req.body;

    const week = await SyllabusWeek.findOneAndUpdate(
      { courseId, weekNumber },
      {
        courseId,
        weekNumber,
        title,
        description,
        learningObjectives: learningObjectives || [],
        isPracticalProject: !!isPracticalProject,
        isFinalAssessment: !!isFinalAssessment,
        order: weekNumber,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Syllabus week saved', data: week });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Add or update lesson within a week
// @route POST /api/syllabus/lessons
const saveLesson = async (req, res) => {
  try {
    const { syllabusWeekId, courseId, lessonNumber, title, content, durationMinutes, resources } = req.body;

    const lesson = await Lesson.findOneAndUpdate(
      { syllabusWeekId, lessonNumber },
      {
        syllabusWeekId,
        courseId,
        lessonNumber,
        title,
        content,
        durationMinutes: durationMinutes || 60,
        resources: resources || [],
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Lesson saved', data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Delete lesson
// @route DELETE /api/syllabus/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lesson deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSyllabusForCourse,
  saveSyllabusWeek,
  saveLesson,
  deleteLesson,
};
