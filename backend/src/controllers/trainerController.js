const { User, Trainer, Batch, Student } = require('../models');

// @desc Get all trainers
// @route GET /api/trainers
const getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer', isActive: true }).select('-password');

    // Attach trainer profile information and active batches
    const trainerProfiles = await Promise.all(
      trainers.map(async (t) => {
        const profile = await Trainer.findOne({ userId: t._id });
        const batches = await Batch.find({ trainerId: t._id, status: 'Ongoing' }).select('name batchId courseId studentCapacity currentEnrollment');
        const studentCount = await Student.countDocuments({ trainerId: t._id, status: 'Active' });

        return {
          ...t.toObject(),
          profile: profile || {},
          activeBatches: batches,
          totalActiveStudents: studentCount,
        };
      })
    );

    res.json({ success: true, count: trainerProfiles.length, data: trainerProfiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get trainer dashboard / batches
// @route GET /api/trainers/:id/batches
const getTrainerBatches = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const batches = await Batch.find({ trainerId }).populate('courseId', 'name courseCode durationWeeks');
    res.json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create a new faculty trainer
// @route POST /api/trainers
const createTrainer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specializations = [],
      experienceYears = 3,
      qualification = '',
      bio = '',
      assignedCourses = [],
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const userPassword = password && password.trim().length >= 6 ? password.trim() : 'Trainer@123';

    const parsedSpecializations = Array.isArray(specializations)
      ? specializations
      : (typeof specializations === 'string' ? specializations.split(',').map(s => s.trim()).filter(Boolean) : []);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: userPassword,
      phone: phone ? phone.trim() : '',
      role: 'trainer',
      assignedCourses: Array.isArray(assignedCourses) && assignedCourses.length > 0
        ? assignedCourses
        : parsedSpecializations,
      isActive: true,
    });

    const trainerProfile = await Trainer.create({
      userId: user._id,
      specializations: parsedSpecializations,
      experienceYears: Number(experienceYears) || 3,
      qualification,
      bio,
      rating: 4.8,
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Faculty trainer created successfully',
      data: {
        ...user.toObject(),
        profile: trainerProfile,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update trainer profile
// @route PUT /api/trainers/:id
const updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      specializations,
      experienceYears,
      qualification,
      bio,
      rating,
      status,
      assignedCourses,
      isActive,
    } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (isActive !== undefined) user.isActive = isActive;
    if (assignedCourses) user.assignedCourses = assignedCourses;
    await user.save();

    let profile = await Trainer.findOne({ userId: user._id });
    if (!profile) {
      profile = new Trainer({ userId: user._id });
    }

    if (specializations !== undefined) {
      profile.specializations = Array.isArray(specializations)
        ? specializations
        : specializations.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (experienceYears !== undefined) profile.experienceYears = Number(experienceYears);
    if (qualification !== undefined) profile.qualification = qualification;
    if (bio !== undefined) profile.bio = bio;
    if (rating !== undefined) profile.rating = Number(rating);
    if (status !== undefined) profile.status = status;
    await profile.save();

    res.json({
      success: true,
      message: 'Trainer updated successfully',
      data: {
        ...user.toObject(),
        profile,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Deactivate trainer
// @route DELETE /api/trainers/:id
const deleteTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.role !== 'trainer') {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    user.isActive = false;
    await user.save();

    await Trainer.findOneAndUpdate({ userId: user._id }, { status: 'Inactive' });

    res.json({ success: true, message: 'Trainer deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTrainers,
  getTrainerBatches,
  createTrainer,
  updateTrainer,
  deleteTrainer,
};
