const { WebhookEvent, Lead } = require('../models');
const { verifyWebhookChallenge, processLeadGenItem } = require('../services/metaService');
const { generateLeadId } = require('../utils/idGenerator');
const { assignLeadByCourse } = require('../services/autoAssignService');
const { createNotification } = require('../services/notificationService');

// @desc Meta Webhook Verification (hub.challenge)
// @route GET /api/webhooks/meta
const verifyMetaWebhook = async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  try {
    const verifiedChallenge = await verifyWebhookChallenge(mode, token, challenge);
    if (verifiedChallenge) {
      console.log('[Meta Webhook] Successfully verified verification challenge from Meta.');
      return res.status(200).send(verifiedChallenge);
    }
    console.warn('[Meta Webhook] Verification failed: Token mismatch.');
    return res.status(403).send('Verification token mismatch');
  } catch (err) {
    console.error('[Meta Webhook] Verification error:', err.message);
    return res.status(500).send('Internal Server Error');
  }
};

// @desc Meta Leadgen Webhook Event Receiver
// @route POST /api/webhooks/meta
const receiveMetaWebhook = async (req, res) => {
  const body = req.body;

  // Immediately respond 200 OK as required by Meta webhook protocol
  res.status(200).send('EVENT_RECEIVED');

  // Background processing of the payload
  try {
    if (body.object === 'page' && body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'leadgen' && change.value) {
              // 1. Record raw webhook in WebhookEvent collection
              const webhookDoc = await WebhookEvent.create({
                platform: 'Meta',
                eventType: 'leadgen',
                payload: body,
                metaLeadId: change.value.leadgen_id,
                processedStatus: 'Received',
              });

              // 2. Process lead generation item
              try {
                await processLeadGenItem(change.value, webhookDoc);
              } catch (processErr) {
                console.error('[Meta Webhook] Error processing lead item:', processErr.message);
                webhookDoc.processedStatus = 'Failed';
                webhookDoc.errorMessage = processErr.message;
                await webhookDoc.save();
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Meta Webhook] Fatal error handling event:', err.message);
  }
};

// @desc Website Lead Webhook receiver
// @route POST /api/webhooks/website
const receiveWebsiteWebhook = async (req, res) => {
  try {
    const rawName = req.body.name || req.body.fullName || req.body['your-name'] || req.body.contact_name || req.body.customerName;
    const rawMobile = req.body.mobile || req.body.phone || req.body.phoneNumber || req.body['your-phone'] || req.body.tel || req.body.contact_phone;
    const rawEmail = req.body.email || req.body['your-email'] || req.body.contact_email;
    const rawCourse = req.body.course || req.body.interestedCourse || req.body.subject || req.body.program || req.body.service;
    const campaign = req.body.campaign || req.body.campaignName || 'whitehouse.org.in/contact';
    const remarks = req.body.remarks || req.body.message || req.body['your-message'] || req.body.comments || 'Lead captured via website webhook';

    if (!rawName || !rawMobile) {
      return res.status(400).json({ success: false, message: 'Name and mobile number are required.' });
    }

    const cleanMobile = String(rawMobile).replace(/\D/g, '').slice(-10);

    // Normalize course name
    let interestedCourse = 'General Enquiry';
    const c = String(rawCourse || '').toLowerCase();
    if (c.includes('vfx') || c.includes('animation') || c.includes('3d')) interestedCourse = 'VFX & Animation';
    else if (c.includes('ai video') || c.includes('ai edit')) interestedCourse = 'AI Video Editing';
    else if (c.includes('video') || c.includes('edit') || c.includes('premiere')) interestedCourse = 'Video Editing';
    else if (c.includes('drone') || c.includes('photo') || c.includes('camera')) interestedCourse = 'Drone Photography';
    else if (c.includes('cod') || c.includes('programm') || c.includes('web') || c.includes('full stack') || c.includes('python')) interestedCourse = 'Coding';
    else if (c.includes('graphic') || c.includes('design') || c.includes('photoshop')) interestedCourse = 'Graphic Design';
    else if (c.includes('market') || c.includes('digital') || c.includes('seo')) interestedCourse = 'Digital Marketing';
    else if (rawCourse) interestedCourse = String(rawCourse).trim();

    const existing = await Lead.findOne({
      $or: [{ mobileNumber: cleanMobile }, ...(rawEmail ? [{ email: String(rawEmail).toLowerCase().trim() }] : [])],
    });

    const leadId = generateLeadId();
    const lead = await Lead.create({
      leadId,
      customerName: String(rawName).trim(),
      mobileNumber: cleanMobile,
      whatsappNumber: cleanMobile,
      email: rawEmail ? String(rawEmail).toLowerCase().trim() : '',
      interestedCourse,
      leadSource: 'Website enquiries',
      campaignName: campaign,
      remarks,
      isDuplicate: !!existing,
      duplicateOfLeadId: existing ? existing._id : null,
    });

    const assignResult = await assignLeadByCourse(lead);

    await createNotification({
      roleTarget: 'admin',
      title: 'Website Webhook Lead Received',
      message: `${lead.customerName} interested in ${lead.interestedCourse} received from ${campaign}. Assigned to ${assignResult.staffName}.`,
      type: 'lead',
      link: `/leads?id=${lead._id}`,
      relatedEntityId: lead._id,
      relatedEntityType: 'Lead',
    });

    if (assignResult.assignedStaffId) {
      await createNotification({
        roleTarget: 'staff',
        recipientUserId: assignResult.assignedStaffId,
        title: 'New Website Lead Allocated To You',
        message: `${lead.customerName} (${cleanMobile}) enquired for ${lead.interestedCourse}`,
        type: 'lead',
        link: `/leads?id=${lead._id}`,
        relatedEntityId: lead._id,
        relatedEntityType: 'Lead',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Website webhook processed and lead allocated',
      leadId: lead.leadId,
      assignedTo: assignResult.staffName,
      course: interestedCourse,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  verifyMetaWebhook,
  receiveMetaWebhook,
  receiveWebsiteWebhook,
};
