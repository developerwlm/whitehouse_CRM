const express = require('express');
const router = express.Router();
const {
  verifyMetaWebhook,
  receiveMetaWebhook,
  receiveWebsiteWebhook,
} = require('../controllers/webhookController');

// Meta Webhook endpoints (Public - secured via hub.verify_token and Meta signature verification)
router.get('/meta', verifyMetaWebhook);
router.post('/meta', receiveMetaWebhook);

// Website enquiry webhook
router.post('/website', receiveWebsiteWebhook);

module.exports = router;
