const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  submitAssignment,
  evaluateAssignment,
  getAssignmentSubmissions,
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAssignments);
router.post('/', authorize('admin', 'staff', 'trainer'), createAssignment);
router.post('/:id/submit', submitAssignment);
router.post('/evaluate/:submissionId', authorize('admin', 'staff', 'trainer'), evaluateAssignment);
router.get('/:id/submissions', authorize('admin', 'staff', 'trainer'), getAssignmentSubmissions);

module.exports = router;
