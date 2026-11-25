const { Course, SyllabusWeek, Lesson } = require('../models');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get all courses
// @route GET /api/courses
const getCourses = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const query = {};

    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .populate('assignedTrainers', 'name email')
      .populate('defaultAssignedStaff', 'name staffIdentifier')
      .sort({ name: 1 });

    res.json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get course by ID with its syllabus weeks
// @route GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('assignedTrainers', 'name email phone avatar')
      .populate('defaultAssignedStaff', 'name staffIdentifier');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const syllabus = await SyllabusWeek.find({ courseId: course._id }).sort({ weekNumber: 1 });

    res.json({ success: true, data: { ...course.toObject(), syllabus } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new course (Admin only)
// @route POST /api/courses
const createCourse = async (req, res) => {
  try {
    const {
      name,
      courseCode,
      description,
      durationWeeks = 12,
      durationMonths = 3,
      totalHours = 120,
      fee,
      assignedTrainers = [],
      defaultAssignedStaff,
      syllabusOverview,
    } = req.body;

    if (!name || !courseCode || !fee) {
      return res.status(400).json({ success: false, message: 'Name, course code, and fee are required.' });
    }

    const course = await Course.create({
      name: name.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      description,
      durationWeeks,
      durationMonths,
      totalHours,
      fee,
      assignedTrainers,
      defaultAssignedStaff,
      syllabusOverview,
    });

    // Automatically generate 12 default syllabus weeks for the course if requested
    const defaultSyllabus = [
      'Introduction & Core Fundamentals',
      'Tools & Interface Walkthrough',
      'Core Mechanics & Workflows',
      'Intermediate Practical Techniques',
      'Advanced Workflows & Asset Handling',
      'Project Integration & Hands-on Lab',
      'Mid-Course Practical Project',
      'Industry Workflows & Optimization',
      'Advanced Techniques & Masterclasses',
      'Portfolio & Project Development',
      'Final Real-world Project',
      'Comprehensive Final Assessment & Review',
    ];

    for (let w = 1; w <= durationWeeks; w++) {
      const title = defaultSyllabus[w - 1] || `Week ${w} Advanced Training`;
      await SyllabusWeek.create({
        courseId: course._id,
        weekNumber: w,
        title,
        description: `Comprehensive training modules for Week ${w}`,
        isPracticalProject: w === 7 || w === 11,
        isFinalAssessment: w === durationWeeks,
        order: w,
      });
    }

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_COURSE',
      module: 'COURSES',
      targetId: course._id.toString(),
      description: `Created course ${course.name} (${course.courseCode})`,
      req,
    });

    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A course with this Course Code or Name already exists in the database.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update course
// @route PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const {
      name,
      courseCode,
      description,
      durationWeeks,
      durationMonths,
      totalHours,
      fee,
      assignedTrainers,
      defaultAssignedStaff,
      syllabusOverview,
      isActive,
    } = req.body;

    if (name) course.name = name;
    if (courseCode) course.courseCode = courseCode.toUpperCase();
    if (description !== undefined) course.description = description;
    if (durationWeeks) course.durationWeeks = durationWeeks;
    if (durationMonths) course.durationMonths = durationMonths;
    if (totalHours) course.totalHours = totalHours;
    if (fee !== undefined) course.fee = fee;
    if (assignedTrainers) course.assignedTrainers = assignedTrainers;
    if (defaultAssignedStaff !== undefined) course.defaultAssignedStaff = defaultAssignedStaff;
    if (syllabusOverview !== undefined) course.syllabusOverview = syllabusOverview;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_COURSE',
      module: 'COURSES',
      targetId: course._id.toString(),
      description: `Updated course ${course.name}`,
      req,
    });

    res.json({ success: true, message: 'Course updated successfully', data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Delete course
// @route DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.isActive = false;
    await course.save();

    res.json({ success: true, message: 'Course marked inactive' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
