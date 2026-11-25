import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  User,
  GraduationCap,
  Calendar,
  CreditCard,
  ClipboardCheck,
  TrendingUp,
  FileCheck2,
  Award,
  ScrollText,
  Briefcase,
  History,
  Phone,
  Mail,
  MapPin,
  Download,
  Upload,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const StudentProfilePage = () => {
  const { id } = useParams();
  const { user, isAdmin, isStaff, isTrainer } = useAuth();
  const { success, error } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [batches, setBatches] = useState([]);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('Identity Proof');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      if (res.data.success) {
        setProfile(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch student profile';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const loadBatches = async () => {
      try {
        const res = await api.get('/batches');
        if (res.data.success) setBatches(res.data.data);
      } catch (e) {}
    };
    loadBatches();
  }, [id]);

  const handleTransferBatch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/students/${id}/transfer-batch`, {
        targetBatchId,
        reason: transferReason,
      });
      if (res.data.success) {
        success('Student batch transferred successfully');
        setShowTransferModal(false);
        fetchProfile();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Batch transfer failed');
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/students/${id}/documents`, {
        name: docName,
        url: docUrl || 'https://via.placeholder.com/300',
        documentType: docType,
      });
      if (res.data.success) {
        success('Document attached to student record');
        setShowDocModal(false);
        fetchProfile();
      }
    } catch (err) {
      error('Failed to attach document');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments', {
        studentId: id,
        amount: Number(paymentAmount),
        paymentMode,
        transactionReference: paymentRef,
      });
      if (res.data.success) {
        success('Fee payment recorded & receipt generated');
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchProfile();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Payment recording failed');
    }
  };

  const handleDownloadReceipt = async (paymentId, receiptNo) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${receiptNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Receipt PDF downloaded');
    } catch (err) {
      error('Failed to download receipt');
    }
  };

  const handleDownloadCertificate = async (certId) => {
    try {
      const response = await api.get(`/certificates/${certId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate_${profile?.rawStudent?.name || 'Student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Official Certificate PDF downloaded');
    } catch (err) {
      error(err.response?.data?.message || 'Certificate PDF not yet approved');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 font-medium">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading 15-Section Comprehensive Student Profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Access Information</h3>
        <p className="text-xs text-slate-500 mb-4">{errorMessage || 'Student record not found or inaccessible.'}</p>
        <Link
          to="/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Back to Students List</span>
        </Link>
      </div>
    );
  }

  const {
    overview,
    personalDetails,
    admissionDetails,
    courseDetails,
    batchDetails,
    trainerDetails,
    attendance,
    weeklyProgress,
    assignments,
    examinationResults,
    fees,
    payments,
    certificates,
    placement,
    activityHistory,
    documents,
    rawStudent,
  } = profile;

  const sections = [
    { id: 'overview', label: '1. Overview', icon: GraduationCap },
    { id: 'personal', label: '2. Personal Info', icon: User },
    { id: 'admission', label: '3. Admission Details', icon: Calendar },
    { id: 'academic', label: '4-6. Course & Batch', icon: Calendar },
    { id: 'attendance', label: '7. Attendance', icon: ClipboardCheck },
    { id: 'progress', label: '8. Weekly Syllabus', icon: TrendingUp },
    { id: 'assignments', label: '9. Assignments', icon: FileCheck2 },
    { id: 'exams', label: '10. Examinations', icon: Award },
    { id: 'fees', label: '11-12. Fees & Payments', icon: CreditCard },
    { id: 'certificates', label: '13. Certificates', icon: ScrollText },
    { id: 'placement', label: '14. Placement', icon: Briefcase },
    { id: 'history', label: '15. Activity History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={personalDetails.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160'}
            alt={personalDetails.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {overview.studentId}
              </span>
              <Badge status={overview.status} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{personalDetails.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <span className="text-slate-800 font-semibold">{overview.courseName}</span> • Batch: <span className="text-slate-800 font-semibold">{overview.batchName || 'Unassigned'}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        {(isAdmin || isStaff) && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Fee Payment</span>
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Transfer Batch</span>
            </button>
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Document</span>
            </button>
          </div>
        )}
      </div>

      {/* 15 Sections Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200">
        {sections.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Attendance Rate</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{overview.attendancePercent}%</span>
              <span className="text-[11px] text-emerald-600 font-medium">Eligible for Certificate</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Syllabus Progress</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{overview.progressPercent}%</span>
              <span className="text-[11px] text-slate-500 font-medium">Week {weeklyProgress?.currentWeek || 1} of 12</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Outstanding Balance</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">₹{Number(overview.feeBalance || 0).toLocaleString('en-IN')}</span>
              <span className="text-[11px] text-slate-500 font-medium">Status: {overview.feeStatus}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Lead Trainer</span>
              <span className="text-base font-bold text-slate-900 mt-1 block truncate">{overview.trainerName || 'Assigned Lead Trainer'}</span>
              <span className="text-[11px] text-slate-500 font-medium">Whitehouse Faculty</span>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact & Residency</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <p><strong className="text-slate-800">Mobile:</strong> {personalDetails.mobile}</p>
                <p><strong className="text-slate-800">Email:</strong> {personalDetails.email}</p>
                <p><strong className="text-slate-800">City / State:</strong> {personalDetails.address?.city || 'Madurai'}, {personalDetails.address?.state || 'Tamil Nadu'}</p>
                <p><strong className="text-slate-800">Qualification:</strong> {personalDetails.qualification || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Touchpoints</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(activityHistory || []).slice(0, 4).map((act) => (
                  <div key={act._id} className="py-2">
                    <p className="font-semibold text-slate-800">{act.title}</p>
                    <p className="text-slate-500 text-[11px]">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. PERSONAL DETAILS */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">2. Full Personal Particulars</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 font-medium block">Full Legal Name</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Date of Birth</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {personalDetails.dateOfBirth ? new Date(personalDetails.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Gender</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.gender || 'Male'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Mobile Phone</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.mobile}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Alternate Contact / WhatsApp</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.altMobile || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Email Address</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Parent / Guardian Name</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.parentContact?.parentName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Parent Contact Number</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.parentContact?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Highest Qualification</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{personalDetails.qualification || 'N/A'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-slate-400 font-medium block">Permanent Address</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                  {personalDetails.address?.street ? `${personalDetails.address.street}, ` : ''}
                  {personalDetails.address?.city || 'Madurai'}, {personalDetails.address?.state || 'Tamil Nadu'}
                  {personalDetails.address?.pincode ? ` - ${personalDetails.address.pincode}` : ''}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${personalDetails.address?.street || ''} ${personalDetails.address?.city || 'Madurai'} ${personalDetails.address?.state || 'Tamil Nadu'}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs hover:bg-blue-100 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>View on Maps</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            {/* Embedded Student Location Map */}
            <div className="mt-2 w-full h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <iframe
                title="Student Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  `${personalDetails.address?.street || ''} ${personalDetails.address?.city || 'Madurai'} ${personalDetails.address?.state || 'Tamil Nadu'}`
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. ADMISSION DETAILS */}
      {activeTab === 'admission' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">3. Admission Record & Audit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 font-medium block">Admission Number</span>
              <span className="font-mono font-bold text-blue-700 text-sm mt-0.5 block">{admissionDetails.admissionNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Admission Date</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                {admissionDetails.admissionDate ? new Date(admissionDetails.admissionDate).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Original Lead Reference</span>
              <span className="font-mono font-semibold text-slate-800 text-sm mt-0.5 block">{rawStudent.originalLeadNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Standard Course Fee</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">₹{admissionDetails.courseFee?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Discount Granted</span>
              <span className="font-semibold text-emerald-600 text-sm mt-0.5 block">₹{admissionDetails.discount?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Final Agreed Fee</span>
              <span className="font-bold text-blue-900 text-sm mt-0.5 block">₹{admissionDetails.finalFee?.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Advance Paid at Admission</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">₹{admissionDetails.advancePaid?.toLocaleString('en-IN')} ({admissionDetails.paymentMode})</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Admitting Counsellor</span>
              <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{admissionDetails.counsellorId?.name || 'Staff Member'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Admission Status</span>
              <span className="font-bold text-emerald-600 text-sm mt-0.5 block">{admissionDetails.status || 'Confirmed'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4-6. COURSE & BATCH & TRAINER */}
      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>4. Course Details</span>
            </h4>
            <p><strong className="text-slate-800">Course Name:</strong> {courseDetails.name}</p>
            <p><strong className="text-slate-800">Course Code:</strong> {courseDetails.courseCode}</p>
            <p><strong className="text-slate-800">Duration:</strong> {courseDetails.durationWeeks} Weeks</p>
            <p className="text-slate-500 leading-relaxed">{courseDetails.description}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>5. Batch Details</span>
            </h4>
            <p><strong className="text-slate-800">Batch Name:</strong> {batchDetails.name || 'Unassigned'}</p>
            <p><strong className="text-slate-800">Batch Code:</strong> {batchDetails.batchId || 'N/A'}</p>
            <p><strong className="text-slate-800">Class Timings:</strong> {batchDetails.classTimings?.startTime} - {batchDetails.classTimings?.endTime}</p>
            <p><strong className="text-slate-800">Training Days:</strong> {batchDetails.trainingDays?.join(', ') || 'Monday - Friday'}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              <span>6. Lead Trainer</span>
            </h4>
            <p><strong className="text-slate-800">Trainer:</strong> {trainerDetails.name || 'Assigned Lead Faculty'}</p>
            <p><strong className="text-slate-800">Email:</strong> {trainerDetails.email || 'trainer@whitehouse.com'}</p>
            <p><strong className="text-slate-800">Contact:</strong> {trainerDetails.phone || '+91 98765 43210'}</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">7. Attendance Tracker</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Classes: {attendance.summary.totalClasses} | Present: {attendance.summary.presentCount} | Rate: {attendance.summary.attendancePercent}%
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${attendance.summary.attendancePercent >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {attendance.summary.attendancePercent >= 75 ? 'Meets Institute 75% Requirement' : 'Below 75% Attendance'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Topic / Subject Covered</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(attendance.records || []).slice(0, 20).map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{new Date(a.classDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-2 px-3 text-slate-600">{a.sessionTopic || 'Regular Practical Session'}</td>
                    <td className="py-2 px-3"><Badge status={a.status} /></td>
                    <td className="py-2 px-3 text-slate-400">{a.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. WEEKLY PROGRESS */}
      {activeTab === 'progress' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">8. Weekly Syllabus Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5">Current Week: {weeklyProgress.currentWeek || 1} • Completed Weeks: {weeklyProgress.completedWeeks?.length || 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                {weeklyProgress.actualProgressPercent || 0}% Completed
              </span>
              {weeklyProgress.isDelayed && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5" /> Delay Detected
                </span>
              )}
            </div>
          </div>

          {/* Trainer Remarks List */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Trainer Feedback & Observations:</h4>
            {(weeklyProgress.trainerRemarks || []).length === 0 ? (
              <p className="text-xs text-slate-400">No remarks entered yet.</p>
            ) : (
              (weeklyProgress.trainerRemarks || []).map((r, i) => (
                <div key={i} className="text-xs text-slate-600 border-b border-slate-200/60 pb-1.5 last:border-none">
                  <span className="font-bold text-slate-800">Week {r.week}: </span>
                  <span>{r.remark}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">By {r.trainerName || 'Trainer'} on {new Date(r.date).toLocaleDateString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 9. ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">9. Practical Assignments & Project Submissions</h3>
          {(assignments || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No assignments submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((sub) => (
                <div key={sub._id} className="py-3 flex items-start justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{sub.assignmentId?.title || 'Assignment Task'}</h4>
                    <p className="text-slate-500 mt-0.5">{sub.notes || 'Submitted by student'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Submitted: {new Date(sub.submissionDate).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{sub.marksObtained !== null ? `${sub.marksObtained}/100` : 'Pending Evaluation'}</span>
                    <Badge status={sub.evaluationStatus} className="mt-1 block" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 10. EXAMINATIONS */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">10. Examination Assessment Results</h3>
          {(examinationResults || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No examinations taken yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {examinationResults.map((ex) => (
                <div key={ex._id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{ex.examTitle}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Correct: {ex.correctCount} / {ex.totalQuestions} Questions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-blue-700 text-sm">{ex.score} / {ex.totalMarks} ({ex.percentage}%)</span>
                    <span className={`block text-[11px] font-bold ${ex.isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {ex.isPassed ? 'PASSED' : 'RETAKE REQUIRED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 11-12. FEES & PAYMENTS */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">11. Fee Structure & Installment Schedule</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Total Course Fee</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">₹{fees?.totalCourseFee?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Discount</span>
                <span className="font-bold text-emerald-600 text-sm mt-0.5 block">₹{(fees?.discount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Final Payable</span>
                <span className="font-bold text-blue-900 text-sm mt-0.5 block">₹{fees?.finalFee?.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Outstanding Balance</span>
                <span className="font-black text-rose-600 text-sm mt-0.5 block">₹{fees?.outstandingBalance?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">12. Payment History & Official Receipts</h3>
              {(isAdmin || isStaff) && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  + Add Payment
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">PDF Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(payments || []).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.paymentMode}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(p._id, p.receiptNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 13. CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">13. Official Course Certificate</h3>
          {!certificates ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No certificate issued or recommended yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Requires 75% attendance, completed assignments, passed exams, and cleared fee balance.</p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-sky-50/60 border border-blue-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-800 bg-white px-2 py-0.5 rounded shadow-xs">
                    {certificates.certificateId}
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 mt-1">Certificate of Completion</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{certificates.courseName} • Grade: {certificates.grade}</p>
                </div>
                <Badge status={certificates.adminApprovalStatus} />
              </div>

              <div className="pt-3 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Completion Date: {new Date(certificates.completionDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-slate-500 mt-0.5">Verification Hash: <span className="font-mono font-bold text-slate-800">{certificates.verificationHash}</span></p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/verify-certificate/${certificates.certificateId}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50"
                  >
                    Public QR Verification Link
                  </Link>
                  {certificates.adminApprovalStatus === 'Approved' && (
                    <button
                      onClick={() => handleDownloadCertificate(certificates._id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 14. PLACEMENT */}
      {activeTab === 'placement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">14. Placement & Career Status</h3>
          {!placement ? (
            <p className="text-slate-400 py-6 text-center">No placement record created for this student yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 font-medium block">Career Status</span>
                <span className="font-bold text-blue-700 text-sm mt-0.5 block">{placement.jobStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Hiring Company</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{placement.company || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Job Role</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{placement.jobRole || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Work Location</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{placement.workLocation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Placement Date</span>
                <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                  {placement.placementDate ? new Date(placement.placementDate).toLocaleDateString('en-IN') : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Annual CTC Package</span>
                <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                  {placement.salaryPackageAnnual ? `₹${placement.salaryPackageAnnual.toLocaleString('en-IN')} / year` : 'Not Disclosed'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 15. ACTIVITY HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">15. Comprehensive Touchpoint & Lead History</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {(activityHistory || []).map((h) => (
              <div key={h._id} className="py-3 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{h.title}</h4>
                  <p className="text-slate-600 mt-0.5">{h.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-4">
                  {new Date(h.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Batch Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Student to Another Batch">
        <form onSubmit={handleTransferBatch} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Target Batch *</label>
            <select
              required
              value={targetBatchId}
              onChange={(e) => setTargetBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
            >
              <option value="">-- Choose Target Batch --</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.name} ({b.batchId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transfer Reason</label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Schedule conflict with college exams."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Confirm Transfer</button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Fee Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-700"
              placeholder="e.g. 8000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                placeholder="UPI / Cheque Ref"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Save & Generate Receipt</button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} title="Attach Student Document">
        <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Name *</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Aadhaar Card Copy, Degree Certificate"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <option value="Identity Proof">Identity Proof (Aadhaar / Passport)</option>
              <option value="Academic Certificate">Academic Certificate</option>
              <option value="Resume">Resume / Portfolio PDF</option>
              <option value="Photo">Passport Photo</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cloudinary / Storage File URL</label>
            <input
              type="text"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
              placeholder="https://res.cloudinary.com/whitehouse/..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">Attach Document</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
