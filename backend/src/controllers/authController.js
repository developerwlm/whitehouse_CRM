const jwt = require('jsonwebtoken');
const { User, Student } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');
const { logAudit } = require('../middleware/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = typeof password === 'string' ? password.trim() : password;

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      // Check if user entered Student ID or Phone number instead of email
      const studentMatch = await Student.findOne({
        $or: [
          { studentId: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
          { mobile: cleanEmail },
          { email: cleanEmail },
        ],
      });
      if (studentMatch && studentMatch.userId) {
        user = await User.findById(studentMatch.userId).select('+password');
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: User not found in CRM.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await user.comparePassword(cleanPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: Password does not match.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // If student role, find linked student profile ID
    let linkedStudent = null;
    if (user.role === 'student') {
      linkedStudent = await Student.findOne({
        $or: [{ userId: user._id }, { email: user.email }],
      }).select('_id studentId name courseName');
    }

    await logAudit({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'LOGIN',
      module: 'AUTH',
      description: `User ${user.email} logged in successfully`,
      req,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffIdentifier: user.staffIdentifier,
        assignedCourses: user.assignedCourses,
        avatar: user.avatar,
        linkedStudentId: linkedStudent ? linkedStudent._id : null,
        linkedStudentUniqueId: linkedStudent ? linkedStudent.studentId : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Check if CRM needs initial Admin setup (0 admin users)
// @route GET /api/auth/setup-status
const getSetupStatus = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({
      success: true,
      needsSetup: adminCount === 0,
      adminCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Setup initial Administrator account when 0 admins exist
// @route POST /api/auth/setup-admin
const setupInitialAdmin = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'CRM already has an administrator configured.',
      });
    }

    const { name, email, password } = req.body;
    const cleanEmail = (email || 'admin@whitehouse.com').trim().toLowerCase();
    const cleanPassword = (password || 'admin123').trim();
    const cleanName = (name || 'Director Admin').trim();

    const admin = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: 'admin',
      phone: '9876543210',
    });

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Initial Administrator created successfully',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get current logged in user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let linkedStudent = null;
    if (user.role === 'student') {
      linkedStudent = await Student.findOne({
        $or: [{ userId: user._id }, { email: user.email }],
      }).select('_id studentId name courseName batchName');
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffIdentifier: user.staffIdentifier,
        phone: user.phone,
        avatar: user.avatar,
        assignedCourses: user.assignedCourses,
        linkedStudent,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update password
// @route PUT /api/auth/update-password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  login,
  getMe,
  updatePassword,
  getSetupStatus,
  setupInitialAdmin,
};
