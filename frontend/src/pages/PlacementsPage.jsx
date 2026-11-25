import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  PlusCircle,
  Edit,
  TrendingUp,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const STATUS_VARIANTS = {
  Placed: 'success',
  Selected: 'primary',
  'Interview Scheduled': 'warning',
  'Job Seeking': 'default',
  'Higher Studies': 'secondary',
  'Self Employed': 'primary',
};

export default function PlacementsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [placements, setPlacements] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    jobStatus: 'Job Seeking',
    company: '',
    jobRole: '',
    workLocation: '',
    interviewDate: '',
    placementDate: '',
    resumeUrl: '',
    portfolioUrl: '',
    salaryPackageAnnual: '',
    voluntarySalaryReported: false,
    remarks: '',
  });

  useEffect(() => {
    fetchPlacements();
    fetchStudents();
    fetchCourses();
  }, [statusFilter, courseFilter]);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.jobStatus = statusFilter;
      if (courseFilter) params.courseName = courseFilter;

      const res = await api.get('/placements', { params });
      setPlacements(res.data.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load placements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = (existing = null) => {
    if (existing) {
      setFormData({
        studentId: existing.studentId?._id || existing.studentId,
        jobStatus: existing.jobStatus || 'Job Seeking',
        company: existing.company || '',
        jobRole: existing.jobRole || '',
        workLocation: existing.workLocation || '',
        interviewDate: existing.interviewDate ? existing.interviewDate.split('T')[0] : '',
        placementDate: existing.placementDate ? existing.placementDate.split('T')[0] : '',
        resumeUrl: existing.resumeUrl || '',
        portfolioUrl: existing.portfolioUrl || '',
        salaryPackageAnnual: existing.salaryPackageAnnual || '',
        voluntarySalaryReported: existing.voluntarySalaryReported || false,
        remarks: existing.remarks || '',
      });
    } else {
      setFormData({
        studentId: '',
        jobStatus: 'Job Seeking',
        company: '',
        jobRole: '',
        workLocation: '',
        interviewDate: '',
        placementDate: '',
        resumeUrl: '',
        portfolioUrl: '',
        salaryPackageAnnual: '',
        voluntarySalaryReported: false,
        remarks: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId) {
      return addToast('Please select a student', 'error');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/placements/update', formData);
      addToast(res.data.message || 'Placement record saved successfully', 'success');
      setModalOpen(false);
      fetchPlacements();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save placement record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered by search
  const filteredPlacements = placements.filter((p) => {
    const match =
      (p.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.studentUniqueId || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.jobRole || '').toLowerCase().includes(search.toLowerCase());
    return match;
  });

  // Metrics
  const totalTracked = placements.length;
  const placedCount = placements.filter((p) => p.jobStatus === 'Placed').length;
  const interviewCount = placements.filter((p) => p.jobStatus === 'Interview Scheduled').length;
  const seekingCount = placements.filter((p) => p.jobStatus === 'Job Seeking').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Placement & Career Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track student employment pipelines, interviews, corporate offers, and voluntary salary benchmarks with automatic Alumni transition.
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'staff') && (
          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Update Placement Record
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Students Tracked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalTracked}</p>
          </div>
          <div className="p-3 bg-navy-50 text-navy-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Successfully Placed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{placedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interviews Scheduled</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{interviewCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actively Seeking</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{seekingCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Career Statuses</option>
            <option value="Job Seeking">Job Seeking</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Placed">Placed</option>
            <option value="Higher Studies">Higher Studies</option>
            <option value="Self Employed">Self Employed</option>
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading placement data...</div>
        ) : filteredPlacements.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No placement records found"
            description="Log career milestones, interviews, and job placements to track student career success."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Job Status</th>
                  <th className="py-3 px-4">Company & Role</th>
                  <th className="py-3 px-4">Location / CTC</th>
                  <th className="py-3 px-4">Links</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlacements.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900">{p.studentName}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.studentUniqueId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 text-sm">{p.courseName}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={STATUS_VARIANTS[p.jobStatus] || 'default'}>{p.jobStatus}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        {p.company || 'Not Specified'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.jobRole || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-800">{p.workLocation || 'Madurai'}</div>
                      {p.voluntarySalaryReported && p.salaryPackageAnnual ? (
                        <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                          ₹{Number(p.salaryPackageAnnual).toLocaleString('en-IN')} / yr
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-0.5">Confidential</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {p.portfolioUrl ? (
                          <a
                            href={p.portfolioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-900 font-medium"
                          >
                            Portfolio <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {p.resumeUrl ? (
                          <a
                            href={p.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-900 font-medium"
                          >
                            Resume <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                        {!p.portfolioUrl && !p.resumeUrl && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <button
                          onClick={() => openAddModal(p)}
                          className="p-1.5 text-gray-500 hover:text-navy-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Placement Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update / Add Placement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Manage Placement Record"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Student</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value="">-- Choose Student --</option>
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.studentId}) – {st.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Job Status</label>
              <select
                value={formData.jobStatus}
                onChange={(e) => setFormData({ ...formData, jobStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                <option value="Job Seeking">Job Seeking</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="Placed">Placed (Alumni)</option>
                <option value="Higher Studies">Higher Studies</option>
                <option value="Self Employed">Self Employed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. PixelWorks VFX Studio"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Job Role</label>
              <input
                type="text"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                placeholder="e.g. Junior Compositor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Work Location</label>
              <input
                type="text"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                placeholder="e.g. Chennai / Madurai / Remote"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Interview Date</label>
              <input
                type="date"
                value={formData.interviewDate}
                onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Placement / Offer Date</label>
              <input
                type="date"
                value={formData.placementDate}
                onChange={(e) => setFormData({ ...formData, placementDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Resume Link (URL)</label>
              <input
                type="url"
                value={formData.resumeUrl}
                onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Portfolio Link (URL)</label>
              <input
                type="url"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                placeholder="https://behance.net/... or github.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          {/* Salary Package Section (Voluntary) */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="voluntaryCheck"
                checked={formData.voluntarySalaryReported}
                onChange={(e) => setFormData({ ...formData, voluntarySalaryReported: e.target.checked })}
                className="h-4 w-4 text-navy-600 focus:ring-navy-500 border-gray-300 rounded"
              />
              <label htmlFor="voluntaryCheck" className="text-xs font-medium text-gray-700">
                Student voluntarily provided annual compensation details
              </label>
            </div>

            {formData.voluntarySalaryReported && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Annual CTC (INR)</label>
                <input
                  type="number"
                  value={formData.salaryPackageAnnual}
                  onChange={(e) => setFormData({ ...formData, salaryPackageAnnual: e.target.value })}
                  placeholder="e.g. 360000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Remarks & Feedback</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Offered permanent position after 3 months paid internship."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Placement Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
