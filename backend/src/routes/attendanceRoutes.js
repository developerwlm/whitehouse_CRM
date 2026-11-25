const express = require('express');
const router = express.Router();
const {
  markBatchAttendance,
  getBatchAttendanceByDate,
  getStudentAttendance,
  getMonthlyAttendanceReport,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/mark', authorize('admin', 'staff', 'trainer'), markBatchAttendance);
router.get('/batch/:batchId', authorize('admin', 'trainer', 'staff'), getBatchAttendanceByDate);
router.get('/student/:studentId', getStudentAttendance);
router.get('/monthly-report', authorize('admin', 'trainer', 'staff'), getMonthlyAttendanceReport);

module.exports = router;
