const { InstituteSettings, User } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get institute settings & course assignment mappings
// @route GET /api/settings
const getInstituteSettings = async (req, res) => {
  try {
    let settings = await InstituteSettings.findOne();
    if (!settings) {
      // Find Staff 1 and Staff 2 if seeded
      const staff1 = await User.findOne({ staffIdentifier: 'Staff 1' });
      const staff2 = await User.findOne({ staffIdentifier: 'Staff 2' });

      settings = await InstituteSettings.create({
        instituteName: 'Whitehouse Skill Development Institute',
        tagline: 'Premier Professional & Creative Skills Training',
        address: {
          street: 'Pasumalai',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625004',
          country: 'India',
        },
        phone: '+91 98765 43210',
        email: 'info@whitehouseinstitute.in',
        website: 'https://whitehouseinstitute.in',
        courseAssignments: [
          { courseName: 'VFX & Animation', assignedStaffId: staff1 ? staff1._id : null, assignedStaffName: 'Staff 1' },
          { courseName: 'Video Editing', assignedStaffId: staff1 ? staff1._id : null, assignedStaffName: 'Staff 1' },
          { courseName: 'AI Video Editing', assignedStaffId: staff1 ? staff1._id : null, assignedStaffName: 'Staff 1' },
          { courseName: 'Drone Photography', assignedStaffId: staff1 ? staff1._id : null, assignedStaffName: 'Staff 1' },
          { courseName: 'Coding', assignedStaffId: staff2 ? staff2._id : null, assignedStaffName: 'Staff 2' },
          { courseName: 'Graphic Design', assignedStaffId: staff2 ? staff2._id : null, assignedStaffName: 'Staff 2' },
          { courseName: 'Digital Marketing', assignedStaffId: staff2 ? staff2._id : null, assignedStaffName: 'Staff 2' },
        ],
        eligibilityCriteria: {
          minAttendancePercent: 75,
          minAssignmentPercent: 60,
          requireExamPassed: true,
          requireFeesCleared: true,
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update institute settings (Admin only)
// @route PUT /api/settings
const updateInstituteSettings = async (req, res) => {
  try {
    const { instituteName, tagline, address, phone, email, website, eligibilityCriteria, courseAssignments } = req.body;

    let settings = await InstituteSettings.findOne();
    if (!settings) {
      settings = new InstituteSettings();
    }

    if (instituteName) settings.instituteName = instituteName;
    if (tagline) settings.tagline = tagline;
    if (address) settings.address = address;
    if (phone) settings.phone = phone;
    if (email) settings.email = email;
    if (website) settings.website = website;
    if (eligibilityCriteria) settings.eligibilityCriteria = eligibilityCriteria;

    // Update dynamic course assignments
    if (courseAssignments && Array.isArray(courseAssignments)) {
      settings.courseAssignments = courseAssignments;

      // Synchronize assignedCourses on User documents for Staff 1 and Staff 2
      for (const mapping of courseAssignments) {
        if (mapping.assignedStaffId) {
          await User.findByIdAndUpdate(mapping.assignedStaffId, {
            $addToSet: { assignedCourses: mapping.courseName },
          });
        }
      }
    }

    await settings.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_SETTINGS',
      module: 'SETTINGS',
      description: 'Updated institute settings and course assignment rules',
      req,
    });

    res.json({ success: true, message: 'Settings saved successfully', data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getInstituteSettings,
  updateInstituteSettings,
};
