const express = require('express');
const router = express.Router();
const { getDashboardStats, getReportByType } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard-stats', getDashboardStats);
router.get('/:reportType', getReportByType);

module.exports = router;
