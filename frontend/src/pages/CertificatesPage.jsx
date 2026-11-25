import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ExternalLink,
  Search,
  Filter,
  PlusCircle,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function CertificatesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [certificates, setCertificates] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modals
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  // Form states
  const [recommendForm, setRecommendForm] = useState({
    studentId: '',
    remarks: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCertificates();
    fetchCourses();
    if (user?.role === 'admin' || user?.role === 'staff' || user?.role === 'trainer') {
      fetchStudents();
    }
  }, [statusFilter, courseFilter]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.approvalStatus = statusFilter;
      if (courseFilter) params.courseId = courseFilter;

      const res = await api.get('/certificates', { params });
      setCertificates(res.data.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
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

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    if (!recommendForm.studentId) {
      return addToast('Please select a student', 'error');
    }

    try {
      setSubmitting(true);
      const res = await api.post('/certificates/recommend', recommendForm);
      addToast(res.data.message || 'Certificate recommendation submitted successfully', 'success');
      setRecommendModalOpen(false);
      setRecommendForm({ studentId: '', remarks: '' });
      fetchCertificates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit recommendation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCert) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/certificates/${selectedCert._id}/approve`, {
        action: 'Approved',
      });
      addToast(res.data.message || 'Certificate approved & issued', 'success');
      setApproveModalOpen(false);
      setSelectedCert(null);
      fetchCertificates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCert) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/certificates/${selectedCert._id}/approve`, {
        action: 'Rejected',
        rejectionReason,
      });
      addToast(res.data.message || 'Certificate rejected', 'info');
      setRejectModalOpen(false);
      setSelectedCert(null);
      setRejectionReason('');
      fetchCertificates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async (certId, certCode) => {
    try {
      const res = await api.get(`/certificates/${certId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${certCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast(`Downloaded Certificate ${certCode}`, 'success');
    } catch (err) {
      addToast('Certificate PDF could not be generated yet (Must be approved)', 'error');
    }
  };

  // Filtered list by search
  const filteredCertificates = certificates.filter((c) => {
    const matchSearch =
      (c.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.certificateId || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.studentUniqueId || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.courseName || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Metrics
  const totalCerts = certificates.length;
  const pendingCerts = certificates.filter((c) => c.adminApprovalStatus === 'Pending Approval').length;
  const approvedCerts = certificates.filter((c) => c.adminApprovalStatus === 'Approved').length;
  const rejectedCerts = certificates.filter((c) => c.adminApprovalStatus === 'Rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Certificate Records & Issuance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Trainer recommendation workflow, multi-factor eligibility verification, admin approval, and branded QR credentials.
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'staff' || user?.role === 'trainer') && (
          <button
            onClick={() => setRecommendModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Recommend Certificate
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCerts}</p>
          </div>
          <div className="p-3 bg-navy-50 text-navy-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCerts}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved & Issued</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCerts}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{rejectedCerts}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, ID, or certificate..."
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
            <option value="">All Approval Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading certificate records...</div>
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificate records found"
            description="Certificates are generated when a trainer recommends course completion and Admin approves issuance."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Certificate ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course & Grade</th>
                  <th className="py-3 px-4">Eligibility Snapshot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCertificates.map((cert) => {
                  const elig = cert.eligibilitySnapshot || {};
                  return (
                    <tr key={cert._id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                        {cert.certificateId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{cert.studentName}</div>
                        <div className="text-xs text-gray-400 font-mono">{cert.studentUniqueId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{cert.courseName}</div>
                        <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {cert.grade || 'Pass'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              elig.attendancePassed ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            Att: {elig.attendancePercent ?? 'N/A'}%
                            {elig.attendancePassed ? ' (OK)' : ' (Short)'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 ${
                              elig.feeCleared ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            Fee: {elig.feeCleared ? 'Cleared' : 'Pending Due'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            cert.adminApprovalStatus === 'Approved'
                              ? 'success'
                              : cert.adminApprovalStatus === 'Pending Approval'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {cert.adminApprovalStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN') : 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cert.adminApprovalStatus === 'Approved' && (
                            <>
                              <button
                                onClick={() => downloadPdf(cert._id, cert.certificateId)}
                                title="Download Branded PDF Certificate"
                                className="p-1.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <a
                                href={`/verify-certificate/${cert.certificateId}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Public QR Verification Link"
                                className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </>
                          )}

                          {user?.role === 'admin' && cert.adminApprovalStatus === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setApproveModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setRejectModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-medium rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recommend Certificate Modal */}
      <Modal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title="Recommend Student for Certificate"
      >
        <form onSubmit={handleRecommendSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Submit recommendation for a student who has completed course requirements. The system automatically
            checks attendance, exam score, and fee clearance to create an eligibility snapshot for the Admin.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Select Student</label>
            <select
              value={recommendForm.studentId}
              onChange={(e) => setRecommendForm({ ...recommendForm, studentId: e.target.value })}
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Trainer Remarks</label>
            <textarea
              rows={3}
              value={recommendForm.remarks}
              onChange={(e) => setRecommendForm({ ...recommendForm, remarks: e.target.value })}
              placeholder="e.g. Excellent practical performance in final project and portfolio review."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setRecommendModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Recommendation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Confirm Certificate Approval"
      >
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-sm flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Approve and Issue Certificate</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Student: <span className="font-medium">{selectedCert?.studentName}</span> ({selectedCert?.studentUniqueId})
                <br />
                Course: <span className="font-medium">{selectedCert?.courseName}</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Approving this record will generate the official QR-verified PDF credential and update the student status to
            <span className="font-semibold text-gray-700"> Completed</span>.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setApproveModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Approving...' : 'Confirm Approval & Issue'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Certificate Recommendation"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-800 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Reject Recommendation</p>
              <p className="text-xs text-rose-700 mt-0.5">
                Student: {selectedCert?.studentName} ({selectedCert?.studentUniqueId})
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Reason for Rejection</label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete final fee payment balance of INR 5,000 pending clearance."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Reject Certificate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
