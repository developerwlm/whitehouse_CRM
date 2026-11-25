const {
  Certificate,
  Student,
  Attendance,
  StudentProgress,
  AssignmentSubmission,
  ExamResult,
  StudentFee,
  InstituteSettings,
} = require('../models');
const { generateCertificateId, generateVerificationCode } = require('../utils/idGenerator');
const { generateCertificatePDFBuffer } = require('../services/pdfService');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');

// @desc Trainer recommends course completion & certificate issuance
// @route POST /api/certificates/recommend
const recommendCertificate = async (req, res) => {
  try {
    const { studentId, remarks = '' } = req.body;

    const student = await Student.findById(studentId).populate('courseId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // 1. Fetch institute eligibility settings
    const settings = await InstituteSettings.findOne();
    const minAtt = settings && settings.eligibilityCriteria ? settings.eligibilityCriteria.minAttendancePercent : 75;
    const minAssign = settings && settings.eligibilityCriteria ? settings.eligibilityCriteria.minAssignmentPercent : 60;

    // 2. Compute attendance percentage
    const attendanceRecords = await Attendance.find({ studentId: student._id });
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
    const attendancePercent = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    const attendancePassed = attendancePercent >= minAtt;

    // 3. Compute assignment completion & performance
    const submissions = await AssignmentSubmission.find({ studentId: student._id });
    const evaluatedSubs = submissions.filter((s) => s.evaluationStatus === 'Evaluated');
    const assignmentPercent =
      evaluatedSubs.length > 0
        ? Math.round(
            evaluatedSubs.reduce((acc, s) => acc + (s.marksObtained || 0), 0) / evaluatedSubs.length
          )
        : 80;
    const assignmentPassed = assignmentPercent >= minAssign;

    // 4. Compute exam results
    const examResults = await ExamResult.find({ studentId: student._id });
    const examPassed = examResults.length > 0 ? examResults.every((e) => e.isPassed) : true;
    const examAvg =
      examResults.length > 0
        ? Math.round(examResults.reduce((acc, e) => acc + e.percentage, 0) / examResults.length)
        : 85;

    // 5. Fee clearance
    const feeRecord = await StudentFee.findOne({ studentId: student._id });
    const feeCleared = !feeRecord || feeRecord.outstandingBalance <= 0;

    const allRequirementsMet = attendancePassed && assignmentPassed && examPassed && feeCleared;

    // Find or create Certificate record
    let certificate = await Certificate.findOne({ studentId: student._id });
    const certificateId = certificate ? certificate.certificateId : generateCertificateId();
    const verificationHash = certificate ? certificate.verificationHash : generateVerificationCode(student.studentId);

    const grade =
      examAvg >= 85 ? 'Distinction' : examAvg >= 70 ? 'First Class' : examAvg >= 60 ? 'Second Class' : 'Pass';

    const certData = {
      certificateId,
      studentId: student._id,
      studentUniqueId: student.studentId,
      studentName: student.name,
      courseId: student.courseId._id,
      courseName: student.courseName,
      completionDate: new Date(),
      grade,
      trainerRecommendation: {
        isRecommended: true,
        recommendedBy: req.user._id,
        recommendedByName: req.user.name,
        recommendedAt: new Date(),
        remarks,
      },
      adminApprovalStatus: 'Pending Approval',
      eligibilitySnapshot: {
        attendancePercent,
        attendancePassed,
        assignmentPercent,
        assignmentPassed,
        examAveragePercent: examAvg,
        examPassed,
        feeCleared,
        allRequirementsMet,
      },
      verificationHash,
    };

    if (certificate) {
      Object.assign(certificate, certData);
      await certificate.save();
    } else {
      certificate = await Certificate.create(certData);
    }

    await createNotification({
      roleTarget: 'admin',
      title: 'Certificate Issuance Recommended',
      message: `Trainer ${req.user.name} recommended certificate issuance for ${student.name} (${student.studentId}) in ${student.courseName}. All requirements met: ${allRequirementsMet ? 'YES' : 'NO'}.`,
      type: 'certificate',
      link: `/certificates/${certificate._id}`,
      relatedEntityId: certificate._id,
      relatedEntityType: 'Certificate',
    });

    res.status(200).json({
      success: true,
      message: 'Certificate recommendation submitted for Admin approval.',
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Admin approves or rejects certificate issuance
// @route POST /api/certificates/:id/approve
const approveCertificate = async (req, res) => {
  try {
    const { action, rejectionReason = '' } = req.body; // action: 'Approved' | 'Rejected'
    const certificate = await Certificate.findById(req.params.id).populate('studentId');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate record not found' });
    }

    if (action === 'Approved') {
      certificate.adminApprovalStatus = 'Approved';
      certificate.approvedBy = req.user._id;
      certificate.approvedAt = new Date();
      certificate.issueDate = new Date();

      // Update student status to Completed
      if (certificate.studentId) {
        await Student.findByIdAndUpdate(certificate.studentId._id, { status: 'Completed' });
      }

      await createNotification({
        roleTarget: 'all',
        title: 'Certificate Approved & Issued!',
        message: `Official Certificate ${certificate.certificateId} has been issued to ${certificate.studentName} for completing ${certificate.courseName}.`,
        type: 'certificate',
        link: `/certificates/${certificate._id}`,
        relatedEntityId: certificate._id,
        relatedEntityType: 'Certificate',
      });
    } else {
      certificate.adminApprovalStatus = 'Rejected';
      certificate.rejectionReason = rejectionReason;
    }

    await certificate.save();

    await logAudit({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: action === 'Approved' ? 'APPROVE_CERTIFICATE' : 'REJECT_CERTIFICATE',
      module: 'CERTIFICATES',
      targetId: certificate._id.toString(),
      description: `${action} certificate ${certificate.certificateId} for ${certificate.studentName}`,
      req,
    });

    res.json({
      success: true,
      message: `Certificate status updated to: ${certificate.adminApprovalStatus}`,
      data: certificate,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Download official branded Certificate PDF
// @route GET /api/certificates/:id/pdf
const downloadCertificatePdf = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('studentId');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (certificate.adminApprovalStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Certificate has not been approved by the Administrator yet.',
      });
    }

    const host = req.get('host') || 'localhost:5173';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const pdfBuffer = await generateCertificatePDFBuffer({
      certificate,
      student: certificate.studentId || { name: certificate.studentName, studentId: certificate.studentUniqueId },
      baseUrl,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificate.certificateId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Public QR verification endpoint (No sensitive private student info exposed)
// @route GET /api/certificates/verify/:certificateId
const verifyPublicCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId }).select(
      'certificateId studentName courseName issueDate completionDate grade adminApprovalStatus verificationHash'
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: 'No certificate found matching this Certificate ID. Verification Failed.',
      });
    }

    if (certificate.adminApprovalStatus !== 'Approved') {
      return res.status(200).json({
        success: true,
        isValid: false,
        message: 'Certificate is currently pending verification or approval.',
        status: certificate.adminApprovalStatus,
      });
    }

    res.json({
      success: true,
      isValid: true,
      institute: 'Whitehouse Skill Development Institute, Madurai',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        grade: certificate.grade,
        verificationHash: certificate.verificationHash,
        status: 'VERIFIED GENUINE CREDENTIAL',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get all certificates list
// @route GET /api/certificates
const getCertificates = async (req, res) => {
  try {
    const { approvalStatus, courseId } = req.query;
    const query = {};

    if (approvalStatus) query.adminApprovalStatus = approvalStatus;
    if (courseId) query.courseId = courseId;

    const certificates = await Certificate.find(query)
      .populate('studentId', 'studentId name mobile status photoUrl')
      .populate('courseId', 'name courseCode')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  recommendCertificate,
  approveCertificate,
  downloadCertificatePdf,
  verifyPublicCertificate,
  getCertificates,
};
