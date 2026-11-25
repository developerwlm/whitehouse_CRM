const axios = require('axios');
const {
  MetaIntegration,
  WebhookEvent,
  Lead,
  LeadActivity,
  AuditLog,
} = require('../models');
const { generateLeadId } = require('../utils/idGenerator');
const { assignLeadByCourse } = require('./autoAssignService');
const { createNotification } = require('./notificationService');

/**
 * Handles Webhook verification challenge from Meta
 */
const verifyWebhookChallenge = async (mode, verifyToken, challenge) => {
  if (mode !== 'subscribe') return null;

  // Check token against database or environment variable
  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'WHITEHOUSE_CRM_META_VERIFY_TOKEN_2026';

  const integration = await MetaIntegration.findOne({ isActive: true }).select('+webhookVerifyToken');
  const validToken = (integration && integration.webhookVerifyToken) || expectedToken;

  if (verifyToken === validToken) {
    return challenge;
  }
  return null;
};

/**
 * Parses field data from Meta Graph API response
 */
const parseMetaFieldData = (fieldData = []) => {
  const fields = {};
  for (const item of fieldData) {
    const name = item.name.toLowerCase();
    const val = item.values && item.values[0] ? item.values[0] : '';

    if (name.includes('name') || name === 'full_name') {
      fields.name = val;
    } else if (name.includes('phone') || name === 'phone_number') {
      fields.mobile = val.replace(/\D/g, '').slice(-10); // normalize to 10-digit if possible
    } else if (name.includes('email')) {
      fields.email = val.toLowerCase().trim();
    } else if (name.includes('course') || name.includes('program') || name.includes('interested')) {
      fields.course = val;
    }
  }
  return fields;
};

/**
 * Fetches lead details from Meta Graph API
 */
const fetchLeadFromMetaGraphAPI = async (leadgenId, pageAccessToken) => {
  try {
    const url = `https://graph.facebook.com/v21.0/${leadgenId}`;
    const response = await axios.get(url, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,created_time,ad_id,ad_name,adset_name,campaign_name,form_id,field_data',
      },
      timeout: 8000,
    });
    return response.data;
  } catch (err) {
    const errorDetails = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Meta Graph API lead retrieval failed: ${errorDetails}`);
  }
};

/**
 * Processes a single incoming Meta lead item
 */
const processLeadGenItem = async (changeValue, webhookEventDoc) => {
  const { leadgen_id, form_id, page_id, created_time, test_lead_data } = changeValue;

  // 1. Find active MetaIntegration configuration
  const integration = await MetaIntegration.findOne({
    $or: [{ pageId: page_id }, { isActive: true }],
  }).select('+pageAccessToken');

  let rawLead = null;
  let parsed = {};
  let campaignName = changeValue.campaign_name || 'Meta Ads Campaign';
  let adName = changeValue.ad_name || 'Lead Gen Ad';

  // If this is a simulated / direct test lead payload (useful for testing and sandbox acceptance)
  if (test_lead_data) {
    parsed = {
      name: test_lead_data.name || 'Meta Test Lead',
      mobile: test_lead_data.mobile || test_lead_data.phone || '9876543210',
      email: test_lead_data.email || 'metatest@example.com',
      course: test_lead_data.course || 'VFX & Animation',
    };
    campaignName = test_lead_data.campaign_name || campaignName;
    adName = test_lead_data.ad_name || adName;
  } else {
    // Attempt real Meta Graph API call if token exists
    if (!integration || !integration.pageAccessToken) {
      throw new Error(`No active Meta Page Access Token found for Page ID ${page_id}`);
    }

    rawLead = await fetchLeadFromMetaGraphAPI(leadgen_id, integration.pageAccessToken);
    parsed = parseMetaFieldData(rawLead.field_data || []);
    campaignName = rawLead.campaign_name || campaignName;
    adName = rawLead.ad_name || adName;
  }

  // Determine course: check form mapping in subscribedForms
  let interestedCourse = parsed.course;
  if (!interestedCourse && integration && integration.subscribedForms) {
    const formConfig = integration.subscribedForms.find((f) => f.formId === form_id);
    if (formConfig && formConfig.targetCourse) {
      interestedCourse = formConfig.targetCourse;
    }
  }
  if (!interestedCourse) {
    interestedCourse = 'VFX & Animation'; // Default fallback
  }

  // 2. Duplicate Detection
  const mobile = parsed.mobile || '9876500000';
  const email = parsed.email || `lead_${leadgen_id || Date.now()}@meta-lead.com`;
  const existingLead = await Lead.findOne({
    $or: [{ mobileNumber: mobile }, { email: email }],
  });

  const leadId = generateLeadId();
  const isDuplicate = !!existingLead;

  // 3. Save Lead in MongoDB
  const newLead = await Lead.create({
    leadId,
    customerName: parsed.name || 'Meta Lead',
    mobileNumber: mobile,
    whatsappNumber: mobile,
    email: email,
    interestedCourse,
    leadSource: 'Meta Ads',
    campaignName,
    adName,
    metaLeadId: leadgen_id || `TEST-${Date.now()}`,
    metaFormId: form_id,
    enquiryDate: created_time ? new Date(created_time * 1000) : new Date(),
    leadStatus: 'New Lead',
    remarks: isDuplicate ? `Duplicate lead. Original lead ID: ${existingLead.leadId}` : 'Meta Lead Ads capture',
    isDuplicate,
    duplicateOfLeadId: isDuplicate ? existingLead._id : null,
  });

  // 4. Log Activity
  await LeadActivity.create({
    leadId: newLead._id,
    activityType: 'status_change',
    title: 'Lead Created via Meta Ads Webhook',
    description: `Campaign: ${campaignName}, Ad: ${adName}, Form: ${form_id}`,
    performedBy: newLead._id, // System placeholder
    performedByName: 'Meta Webhook Service',
  });

  // 5. Course-Wise Staff Assignment
  const assignResult = await assignLeadByCourse(newLead);

  // 6. Notifications
  await createNotification({
    roleTarget: 'admin',
    title: 'New Meta Ads Lead Received',
    message: `Lead ${newLead.customerName} (${interestedCourse}) received from ${campaignName}. Assigned to ${assignResult.staffName}.`,
    type: 'lead',
    link: `/leads?id=${newLead._id}`,
    relatedEntityId: newLead._id,
    relatedEntityType: 'Lead',
  });

  if (assignResult.assignedStaffId) {
    await createNotification({
      recipientId: assignResult.assignedStaffId,
      title: 'New Lead Assigned to You',
      message: `${newLead.customerName} interested in ${interestedCourse}. Follow-up required.`,
      type: 'lead',
      link: `/leads?id=${newLead._id}`,
      relatedEntityId: newLead._id,
      relatedEntityType: 'Lead',
    });
  }

  // Update webhook event
  if (webhookEventDoc) {
    webhookEventDoc.processedStatus = 'Processed';
    webhookEventDoc.leadId = newLead._id;
    await webhookEventDoc.save();
  }

  // Update integration sync stats
  if (integration) {
    integration.lastSyncAt = new Date();
    integration.lastSyncStatus = 'Connected & Active';
    integration.syncStats.totalReceived = (integration.syncStats.totalReceived || 0) + 1;
    integration.syncStats.totalSaved = (integration.syncStats.totalSaved || 0) + 1;
    if (isDuplicate) {
      integration.syncStats.totalDuplicates = (integration.syncStats.totalDuplicates || 0) + 1;
    }
    await integration.save();
  }

  return newLead;
};

/**
 * Retries a failed webhook event
 */
const retryWebhookEvent = async (webhookEventId) => {
  const eventDoc = await WebhookEvent.findById(webhookEventId);
  if (!eventDoc) throw new Error('Webhook event not found');

  eventDoc.retryCount += 1;
  eventDoc.lastRetryAt = new Date();

  try {
    const payload = eventDoc.payload;
    if (payload && payload.entry) {
      for (const entry of payload.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen' && change.value) {
              await processLeadGenItem(change.value, eventDoc);
            }
          }
        }
      }
    }
    eventDoc.processedStatus = 'Retried';
    eventDoc.errorMessage = '';
    await eventDoc.save();
    return { success: true, eventDoc };
  } catch (err) {
    eventDoc.processedStatus = 'Failed';
    eventDoc.errorMessage = err.message;
    await eventDoc.save();
    throw err;
  }
};

module.exports = {
  verifyWebhookChallenge,
  fetchLeadFromMetaGraphAPI,
  processLeadGenItem,
  retryWebhookEvent,
};
