const { User, InstituteSettings, LeadAssignment } = require('../models');

// Fallback course to staff identifier mapping
const DEFAULT_COURSE_STAFF_MAP = {
  'Digital Marketing': 'Staff 1',
  'Performance Marketing': 'Staff 1',
  'Full Stack Development': 'Staff 1',
  'Graphic Designing': 'Staff 2',
  'Video Editing': 'Staff 2',
  'AI Video Editing': 'Staff 2',
  'VFX & Animation': 'Staff 1',
  'Drone Cinematics': 'Staff 2',
  // Backward compatibility aliases
  'VFX': 'Staff 1',
  'Coding': 'Staff 1',
  'Graphic Design': 'Staff 2',
  'Drone Photography': 'Staff 2',
};

/**
 * Assigns lead automatically based on the interested course.
 * @param {Object} lead - The lead document
 * @param {Object} [performedByUser=null] - User who triggered the assignment (if manual)
 * @returns {Promise<{ assignedStaffId: ObjectId|null, staffName: String|null, isUnassigned: Boolean }>}
 */
const assignLeadByCourse = async (lead, performedByUser = null) => {
  try {
    let course = lead.interestedCourse ? lead.interestedCourse.trim() : '';

    // Standardize course name variations to the 8 official institute courses
    const cLower = course.toLowerCase();
    if (cLower.includes('vfx') || cLower.includes('animation')) course = 'VFX & Animation';
    else if (cLower.includes('ai video') || cLower.includes('ai edit')) course = 'AI Video Editing';
    else if (cLower.includes('video') || cLower.includes('edit')) course = 'Video Editing';
    else if (cLower.includes('drone') || cLower.includes('cinema') || cLower.includes('aerial')) course = 'Drone Cinematics';
    else if (cLower.includes('full stack') || cLower.includes('stack') || cLower.includes('cod') || cLower.includes('web') || cLower.includes('mern') || cLower.includes('program')) course = 'Full Stack Development';
    else if (cLower.includes('performance') || (cLower.includes('ad') && cLower.includes('market'))) course = 'Performance Marketing';
    else if (cLower.includes('market') || cLower.includes('digital') || cLower.includes('seo') || cLower.includes('social')) course = 'Digital Marketing';
    else if (cLower.includes('graphic') || cLower.includes('design') || cLower.includes('photo') || cLower.includes('illustrat')) course = 'Graphic Designing';

    // Keep lead model updated with normalized course name
    lead.interestedCourse = course;

    // 1. Check if InstituteSettings has custom mapping
    const settings = await InstituteSettings.findOne();
    let assignedUserId = null;
    let staffName = null;

    if (settings && settings.courseAssignments && settings.courseAssignments.length > 0) {
      const match = settings.courseAssignments.find(
        (c) => c.courseName.toLowerCase() === course.toLowerCase()
      );
      if (match && match.assignedStaffId) {
        assignedUserId = match.assignedStaffId;
        staffName = match.assignedStaffName || 'Staff';
      }
    }

    // 2. Dynamic lookup: find active staff member who has this course in assignedCourses
    if (!assignedUserId && course) {
      const staffByCourse = await User.findOne({
        role: 'staff',
        isActive: true,
        assignedCourses: { $regex: new RegExp(`^${course}$`, 'i') },
      });

      if (staffByCourse) {
        assignedUserId = staffByCourse._id;
        staffName = staffByCourse.name;
      }
    }

    // 3. Fallback: check DEFAULT_COURSE_STAFF_MAP
    if (!assignedUserId && course) {
      const mappedKey = Object.keys(DEFAULT_COURSE_STAFF_MAP).find(
        (k) => k.toLowerCase() === course.toLowerCase()
      );

      if (mappedKey) {
        const staffIdentifier = DEFAULT_COURSE_STAFF_MAP[mappedKey];
        const staffUser = await User.findOne({
          $or: [
            { staffIdentifier: staffIdentifier, isActive: true },
            { name: new RegExp(staffIdentifier, 'i'), role: 'staff', isActive: true },
          ],
        });

        if (staffUser) {
          assignedUserId = staffUser._id;
          staffName = staffUser.name;
        }
      }
    }

    // 3. If still unknown or unassigned -> goes to Admin unassigned lead queue
    if (!assignedUserId) {
      lead.assignedStaff = null;
      await lead.save();
      return { assignedStaffId: null, staffName: 'Unassigned (Admin Queue)', isUnassigned: true };
    }

    // 4. Update lead and create LeadAssignment history
    const previousStaff = lead.assignedStaff;
    lead.assignedStaff = assignedUserId;
    await lead.save();

    await LeadAssignment.create({
      leadId: lead._id,
      assignedTo: assignedUserId,
      assignedBy: performedByUser ? performedByUser._id : null,
      previousStaff: previousStaff || null,
      assignmentRule: performedByUser ? 'manual_reassignment' : 'course_auto_allocation',
      reason: `Assigned based on course "${course}"`,
      assignedAt: new Date(),
    });

    return { assignedStaffId: assignedUserId, staffName, isUnassigned: false };
  } catch (error) {
    console.error('[AutoAssignService] Error:', error.message);
    return { assignedStaffId: null, staffName: null, isUnassigned: true, error: error.message };
  }
};

module.exports = {
  assignLeadByCourse,
  DEFAULT_COURSE_STAFF_MAP,
};
