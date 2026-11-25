const { Batch, BatchStudent, Student, Course, User } = require('../models');
const { generateBatchId } = require('../utils/idGenerator');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get all batches with course and trainer details
// @route GET /api/batches
const getBatches = async (req, res) => {
  try {
    const { courseId, trainerId, status } = req.query;
    const query = {};

    if (courseId) query.courseId = courseId;
    if (trainerId) query.trainerId = trainerId;
    if (status) query.status = status;

    if (req.user.role === 'trainer') {
      query.trainerId = req.user._id;
    }

    const batches = await Batch.find(query)
      .populate('courseId', 'name courseCode durationWeeks')
      .populate('trainerId', 'name email phone avatar')
      .sort({ startDate: -1 });

    res.json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get single batch by ID with enrolled students list
// @route GET /api/batches/:id
const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('courseId')
      .populate('trainerId', 'name email phone avatar');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const enrolledRecords = await BatchStudent.find({ batchId: batch._id, status: 'Active' })
      .populate('studentId', 'studentId name mobile email status admissionDate photoUrl')
      .sort({ enrollmentDate: -1 });

    const students = enrolledRecords.map((r) => r.studentId).filter(Boolean);

    res.json({
      success: true,
      data: {
        ...batch.toObject(),
        enrolledStudents: students,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create new batch (Admin only)
// @route POST /api/batches
const createBatch = async (req, res) => {
  try {
    const {
      name,
      courseId,
      startDate,
      endDate,
      classTimings,
      trainingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      trainerId,
      studentCapacity = 25,
      status = 'Ongoing',
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ success: false, message: 'Invalid course selected' });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer) {
      return res.status(400).json({ success: false, message: 'Invalid trainer selected' });
    }

    const batchId = generateBatchId(course.courseCode || 'GEN');

    const batch = await Batch.create({
      batchId,
      name,
      courseId: course._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      classTimings: classTimings || { startTime: '10:00 AM', endTime: '01:00 PM' },
      trainingDays,
      trainerId: trainer._id,
      studentCapacity,
      currentEnrollment: 0,
      status,
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_BATCH',
      module: 'BATCHES',
      targetId: batch._id.toString(),
      description: `Created batch ${batch.name} (${batch.batchId}) for ${course.name}`,
      req,
    });

    res.status(201).json({ success: true, message: 'Batch created successfully', data: batch });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A batch with this Batch ID or Name already exists.',
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update batch details
// @route PUT /api/batches/:id
const updateBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const { name, startDate, endDate, classTimings, trainingDays, trainerId, studentCapacity, status } = req.body;

    if (name) batch.name = name;
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (classTimings) batch.classTimings = classTimings;
    if (trainingDays) batch.trainingDays = trainingDays;
    if (trainerId) batch.trainerId = trainerId;
    if (studentCapacity !== undefined) batch.studentCapacity = studentCapacity;
    if (status) batch.status = status;

    await batch.save();

    res.json({ success: true, message: 'Batch updated successfully', data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Transfer student between batches
// @route POST /api/batches/transfer-student
const transferStudent = async (req, res) => {
  try {
    const { studentId, sourceBatchId, targetBatchId, reason = 'Batch transfer' } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const targetBatch = await Batch.findById(targetBatchId);
    if (!targetBatch) {
      return res.status(404).json({ success: false, message: 'Target batch not found' });
    }

    // Update source batch student record
    if (sourceBatchId) {
      await BatchStudent.findOneAndUpdate(
        { batchId: sourceBatchId, studentId: student._id },
        {
          status: 'Transferred',
          $push: {
            transferHistory: {
              fromBatchId: sourceBatchId,
              toBatchId: targetBatch._id,
              transferredAt: new Date(),
              transferredBy: req.user._id,
              reason,
            },
          },
        }
      );
      await Batch.findByIdAndUpdate(sourceBatchId, { $inc: { currentEnrollment: -1 } });
    }

    // Add / update in target batch
    await BatchStudent.findOneAndUpdate(
      { batchId: targetBatch._id, studentId: student._id },
      {
        batchId: targetBatch._id,
        studentId: student._id,
        enrollmentDate: new Date(),
        status: 'Active',
      },
      { upsert: true }
    );
    await Batch.findByIdAndUpdate(targetBatch._id, { $inc: { currentEnrollment: 1 } });

    student.batchId = targetBatch._id;
    student.batchName = targetBatch.name;
    if (targetBatch.trainerId) {
      student.trainerId = targetBatch.trainerId;
    }
    await student.save();

    res.json({ success: true, message: `Student transferred to batch ${targetBatch.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  transferStudent,
};
