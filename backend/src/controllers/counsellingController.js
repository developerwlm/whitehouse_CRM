const { CounsellingRecord, Lead, LeadActivity } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Get counselling records with filters
// @route GET /api/counselling
const getCounsellingList = async (req, res) => {
  try {
    const { leadId, counsellorId, decision } = req.query;
    const query = {};

    if (leadId) query.leadId = leadId;
    if (counsellorId) query.counsellorId = counsellorId;
    if (decision) query.customerDecision = decision;

    // Staff scoping
    if (req.user.role === 'staff') {
      query.counsellorId = req.user._id;
    }

    const records = await CounsellingRecord.find(query)
      .populate('leadId', 'leadId customerName mobileNumber email interestedCourse leadStatus')
      .populate('counsellorId', 'name email staffIdentifier')
      .sort({ counsellingDate: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new counselling record
// @route POST /api/counselling
const createCounselling = async (req, res) => {
  try {
    const {
      leadId,
      counsellingDate = new Date(),
      interestedCourse,
      courseFee,
      discount = 0,
      finalQuotedFee,
      customerDecision,
      counsellingMode,
      remarks,
      nextFollowUpDate,
    } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const record = await CounsellingRecord.create({
      leadId: lead._id,
      counsellorId: req.user._id,
      counsellingDate,
      interestedCourse: interestedCourse || lead.interestedCourse,
      courseFee: Number(courseFee),
      discount: Number(discount),
      finalQuotedFee: Number(finalQuotedFee || (courseFee - discount)),
      customerDecision,
      counsellingMode,
      remarks,
      nextFollowUpDate,
    });

    // Update lead
    lead.leadStatus = 'Counselling Scheduled';
    if (customerDecision === 'Ready to Enroll') {
      lead.leadStatus = 'Interested';
    } else if (customerDecision === 'Declined') {
      lead.leadStatus = 'Not Interested';
    }
    lead.counsellingCount = (lead.counsellingCount || 0) + 1;
    if (nextFollowUpDate) lead.followUpDate = new Date(nextFollowUpDate);
    await lead.save();

    // Log Activity
    await LeadActivity.create({
      leadId: lead._id,
      activityType: 'counselling',
      title: `Counselling session recorded (${customerDecision})`,
      description: `Offered fee: Rs. ${record.finalQuotedFee}. Mode: ${record.counsellingMode}. Notes: ${remarks || 'None'}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    res.status(201).json({ success: true, message: 'Counselling record created', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCounsellingList,
  createCounselling,
};
