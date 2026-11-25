const { Assignment, AssignmentSubmission, Student, Batch } = require('../models');
const { createNotification } = require('../services/notificationService');

// @desc Create assignment (Trainer / Admin)
// @route POST /api/assignments
const createAssignment = async (req, res) => {
  try {
    const { title, description, courseId, batchId, weekNumber, deadline, totalMarks, instructions } = req.body;

    const assignment = await Assignment.create({
      title,
      description,
      courseId,
      batchId,
      weekNumber,
      deadline: new Date(deadline),
      totalMarks: Number(totalMarks) || 100,
      instructions,
      createdBy: req.user._id,
    });

    // Notify batch students
    const batch = await Batch.findById(batchId);
    await createNotification({
      roleTarget: 'all',
      title: 'New Assignment Published',
      message: `Assignment "${title}" for ${batch ? batch.name : 'Batch'} is now available. Deadline: ${new Date(deadline).toLocaleDateString('en-IN')}`,
      type: 'assignment',
      link: `/assignments/${assignment._id}`,
      relatedEntityId: assignment._id,
      relatedEntityType: 'Assignment',
    });

    res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get assignments with filters
// @route GET /api/assignments
const getAssignments = async (req, res) => {
  try {
    const { batchId, courseId, weekNumber } = req.query;
    const query = {};

    if (batchId) query.batchId = batchId;
    if (courseId) query.courseId = courseId;
    if (weekNumber) query.weekNumber = weekNumber;

    const assignments = await Assignment.find(query)
      .populate('courseId', 'name courseCode')
      .populate('batchId', 'name batchId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Submit assignment work (Student or Trainer recording submission)
// @route POST /api/assignments/:id/submit
const submitAssignment = async (req, res) => {
  try {
    const { studentId, submissionUrl, projectFileUrl, notes } = req.body;
    const assignmentId = req.params.id;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        assignmentId,
        studentId,
        submissionDate: new Date(),
        submissionUrl: submissionUrl || '',
        projectFileUrl: projectFileUrl || '',
        notes: notes || '',
        evaluationStatus: 'Submitted',
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: 'Assignment submitted successfully', data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Evaluate student assignment (Trainer / Admin)
// @route POST /api/assignments/evaluate/:submissionId
const evaluateAssignment = async (req, res) => {
  try {
    const { marksObtained, trainerRemarks, evaluationStatus = 'Evaluated' } = req.body;
    const submission = await AssignmentSubmission.findById(req.params.submissionId).populate('assignmentId studentId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.marksObtained = Number(marksObtained);
    submission.trainerRemarks = trainerRemarks || '';
    submission.evaluationStatus = evaluationStatus;
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();
    await submission.save();

    await createNotification({
      roleTarget: 'student',
      title: 'Assignment Evaluated',
      message: `Your assignment "${submission.assignmentId ? submission.assignmentId.title : 'Task'}" has been evaluated. Marks: ${marksObtained}/${submission.assignmentId ? submission.assignmentId.totalMarks : 100}`,
      type: 'assignment',
      link: `/students/${submission.studentId ? submission.studentId._id : ''}`,
      relatedEntityId: submission._id,
      relatedEntityType: 'AssignmentSubmission',
    });

    res.json({ success: true, message: 'Evaluation submitted successfully', data: submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Get submissions for an assignment
// @route GET /api/assignments/:id/submissions
const getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignmentId: req.params.id })
      .populate('studentId', 'studentId name mobile status photoUrl')
      .populate('evaluatedBy', 'name');

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  submitAssignment,
  evaluateAssignment,
  getAssignmentSubmissions,
};
