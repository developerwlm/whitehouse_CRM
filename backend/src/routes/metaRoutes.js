const express = require('express');
const router = express.Router();
const {
  getMetaSettings,
  updateMetaSettings,
  testMetaConnection,
  getWebhookLogs,
  retryWebhook,
} = require('../controllers/metaController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/settings', authorize('admin'), getMetaSettings);
router.put('/settings', authorize('admin'), updateMetaSettings);
router.post('/test-connection', authorize('admin'), testMetaConnection);
router.get('/webhook-logs', authorize('admin'), getWebhookLogs);
router.post('/retry-webhook/:id', authorize('admin'), retryWebhook);

module.exports = router;
