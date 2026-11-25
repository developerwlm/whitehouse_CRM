const { User } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get all users with filters
// @route GET /api/users
const getUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get user by ID
// @route GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new user (Admin only)
// @route POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, staffIdentifier, phone, assignedCourses } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      staffIdentifier,
      phone,
      assignedCourses: assignedCourses || [],
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_USER',
      module: 'USERS',
      targetId: user._id.toString(),
      description: `Created user ${user.name} with role ${user.role}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffIdentifier: user.staffIdentifier,
        assignedCourses: user.assignedCourses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update user
// @route PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, staffIdentifier, phone, assignedCourses, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (staffIdentifier !== undefined) user.staffIdentifier = staffIdentifier;
    if (phone !== undefined) user.phone = phone;
    if (assignedCourses) user.assignedCourses = assignedCourses;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_USER',
      module: 'USERS',
      targetId: user._id.toString(),
      description: `Updated user ${user.name}`,
      req,
    });

    res.json({ success: true, message: 'User updated successfully', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Delete user
// @route DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete or deactivate
    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User account deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
