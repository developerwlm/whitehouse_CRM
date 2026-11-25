const express = require('express');
const router = express.Router();
const {
  getSyllabusForCourse,
  saveSyllabusWeek,
  saveLesson,
  deleteLesson,
} = require('../controllers/syllabusController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/course/:courseId', getSyllabusForCourse);
router.post('/weeks', authorize('admin', 'trainer'), saveSyllabusWeek);
router.post('/lessons', authorize('admin', 'trainer'), saveLesson);
router.delete('/lessons/:id', authorize('admin', 'trainer'), deleteLesson);

module.exports = router;
