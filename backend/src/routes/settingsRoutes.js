const express = require('express');
const router = express.Router();
const { getInstituteSettings, updateInstituteSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getInstituteSettings);
router.put('/', authorize('admin'), updateInstituteSettings);

module.exports = router;
