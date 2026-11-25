const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updatePassword,
  getSetupStatus,
  setupInitialAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/setup-status', getSetupStatus);
router.post('/setup-admin', setupInitialAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
