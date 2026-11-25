const { Placement, Student } = require('../models');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get placement records
// @route GET /api/placements
const getPlacements = async (req, res) => {
  try {
    const { jobStatus, company, courseName } = req.query;
    const query = {};

    if (jobStatus) query.jobStatus = jobStatus;
    if (company) query.company = { $regex: company, $options: 'i' };
    if (courseName) query.courseName = courseName;

    const placements = await Placement.find(query)
      .populate('studentId', 'studentId name mobile email status photoUrl')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: placements.length, data: placements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create or update placement record
// @route POST /api/placements/update
const updatePlacement = async (req, res) => {
  try {
    const {
      studentId,
      jobStatus,
      company,
      jobRole,
      workLocation,
      interviewDate,
      placementDate,
      resumeUrl,
      portfolioUrl,
      salaryPackageAnnual,
      voluntarySalaryReported = false,
      remarks,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updatePayload = {
      studentId: student._id,
      studentUniqueId: student.studentId,
      studentName: student.name,
      courseName: student.courseName,
      jobStatus: jobStatus || 'Job Seeking',
      company: company || '',
      jobRole: jobRole || '',
      workLocation: workLocation || '',
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      placementDate: placementDate ? new Date(placementDate) : undefined,
      resumeUrl: resumeUrl || '',
      portfolioUrl: portfolioUrl || '',
      salaryPackageAnnual: voluntarySalaryReported && salaryPackageAnnual ? Number(salaryPackageAnnual) : null,
      voluntarySalaryReported: !!voluntarySalaryReported,
      remarks: remarks || '',
      updatedBy: req.user._id,
    };

    const placement = await Placement.findOneAndUpdate({ studentId: student._id }, updatePayload, {
      upsert: true,
      new: true,
    });

    // If placed, update student status to Alumni
    if (jobStatus === 'Placed') {
      student.status = 'Alumni';
      await student.save();

      await createNotification({
        roleTarget: 'all',
        title: 'Student Placed! Congratulations',
        message: `${student.name} (${student.courseName}) placed at ${company} as ${jobRole}!`,
        type: 'placement',
        link: `/placements?id=${placement._id}`,
        relatedEntityId: placement._id,
        relatedEntityType: 'Placement',
      });
    }

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_PLACEMENT',
      module: 'PLACEMENTS',
      targetId: placement._id.toString(),
      description: `Updated placement for student ${student.studentId}: ${jobStatus} at ${company || 'N/A'}`,
      req,
    });

    res.status(200).json({ success: true, message: 'Placement details saved successfully', data: placement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPlacements,
  updatePlacement,
};
