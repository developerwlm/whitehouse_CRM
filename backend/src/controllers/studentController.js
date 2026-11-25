const {
  Student,
  Course,
  Batch,
  BatchStudent,
  User,
  Admission,
  StudentFee,
  Payment,
  Attendance,
  StudentProgress,
  AssignmentSubmission,
  ExamResult,
  Certificate,
  Placement,
  LeadActivity,
  Lead,
} = require('../models');
const { logAudit } = require('../middleware/auditLogger');
const { createNotification } = require('../services/notificationService');

// @desc Get students with search, filters, pagination, and role scoping
// @route GET /api/students
const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      status,
      courseId,
      batchId,
      trainerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { ...req.studentScope };

    if (status) query.status = status;
    if (courseId) query.courseId = courseId;
    if (batchId) query.batchId = batchId;
    if (trainerId) query.trainerId = trainerId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('courseId', 'name courseCode')
        .populate('batchId', 'name batchId startDate')
        .populate('trainerId', 'name email')
        .populate('assignedStaff', 'name staffIdentifier')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Student.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: students,
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

// @desc Get comprehensive 15-section Student Profile
// @route GET /api/students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('courseId')
      .populate('batchId')
      .populate('trainerId', 'name email phone avatar')
      .populate('assignedStaff', 'name email staffIdentifier')
      .populate('admissionId');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role-based access validation
    if (req.user.role === 'staff') {
      const staffIdStr = req.user._id.toString();
      const studentStaffId = student.assignedStaff
        ? (student.assignedStaff._id || student.assignedStaff).toString()
        : null;
      const isAssigned = studentStaffId === staffIdStr;

      const studentCourseName = (
        student.courseName ||
        (student.courseId && student.courseId.name) ||
        ''
      ).trim().toLowerCase();
      const userAssigned = (req.user.assignedCourses || []).map((c) => c.trim().toLowerCase());
      const isCoursePermitted = userAssigned.includes(studentCourseName);

      const isProcessedByStaff =
        student.admissionId &&
        ((student.admissionId.counsellorId &&
          student.admissionId.counsellorId.toString() === staffIdStr) ||
          (student.admissionId.processedBy &&
            student.admissionId.processedBy.toString() === staffIdStr));

      if (!isAssigned && !isCoursePermitted && !isProcessedByStaff) {
        return res.status(403).json({
          success: false,
          message: `Access restricted: You are assigned to manage ${req.user.assignedCourses?.join(', ') || 'your designated courses'}. This student is enrolled in ${student.courseName || 'another department'}.`,
        });
      }
    } else if (req.user.role === 'trainer') {
      const isTrainerMatch = student.trainerId && student.trainerId._id.toString() === req.user._id.toString();
      if (!isTrainerMatch) {
        return res.status(403).json({ success: false, message: 'You are only authorized to view students in your batches.' });
      }
    } else if (req.user.role === 'student') {
      const isSelf = (student.userId && student.userId.toString() === req.user._id.toString()) || student.email === req.user.email;
      if (!isSelf) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own student record.' });
      }
    }

    // Parallel fetch of all 15 profile sections
    const [
      admission,
      feeRecord,
      payments,
      attendanceRecords,
      progress,
      assignments,
      examResults,
      certificate,
      placement,
      leadActivities,
    ] = await Promise.all([
      Admission.findOne({ studentId: student._id }).populate('counsellorId', 'name staffIdentifier'),
      StudentFee.findOne({ studentId: student._id }),
      Payment.find({ studentId: student._id }).sort({ paymentDate: -1 }),
      Attendance.find({ studentId: student._id }).sort({ classDate: -1 }),
      StudentProgress.findOne({ studentId: student._id }),
      AssignmentSubmission.find({ studentId: student._id }).populate('assignmentId').sort({ submissionDate: -1 }),
      ExamResult.find({ studentId: student._id }).populate('examinationId').sort({ publishedAt: -1 }),
      Certificate.findOne({ studentId: student._id }),
      Placement.findOne({ studentId: student._id }),
      student.leadId ? LeadActivity.find({ leadId: student.leadId }).sort({ createdAt: -1 }) : [],
    ]);

    // Attendance stats
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
    const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    res.json({
      success: true,
      data: {
        // Section 1: Overview
        overview: {
          studentId: student.studentId,
          name: student.name,
          status: student.status,
          courseName: student.courseName,
          batchName: student.batchName,
          trainerName: student.trainerName,
          attendancePercent,
          progressPercent: progress ? progress.actualProgressPercent : 0,
          feeBalance: feeRecord ? feeRecord.outstandingBalance : 0,
          feeStatus: feeRecord ? feeRecord.paymentStatus : 'Pending',
        },
        // Section 2: Personal Details
        personalDetails: {
          name: student.name,
          mobile: student.mobile,
          altMobile: student.altMobile,
          email: student.email,
          address: student.address,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          qualification: student.qualification,
          parentContact: student.parentContact,
          photoUrl: student.photoUrl,
        },
        // Section 3: Admission Details
        admissionDetails: admission || {},
        // Section 4: Course Details
        courseDetails: student.courseId || {},
        // Section 5: Batch Details
        batchDetails: student.batchId || {},
        // Section 6: Trainer Details
        trainerDetails: student.trainerId || {},
        // Section 7: Attendance
        attendance: {
          summary: { totalClasses, presentCount, attendancePercent },
          records: attendanceRecords,
        },
        // Section 8: Weekly Progress
        weeklyProgress: progress || {},
        // Section 9: Assignments
        assignments: assignments || [],
        // Section 10: Examination Results
        examinationResults: examResults || [],
        // Section 11: Fees
        fees: feeRecord || {},
        // Section 12: Payments
        payments: payments || [],
        // Section 13: Certificates
        certificates: certificate || null,
        // Section 14: Placement
        placement: placement || null,
        // Section 15: Activity History
        activityHistory: leadActivities || [],
        // Documents
        documents: student.documents || [],
        rawStudent: student,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Update student details
// @route PUT /api/students/:id
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const {
      name,
      mobile,
      altMobile,
      email,
      address,
      dateOfBirth,
      gender,
      qualification,
      parentContact,
      status,
      notes,
    } = req.body;

    if (name) student.name = name;
    if (mobile) student.mobile = mobile.replace(/\D/g, '').slice(-10);
    if (altMobile !== undefined) student.altMobile = altMobile;
    if (email) student.email = email.toLowerCase();
    if (address) student.address = address;
    if (dateOfBirth) student.dateOfBirth = new Date(dateOfBirth);
    if (gender) student.gender = gender;
    if (qualification !== undefined) student.qualification = qualification;
    if (parentContact) student.parentContact = parentContact;
    if (status) student.status = status;
    if (notes !== undefined) student.notes = notes;

    await student.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_STUDENT',
      module: 'STUDENTS',
      targetId: student._id.toString(),
      description: `Updated student ${student.studentId} (${student.name})`,
      req,
    });

    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Transfer student to another batch (Admin / Staff)
// @route POST /api/students/:id/transfer-batch
const transferStudentBatch = async (req, res) => {
  try {
    const { targetBatchId, reason = 'Batch reassignment' } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const targetBatch = await Batch.findById(targetBatchId).populate('trainerId', 'name');
    if (!targetBatch) {
      return res.status(404).json({ success: false, message: 'Target batch not found' });
    }

    const oldBatchId = student.batchId;

    // Update batch student records
    if (oldBatchId) {
      await BatchStudent.findOneAndUpdate(
        { batchId: oldBatchId, studentId: student._id },
        {
          status: 'Transferred',
          $push: {
            transferHistory: {
              fromBatchId: oldBatchId,
              toBatchId: targetBatch._id,
              transferredAt: new Date(),
              transferredBy: req.user._id,
              reason,
            },
          },
        }
      );
      await Batch.findByIdAndUpdate(oldBatchId, { $inc: { currentEnrollment: -1 } });
    }

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
      student.trainerId = targetBatch.trainerId._id;
      student.trainerName = targetBatch.trainerId.name;
    }
    await student.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TRANSFER_STUDENT_BATCH',
      module: 'STUDENTS',
      targetId: student._id.toString(),
      description: `Transferred student ${student.studentId} to batch ${targetBatch.name}`,
      req,
    });

    res.json({
      success: true,
      message: `Student successfully transferred to ${targetBatch.name}`,
      data: student,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Upload student document (metadata)
// @route POST /api/students/:id/documents
const uploadStudentDocument = async (req, res) => {
  try {
    const { name, url, documentType } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.documents.push({
      name: name || 'Student Document',
      url: url || 'https://example.com/doc',
      documentType: documentType || 'Certificate',
      uploadedAt: new Date(),
    });

    await student.save();
    res.status(201).json({ success: true, message: 'Document added', data: student.documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  transferStudentBatch,
  uploadStudentDocument,
};
