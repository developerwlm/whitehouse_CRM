const {
  Lead,
  Admission,
  Student,
  Course,
  Batch,
  Attendance,
  StudentProgress,
  AssignmentSubmission,
  ExamResult,
  StudentFee,
  Payment,
  Certificate,
  Placement,
  User,
} = require('../models');
const { exportToExcelBuffer } = require('../services/excelService');

// @desc Dashboard Overview Stats (Role-tailored: Admin, Staff, Trainer)
// @route GET /api/reports/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;

    // Common today boundary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (user.role === 'admin') {
      const [
        totalLeads,
        todayLeads,
        metaAdsLeads,
        websiteLeads,
        manualLeads,
        followUpsPending,
        totalAdmissions,
        activeStudents,
        completedStudents,
        discontinuedStudents,
        totalTrainers,
        feeAgg,
        certificatesIssued,
        placementsCount,
      ] = await Promise.all([
        Lead.countDocuments(),
        Lead.countDocuments({ enquiryDate: { $gte: todayStart, $lte: todayEnd } }),
        Lead.countDocuments({ leadSource: { $in: ['Meta Ads', 'Facebook Ads', 'Instagram Ads'] } }),
        Lead.countDocuments({ leadSource: 'Website enquiries' }),
        Lead.countDocuments({ leadSource: 'Manual entry' }),
        Lead.countDocuments({ followUpDate: { $lte: todayEnd }, leadStatus: { $nin: ['Admission Confirmed', 'Lost', 'Not Interested'] } }),
        Admission.countDocuments({ status: 'Confirmed' }),
        Student.countDocuments({ status: 'Active' }),
        Student.countDocuments({ status: 'Completed' }),
        Student.countDocuments({ status: 'Discontinued' }),
        User.countDocuments({ role: 'trainer', isActive: true }),
        Payment.aggregate([{ $group: { _id: null, totalCollected: { $sum: '$amount' } } }]),
        Certificate.countDocuments({ adminApprovalStatus: 'Approved' }),
        Placement.countDocuments({ jobStatus: 'Placed' }),
      ]);

      const pendingFeesAgg = await StudentFee.aggregate([{ $group: { _id: null, totalPending: { $sum: '$outstandingBalance' } } }]);

      // Course-wise leads aggregation
      const courseWiseLeads = await Lead.aggregate([
        { $group: { _id: '$interestedCourse', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // Lead status breakdown
      const statusBreakdown = await Lead.aggregate([
        { $group: { _id: '$leadStatus', count: { $sum: 1 } } },
      ]);

      // Recent leads & admissions
      const recentLeads = await Lead.find().populate('assignedStaff', 'name staffIdentifier').sort({ createdAt: -1 }).limit(5);
      const recentAdmissions = await Admission.find().populate('courseId', 'name').sort({ createdAt: -1 }).limit(5);

      return res.json({
        success: true,
        role: 'admin',
        data: {
          metrics: {
            totalLeads,
            todayLeads,
            metaAdsLeads,
            websiteLeads,
            manualLeads,
            followUpsPending,
            totalAdmissions,
            conversionRate: totalLeads > 0 ? Math.round((totalAdmissions / totalLeads) * 100) : 0,
            activeStudents,
            completedStudents,
            discontinuedStudents,
            trainerCount: totalTrainers,
            totalFeeCollected: feeAgg[0] ? feeAgg[0].totalCollected : 0,
            totalPendingFee: pendingFeesAgg[0] ? pendingFeesAgg[0].totalPending : 0,
            certificatesIssued,
            placementsCount,
          },
          courseWiseLeads: courseWiseLeads.map((c) => ({ course: c._id || 'Unknown', count: c.count })),
          statusBreakdown: statusBreakdown.map((s) => ({ status: s._id || 'Other', count: s.count })),
          recentLeads,
          recentAdmissions,
        },
      });
    }

    if (user.role === 'staff') {
      const staffQuery = {
        $or: [{ assignedStaff: user._id }, { interestedCourse: { $in: user.assignedCourses || [] } }],
      };

      const [assignedLeads, newLeads, interestedLeads, pendingFollowUps, counsellingCount, convertedAdmissions] =
        await Promise.all([
          Lead.countDocuments(staffQuery),
          Lead.countDocuments({ ...staffQuery, leadStatus: 'New Lead' }),
          Lead.countDocuments({ ...staffQuery, leadStatus: 'Interested' }),
          Lead.countDocuments({ ...staffQuery, followUpDate: { $lte: todayEnd }, leadStatus: { $nin: ['Admission Confirmed', 'Lost', 'Not Interested'] } }),
          Lead.countDocuments({ ...staffQuery, leadStatus: 'Counselling Scheduled' }),
          Lead.countDocuments({ ...staffQuery, leadStatus: 'Admission Confirmed' }),
        ]);

      const recentAssigned = await Lead.find(staffQuery).sort({ createdAt: -1 }).limit(8);

      return res.json({
        success: true,
        role: 'staff',
        data: {
          metrics: {
            assignedLeads,
            newLeads,
            interestedLeads,
            pendingFollowUps,
            counsellingCount,
            convertedAdmissions,
            conversionRate: assignedLeads > 0 ? Math.round((convertedAdmissions / assignedLeads) * 100) : 0,
          },
          assignedCourses: user.assignedCourses || [],
          recentAssigned,
        },
      });
    }

    if (user.role === 'trainer') {
      const [assignedBatches, activeStudents] = await Promise.all([
        Batch.find({ trainerId: user._id, status: 'Ongoing' }).populate('courseId', 'name courseCode'),
        Student.countDocuments({ trainerId: user._id, status: 'Active' }),
      ]);

      const batchIds = assignedBatches.map((b) => b._id);
      const todayString = new Date().toISOString().split('T')[0];
      const todayAttendance = await Attendance.find({ batchId: { $in: batchIds }, dateString: todayString });

      return res.json({
        success: true,
        role: 'trainer',
        data: {
          metrics: {
            assignedBatchesCount: assignedBatches.length,
            activeStudentsCount: activeStudents,
            todayAttendanceMarked: todayAttendance.length,
          },
          batches: assignedBatches,
        },
      });
    }

    // Default student overview
    const student = await Student.findOne({ $or: [{ userId: user._id }, { email: user.email }] });
    res.json({
      success: true,
      role: 'student',
      data: { student },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Generate all reports data dynamically based on report type
// @route GET /api/reports/:reportType
const getReportByType = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { exportFormat } = req.query; // 'json' or 'excel'

    let columns = [];
    let data = [];
    let sheetName = 'Report';

    switch (reportType) {
      case 'daily-leads':
        sheetName = 'Daily Leads';
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const dailyLeads = await Lead.find({ enquiryDate: { $gte: todayStart } }).populate('assignedStaff', 'name staffIdentifier');
        columns = [
          { header: 'Lead ID', key: 'leadId', width: 18 },
          { header: 'Customer Name', key: 'customerName', width: 22 },
          { header: 'Mobile', key: 'mobileNumber', width: 16 },
          { header: 'Course', key: 'interestedCourse', width: 20 },
          { header: 'Source', key: 'leadSource', width: 18 },
          { header: 'Status', key: 'leadStatus', width: 18 },
          { header: 'Assigned Staff', key: 'staff', width: 18 },
        ];
        data = dailyLeads.map((l) => ({
          leadId: l.leadId,
          customerName: l.customerName,
          mobileNumber: l.mobileNumber,
          interestedCourse: l.interestedCourse,
          leadSource: l.leadSource,
          leadStatus: l.leadStatus,
          staff: l.assignedStaff ? l.assignedStaff.name : 'Unassigned',
        }));
        break;

      case 'monthly-leads':
        sheetName = 'Monthly Leads Summary';
        const monthlyAgg = await Lead.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$enquiryDate' },
                month: { $month: '$enquiryDate' },
                source: '$leadSource',
              },
              count: { $sum: 1 },
              admissions: {
                $sum: { $cond: [{ $eq: ['$leadStatus', 'Admission Confirmed'] }, 1, 0] },
              },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
        ]);
        columns = [
          { header: 'Year', key: 'year', width: 12 },
          { header: 'Month', key: 'month', width: 12 },
          { header: 'Source', key: 'source', width: 20 },
          { header: 'Total Leads', key: 'count', width: 15 },
          { header: 'Admissions Confirmed', key: 'admissions', width: 22 },
        ];
        data = monthlyAgg.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          source: m._id.source || 'General',
          count: m.count,
          admissions: m.admissions,
        }));
        break;

      case 'course-wise-leads':
        sheetName = 'Course Leads';
        const courseAgg = await Lead.aggregate([
          {
            $group: {
              _id: '$interestedCourse',
              totalLeads: { $sum: 1 },
              admissions: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Admission Confirmed'] }, 1, 0] } },
              interested: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Interested'] }, 1, 0] } },
              lost: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Lost'] }, 1, 0] } },
            },
          },
          { $sort: { totalLeads: -1 } },
        ]);
        columns = [
          { header: 'Course Name', key: 'course', width: 25 },
          { header: 'Total Leads', key: 'totalLeads', width: 15 },
          { header: 'Admissions Confirmed', key: 'admissions', width: 22 },
          { header: 'Interested Leads', key: 'interested', width: 18 },
          { header: 'Lost Leads', key: 'lost', width: 15 },
        ];
        data = courseAgg.map((c) => ({
          course: c._id || 'Unknown',
          totalLeads: c.totalLeads,
          admissions: c.admissions,
          interested: c.interested,
          lost: c.lost,
        }));
        break;

      case 'staff-wise-leads':
        sheetName = 'Staff Leads';
        const staffAgg = await Lead.aggregate([
          {
            $group: {
              _id: '$assignedStaff',
              totalAssigned: { $sum: 1 },
              admissions: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Admission Confirmed'] }, 1, 0] } },
            },
          },
        ]);
        columns = [
          { header: 'Staff Member', key: 'staffName', width: 24 },
          { header: 'Assigned Leads', key: 'totalAssigned', width: 18 },
          { header: 'Conversions', key: 'admissions', width: 18 },
          { header: 'Conversion Rate %', key: 'rate', width: 18 },
        ];
        data = await Promise.all(
          staffAgg.map(async (s) => {
            const staffUser = s._id ? await User.findById(s._id) : null;
            const rate = s.totalAssigned > 0 ? Math.round((s.admissions / s.totalAssigned) * 100) : 0;
            return {
              staffName: staffUser ? staffUser.name : 'Unassigned Queue',
              totalAssigned: s.totalAssigned,
              admissions: s.admissions,
              rate: `${rate}%`,
            };
          })
        );
        break;

      case 'fee-collection':
        sheetName = 'Fee Collection';
        const payments = await Payment.find().populate('studentId', 'studentId name courseName').sort({ paymentDate: -1 });
        columns = [
          { header: 'Receipt No', key: 'receiptNumber', width: 18 },
          { header: 'Date', key: 'date', width: 14 },
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Amount (INR)', key: 'amount', width: 16 },
          { header: 'Payment Mode', key: 'mode', width: 16 },
          { header: 'Ref No', key: 'ref', width: 20 },
        ];
        data = payments.map((p) => ({
          receiptNumber: p.receiptNumber,
          date: new Date(p.paymentDate).toLocaleDateString('en-IN'),
          studentId: p.studentId ? p.studentId.studentId : 'N/A',
          studentName: p.studentId ? p.studentId.name : 'N/A',
          course: p.studentId ? p.studentId.courseName : 'N/A',
          amount: p.amount,
          mode: p.paymentMode,
          ref: p.transactionReference || '',
        }));
        break;

      case 'pending-fees':
        sheetName = 'Pending Fees';
        const pendingFees = await StudentFee.find({ outstandingBalance: { $gt: 0 } }).populate('studentId', 'studentId name mobile email courseName');
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'name', width: 22 },
          { header: 'Mobile', key: 'mobile', width: 16 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Final Fee', key: 'finalFee', width: 15 },
          { header: 'Total Paid', key: 'totalPaid', width: 15 },
          { header: 'Balance Due', key: 'balance', width: 16 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        data = pendingFees.map((f) => ({
          studentId: f.studentId ? f.studentId.studentId : 'N/A',
          name: f.studentId ? f.studentId.name : 'N/A',
          mobile: f.studentId ? f.studentId.mobile : 'N/A',
          course: f.studentId ? f.studentId.courseName : 'N/A',
          finalFee: f.finalFee,
          totalPaid: f.totalPaid,
          balance: f.outstandingBalance,
          status: f.paymentStatus,
        }));
        break;

      case 'source-wise-leads':
        sheetName = 'Source-wise Leads';
        const sourceAgg = await Lead.aggregate([
          {
            $group: {
              _id: '$leadSource',
              totalLeads: { $sum: 1 },
              admissions: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Admission Confirmed'] }, 1, 0] } },
              interested: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Interested'] }, 1, 0] } },
              lost: { $sum: { $cond: [{ $eq: ['$leadStatus', 'Lost'] }, 1, 0] } },
            },
          },
          { $sort: { totalLeads: -1 } },
        ]);
        columns = [
          { header: 'Lead Source', key: 'source', width: 25 },
          { header: 'Total Leads', key: 'totalLeads', width: 15 },
          { header: 'Admissions Confirmed', key: 'admissions', width: 22 },
          { header: 'Conversion Rate', key: 'rate', width: 18 },
          { header: 'Interested Leads', key: 'interested', width: 18 },
          { header: 'Lost Leads', key: 'lost', width: 15 },
        ];
        data = sourceAgg.map((s) => ({
          source: s._id || 'Unknown',
          totalLeads: s.totalLeads,
          admissions: s.admissions,
          rate: s.totalLeads > 0 ? `${Math.round((s.admissions / s.totalLeads) * 100)}%` : '0%',
          interested: s.interested,
          lost: s.lost,
        }));
        break;

      case 'admission-conversion':
        sheetName = 'Admission Conversion';
        const admissions = await Admission.find().populate('leadId', 'leadId customerName leadSource').populate('courseId', 'name').sort({ admissionDate: -1 });
        columns = [
          { header: 'Admission No', key: 'admissionNumber', width: 18 },
          { header: 'Date', key: 'date', width: 14 },
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Original Lead ID', key: 'leadId', width: 18 },
          { header: 'Source', key: 'source', width: 18 },
          { header: 'Agreed Fee', key: 'fee', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        data = admissions.map((a) => ({
          admissionNumber: a.admissionNumber,
          date: new Date(a.admissionDate).toLocaleDateString('en-IN'),
          studentId: a.studentUniqueId || 'N/A',
          studentName: a.studentName,
          course: a.courseName,
          leadId: a.leadId ? a.leadId.leadId : a.leadUniqueId || 'N/A',
          source: a.leadId ? a.leadId.leadSource : 'Direct',
          fee: a.feeAgreed,
          status: a.status,
        }));
        break;

      case 'student-registration':
        sheetName = 'Student Registrations';
        const allStudents = await Student.find().sort({ admissionDate: -1 });
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Name', key: 'name', width: 22 },
          { header: 'Mobile', key: 'mobile', width: 16 },
          { header: 'Email', key: 'email', width: 24 },
          { header: 'Course', key: 'courseName', width: 22 },
          { header: 'Batch', key: 'batchName', width: 20 },
          { header: 'Admission Date', key: 'admissionDate', width: 16 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        data = allStudents.map((s) => ({
          studentId: s.studentId,
          name: s.name,
          mobile: s.mobile,
          email: s.email || 'N/A',
          courseName: s.courseName,
          batchName: s.batchName,
          admissionDate: new Date(s.admissionDate).toLocaleDateString('en-IN'),
          status: s.status,
        }));
        break;

      case 'batch-wise-students':
        sheetName = 'Batch-wise Students';
        const batches = await Batch.find().populate('courseId', 'name').populate('trainerId', 'name');
        columns = [
          { header: 'Batch ID', key: 'batchId', width: 16 },
          { header: 'Batch Name', key: 'batchName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Trainer', key: 'trainer', width: 20 },
          { header: 'Capacity', key: 'capacity', width: 12 },
          { header: 'Enrolled', key: 'enrolled', width: 12 },
          { header: 'Status', key: 'status', width: 15 },
        ];
        data = batches.map((b) => ({
          batchId: b.batchId,
          batchName: b.batchName,
          course: b.courseId ? b.courseId.name : b.courseName,
          trainer: b.trainerId ? b.trainerId.name : b.trainerName,
          capacity: b.studentCapacity,
          enrolled: b.enrolledCount,
          status: b.status,
        }));
        break;

      case 'weekly-progress':
        sheetName = 'Weekly Progress';
        const progressList = await StudentProgress.find().populate('studentId', 'studentId name courseName batchName').sort({ updatedAt: -1 });
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Batch', key: 'batch', width: 20 },
          { header: 'Current Week', key: 'currentWeek', width: 14 },
          { header: 'Progress %', key: 'progress', width: 14 },
          { header: 'Expected %', key: 'expected', width: 14 },
          { header: 'Learning Delay', key: 'isDelayed', width: 15 },
        ];
        data = progressList.map((p) => ({
          studentId: p.studentId ? p.studentId.studentId : 'N/A',
          studentName: p.studentId ? p.studentId.name : 'N/A',
          course: p.studentId ? p.studentId.courseName : 'N/A',
          batch: p.studentId ? p.studentId.batchName : 'N/A',
          currentWeek: `Week ${p.currentWeek}`,
          progress: `${p.actualProgressPercentage}%`,
          expected: `${p.expectedProgressPercentage}%`,
          isDelayed: p.isDelayedLearning ? 'DELAYED' : 'On Track',
        }));
        break;

      case 'attendance-report':
        sheetName = 'Attendance Summary';
        const attAgg = await Attendance.aggregate([
          {
            $group: {
              _id: '$studentId',
              totalClasses: { $sum: 1 },
              presentCount: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
              absentCount: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
              leaveCount: { $sum: { $cond: [{ $eq: ['$status', 'Leave'] }, 1, 0] } },
            },
          },
        ]);
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Total Sessions', key: 'total', width: 15 },
          { header: 'Present', key: 'present', width: 12 },
          { header: 'Absent', key: 'absent', width: 12 },
          { header: 'Attendance %', key: 'percentage', width: 15 },
        ];
        data = await Promise.all(
          attAgg.map(async (a) => {
            const st = await Student.findById(a._id);
            const pct = a.totalClasses > 0 ? Math.round((a.presentCount / a.totalClasses) * 100) : 0;
            return {
              studentId: st ? st.studentId : 'N/A',
              studentName: st ? st.name : 'Unknown',
              course: st ? st.courseName : 'N/A',
              total: a.totalClasses,
              present: a.presentCount,
              absent: a.absentCount,
              percentage: `${pct}%`,
            };
          })
        );
        break;

      case 'assignment-report':
        sheetName = 'Assignment Submissions';
        const submissions = await AssignmentSubmission.find().populate('assignmentId', 'title courseName weekNumber').populate('studentId', 'studentId name courseName');
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Assignment', key: 'title', width: 25 },
          { header: 'Course', key: 'course', width: 20 },
          { header: 'Week', key: 'week', width: 10 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Marks Obtained', key: 'marks', width: 16 },
        ];
        data = submissions.map((s) => ({
          studentId: s.studentId ? s.studentId.studentId : 'N/A',
          studentName: s.studentId ? s.studentId.name : 'N/A',
          title: s.assignmentId ? s.assignmentId.title : 'N/A',
          course: s.studentId ? s.studentId.courseName : 'N/A',
          week: s.assignmentId ? s.assignmentId.weekNumber : '-',
          status: s.evaluationStatus,
          marks: s.marksObtained !== undefined ? s.marksObtained : '-',
        }));
        break;

      case 'examination-report':
        sheetName = 'Exam Results';
        const examResults = await ExamResult.find().populate('examId', 'title courseName totalMarks').populate('studentId', 'studentId name courseName');
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Examination', key: 'title', width: 25 },
          { header: 'Score', key: 'score', width: 12 },
          { header: 'Percentage', key: 'percentage', width: 14 },
          { header: 'Result', key: 'result', width: 14 },
        ];
        data = examResults.map((e) => ({
          studentId: e.studentId ? e.studentId.studentId : 'N/A',
          studentName: e.studentId ? e.studentId.name : 'N/A',
          title: e.examId ? e.examId.title : 'N/A',
          score: `${e.score}/${e.totalMarks}`,
          percentage: `${e.percentage}%`,
          result: e.isPassed ? 'PASSED' : 'FAILED',
        }));
        break;

      case 'certificate-report':
        sheetName = 'Certificates';
        const certs = await Certificate.find().sort({ createdAt: -1 });
        columns = [
          { header: 'Certificate ID', key: 'certificateId', width: 18 },
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Grade', key: 'grade', width: 14 },
          { header: 'Status', key: 'status', width: 18 },
          { header: 'Issue Date', key: 'issueDate', width: 15 },
        ];
        data = certs.map((c) => ({
          certificateId: c.certificateId,
          studentId: c.studentUniqueId,
          studentName: c.studentName,
          course: c.courseName,
          grade: c.grade || 'N/A',
          status: c.adminApprovalStatus,
          issueDate: c.issueDate ? new Date(c.issueDate).toLocaleDateString('en-IN') : 'Pending',
        }));
        break;

      case 'placement-report':
        sheetName = 'Placements';
        const placements = await Placement.find().sort({ updatedAt: -1 });
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Student Name', key: 'studentName', width: 22 },
          { header: 'Course', key: 'course', width: 22 },
          { header: 'Job Status', key: 'jobStatus', width: 18 },
          { header: 'Company', key: 'company', width: 22 },
          { header: 'Role', key: 'role', width: 20 },
          { header: 'Placement Date', key: 'placementDate', width: 16 },
        ];
        data = placements.map((p) => ({
          studentId: p.studentUniqueId,
          studentName: p.studentName,
          course: p.courseName,
          jobStatus: p.jobStatus,
          company: p.company || 'N/A',
          role: p.jobRole || 'N/A',
          placementDate: p.placementDate ? new Date(p.placementDate).toLocaleDateString('en-IN') : 'N/A',
        }));
        break;

      default:
        // Generic active students report
        sheetName = 'Active Students';
        const activeSt = await Student.find({ status: 'Active' });
        columns = [
          { header: 'Student ID', key: 'studentId', width: 16 },
          { header: 'Name', key: 'name', width: 22 },
          { header: 'Course', key: 'courseName', width: 22 },
          { header: 'Batch', key: 'batchName', width: 20 },
          { header: 'Mobile', key: 'mobile', width: 16 },
          { header: 'Admission Date', key: 'admDate', width: 16 },
        ];
        data = activeSt.map((s) => ({
          studentId: s.studentId,
          name: s.name,
          courseName: s.courseName,
          batchName: s.batchName,
          mobile: s.mobile,
          admDate: new Date(s.admissionDate).toLocaleDateString('en-IN'),
        }));
        break;
    }

    if (exportFormat === 'excel') {
      const buffer = await exportToExcelBuffer({ sheetName, columns, data });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}_${Date.now()}.xlsx`);
      return res.send(buffer);
    }

    res.json({
      success: true,
      reportType,
      columns,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDashboardStats,
  getReportByType,
};
