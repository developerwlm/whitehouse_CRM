const express = require('express');
const router = express.Router();
const {
  getStudentProgress,
  updateLessonProgress,
  addTrainerRemark,
  compareProgress,
} = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student/:studentId', getStudentProgress);
router.post('/update-lesson', authorize('admin', 'staff', 'trainer'), updateLessonProgress);
router.post('/add-remark', authorize('admin', 'staff', 'trainer'), addTrainerRemark);
router.get('/comparison', authorize('admin', 'trainer', 'staff'), compareProgress);

module.exports = router;
