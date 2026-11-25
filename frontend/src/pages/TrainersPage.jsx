import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import {
  UserCog,
  Mail,
  Phone,
  Calendar,
  Users,
  Star,
  Plus,
  Edit3,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

export const TrainersPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const canManageTrainers = isAdmin || isStaff;
  const { success, error } = useToast();

  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    qualification: '',
    experienceYears: 3,
    specializations: '',
    bio: '',
  });

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/trainers');
      if (res.data.success) {
        setTrainers(res.data.data);
      }
    } catch (e) {
      error('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
  }, []);

  const openCreateModal = () => {
    setSelectedTrainer(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      qualification: 'Certified Industry Professional',
      experienceYears: 3,
      specializations: '',
      bio: '',
    });
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setSelectedTrainer(trainer);
    const specs = trainer.profile?.specializations?.length
      ? trainer.profile.specializations.join(', ')
      : (trainer.assignedCourses?.join(', ') || '');

    setForm({
      name: trainer.name || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      password: '',
      qualification: trainer.profile?.qualification || '',
      experienceYears: trainer.profile?.experienceYears ?? 3,
      specializations: specs,
      bio: trainer.profile?.bio || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const specsArray = form.specializations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (selectedTrainer) {
        // Update existing trainer
        const payload = {
          name: form.name,
          phone: form.phone,
          qualification: form.qualification,
          experienceYears: Number(form.experienceYears),
          specializations: specsArray,
          assignedCourses: specsArray,
          bio: form.bio,
        };
        const res = await api.put(`/trainers/${selectedTrainer._id}`, payload);
        if (res.data.success) {
          success('Faculty trainer updated successfully');
          setShowModal(false);
          fetchTrainers();
        }
      } else {
        // Create new trainer
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password || 'Trainer@123',
          qualification: form.qualification,
          experienceYears: Number(form.experienceYears),
          specializations: specsArray,
          assignedCourses: specsArray,
          bio: form.bio,
        };
        const res = await api.post('/trainers', payload);
        if (res.data.success) {
          success('New faculty trainer created successfully');
          setShowModal(false);
          fetchTrainers();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error saving trainer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Trainers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Technical instructors, batch allocations, and student progress oversight
          </p>
        </div>
        {canManageTrainers && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Trainer</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading trainers...</div>
      ) : trainers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No trainers registered yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add faculty trainers to assign them to courses, batches, and student evaluations.
          </p>
          {canManageTrainers && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Trainer</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120'}
                      alt={t.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{t.name}</h3>
                      <span className="text-[11px] text-blue-600 font-semibold block">
                        {t.profile?.qualification || 'Senior Faculty Trainer'}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{t.profile?.rating || '4.9'} / 5.0 Rating</span>
                      </div>
                    </div>
                  </div>

                  {canManageTrainers && (
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit Trainer Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Specializations / Courses */}
                <div className="flex flex-wrap gap-1.5">
                  {(t.profile?.specializations?.length
                    ? t.profile.specializations
                    : t.assignedCourses?.length
                    ? t.assignedCourses
                    : ['General Instructor']
                  ).map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Experience: <strong className="text-slate-900">{t.profile?.experienceYears || 3} Years</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Active Batches: <strong className="text-slate-900">{t.activeBatches?.length || 0} Batches</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Under Instruction: <strong className="text-blue-700">{t.totalActiveStudents || 0} Students</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certified Faculty
                </span>
                {canManageTrainers && (
                  <button
                    onClick={() => openEditModal(t)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    Manage Profile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trainer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedTrainer ? `Edit Trainer: ${selectedTrainer.name}` : 'Add New Faculty Trainer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                disabled={Boolean(selectedTrainer)}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 disabled:opacity-60"
                placeholder="trainer@whitehouse.org.in"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {selectedTrainer ? 'Password (Leave blank to keep current)' : 'Password (Default: Trainer@123)'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification / Degree</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                placeholder="e.g. Master of Fine Arts / Lead VFX Artist"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Specializations / Assigned Courses (comma-separated) *
            </label>
            <input
              type="text"
              required
              value={form.specializations}
              onChange={(e) => setForm({ ...form, specializations: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              placeholder="e.g. Video Editing, VFX & Animation, Color Grading"
            />
            {courses.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                <span className="text-[10px] text-slate-400 mr-1">Quick click to add:</span>
                {courses.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      const current = form.specializations
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!current.includes(c.name)) {
                        setForm({
                          ...form,
                          specializations: current.concat(c.name).join(', '),
                        });
                      }
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 transition-colors"
                  >
                    + {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bio / Profile Summary</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
              placeholder="Brief professional background, industry projects, or teaching expertise..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : selectedTrainer ? 'Save Changes' : 'Create Trainer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
