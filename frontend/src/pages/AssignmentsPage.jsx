import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { FileCheck2, Plus, Calendar, Clock, Upload, CheckCircle2, Award } from 'lucide-react';

export const AssignmentsPage = () => {
  const { user, isAdmin, isStaff, isTrainer, isStudent } = useAuth();
  const { success, error } = useToast();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    courseId: '',
    batchId: '',
    weekNumber: 1,
    deadline: '',
    totalMarks: 100,
  });

  const [submitForm, setSubmitForm] = useState({
    submissionUrl: '',
    notes: '',
  });

  const [evalForm, setEvalForm] = useState({
    marksObtained: 85,
    trainerRemarks: '',
  });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      if (res.data.success) {
        setAssignments(res.data.data);
      }
    } catch (e) {
      error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    const loadPrerequisites = async () => {
      try {
        const [cRes, bRes] = await Promise.all([api.get('/courses'), api.get('/batches')]);
        if (cRes.data.success) setCourses(cRes.data.data);
        if (bRes.data.success) setBatches(bRes.data.data);
      } catch (e) {}
    };
    loadPrerequisites();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/assignments', createForm);
      if (res.data.success) {
        success('Assignment created & published to students');
        setShowCreateModal(false);
        fetchAssignments();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const openSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      if (res.data.success) {
        setSubmissionsList(res.data.data);
      }
    } catch (e) {}
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find linked student ID from auth user
      const studentId = user?.linkedStudentId || user?.linkedStudent?._id;
      if (!studentId) {
        error('Student profile not associated with this account');
        return;
      }

      const res = await api.post(`/assignments/${selectedAssignment._id}/submit`, {
        studentId,
        ...submitForm,
      });

      if (res.data.success) {
        success('Assignment submitted for evaluation!');
        setShowSubmitModal(false);
        setSubmitForm({ submissionUrl: '', notes: '' });
      }
    } catch (err) {
      error('Submission failed');
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/assignments/evaluate/${selectedSubmission._id}`, evalForm);
      if (res.data.success) {
        success('Evaluation recorded');
        setShowEvalModal(false);
        openSubmissions(selectedAssignment);
      }
    } catch (err) {
      error('Evaluation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignment Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 12 Practical Studio Projects, Submissions & Trainer Evaluations
          </p>
        </div>

        {(isAdmin || isStaff || isTrainer) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <EmptyState title="No assignments found" description="Create an assignment for batch students." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((asgn) => (
            <div
              key={asgn._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Week {asgn.weekNumber}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800">
                    Max Marks: {asgn.totalMarks}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{asgn.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">{asgn.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p><strong className="text-slate-800">Course:</strong> {asgn.courseId?.name}</p>
                  <p><strong className="text-slate-800">Batch:</strong> {asgn.batchId?.name || 'All Batches'}</p>
                  <p className="text-rose-600 font-semibold">
                    Deadline: {new Date(asgn.deadline).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                {isStudent ? (
                  <button
                    onClick={() => {
                      setSelectedAssignment(asgn);
                      setShowSubmitModal(true);
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  >
                    Submit Assignment Work
                  </button>
                ) : (
                  <button
                    onClick={() => openSubmissions(asgn)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    View Student Submissions &rarr;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions List Drawer / Modal */}
      {selectedAssignment && !showSubmitModal && !showEvalModal && (
        <Modal
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          title={`Submissions: ${selectedAssignment.title}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4 text-xs">
            {submissionsList.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No student submissions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissionsList.map((sub) => (
                  <div key={sub._id} className="py-3 flex items-start justify-between">
                    <div>
                      <span className="font-mono text-blue-700 font-bold">{sub.studentId?.studentId}</span>
                      <h4 className="font-bold text-slate-900 mt-0.5">{sub.studentId?.name}</h4>
                      {sub.submissionUrl && (
                        <a href={sub.submissionUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline block mt-1 font-mono text-[11px]">
                          🔗 {sub.submissionUrl}
                        </a>
                      )}
                      {sub.trainerRemarks && (
                        <p className="text-emerald-700 bg-emerald-50 p-2 rounded-lg mt-2 text-[11px]">
                          <strong>Feedback:</strong> {sub.trainerRemarks}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-base text-slate-900 block">
                        {sub.marksObtained !== null ? `${sub.marksObtained}/${selectedAssignment.totalMarks}` : 'Ungraded'}
                      </span>
                      <Badge status={sub.evaluationStatus} className="mt-1" />
                      {(isAdmin || isStaff || isTrainer) && (
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setShowEvalModal(true);
                          }}
                          className="mt-2 px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[11px] block ml-auto hover:bg-blue-700"
                        >
                          Grade / Evaluate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Evaluate Modal */}
      <Modal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} title="Evaluate Assignment Submission">
        <form onSubmit={handleEvaluate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Marks Awarded (out of {selectedAssignment?.totalMarks || 100}) *</label>
            <input
              type="number"
              required
              min={0}
              max={selectedAssignment?.totalMarks || 100}
              value={evalForm.marksObtained}
              onChange={(e) => setEvalForm({ ...evalForm, marksObtained: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-700"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trainer Feedback & Remarks</label>
            <textarea
              rows={3}
              value={evalForm.trainerRemarks}
              onChange={(e) => setEvalForm({ ...evalForm, trainerRemarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Excellent attention to framing and pacing. Good color depth."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowEvalModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Save Grade</button>
          </div>
        </form>
      </Modal>

      {/* Student Submit Work Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Assignment Project">
        <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Link / Cloud Drive URL *</label>
            <input
              type="url"
              required
              value={submitForm.submissionUrl}
              onChange={(e) => setSubmitForm({ ...submitForm, submissionUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
              placeholder="https://drive.google.com/... or https://vimeo.com/..."
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Submission Notes</label>
            <textarea
              rows={3}
              value={submitForm.notes}
              onChange={(e) => setSubmitForm({ ...submitForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="Key design choices, render settings, software versions used."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Submit Project</button>
          </div>
        </form>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Studio Assignment">
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assignment Title *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Commercial 60-Second Edit Teaser"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course *</label>
              <select
                required
                value={createForm.courseId}
                onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch</label>
              <select
                value={createForm.batchId}
                onChange={(e) => setCreateForm({ ...createForm, batchId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">-- All Course Batches --</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Week Number</label>
              <input
                type="number"
                min={1}
                max={12}
                value={createForm.weekNumber}
                onChange={(e) => setCreateForm({ ...createForm, weekNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Submission Deadline *</label>
              <input
                type="date"
                required
                value={createForm.deadline}
                onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
              <input
                type="number"
                value={createForm.totalMarks}
                onChange={(e) => setCreateForm({ ...createForm, totalMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assignment Brief & Instructions *</label>
            <textarea
              required
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="Detailed guidelines, deliverables, required file format."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Publish Assignment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
