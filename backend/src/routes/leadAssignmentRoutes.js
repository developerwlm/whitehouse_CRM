const express = require('express');
const router = express.Router();
const { reassignLead, getUnassignedQueue, getAssignmentHistory } = require('../controllers/leadAssignmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/reassign', authorize('admin'), reassignLead);
router.get('/unassigned', authorize('admin'), getUnassignedQueue);
router.get('/history/:leadId', authorize('admin', 'staff'), getAssignmentHistory);

module.exports = router;
