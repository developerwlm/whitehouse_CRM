const { Lead, LeadAssignment, User, InstituteSettings } = require('../models');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Reassign lead to a staff member (Admin or authorized)
// @route POST /api/lead-assignments/reassign
const reassignLead = async (req, res) => {
  try {
    const { leadId, staffId, reason = 'Admin reassignment' } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const newStaff = await User.findById(staffId);
    if (!newStaff || newStaff.role !== 'staff') {
      return res.status(400).json({ success: false, message: 'Invalid staff member selected' });
    }

    const previousStaff = lead.assignedStaff;
    lead.assignedStaff = newStaff._id;
    await lead.save();

    const assignment = await LeadAssignment.create({
      leadId: lead._id,
      assignedTo: newStaff._id,
      assignedBy: req.user._id,
      previousStaff: previousStaff || null,
      assignmentRule: 'manual_reassignment',
      reason,
      assignedAt: new Date(),
    });

    await createNotification({
      recipientId: newStaff._id,
      title: 'Lead Reassigned to You',
      message: `Lead ${lead.customerName} (${lead.interestedCourse}) has been reassigned to you. Reason: ${reason}`,
      type: 'lead',
      link: `/leads?id=${lead._id}`,
      relatedEntityId: lead._id,
      relatedEntityType: 'Lead',
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REASSIGN_LEAD',
      module: 'LEAD_ASSIGNMENTS',
      targetId: lead._id.toString(),
      description: `Reassigned lead ${lead.leadId} to ${newStaff.name}`,
      req,
    });

    res.json({
      success: true,
      message: `Lead successfully reassigned to ${newStaff.name}`,
      data: assignment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get unassigned lead queue (Admin only)
// @route GET /api/lead-assignments/unassigned
const getUnassignedQueue = async (req, res) => {
  try {
    const unassignedLeads = await Lead.find({
      $or: [{ assignedStaff: null }, { assignedStaff: { $exists: false } }],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: unassignedLeads.length,
      data: unassignedLeads,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get assignment history for a lead
// @route GET /api/lead-assignments/history/:leadId
const getAssignmentHistory = async (req, res) => {
  try {
    const history = await LeadAssignment.find({ leadId: req.params.leadId })
      .populate('assignedTo', 'name email staffIdentifier')
      .populate('assignedBy', 'name role')
      .populate('previousStaff', 'name staffIdentifier')
      .sort({ assignedAt: -1 });

    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  reassignLead,
  getUnassignedQueue,
  getAssignmentHistory,
};
