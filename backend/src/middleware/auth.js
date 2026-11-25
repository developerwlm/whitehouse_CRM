const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'whitehouse_crm_jwt_super_secret_key_2026';

/**
 * Protects routes by validating JWT bearer token
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Grants access only to specific user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

/**
 * Middleware that attaches scoping query constraints for leads based on role.
 * Admin: all leads
 * Staff: only leads assigned to this staff member OR leads belonging to staff's assigned courses
 */
const scopeLeadAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    req.leadScope = {}; // Admin sees all
    return next();
  }

  if (req.user.role === 'staff') {
    // Staff can access leads assigned directly to them OR matching their assigned course list
    const conditions = [{ assignedStaff: req.user._id }];
    if (req.user.assignedCourses && req.user.assignedCourses.length > 0) {
      conditions.push({ interestedCourse: { $in: req.user.assignedCourses } });
    }
    req.leadScope = { $or: conditions };
    return next();
  }

  // Other roles should not access leads
  return res.status(403).json({
    success: false,
    message: 'Access denied: Only Admin and Staff can access lead records.',
  });
};

/**
 * Middleware that attaches scoping query constraints for students based on role.
 * Admin: all students
 * Staff: students enrolled in their assigned courses or assigned staff
 * Trainer: students in batches assigned to this trainer
 * Student: only their own student record
 */
const scopeStudentAccess = async (req, res, next) => {
  if (req.user.role === 'admin') {
    req.studentScope = {};
    return next();
  }

  if (req.user.role === 'staff') {
    const conditions = [{ assignedStaff: req.user._id }];
    if (req.user.assignedCourses && req.user.assignedCourses.length > 0) {
      conditions.push({ courseName: { $in: req.user.assignedCourses } });
    }
    req.studentScope = { $or: conditions };
    return next();
  }

  if (req.user.role === 'trainer') {
    req.studentScope = { trainerId: req.user._id };
    return next();
  }

  if (req.user.role === 'student') {
    const student = await Student.findOne({
      $or: [{ userId: req.user._id }, { email: req.user.email }],
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not linked to user account.' });
    }
    req.studentScope = { _id: student._id };
    req.currentStudent = student;
    return next();
  }

  return res.status(403).json({ success: false, message: 'Forbidden' });
};

module.exports = {
  protect,
  authorize,
  scopeLeadAccess,
  scopeStudentAccess,
  JWT_SECRET,
};
