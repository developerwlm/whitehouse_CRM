const express = require('express');
const router = express.Router();
const { getPlacements, updatePlacement } = require('../controllers/placementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('admin', 'staff', 'trainer'), getPlacements);
router.post('/update', authorize('admin', 'staff'), updatePlacement);

module.exports = router;
