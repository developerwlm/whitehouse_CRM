import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Key,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

export const AdmissionsPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const convertLeadId = searchParams.get('convertLeadId');

  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [leadsList, setLeadsList] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const [admissionForm, setAdmissionForm] = useState({
    leadId: convertLeadId || '',
    courseId: '',
    batchId: '',
    trainerId: '',
    courseFee: 30000,
    discount: 0,
    advancePaid: 5000,
    paymentMode: 'Cash',
    transactionRef: '',
    installmentsCount: 3,
    dateOfBirth: '2002-01-01',
    gender: 'Male',
    qualification: 'Undergraduate',
    parentName: '',
    parentPhone: '',
    remarks: 'Admitted from CRM',
  });

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admissions');
      if (res.data.success) {
        setAdmissions(res.data.data);
      }
    } catch (err) {
      error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();

    // Fetch prerequisite options
    const loadPrerequisites = async () => {
      try {
        const [cRes, bRes, tRes, lRes] = await Promise.all([
          api.get('/courses'),
          api.get('/batches'),
          api.get('/trainers'),
          api.get('/leads?limit=200'),
        ]);

        const coursesData = cRes.data.success ? cRes.data.data : [];
        const batchesData = bRes.data.success ? bRes.data.data : [];
        const trainersData = tRes.data.success ? tRes.data.data : [];
        let leadsData = lRes.data.success ? lRes.data.data : [];

        // Exclude leads that already have an admission confirmed, but keep the current convertLeadId
        const availableLeads = leadsData.filter(
          (l) => l.leadStatus !== 'Admission Confirmed' || l._id === convertLeadId
        );

        setCourses(coursesData);
        setBatches(batchesData);
        setTrainers(trainersData);
        setLeadsList(availableLeads);

        if (convertLeadId) {
          setShowModal(true);
          let matchedLead = leadsData.find((l) => l._id === convertLeadId);
          if (!matchedLead) {
            try {
              const singleRes = await api.get(`/leads/${convertLeadId}`);
              if (singleRes.data.success && singleRes.data.data) {
                matchedLead = singleRes.data.data;
                setLeadsList((prev) => [matchedLead, ...prev.filter((p) => p._id !== matchedLead._id)]);
              }
            } catch (err) {
              console.error('Error fetching single lead:', err);
            }
          }

          if (matchedLead) {
            const matchedCourse = coursesData.find(
              (c) => c.name.toLowerCase() === (matchedLead.interestedCourse || '').toLowerCase()
            );
            setAdmissionForm((prev) => ({
              ...prev,
              leadId: matchedLead._id,
              courseId: matchedCourse ? matchedCourse._id : prev.courseId,
              courseFee: matchedCourse ? matchedCourse.fee : prev.courseFee,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load prerequisites:', e);
      }
    };

    loadPrerequisites();
  }, [convertLeadId]);

  const handleCourseChange = (courseId) => {
    const course = courses.find((c) => c._id === courseId);
    setAdmissionForm((prev) => ({
      ...prev,
      courseId,
      courseFee: course ? course.fee : prev.courseFee,
    }));
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...admissionForm,
        parentContact: {
          parentName: admissionForm.parentName,
          phone: admissionForm.parentPhone,
        },
      };

      const res = await api.post('/admissions/convert-lead', payload);
      if (res.data.success) {
        success('Student successfully registered and admitted into CRM!');
        setShowModal(false);
        fetchAdmissions();
        if (res.data.data?.credentials) {
          setCredentialsModal(res.data.data);
        } else {
          navigate(`/students/${res.data.data.student._id}`);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Admission confirmation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admissions Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Converted Students, Enrollment Registrations & Batch Onboarding
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Convert Lead to Student</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading admissions...</div>
        ) : admissions.length === 0 ? (
          <EmptyState
            title="No admissions confirmed yet"
            description="Convert qualified leads into registered institute students."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Admit First Student
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID & Admission No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course Enrolled</th>
                  <th className="py-3 px-4">Allocated Batch</th>
                  <th className="py-3 px-4">Total Fee / Advance</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {adm.studentUniqueId}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{adm.admissionNumber}</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {adm.studentId?.name || adm.leadId?.customerName}
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {adm.leadId?.mobileNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {adm.courseName}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {adm.batchId?.name ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium">
                          {adm.batchId.name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium text-[11px]">Pending Batch</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">₹{adm.finalFee?.toLocaleString('en-IN')}</span>
                      <span className="block text-[11px] text-emerald-600 font-medium">
                        Advance: ₹{adm.advancePaid?.toLocaleString('en-IN')} ({adm.paymentMode})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(adm.admissionDate).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          const creds = adm.studentLoginCredentials || {};
                          setCredentialsModal({
                            student: adm.studentId || { name: adm.leadId?.customerName },
                            admission: adm,
                            credentials: {
                              studentId: adm.studentUniqueId,
                              email: creds.email || adm.leadId?.email || `${adm.studentUniqueId?.toLowerCase()}@whitehouseinstitute.in`,
                              password: creds.generatedPassword || 'WH@' + (adm.leadId?.mobileNumber?.replace(/\D/g, '')?.slice(-4) || '2026'),
                              name: adm.studentId?.name || adm.leadId?.customerName,
                              role: 'student',
                            },
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors text-[11px]"
                        title="View Student Portal Login Credentials"
                      >
                        <Key className="w-3 h-3" />
                        <span>Login Info</span>
                      </button>

                      {adm.studentId?._id && (
                        <Link
                          to={`/students/${adm.studentId._id}`}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors inline-block"
                        >
                          View Profile &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Convert Lead to Student Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Convert Lead to Registered Student (Admission Flow)"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleConvertLead} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            <span className="font-bold block mb-0.5">Section 7 Integrated Admission Workflow:</span>
            Confirms admission, generates unique Student ID (e.g. WH-2026-XXXX), transfers all customer history, assigns Course, Batch, and Trainer, and initializes Student Fee installment ledger.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Lead for Admission *</label>
            <select
              required
              value={admissionForm.leadId}
              onChange={(e) => {
                const lead = leadsList.find((l) => l._id === e.target.value);
                const matchedCourse = courses.find(
                  (c) => c.name.toLowerCase() === lead?.interestedCourse?.toLowerCase()
                );
                setAdmissionForm({
                  ...admissionForm,
                  leadId: e.target.value,
                  courseId: matchedCourse ? matchedCourse._id : admissionForm.courseId,
                  courseFee: matchedCourse ? matchedCourse.fee : admissionForm.courseFee,
                });
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <option value="">-- Choose Lead --</option>
              {leadsList.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.customerName} ({l.mobileNumber}) - {l.interestedCourse} [{l.leadStatus}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Enrolled Course *</label>
              <select
                required
                value={admissionForm.courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} (₹{c.fee})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Allocated Batch</label>
              <select
                value={admissionForm.batchId}
                onChange={(e) => setAdmissionForm({ ...admissionForm, batchId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">-- Unassigned / Assign Later --</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name} ({b.batchId})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Trainer</label>
              <select
                value={admissionForm.trainerId}
                onChange={(e) => setAdmissionForm({ ...admissionForm, trainerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">-- Batch Default Trainer --</option>
                {trainers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fee & Payment Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Fee Structure & Admission Payment</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Course Fee (₹)</label>
                <input
                  type="number"
                  value={admissionForm.courseFee}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, courseFee: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Scholarship / Discount (₹)</label>
                <input
                  type="number"
                  value={admissionForm.discount}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, discount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Advance Collected (₹)</label>
                <input
                  type="number"
                  value={admissionForm.advancePaid}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, advancePaid: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Payment Mode</label>
                <select
                  value={admissionForm.paymentMode}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Transaction Reference No</label>
                <input
                  type="text"
                  value={admissionForm.transactionRef}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, transactionRef: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                  placeholder="e.g. UPI Ref 9823746198"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Balance Installment Plan</label>
                <select
                  value={admissionForm.installmentsCount}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, installmentsCount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                >
                  <option value={1}>1 Installment (Pay next month)</option>
                  <option value={2}>2 Monthly Installments</option>
                  <option value={3}>3 Monthly Installments</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Profile Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={admissionForm.dateOfBirth}
                onChange={(e) => setAdmissionForm({ ...admissionForm, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={admissionForm.gender}
                onChange={(e) => setAdmissionForm({ ...admissionForm, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Highest Qualification</label>
              <input
                type="text"
                value={admissionForm.qualification}
                onChange={(e) => setAdmissionForm({ ...admissionForm, qualification: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="e.g. B.Sc VisCom, +2, B.E"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                value={admissionForm.parentName}
                onChange={(e) => setAdmissionForm({ ...admissionForm, parentName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="Parent's name"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Contact Phone</label>
              <input
                type="text"
                value={admissionForm.parentPhone}
                onChange={(e) => setAdmissionForm({ ...admissionForm, parentPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="Parent's phone"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
            >
              Confirm Admission & Register Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Portal Credentials Generated Modal */}
      <Modal
        isOpen={Boolean(credentialsModal)}
        onClose={() => setCredentialsModal(null)}
        title="Student Portal Login Credentials"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Admission Confirmed Successfully!</p>
              <p className="mt-0.5 text-emerald-700">
                A dedicated Student Portal account has been automatically provisioned for <strong>{credentialsModal?.credentials?.name || credentialsModal?.student?.name}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Student User ID (Student ID)</span>
              <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900">
                <span>{credentialsModal?.credentials?.studentId || credentialsModal?.student?.studentId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsModal?.credentials?.studentId || credentialsModal?.student?.studentId);
                    setCopiedField('studentId');
                    setTimeout(() => setCopiedField(''), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                >
                  {copiedField === 'studentId' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'studentId' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Registered Email</span>
              <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800">
                <span className="truncate">{credentialsModal?.credentials?.email || credentialsModal?.student?.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsModal?.credentials?.email || credentialsModal?.student?.email);
                    setCopiedField('email');
                    setTimeout(() => setCopiedField(''), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold shrink-0 ml-2"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Generated Portal Password</span>
              <div className="mt-1 flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 font-mono font-bold text-emerald-800">
                <span>{credentialsModal?.credentials?.password}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(credentialsModal?.credentials?.password);
                    setCopiedField('password');
                    setTimeout(() => setCopiedField(''), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'password' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Student Portal Access Instructions:
              </p>
              <p className="text-slate-600">
                The student can log in at <strong>/login</strong> using either their <strong>Student ID</strong> or <strong>Email</strong> with the password above to view their classes, attendance, assignments, and exams.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const text = `Whitehouse Skill Development Institute - Student Portal Credentials\nStudent: ${credentialsModal?.credentials?.name || credentialsModal?.student?.name}\nStudent ID: ${credentialsModal?.credentials?.studentId || credentialsModal?.student?.studentId}\nEmail: ${credentialsModal?.credentials?.email || credentialsModal?.student?.email}\nPassword: ${credentialsModal?.credentials?.password}\nPortal Link: ${window.location.origin}/login`;
                navigator.clipboard.writeText(text);
                success('All credentials copied to clipboard!');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Full Details</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Close
              </button>
              {credentialsModal?.student?._id && (
                <Link
                  to={`/students/${credentialsModal.student._id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm"
                >
                  Open Student Profile &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
