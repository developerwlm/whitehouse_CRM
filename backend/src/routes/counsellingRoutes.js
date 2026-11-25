const express = require('express');
const router = express.Router();
const { getCounsellingList, createCounselling } = require('../controllers/counsellingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff'), getCounsellingList);
router.post('/', authorize('admin', 'staff'), createCounselling);

module.exports = router;
