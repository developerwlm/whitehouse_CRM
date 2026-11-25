const express = require('express');
const router = express.Router();
const { getAdmissions, convertLeadToStudent } = require('../controllers/admissionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff'), getAdmissions);
router.post('/convert-lead', authorize('admin', 'staff'), convertLeadToStudent);

module.exports = router;
