const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', authorize('admin', 'staff'), createCourse);
router.put('/:id', authorize('admin', 'staff'), updateCourse);
router.delete('/:id', authorize('admin', 'staff'), deleteCourse);

module.exports = router;
