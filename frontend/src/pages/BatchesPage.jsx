import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Calendar, Plus, Users, Clock, User, BookOpen } from 'lucide-react';

export const BatchesPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const canManageBatches = isAdmin || isStaff;
  const { success, error } = useToast();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    courseId: '',
    trainerId: '',
    startDate: '',
    endDate: '',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    studentCapacity: 25,
  });

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/batches');
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
    const loadPrerequisites = async () => {
      try {
        const [cRes, tRes] = await Promise.all([api.get('/courses'), api.get('/trainers')]);
        if (cRes.data.success) setCourses(cRes.data.data);
        if (tRes.data.success) setTrainers(tRes.data.data);
      } catch (e) {}
    };
    loadPrerequisites();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        courseId: form.courseId,
        trainerId: form.trainerId,
        startDate: form.startDate,
        endDate: form.endDate,
        classTimings: { startTime: form.startTime, endTime: form.endTime },
        studentCapacity: Number(form.studentCapacity),
      };
      const res = await api.post('/batches', payload);
      if (res.data.success) {
        success('Batch created successfully');
        setShowModal(false);
        fetchBatches();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create batch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Batch Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Class schedules, training days, trainer assignment & student capacity
          </p>
        </div>
        {canManageBatches && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading batches...</div>
      ) : batches.length === 0 ? (
        <EmptyState title="No batches created" description="Create a batch to start scheduling classes." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {batch.batchId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {batch.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{batch.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{batch.courseId?.name}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Trainer: <strong className="text-slate-800">{batch.trainerId?.name || 'Assigned Trainer'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{batch.classTimings?.startTime} - {batch.classTimings?.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {new Date(batch.startDate).toLocaleDateString('en-IN')} to {new Date(batch.endDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Enrollment: <strong className="text-blue-700">{batch.currentEnrollment || 0}</strong> / {batch.studentCapacity} Capacity</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Batch Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Training Batch">
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Batch Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. VFX & Animation Morning Batch 2026-A"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course *</label>
              <select
                required
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Trainer *</label>
              <select
                required
                value={form.trainerId}
                onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
              >
                <option value="">-- Choose Trainer --</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                value={form.studentCapacity}
                onChange={(e) => setForm({ ...form, studentCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              Create Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
