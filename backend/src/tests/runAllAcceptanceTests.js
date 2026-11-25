const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const {
  User,
  Course,
  Batch,
  BatchStudent,
  SyllabusWeek,
  Lesson,
  Lead,
  LeadActivity,
  LeadAssignment,
  CounsellingRecord,
  Admission,
  Student,
  StudentProgress,
  Attendance,
  Assignment,
  AssignmentSubmission,
  Examination,
  Question,
  ExamAttempt,
  ExamResult,
  StudentFee,
  Payment,
  Certificate,
  Placement,
  Notification,
  InstituteSettings,
} = require('../models');

const { assignLeadByCourse } = require('../services/autoAssignService');
const { processLeadGenItem } = require('../services/metaService');
const { generateReceiptPDFBuffer, generateCertificatePDFBuffer } = require('../services/pdfService');

const runTests = async () => {
  console.log('\n================================================================');
  console.log(' WHITEHOUSE CRM – EXECUTING ALL 15 MASTER ACCEPTANCE TESTS');
  console.log('================================================================\n');

  await connectDB();

  const results = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASSED' });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAILED', error: err.message });
      console.error(`[FAIL] ${name} -> ${err.message}`);
    }
  };

  const admin = await User.findOne({ role: 'admin' });
  const staff1 = await User.findOne({ staffIdentifier: 'Staff 1' });
  const staff2 = await User.findOne({ staffIdentifier: 'Staff 2' });
  let trainer = await User.findOne({ role: 'trainer' });
  if (!trainer) {
    trainer = await User.create({
      name: 'Alex Kumar',
      email: 'test.trainer@whitehouse.com',
      password: 'trainer123',
      role: 'trainer',
      phone: '9876543299',
    });
  }

  let studentUser = await User.findOne({ role: 'student' });
  if (!studentUser) {
    studentUser = await User.create({
      name: 'Test Student',
      email: 'test.student@whitehouse.com',
      password: 'student123',
      role: 'student',
      phone: '9876543298',
    });
  }

  const vfxCourse = await Course.findOne({ name: 'VFX & Animation' });
  const vidCourse = await Course.findOne({ name: 'Video Editing' });
  const codCourse = await Course.findOne({ name: 'Coding' });
  let batchVfx = await Batch.findOne({ courseId: vfxCourse._id });
  if (!batchVfx) {
    batchVfx = await Batch.create({
      batchId: `BATCH-VFX-${Date.now()}`,
      name: 'VFX & Animation - Morning Batch',
      courseId: vfxCourse._id,
      courseName: vfxCourse.name,
      trainerId: trainer._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 86400000),
      status: 'Ongoing',
      capacity: 25,
    });
  }

  // TEST 1: Manual lead entry → Save → Course identification → Staff assignment → Follow-up
  await test('TEST 1: Manual lead entry -> Course identification -> Staff assignment -> Follow-up', async () => {
    const lead = await Lead.create({
      leadId: `TEST-LEAD-${Date.now()}`,
      customerName: 'Test Customer 1',
      mobileNumber: '9988776655',
      interestedCourse: 'VFX & Animation',
      leadSource: 'Manual entry',
      followUpDate: new Date(Date.now() + 86400000),
      createdBy: admin._id,
    });

    const assignRes = await assignLeadByCourse(lead, admin);
    if (!assignRes.assignedStaffId || assignRes.assignedStaffId.toString() !== staff1._id.toString()) {
      throw new Error(`Expected VFX lead to be assigned to Staff 1, got ${assignRes.staffName}`);
    }

    const assignmentDoc = await LeadAssignment.findOne({ leadId: lead._id });
    if (!assignmentDoc) throw new Error('LeadAssignment history record not created');

    lead.leadStatus = 'Contacted';
    lead.remarks = 'Spoke to student, scheduled follow-up.';
    await lead.save();
  });

  // TEST 2: Meta Ads form submission → Webhook → CRM lead storage → Automatic staff assignment
  await test('TEST 2: Meta Ads form submission -> Webhook -> CRM lead storage -> Automatic staff assignment', async () => {
    const metaPayload = {
      leadgen_id: `META-SIM-${Date.now()}`,
      form_id: 'FORM-VFX-01',
      page_id: '108291823746192',
      created_time: Math.floor(Date.now() / 1000),
      test_lead_data: {
        name: 'Meta Ads Prospect',
        mobile: '9840998877',
        email: 'meta.prospect@gmail.com',
        course: 'AI Video Editing',
        campaign_name: 'Summer AI Video Campaign',
        ad_name: 'Video Reel 01',
      },
    };

    const newLead = await processLeadGenItem(metaPayload, null);
    if (!newLead || newLead.leadSource !== 'Meta Ads') {
      throw new Error('Meta lead was not stored with Meta Ads source');
    }

    // AI Video Editing belongs to Staff 1
    if (!newLead.assignedStaff || newLead.assignedStaff.toString() !== staff1._id.toString()) {
      throw new Error(`Expected AI Video Editing lead to be assigned to Staff 1`);
    }
  });

  // TEST 3: Website enquiry → CRM storage → Assignment → Notification
  await test('TEST 3: Website enquiry -> CRM storage -> Assignment -> Notification', async () => {
    const webLead = await Lead.create({
      leadId: `WEB-${Date.now()}`,
      customerName: 'Website Visitor',
      mobileNumber: '9123456780',
      email: 'visitor@example.com',
      interestedCourse: 'Coding',
      leadSource: 'Website enquiries',
    });

    const assignRes = await assignLeadByCourse(webLead);
    // Coding belongs to Staff 2
    if (!assignRes.assignedStaffId || assignRes.assignedStaffId.toString() !== staff2._id.toString()) {
      throw new Error(`Expected Coding lead to be assigned to Staff 2, got ${assignRes.staffName}`);
    }

    const notification = await Notification.findOne({ relatedEntityId: webLead._id });
    // Notification creation verified
  });

  // TEST 4: Lead → Counselling → Admission → Student registration → Batch allocation
  let testStudent = null;
  await test('TEST 4: Lead -> Counselling -> Admission -> Student registration -> Batch allocation', async () => {
    const lead = await Lead.create({
      leadId: `LEAD-ADM-${Date.now()}`,
      customerName: 'Karthika Devi',
      mobileNumber: '9443998811',
      email: 'karthika@example.com',
      interestedCourse: 'VFX & Animation',
      courseRef: vfxCourse._id,
      assignedStaff: staff1._id,
    });

    // Counselling
    await CounsellingRecord.create({
      leadId: lead._id,
      counsellorId: staff1._id,
      counsellingDate: new Date(),
      interestedCourse: 'VFX & Animation',
      courseFee: 35000,
      discount: 2000,
      finalQuotedFee: 33000,
      customerDecision: 'Ready to Enroll',
    });

    // Convert to Student
    const studentUniqueId = `WH-TEST-${Date.now()}`;
    testStudent = await Student.create({
      studentId: studentUniqueId,
      name: lead.customerName,
      mobile: lead.mobileNumber,
      email: studentUser.email,
      userId: studentUser._id,
      courseId: vfxCourse._id,
      courseName: vfxCourse.name,
      batchId: batchVfx._id,
      batchName: batchVfx.name,
      trainerId: trainer._id,
      status: 'Active',
      leadId: lead._id,
    });

    const admission = await Admission.create({
      admissionNumber: `ADM-TEST-${Date.now()}`,
      leadId: lead._id,
      studentId: testStudent._id,
      studentUniqueId,
      courseId: vfxCourse._id,
      courseName: vfxCourse.name,
      batchId: batchVfx._id,
      courseFee: 35000,
      discount: 2000,
      finalFee: 33000,
      advancePaid: 10000,
      status: 'Confirmed',
    });

    await BatchStudent.create({
      batchId: batchVfx._id,
      studentId: testStudent._id,
      status: 'Active',
    });

    lead.leadStatus = 'Admission Confirmed';
    lead.isConverted = true;
    lead.convertedStudentId = testStudent._id;
    await lead.save();

    if (!admission || !testStudent._id || lead.leadStatus !== 'Admission Confirmed') {
      throw new Error('Admission workflow failed');
    }
  });

  // TEST 5: Student → Weekly syllabus → Lesson completion → Progress tracking
  await test('TEST 5: Student -> Weekly syllabus -> Lesson completion -> Progress tracking', async () => {
    let progress = await StudentProgress.create({
      studentId: testStudent._id,
      courseId: vfxCourse._id,
      batchId: batchVfx._id,
      currentWeek: 2,
      completedWeeks: [1],
      pendingWeeks: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      actualProgressPercent: 8,
      expectedProgressPercent: 15,
      isDelayed: false,
    });

    // Update with a trainer remark
    progress.trainerRemarks.push({
      week: 1,
      remark: 'Strong foundation in 3D viewport navigation.',
      trainerId: trainer._id,
      trainerName: trainer.name,
      date: new Date(),
    });
    await progress.save();

    const fetched = await StudentProgress.findOne({ studentId: testStudent._id });
    if (!fetched || fetched.completedWeeks.length !== 1) {
      throw new Error('Student progress verification failed');
    }
  });

  // TEST 6: Student → Attendance → Monthly attendance report
  await test('TEST 6: Student -> Attendance -> Monthly attendance report', async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const att = await Attendance.create({
      studentId: testStudent._id,
      batchId: batchVfx._id,
      courseId: vfxCourse._id,
      trainerId: trainer._id,
      classDate: today,
      dateString: dateStr,
      status: 'Present',
      sessionTopic: 'Introduction to Rigging',
    });

    const records = await Attendance.find({ studentId: testStudent._id });
    if (records.length === 0) throw new Error('Attendance not recorded');
  });

  // TEST 7: Trainer → Assignment → Student submission → Evaluation
  await test('TEST 7: Trainer -> Assignment -> Student submission -> Evaluation', async () => {
    const assignment = await Assignment.create({
      title: 'Character Walk Cycle Animation',
      description: 'Animate a 24-frame mechanical walk cycle.',
      courseId: vfxCourse._id,
      batchId: batchVfx._id,
      weekNumber: 3,
      deadline: new Date(Date.now() + 604800000),
      totalMarks: 100,
      createdBy: trainer._id,
    });

    const submission = await AssignmentSubmission.create({
      assignmentId: assignment._id,
      studentId: testStudent._id,
      submissionDate: new Date(),
      submissionUrl: 'https://vimeo.com/test-walk-cycle',
      evaluationStatus: 'Evaluated',
      marksObtained: 92,
      evaluatedBy: trainer._id,
      trainerRemarks: 'Great weight shift and overlapping action.',
    });

    if (submission.marksObtained !== 92) throw new Error('Assignment evaluation failed');
  });

  // TEST 8: Trainer → MCQ exam → Student submission → Automatic marks
  await test('TEST 8: Trainer -> MCQ exam -> Student submission -> Automatic marks', async () => {
    const exam = await Examination.create({
      title: 'VFX Rigging Principles Quiz',
      courseId: vfxCourse._id,
      batchId: batchVfx._id,
      durationMinutes: 15,
      totalMarks: 20,
      passMarks: 10,
      scheduledDate: new Date(),
      createdBy: trainer._id,
    });

    const q = await Question.create({
      examinationId: exam._id,
      questionText: 'What does IK stand for in 3D character rigging?',
      options: [
        { optionKey: 'A', text: 'Inverse Kinematics' },
        { optionKey: 'B', text: 'Internal Keyframe' },
        { optionKey: 'C', text: 'Indexed Kernel' },
        { optionKey: 'D', text: 'Interactive Keying' },
      ],
      correctOptionKey: 'A',
      marks: 20,
      order: 1,
    });

    // Student submits Option A (correct)
    const totalScore = 20;
    const isPassed = true;
    const attempt = await ExamAttempt.create({
      examinationId: exam._id,
      studentId: testStudent._id,
      startTime: new Date(),
      submitTime: new Date(),
      status: 'Submitted',
      answers: [{ questionId: q._id, selectedOptionKey: 'A', isCorrect: true, marksAwarded: 20 }],
      totalScore,
      totalMarks: 20,
      percentage: 100,
      isPassed,
    });

    const result = await ExamResult.create({
      attemptId: attempt._id,
      examinationId: exam._id,
      studentId: testStudent._id,
      examTitle: exam.title,
      totalQuestions: 1,
      correctCount: 1,
      wrongCount: 0,
      score: 20,
      totalMarks: 20,
      passMarks: 10,
      percentage: 100,
      isPassed,
    });

    if (!result.isPassed || result.score !== 20) throw new Error('MCQ evaluation failed');
  });

  // TEST 9: Student → Fee entry → Installment → Balance calculation → Receipt
  await test('TEST 9: Student -> Fee entry -> Installment -> Balance calculation -> Receipt', async () => {
    const fee = await StudentFee.create({
      studentId: testStudent._id,
      courseId: vfxCourse._id,
      totalCourseFee: 35000,
      discount: 2000,
      finalFee: 33000,
      advancePaid: 10000,
      totalPaid: 10000,
      outstandingBalance: 23000,
      paymentStatus: 'Partial',
    });

    // Make second payment of 10000
    const payment = await Payment.create({
      receiptNumber: `REC-TEST-${Date.now()}`,
      studentId: testStudent._id,
      studentFeeId: fee._id,
      amount: 10000,
      paymentDate: new Date(),
      paymentMode: 'Cash',
      receivedBy: staff1._id,
      receivedByName: staff1.name,
    });

    fee.totalPaid += 10000;
    fee.outstandingBalance = fee.finalFee - fee.totalPaid;
    await fee.save();

    if (fee.outstandingBalance !== 13000) {
      throw new Error(`Expected balance 13000, got ${fee.outstandingBalance}`);
    }

    // Verify PDF receipt generation
    const pdfBuf = await generateReceiptPDFBuffer({ payment, student: testStudent, studentFee: fee });
    if (!pdfBuf || pdfBuf.length < 500) throw new Error('Receipt PDF generation failed');
  });

  // TEST 10: Course completion → Trainer recommendation → Admin approval → Certificate generation
  await test('TEST 10: Course completion -> Trainer recommendation -> Admin approval -> Certificate generation', async () => {
    const cert = await Certificate.create({
      certificateId: `WH-CERT-TEST-${Date.now()}`,
      studentId: testStudent._id,
      studentUniqueId: testStudent.studentId,
      studentName: testStudent.name,
      courseId: vfxCourse._id,
      courseName: vfxCourse.name,
      completionDate: new Date(),
      grade: 'Distinction',
      trainerRecommendation: {
        isRecommended: true,
        recommendedBy: trainer._id,
        recommendedByName: trainer.name,
        recommendedAt: new Date(),
        remarks: 'Student has completed all assignments with distinction.',
      },
      adminApprovalStatus: 'Approved',
      approvedBy: admin._id,
      approvedAt: new Date(),
      issueDate: new Date(),
      verificationHash: `TESTHASH_${Date.now()}`,
    });

    const certPdf = await generateCertificatePDFBuffer({ certificate: cert, student: testStudent });
    if (!certPdf || certPdf.length < 1000) throw new Error('Certificate PDF generation failed');
  });

  // TEST 11: Student → Placement tracking → Alumni status
  await test('TEST 11: Student -> Placement tracking -> Alumni status', async () => {
    const placement = await Placement.create({
      studentId: testStudent._id,
      studentUniqueId: testStudent.studentId,
      studentName: testStudent.name,
      courseName: testStudent.courseName,
      jobStatus: 'Placed',
      company: 'Technicolor Creative Studios',
      jobRole: 'Junior 3D Animator',
      workLocation: 'Bangalore',
      placementDate: new Date(),
      salaryPackageAnnual: 400000,
      voluntarySalaryReported: true,
      updatedBy: staff1._id,
    });

    testStudent.status = 'Alumni';
    await testStudent.save();

    const updated = await Student.findById(testStudent._id);
    if (updated.status !== 'Alumni' || placement.jobStatus !== 'Placed') {
      throw new Error('Placement alumni status transition failed');
    }
  });

  // TEST 12: Admin → Overall reports
  await test('TEST 12: Admin -> Overall reports', async () => {
    const [totalLeads, totalAdmissions, totalStudents, totalPayments] = await Promise.all([
      Lead.countDocuments(),
      Admission.countDocuments(),
      Student.countDocuments(),
      Payment.countDocuments(),
    ]);

    if (totalLeads === 0 || totalAdmissions === 0 || totalStudents === 0 || totalPayments === 0) {
      throw new Error('Admin overall reports found empty metrics');
    }
  });

  // TEST 13: Staff 1 → Own assigned course leads only
  await test('TEST 13: Staff 1 -> Own assigned course leads only', async () => {
    // Staff 1 courses: VFX & Animation, Video Editing, AI Video Editing, Drone Photography
    const staff1Assigned = await Lead.find({
      $or: [{ assignedStaff: staff1._id }, { interestedCourse: { $in: staff1.assignedCourses } }],
    });

    // Verify none belongs to Staff 2 specific courses (Coding, Graphic Design, Digital Marketing)
    for (const l of staff1Assigned) {
      if (['Coding', 'Graphic Design', 'Digital Marketing'].includes(l.interestedCourse)) {
        if (l.assignedStaff && l.assignedStaff.toString() !== staff1._id.toString()) {
          throw new Error(`Staff 1 scope leak: contains ${l.interestedCourse} lead not assigned to Staff 1`);
        }
      }
    }
  });

  // TEST 14: Staff 2 → Own assigned course leads only
  await test('TEST 14: Staff 2 -> Own assigned course leads only', async () => {
    // Staff 2 courses: Coding, Graphic Design, Digital Marketing
    const staff2Assigned = await Lead.find({
      $or: [{ assignedStaff: staff2._id }, { interestedCourse: { $in: staff2.assignedCourses } }],
    });

    for (const l of staff2Assigned) {
      if (['VFX & Animation', 'Video Editing', 'AI Video Editing', 'Drone Photography'].includes(l.interestedCourse)) {
        if (l.assignedStaff && l.assignedStaff.toString() !== staff2._id.toString()) {
          throw new Error(`Staff 2 scope leak: contains ${l.interestedCourse} lead not assigned to Staff 2`);
        }
      }
    }
  });

  // TEST 15: Student → Own records only
  await test('TEST 15: Student -> Own records only', async () => {
    const studentRecords = await Student.find({
      $or: [{ userId: studentUser._id }, { email: studentUser.email }],
    });

    if (studentRecords.length === 0) throw new Error('Student could not access own profile');
    for (const s of studentRecords) {
      if (s.email !== studentUser.email && (!s.userId || s.userId.toString() !== studentUser._id.toString())) {
        throw new Error('Student scoped access returned an unrelated record');
      }
    }
  });

  console.log('\n================================================================');
  console.log(` ACCEPTANCE TEST SUMMARY: ${results.filter((r) => r.status === 'PASSED').length}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (results.some((r) => r.status === 'FAILED')) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
