const {
  Admission,
  Lead,
  LeadActivity,
  Student,
  Course,
  Batch,
  BatchStudent,
  StudentFee,
  Payment,
  User,
  StudentProgress,
  SyllabusWeek,
  Lesson,
} = require('../models');
const {
  generateStudentId,
  generateAdmissionNumber,
  generateReceiptNumber,
} = require('../utils/idGenerator');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Get admissions list
// @route GET /api/admissions
const getAdmissions = async (req, res) => {
  try {
    const { status, courseId, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (courseId) query.courseId = courseId;

    const admissions = await Admission.find(query)
      .populate('leadId', 'leadId customerName mobileNumber email interestedCourse')
      .populate('studentId', 'studentId name status photoUrl')
      .populate('courseId', 'name courseCode fee durationWeeks')
      .populate('batchId', 'batchId name startDate endDate')
      .populate('trainerId', 'name email')
      .populate('counsellorId', 'name email staffIdentifier')
      .sort({ admissionDate: -1 });

    res.json({ success: true, count: admissions.length, data: admissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Convert Lead to Student (Section 7: Complete Admission Flow)
// @route POST /api/admissions/convert-lead
const convertLeadToStudent = async (req, res) => {
  try {
    const {
      leadId,
      courseId,
      batchId,
      trainerId,
      courseFee,
      discount = 0,
      advancePaid = 0,
      paymentMode = 'Cash',
      transactionRef = '',
      installmentsCount = 3,
      dateOfBirth,
      gender,
      qualification,
      address,
      parentContact,
      remarks = '',
    } = req.body;

    // 1. Validate Lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.isConverted && lead.convertedStudentId) {
      return res.status(400).json({
        success: false,
        message: 'This lead has already been converted into a registered student.',
      });
    }

    // Check duplicate student registration by mobile or email
    const existingStudent = await Student.findOne({
      $or: [
        { mobile: lead.mobileNumber },
        ...(lead.email ? [{ email: lead.email.toLowerCase() }] : []),
      ],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Duplicate student registration prevented: A student with this contact already exists (${existingStudent.studentId} - ${existingStudent.name}).`,
      });
    }

    // 2. Validate Course & Batch & Trainer
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ success: false, message: 'Invalid course selected' });
    }

    let batch = null;
    if (batchId) {
      batch = await Batch.findById(batchId);
    }

    let trainer = null;
    if (trainerId) {
      trainer = await User.findById(trainerId);
    } else if (batch && batch.trainerId) {
      trainer = await User.findById(batch.trainerId);
    }

    // 3. Step 1: Generate Student ID & Admission Number
    const studentUniqueId = generateStudentId();
    const admissionNumber = generateAdmissionNumber();

    const totalFeeNum = Number(courseFee || course.fee);
    const discountNum = Number(discount || 0);
    const finalFeeNum = Math.max(0, totalFeeNum - discountNum);
    const advancePaidNum = Number(advancePaid || 0);
    const balanceNum = Math.max(0, finalFeeNum - advancePaidNum);

    // 4. Step 2 & 3: Create Student Profile & Transfer Lead Info
    const mobileDigits = (lead.mobileNumber || '').replace(/\D/g, '');
    const last4Mobile = mobileDigits.length >= 4 ? mobileDigits.slice(-4) : '2026';
    const rawStudentPassword = (req.body.studentPassword && req.body.studentPassword.trim().length >= 6)
      ? req.body.studentPassword.trim()
      : `WH@${last4Mobile}`;

    const studentLoginEmail = (lead.email && lead.email.trim())
      ? lead.email.toLowerCase().trim()
      : `${studentUniqueId.toLowerCase()}@whitehouseinstitute.in`;

    const student = await Student.create({
      studentId: studentUniqueId,
      name: lead.customerName,
      mobile: lead.mobileNumber,
      altMobile: lead.whatsappNumber || '',
      email: studentLoginEmail,
      address: address || { city: 'Madurai', state: 'Tamil Nadu' },
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || 'Male',
      qualification: qualification || '',
      parentContact: parentContact || {},
      admissionDate: new Date(),
      courseId: course._id,
      courseName: course.name,
      batchId: batch ? batch._id : null,
      batchName: batch ? batch.name : '',
      trainerId: trainer ? trainer._id : null,
      trainerName: trainer ? trainer.name : '',
      courseDurationWeeks: course.durationWeeks || 12,
      status: 'Active',
      leadId: lead._id,
      originalLeadNumber: lead.leadId,
      assignedStaff: lead.assignedStaff,
      notes: remarks || 'Admitted from CRM Lead',
      generatedPassword: rawStudentPassword,
    });

    // Create or link User login account for Student Portal access
    let studentUser = await User.findOne({
      $or: [
        { email: studentLoginEmail },
        { linkedStudentId: student._id },
      ],
    });

    if (!studentUser) {
      studentUser = await User.create({
        name: student.name,
        email: studentLoginEmail,
        password: rawStudentPassword,
        role: 'student',
        phone: student.mobile,
        linkedStudentId: student._id,
        isActive: true,
      });
    } else {
      studentUser.name = student.name;
      studentUser.password = rawStudentPassword;
      studentUser.role = 'student';
      studentUser.linkedStudentId = student._id;
      studentUser.isActive = true;
      await studentUser.save();
    }

    student.userId = studentUser._id;
    await student.save();

    // 5. Step 4 & 5: Create Admission Record
    const admission = await Admission.create({
      admissionNumber,
      leadId: lead._id,
      studentId: student._id,
      studentUniqueId,
      courseId: course._id,
      courseName: course.name,
      batchId: batch ? batch._id : null,
      trainerId: trainer ? trainer._id : null,
      counsellorId: req.user._id,
      admissionDate: new Date(),
      courseFee: totalFeeNum,
      discount: discountNum,
      finalFee: finalFeeNum,
      advancePaid: advancePaidNum,
      paymentMode,
      transactionRef,
      status: 'Confirmed',
      remarks,
      studentLoginCredentials: {
        userId: studentUser._id,
        loginId: studentUniqueId,
        email: studentLoginEmail,
        generatedPassword: rawStudentPassword,
      },
      processedBy: req.user._id,
    });

    student.admissionId = admission._id;
    await student.save();

    // 6. Step 6: Enroll in Batch if selected
    if (batch) {
      await BatchStudent.create({
        batchId: batch._id,
        studentId: student._id,
        enrollmentDate: new Date(),
        status: 'Active',
      });
      batch.currentEnrollment = (batch.currentEnrollment || 0) + 1;
      await batch.save();
    }

    // 7. Step 7: Create Student Fee Record and Installment Plan
    const installmentPlan = [];
    const count = Math.max(1, parseInt(installmentsCount, 10) || 1);
    const remPerInstallment = Math.round(balanceNum / count);

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + i * 30);
      installmentPlan.push({
        installmentNumber: i,
        title: `Installment ${i}`,
        dueDate,
        amount: i === count ? balanceNum - remPerInstallment * (count - 1) : remPerInstallment,
        paidAmount: 0,
        status: balanceNum === 0 ? 'Paid' : 'Pending',
      });
    }

    const studentFee = await StudentFee.create({
      studentId: student._id,
      courseId: course._id,
      totalCourseFee: totalFeeNum,
      discount: discountNum,
      finalFee: finalFeeNum,
      advancePaid: advancePaidNum,
      totalPaid: advancePaidNum,
      outstandingBalance: balanceNum,
      paymentStatus: balanceNum === 0 ? 'Paid' : advancePaidNum > 0 ? 'Partial' : 'Pending',
      installmentPlan,
      lastPaymentDate: advancePaidNum > 0 ? new Date() : null,
      remarks: 'Initial course fee setup at admission',
    });

    // If advance paid > 0, create first payment entry
    let initialPayment = null;
    if (advancePaidNum > 0) {
      initialPayment = await Payment.create({
        receiptNumber: generateReceiptNumber(),
        studentId: student._id,
        studentFeeId: studentFee._id,
        amount: advancePaidNum,
        paymentDate: new Date(),
        paymentMode,
        transactionReference: transactionRef,
        installmentNumber: 0,
        remarks: 'Admission advance payment',
        receivedBy: req.user._id,
        receivedByName: req.user.name,
      });
    }

    // 8. Step 8: Initialize StudentProgress with syllabus weeks
    const syllabusWeeks = await SyllabusWeek.find({ courseId: course._id });
    const allLessons = await Lesson.find({ courseId: course._id });

    await StudentProgress.create({
      studentId: student._id,
      courseId: course._id,
      batchId: batch ? batch._id : null,
      currentWeek: 1,
      completedWeeks: [],
      pendingWeeks: syllabusWeeks.map((w) => w.weekNumber),
      completedLessons: [],
      pendingLessons: allLessons.map((l) => l._id),
      actualProgressPercent: 0,
      expectedProgressPercent: 10,
      isDelayed: false,
    });

    // 9. Step 9: Preserve Lead History & Update Lead Status
    lead.leadStatus = 'Admission Confirmed';
    lead.isConverted = true;
    lead.convertedStudentId = student._id;
    await lead.save();

    await LeadActivity.create({
      leadId: lead._id,
      activityType: 'admission',
      title: `Converted to Student: ${student.studentId}`,
      description: `Admission confirmed! Student ID: ${student.studentId}, Admission No: ${admission.admissionNumber}, Final Fee: Rs. ${finalFeeNum}, Advance: Rs. ${advancePaidNum}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
    });

    // 10. Step 10: Notifications & Audit Log
    await createNotification({
      roleTarget: 'all',
      title: 'New Student Admission Confirmed!',
      message: `${student.name} admitted to ${course.name} (ID: ${student.studentId}) by ${req.user.name}.`,
      type: 'admission',
      link: `/students/${student._id}`,
      relatedEntityId: student._id,
      relatedEntityType: 'Student',
    });

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CONVERT_LEAD_TO_STUDENT',
      module: 'ADMISSIONS',
      targetId: student._id.toString(),
      description: `Converted lead ${lead.leadId} to student ${student.studentId}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Admission confirmed and student profile successfully created!',
      data: {
        student,
        admission,
        studentFee,
        initialPayment,
        credentials: {
          studentId: studentUniqueId,
          email: studentLoginEmail,
          password: rawStudentPassword,
          name: student.name,
          role: 'student',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdmissions,
  convertLeadToStudent,
};
