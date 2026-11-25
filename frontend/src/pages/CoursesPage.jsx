import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { BookOpen, Plus, Clock, Award, Users, Edit3, CheckCircle } from 'lucide-react';

export const CoursesPage = () => {
  const { isAdmin, isStaff } = useAuth();
  const canManageCourses = isAdmin || isStaff;
  const { success, error } = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [form, setForm] = useState({
    name: '',
    courseCode: '',
    description: '',
    durationWeeks: 12,
    fee: 30000,
    totalHours: 120,
    syllabusOverview: '',
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setForm({
      name: course.name,
      courseCode: course.courseCode,
      description: course.description,
      durationWeeks: course.durationWeeks,
      fee: course.fee,
      totalHours: course.totalHours || 120,
      syllabusOverview: course.syllabusOverview || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedCourse(null);
    setForm({
      name: '',
      courseCode: '',
      description: '',
      durationWeeks: 12,
      fee: 30000,
      totalHours: 120,
      syllabusOverview: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCourse) {
        await api.put(`/courses/${selectedCourse._id}`, form);
        success('Course updated successfully');
      } else {
        await api.post('/courses', form);
        success('New course created with 12 weeks syllabus');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      error(err.response?.data?.message || 'Error saving course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Courses & Curriculum</h1>
          <p className="text-xs text-slate-500 mt-1">
            Industry-certified technical & creative programs at Whitehouse Institute
          </p>
        </div>
        {canManageCourses && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading courses...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {course.courseCode}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    ₹{Number(course.fee || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-3">{course.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{course.durationWeeks} Weeks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{course.totalHours || 120} Hours</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> ISO Certified
                </span>
                {canManageCourses && (
                  <button
                    onClick={() => openEditModal(course)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedCourse ? `Edit Course: ${selectedCourse.name}` : 'Create New Course'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="e.g. VFX & Animation"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                placeholder="e.g. VFX101"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Fee (₹) *</label>
              <input
                type="number"
                required
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Lab Hours</label>
              <input
                type="number"
                value={form.totalHours}
                onChange={(e) => setForm({ ...form, totalHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Course Description & Overview</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="Summary of tools, workflows and practical studio projects."
            />
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
              Save Course
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
