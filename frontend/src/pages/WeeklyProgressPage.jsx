import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, BookOpen, MessageSquare, Plus } from 'lucide-react';

export const WeeklyProgressPage = () => {
  const { user, isAdmin, isStaff, isTrainer } = useAuth();
  const { success, error } = useToast();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compare progress
  const [comparison, setComparison] = useState(null);

  // Remark Modal
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedStudentForRemark, setSelectedStudentForRemark] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkWeek, setRemarkWeek] = useState(1);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success && res.data.data.length > 0) {
          setCourses(res.data.data);
          setSelectedCourseId(res.data.data[0]._id);
        }
      } catch (e) {}
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const fetchSyllabusAndComparison = async () => {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          api.get(`/syllabus/course/${selectedCourseId}`),
          api.get(`/progress/comparison?courseId=${selectedCourseId}`),
        ]);
        if (sRes.data.success) setSyllabus(sRes.data.data);
        if (cRes.data.success) setComparison(cRes.data);
      } catch (e) {
        error('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabusAndComparison();
  }, [selectedCourseId]);

  const handleAddRemark = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/progress/add-remark', {
        studentId: selectedStudentForRemark,
        weekNumber: Number(remarkWeek),
        remark: remarkText,
      });
      if (res.data.success) {
        success('Trainer remark recorded');
        setShowRemarkModal(false);
        setRemarkText('');
        // Refresh comparison
        const cRes = await api.get(`/progress/comparison?courseId=${selectedCourseId}`);
        if (cRes.data.success) setComparison(cRes.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add remark');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Weekly Syllabus & Progress</h1>
          <p className="text-xs text-slate-500 mt-1">
            Course-wise 12-week roadmap, lesson tracking, delay detection & batch progress
          </p>
        </div>

        {/* Course Selector Dropdown */}
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name} ({c.durationWeeks} Weeks)</option>
          ))}
        </select>
      </div>

      {/* Comparison Statistics Strip */}
      {comparison?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Enrolled Students in Course</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{comparison.stats.totalStudents}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Average Actual Completion</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{comparison.stats.averageProgressPercent}%</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 font-semibold block uppercase">Delayed Learning Flag</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{comparison.stats.delayedStudentsCount} Students</span>
            <span className="text-[11px] text-slate-400">Triggered if &gt;20% behind expected schedule</span>
          </div>
        </div>
      )}

      {/* 12-Week Syllabus Curriculum Roadmap */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
          <span>Official 12-Week Course Syllabus Modules</span>
          <span className="text-xs font-semibold text-blue-600">{syllabus.length} Modules Configured</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {syllabus.map((w) => (
            <div
              key={w._id}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                w.isFinalAssessment
                  ? 'bg-purple-50/50 border-purple-200'
                  : w.isPracticalProject
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-800 text-xs">Week {w.weekNumber}</span>
                {w.isFinalAssessment ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Final Assessment</span>
                ) : w.isPracticalProject ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Studio Project</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-700">Theory + Lab</span>
                )}
              </div>
              <h4 className="font-bold text-slate-900">{w.title}</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">{w.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student-by-Student Progress Comparison Table */}
      {comparison?.data && comparison.data.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Student-Wise Progress Tracker & Delay Detection
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Student ID & Name</th>
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Current Week</th>
                  <th className="py-2.5 px-3">Actual vs Expected</th>
                  <th className="py-2.5 px-3">Schedule Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparison.data.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-blue-700 font-bold">{p.studentId?.studentId}</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{p.studentId?.name}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.batchId?.name || 'Assigned Batch'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">Week {p.currentWeek || 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${p.actualProgressPercent || 0}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-800">{p.actualProgressPercent || 0}%</span>
                        <span className="text-[10px] text-slate-400">(Exp: {p.expectedProgressPercent || 0}%)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {p.isDelayed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Delayed Schedule
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> On Track
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {(isAdmin || isStaff || isTrainer) && (
                        <button
                          onClick={() => {
                            setSelectedStudentForRemark(p.studentId?._id);
                            setShowRemarkModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100"
                        >
                          + Remark
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Trainer Remark Modal */}
      <Modal isOpen={showRemarkModal} onClose={() => setShowRemarkModal(false)} title="Record Weekly Trainer Remark">
        <form onSubmit={handleAddRemark} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Week Number</label>
            <input
              type="number"
              min={1}
              max={12}
              value={remarkWeek}
              onChange={(e) => setRemarkWeek(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trainer Observation / Remark *</label>
            <textarea
              required
              rows={3}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Excellent keyframing and timing. Needs more practice on secondary cloth simulation."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowRemarkModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Save Remark</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
