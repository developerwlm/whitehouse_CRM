const { Attendance, Batch, Student, User } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Mark or update batch attendance for a specific date
// @route POST /api/attendance/mark
const markBatchAttendance = async (req, res) => {
  try {
    const { batchId, classDate, topic = '', attendanceRecords = [] } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const dateObj = new Date(classDate);
    const dateString = dateObj.toISOString().split('T')[0];

    const results = [];
    const absentStudents = [];

    for (const record of attendanceRecords) {
      const { studentId, status, remarks = '' } = record;

      // Upsert: prevent duplicate attendance for the same student on the same date session
      const attendance = await Attendance.findOneAndUpdate(
        {
          studentId,
          batchId: batch._id,
          dateString,
        },
        {
          studentId,
          batchId: batch._id,
          courseId: batch.courseId,
          trainerId: req.user._id,
          classDate: dateObj,
          dateString,
          status,
          sessionTopic: topic,
          remarks,
          markedBy: req.user._id,
        },
        { upsert: true, new: true }
      );
      results.push(attendance);

      if (status === 'Absent') {
        absentStudents.push(studentId);
      }
    }

    // Check attendance thresholds and notify if student has consecutive absences
    if (absentStudents.length > 0) {
      for (const sId of absentStudents) {
        const recentAbsences = await Attendance.find({
          studentId: sId,
          batchId: batch._id,
        })
          .sort({ classDate: -1 })
          .limit(3);

        const allAbsent = recentAbsences.length >= 3 && recentAbsences.every((a) => a.status === 'Absent');
        if (allAbsent) {
          const student = await Student.findById(sId);
          if (student) {
            await createNotification({
              roleTarget: 'staff',
              title: 'Attendance Alert: 3 Consecutive Absences',
              message: `${student.name} (${student.studentId}) has been absent for 3 consecutive classes in ${batch.name}. Contact required.`,
              type: 'attendance',
              link: `/students/${student._id}`,
              relatedEntityId: student._id,
              relatedEntityType: 'Student',
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${results.length} students on ${dateString}`,
      count: results.length,
      data: results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get attendance records for a batch on a specific date
// @route GET /api/attendance/batch/:batchId
const getBatchAttendanceByDate = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { date } = req.query;

    const query = { batchId };
    if (date) {
      query.dateString = date;
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'studentId name photoUrl status mobile')
      .populate('trainerId', 'name')
      .sort({ classDate: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get student attendance summary and history
// @route GET /api/attendance/student/:studentId
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ studentId }).sort({ classDate: -1 });

    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const leave = records.filter((r) => r.status === 'Leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalClasses: total,
        presentCount: present,
        absentCount: absent,
        leaveCount: leave,
        attendancePercentage: percentage,
      },
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Monthly attendance report for a batch
// @route GET /api/attendance/monthly-report
const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { batchId, year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

    const monthStr = month.toString().padStart(2, '0');
    const prefix = `${year}-${monthStr}`;

    const records = await Attendance.find({
      batchId,
      dateString: { $regex: `^${prefix}` },
    }).populate('studentId', 'studentId name');

    // Aggregate by student
    const studentMap = {};
    for (const rec of records) {
      if (!rec.studentId) continue;
      const sId = rec.studentId._id.toString();
      if (!studentMap[sId]) {
        studentMap[sId] = {
          studentId: rec.studentId.studentId,
          name: rec.studentId.name,
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
        };
      }
      studentMap[sId].total++;
      if (rec.status === 'Present') studentMap[sId].present++;
      else if (rec.status === 'Absent') studentMap[sId].absent++;
      else if (rec.status === 'Leave') studentMap[sId].leave++;
    }

    const report = Object.values(studentMap).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
    }));

    res.json({
      success: true,
      month: `${year}-${monthStr}`,
      totalDaysMarked: new Set(records.map((r) => r.dateString)).size,
      data: report,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  markBatchAttendance,
  getBatchAttendanceByDate,
  getStudentAttendance,
  getMonthlyAttendanceReport,
};
