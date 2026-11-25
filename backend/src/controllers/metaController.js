const { MetaIntegration, WebhookEvent } = require('../models');
const { retryWebhookEvent } = require('../services/metaService');
const { logAudit } = require('../middleware/auditLogger');
const axios = require('axios');

// @desc Get Meta Integration configuration (Tokens masked for security)
// @route GET /api/meta/settings
const getMetaSettings = async (req, res) => {
  try {
    let config = await MetaIntegration.findOne().select('+pageAccessToken +webhookVerifyToken');
    if (!config) {
      config = await MetaIntegration.create({
        pageId: '109823471829381',
        pageName: 'Whitehouse Skill Development Institute - Official',
        appId: '827361928374619',
        pageAccessToken: 'EAAGm0PX4ZCpsBAK...SAMPLE_META_TOKEN',
        webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'WHITEHOUSE_CRM_META_VERIFY_TOKEN_2026',
        subscribedForms: [
          {
            formId: '827361928374',
            formName: 'VFX & Animation Lead Ad Form 2026',
            targetCourse: 'VFX & Animation',
            campaignName: 'Summer Creative Skills Campaign',
            isActive: true,
          },
          {
            formId: '827361928375',
            formName: 'Video Editing Career Form',
            targetCourse: 'Video Editing',
            campaignName: 'Media Pro 2026',
            isActive: true,
          },
          {
            formId: '827361928376',
            formName: 'Graphic Design Enquiry Form',
            targetCourse: 'Graphic Design',
            campaignName: 'Design Future Campaign',
            isActive: true,
          },
        ],
        isActive: true,
        lastSyncStatus: 'Connected & Active',
        lastSyncAt: new Date(),
      });
    }

    // Mask pageAccessToken before sending to frontend
    const configObj = config.toObject();
    if (configObj.pageAccessToken) {
      configObj.pageAccessTokenMasked = `${configObj.pageAccessToken.slice(0, 8)}...${configObj.pageAccessToken.slice(-6)}`;
      delete configObj.pageAccessToken;
    }
    delete configObj.appSecret;

    res.json({ success: true, data: configObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update Meta Integration settings (Admin only)
// @route PUT /api/meta/settings
const updateMetaSettings = async (req, res) => {
  try {
    const { pageId, pageName, appId, appSecret, pageAccessToken, webhookVerifyToken, subscribedForms, isActive } = req.body;

    let config = await MetaIntegration.findOne();
    if (!config) {
      config = new MetaIntegration();
    }

    if (pageId) config.pageId = pageId;
    if (pageName) config.pageName = pageName;
    if (appId) config.appId = appId;
    if (appSecret) config.appSecret = appSecret;
    if (pageAccessToken && !pageAccessToken.includes('...')) config.pageAccessToken = pageAccessToken;
    if (webhookVerifyToken) config.webhookVerifyToken = webhookVerifyToken;
    if (subscribedForms) config.subscribedForms = subscribedForms;
    if (isActive !== undefined) config.isActive = isActive;

    await config.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_META_SETTINGS',
      module: 'META_INTEGRATION',
      description: `Updated Meta Page Integration settings for ${config.pageName}`,
      req,
    });

    res.json({ success: true, message: 'Meta settings updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Test Meta Connection with real Graph API probe or status check
// @route POST /api/meta/test-connection
const testMetaConnection = async (req, res) => {
  try {
    const config = await MetaIntegration.findOne().select('+pageAccessToken');
    if (!config || !config.pageAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Page Access Token configured. Please configure Meta API credentials first.',
      });
    }

    // Probe Meta Graph API
    try {
      const response = await axios.get(`https://graph.facebook.com/v21.0/${config.pageId}`, {
        params: { access_token: config.pageAccessToken, fields: 'id,name' },
        timeout: 5000,
      });

      config.lastSyncStatus = 'Connected & Active';
      config.lastSyncAt = new Date();
      config.lastError = '';
      await config.save();

      return res.json({
        success: true,
        message: `Successfully connected to Facebook Page: ${response.data.name} (ID: ${response.data.id})`,
        data: response.data,
      });
    } catch (apiErr) {
      // If live token is a demo/sandbox token or network restricted, report accurately without faking
      const errDetail = apiErr.response && apiErr.response.data && apiErr.response.data.error
        ? apiErr.response.data.error.message
        : apiErr.message;

      config.lastSyncStatus = 'Sync Failed';
      config.lastError = errDetail;
      await config.save();

      return res.status(400).json({
        success: false,
        message: `Meta API verification returned error: ${errDetail}. Check Page Access Token permissions.`,
        errorDetail: errDetail,
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get failed and recent webhook events log
// @route GET /api/meta/webhook-logs
const getWebhookLogs = async (req, res) => {
  try {
    const { status, platform = 'Meta' } = req.query;
    const query = { platform };
    if (status) query.processedStatus = status;

    const logs = await WebhookEvent.find(query).populate('leadId', 'leadId customerName interestedCourse').sort({ createdAt: -1 }).limit(100);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Retry a failed webhook event
// @route POST /api/meta/retry-webhook/:id
const retryWebhook = async (req, res) => {
  try {
    const result = await retryWebhookEvent(req.params.id);
    res.json({ success: true, message: 'Webhook event retried successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: `Retry failed: ${err.message}` });
  }
};

module.exports = {
  getMetaSettings,
  updateMetaSettings,
  testMetaConnection,
  getWebhookLogs,
  retryWebhook,
};
