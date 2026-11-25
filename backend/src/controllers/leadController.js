const { Lead, LeadActivity, Course, User, LeadAssignment } = require('../models');
const { generateLeadId } = require('../utils/idGenerator');
const { assignLeadByCourse } = require('../services/autoAssignService');
const { exportToExcelBuffer, parseLeadsExcelBuffer } = require('../services/excelService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get leads with pagination, search, status & course filter, scoped by role
// @route GET /api/leads
const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      status,
      course,
      source,
      form,
      websiteForm,
      assignedStaff,
      search,
      followUpDue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { ...req.leadScope };

    if (status) {
      if (status.includes(',')) {
        query.leadStatus = { $in: status.split(',').map((s) => s.trim()) };
      } else {
        query.leadStatus = status;
      }
    }
    if (course) {
      if (course.includes(',')) {
        query.interestedCourse = { $in: course.split(',').map((s) => s.trim()) };
      } else {
        query.interestedCourse = course;
      }
    }
    if (source) query.leadSource = source;
    if (form || websiteForm) {
      const formKey = form || websiteForm;
      query.$or = [{ websiteForm: formKey }, { campaignName: formKey }];
    }
    if (assignedStaff) query.assignedStaff = assignedStaff;

    // Follow-up due filter
    if (followUpDue === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      query.followUpDate = { $gte: todayStart, $lte: todayEnd };
    } else if (followUpDue === 'overdue') {
      query.followUpDate = { $lt: new Date(), $ne: null };
      query.leadStatus = { $nin: ['Admission Confirmed', 'Lost', 'Not Interested'] };
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { leadId: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedStaff', 'name email staffIdentifier role')
        .populate('courseRef', 'name courseCode')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Lead.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get single lead with activity log
// @route GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedStaff', 'name email staffIdentifier phone')
      .populate('courseRef')
      .populate('convertedStudentId', 'studentId name status');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Role verification
    if (req.user.role === 'staff') {
      const isAssigned = lead.assignedStaff && lead.assignedStaff._id.toString() === req.user._id.toString();
      const isCoursePermitted = req.user.assignedCourses && req.user.assignedCourses.includes(lead.interestedCourse);
      if (!isAssigned && !isCoursePermitted) {
        return res.status(403).json({ success: false, message: 'You are not authorized to view this lead.' });
      }
    }

    const activities = await LeadActivity.find({ leadId: lead._id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 });

    const assignments = await LeadAssignment.find({ leadId: lead._id })
      .populate('assignedTo', 'name staffIdentifier')
      .populate('assignedBy', 'name')
      .populate('previousStaff', 'name')
      .sort({ assignedAt: -1 });

    res.json({
      success: true,
      data: {
        ...lead.toObject(),
        activities,
        assignments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new lead (manual entry or internal API)
// @route POST /api/leads
const createLead = async (req, res) => {
  try {
    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      email,
      interestedCourse,
      leadSource = 'Manual entry',
      campaignName = '',
      adName = '',
      followUpDate,
      remarks = '',
    } = req.body;

    if (!customerName || !mobileNumber || !interestedCourse) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, mobile number, and interested course are required.',
      });
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);

    // Duplicate detection
    const duplicateQuery = { mobileNumber: cleanMobile };
    if (email) duplicateQuery.email = email.toLowerCase().trim();
    const existingLead = await Lead.findOne(duplicateQuery);

    const leadId = generateLeadId();

    // Find course reference
    const courseDoc = await Course.findOne({
      name: { $regex: new RegExp(`^${interestedCourse.trim()}$`, 'i') },
    });

    const lead = await Lead.create({
      leadId,
      customerName: customerName.trim(),
      mobileNumber: cleanMobile,
      whatsappNumber: whatsappNumber ? whatsappNumber.replace(/\D/g, '').slice(-10) : cleanMobile,
      email: email ? email.toLowerCase().trim() : undefined,
      interestedCourse: interestedCourse.trim(),
      courseRef: courseDoc ? courseDoc._id : null,
      leadSource,
      campaignName,
      adName,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      remarks,
      isDuplicate: !!existingLead,
      duplicateOfLeadId: existingLead ? existingLead._id : null,
      createdBy: req.user._id,
    });

    // Initial activity log
    await LeadActivity.create({
      leadId: lead._id,
      activityType: 'status_change',
      title: 'Lead Created',
      description: `Manual entry by ${req.user.name}. Interested course: ${lead.interestedCourse}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    // Course-wise staff assignment
    const assignResult = await assignLeadByCourse(lead, req.user);

    // Notifications
    if (assignResult.assignedStaffId) {
      await createNotification({
        recipientId: assignResult.assignedStaffId,
        title: 'New Lead Assigned to You',
        message: `Lead ${lead.customerName} (${lead.interestedCourse}) has been assigned to you.`,
        type: 'lead',
        link: `/leads?id=${lead._id}`,
        relatedEntityId: lead._id,
        relatedEntityType: 'Lead',
      });
    }

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_LEAD',
      module: 'LEADS',
      targetId: lead._id.toString(),
      description: `Created lead ${lead.leadId} for ${lead.customerName}`,
      req,
    });

    const populatedLead = await Lead.findById(lead._id).populate('assignedStaff', 'name email staffIdentifier');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: populatedLead,
      assignment: assignResult,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper function to normalize course names from website form submissions
const normalizeCourseName = (inputCourse = '') => {
  const c = inputCourse.toLowerCase().trim();
  if (c.includes('vfx') || c.includes('animation') || c.includes('3d')) return 'VFX & Animation';
  if (c.includes('ai video') || c.includes('ai edit')) return 'AI Video Editing';
  if (c.includes('video') || c.includes('edit') || c.includes('premiere')) return 'Video Editing';
  if (c.includes('drone') || c.includes('photo') || c.includes('camera')) return 'Drone Photography';
  if (c.includes('cod') || c.includes('programm') || c.includes('web') || c.includes('full stack') || c.includes('python') || c.includes('software')) return 'Coding';
  if (c.includes('graphic') || c.includes('design') || c.includes('photoshop') || c.includes('illustrator')) return 'Graphic Design';
  if (c.includes('market') || c.includes('digital') || c.includes('seo') || c.includes('social media')) return 'Digital Marketing';
  return inputCourse.trim() || 'General Enquiry';
};

// @desc Public website enquiry endpoint (no auth required)
// @route POST /api/leads/enquiry
const publicWebsiteEnquiry = async (req, res) => {
  try {
    const rawName = req.body.name || req.body.fullName || req.body['your-name'] || req.body.contact_name || req.body.customerName;
    const rawMobile = req.body.phone || req.body.mobile || req.body.phoneNumber || req.body['your-phone'] || req.body.tel || req.body.contact_phone;
    const rawEmail = req.body.email || req.body['your-email'] || req.body.contact_email;
    const rawCourse = req.body.course || req.body.interestedCourse || req.body.subject || req.body.program || req.body.service || req.body.selected_course;
    const rawCity = req.body.city || '';
    const rawGender = req.body.gender || '';
    const formSource = req.body.source || 'contact-page'; // 'contact-page' or 'home-enquiry-popup'
    const userMessage = req.body.message || req.body.remarks || req.body['your-message'] || req.body.comments || '';

    const remarksDetails = [
      userMessage,
      rawCity ? `City: ${rawCity}` : '',
      rawGender ? `Gender: ${rawGender}` : '',
      `Website Form: ${formSource}`,
    ].filter(Boolean).join(' | ');

    if (!rawName || !rawMobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone/mobile number are required fields.',
      });
    }

    const cleanMobile = String(rawMobile).replace(/\D/g, '').slice(-10);
    const normalizedCourse = normalizeCourseName(rawCourse || 'General Enquiry');

    const existingLead = await Lead.findOne({
      $or: [{ mobileNumber: cleanMobile }, ...(rawEmail ? [{ email: rawEmail.toLowerCase().trim() }] : [])],
    });

    const leadId = generateLeadId();
    const courseDoc = await Course.findOne({
      name: { $regex: new RegExp(`^${normalizedCourse}$`, 'i') },
    });

    const lead = await Lead.create({
      leadId,
      customerName: String(rawName).trim(),
      mobileNumber: cleanMobile,
      whatsappNumber: cleanMobile,
      email: rawEmail ? String(rawEmail).toLowerCase().trim() : undefined,
      city: rawCity,
      gender: rawGender,
      interestedCourse: normalizedCourse,
      courseRef: courseDoc ? courseDoc._id : null,
      leadSource: 'Website enquiries',
      campaignName: formSource,
      websiteForm: formSource,
      remarks: remarksDetails,
      isDuplicate: !!existingLead,
      duplicateOfLeadId: existingLead ? existingLead._id : null,
    });

    // Auto-split course-wise to Staff 1 or Staff 2
    const assignResult = await assignLeadByCourse(lead);

    // 1. Notify Admin
    await createNotification({
      roleTarget: 'admin',
      title: `Website Enquiry from ${formSource}`,
      message: `${lead.customerName} (${cleanMobile}) enquired for ${normalizedCourse} via ${formSource}. Allocated to: ${assignResult.staffName || 'Admin Queue'}.`,
      type: 'lead',
      link: `/leads?id=${lead._id}`,
      relatedEntityId: lead._id,
      relatedEntityType: 'Lead',
    });

    // 2. Notify assigned Staff member directly
    if (assignResult.assignedStaffId) {
      await createNotification({
        roleTarget: 'staff',
        recipientUserId: assignResult.assignedStaffId,
        title: `New Website Lead (${formSource})`,
        message: `${lead.customerName} (${cleanMobile}) enquired for ${normalizedCourse} from ${formSource}.`,
        type: 'lead',
        link: `/leads?id=${lead._id}`,
        relatedEntityId: lead._id,
        relatedEntityType: 'Lead',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Enquiry received successfully. Our admissions team will contact you shortly.',
      enquiryId: lead.leadId,
      assignedStaff: assignResult.staffName,
      course: normalizedCourse,
      form: formSource,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update lead details / status
// @route PUT /api/leads/:id
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const {
      customerName,
      mobileNumber,
      whatsappNumber,
      email,
      interestedCourse,
      leadStatus,
      followUpDate,
      remarks,
      assignedStaff,
    } = req.body;

    const previousStatus = lead.leadStatus;
    const previousCourse = lead.interestedCourse;

    if (customerName) lead.customerName = customerName;
    if (mobileNumber) lead.mobileNumber = mobileNumber.replace(/\D/g, '').slice(-10);
    if (whatsappNumber) lead.whatsappNumber = whatsappNumber.replace(/\D/g, '').slice(-10);
    if (email !== undefined) lead.email = email ? email.toLowerCase() : '';
    if (leadStatus) lead.leadStatus = leadStatus;
    if (followUpDate !== undefined) lead.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (remarks !== undefined) lead.remarks = remarks;

    // If course changed, reassign if unassigned or if course mapping changed
    if (interestedCourse && interestedCourse !== previousCourse) {
      lead.interestedCourse = interestedCourse;
      await assignLeadByCourse(lead, req.user);
    }

    // If admin explicitly reassigns staff
    if (assignedStaff && assignedStaff !== (lead.assignedStaff ? lead.assignedStaff.toString() : '')) {
      const prevStaff = lead.assignedStaff;
      lead.assignedStaff = assignedStaff;
      await LeadAssignment.create({
        leadId: lead._id,
        assignedTo: assignedStaff,
        assignedBy: req.user._id,
        previousStaff: prevStaff || null,
        assignmentRule: 'manual_reassignment',
        reason: 'Staff updated in lead edit',
        assignedAt: new Date(),
      });
    }

    await lead.save();

    // Log status change activity
    if (leadStatus && leadStatus !== previousStatus) {
      await LeadActivity.create({
        leadId: lead._id,
        activityType: 'status_change',
        title: `Status changed to ${leadStatus}`,
        description: `Status updated from "${previousStatus}" to "${leadStatus}" by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
      });
    }

    res.json({ success: true, message: 'Lead updated successfully', data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Add activity / call log / note to lead
// @route POST /api/leads/:id/activities
const addLeadActivity = async (req, res) => {
  try {
    const { activityType, title, description, callOutcome, durationMinutes, followUpDate, newStatus } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const activity = await LeadActivity.create({
      leadId: lead._id,
      activityType: activityType || 'note',
      title: title || `${activityType} recorded`,
      description: description || '',
      callOutcome,
      durationMinutes,
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    lead.lastContactedAt = new Date();
    if (followUpDate) lead.followUpDate = new Date(followUpDate);
    if (newStatus) lead.leadStatus = newStatus;
    await lead.save();

    res.status(201).json({ success: true, data: activity, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Bulk import leads from Excel
// @route POST /api/leads/bulk-import
const bulkImportLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) file' });
    }

    const rawLeads = await parseLeadsExcelBuffer(req.file.buffer);
    if (!rawLeads || rawLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid lead records found in the uploaded file.' });
    }

    const results = {
      total: rawLeads.length,
      saved: 0,
      duplicates: 0,
      errors: 0,
    };

    for (const item of rawLeads) {
      try {
        const existing = await Lead.findOne({
          $or: [{ mobileNumber: item.mobileNumber }, ...(item.email ? [{ email: item.email }] : [])],
        });

        const isDup = !!existing;
        const lead = await Lead.create({
          leadId: generateLeadId(),
          customerName: item.customerName,
          mobileNumber: item.mobileNumber,
          whatsappNumber: item.whatsappNumber,
          email: item.email,
          interestedCourse: item.interestedCourse,
          leadSource: item.leadSource || 'Bulk Excel Import',
          remarks: item.remarks,
          isDuplicate: isDup,
          duplicateOfLeadId: isDup ? existing._id : null,
          createdBy: req.user._id,
        });

        await assignLeadByCourse(lead, req.user);
        results.saved++;
        if (isDup) results.duplicates++;
      } catch (e) {
        results.errors++;
      }
    }

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BULK_IMPORT_LEADS',
      module: 'LEADS',
      description: `Bulk imported ${results.saved} leads from file ${req.file.originalname}`,
      req,
    });

    res.json({
      success: true,
      message: `Bulk import completed: ${results.saved} leads saved (${results.duplicates} flagged duplicates), ${results.errors} errors.`,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Export leads to Excel
// @route GET /api/leads/export
const exportLeadsExcel = async (req, res) => {
  try {
    const query = { ...req.leadScope };
    const { status, course } = req.query;
    if (status) query.leadStatus = status;
    if (course) query.interestedCourse = course;

    const leads = await Lead.find(query).populate('assignedStaff', 'name staffIdentifier');

    const columns = [
      { header: 'Lead ID', key: 'leadId', width: 18 },
      { header: 'Customer Name', key: 'customerName', width: 22 },
      { header: 'Mobile Number', key: 'mobileNumber', width: 16 },
      { header: 'WhatsApp', key: 'whatsappNumber', width: 16 },
      { header: 'Email Address', key: 'email', width: 24 },
      { header: 'Interested Course', key: 'interestedCourse', width: 22 },
      { header: 'Lead Source', key: 'leadSource', width: 18 },
      { header: 'Campaign Name', key: 'campaignName', width: 20 },
      { header: 'Status', key: 'leadStatus', width: 20 },
      { header: 'Assigned Staff', key: 'staffName', width: 20 },
      { header: 'Enquiry Date', key: 'enquiryDateStr', width: 16 },
      { header: 'Follow-up Date', key: 'followUpDateStr', width: 16 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ];

    const data = leads.map((l) => ({
      leadId: l.leadId,
      customerName: l.customerName,
      mobileNumber: l.mobileNumber,
      whatsappNumber: l.whatsappNumber,
      email: l.email || '',
      interestedCourse: l.interestedCourse,
      leadSource: l.leadSource,
      campaignName: l.campaignName || '',
      leadStatus: l.leadStatus,
      staffName: l.assignedStaff ? l.assignedStaff.name : 'Unassigned',
      enquiryDateStr: l.enquiryDate ? new Date(l.enquiryDate).toLocaleDateString('en-IN') : '',
      followUpDateStr: l.followUpDate ? new Date(l.followUpDate).toLocaleDateString('en-IN') : '',
      remarks: l.remarks || '',
    }));

    const buffer = await exportToExcelBuffer({ sheetName: 'Leads', columns, data });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Whitehouse_Leads_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Delete lead (Admin only)
// @route DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    await LeadActivity.deleteMany({ leadId: req.params.id });

    res.json({ success: true, message: 'Lead and associated activities deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  publicWebsiteEnquiry,
  updateLead,
  addLeadActivity,
  bulkImportLeads,
  exportLeadsExcel,
  deleteLead,
};
