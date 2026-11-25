const express = require('express');
const router = express.Router();
const {
  getStudentFee,
  getPendingFeeReminders,
  sendFeeReminder,
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/student/:studentId', getStudentFee);
router.get('/pending-reminders', authorize('admin', 'staff'), getPendingFeeReminders);
router.post('/send-reminder', authorize('admin', 'staff'), sendFeeReminder);

module.exports = router;
