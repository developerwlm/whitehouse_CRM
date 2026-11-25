import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { CreditCard, Download, Bell, Plus, Search, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeesPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('payments'); // 'payments' or 'pending'
  const [payments, setPayments] = useState([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentMode: 'UPI',
    transactionReference: '',
    remarks: 'Fee payment receipt',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/payments'),
        api.get('/fees/pending-reminders'),
      ]);
      if (pRes.data.success) setPayments(pRes.data.data);
      if (rRes.data.success) setPendingReminders(rRes.data.data);
    } catch (e) {
      error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const loadStudents = async () => {
      try {
        const res = await api.get('/students?limit=100');
        if (res.data.success) setStudentsList(res.data.data);
      } catch (e) {}
    };
    loadStudents();
  }, []);

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
      success('Official receipt PDF downloaded');
    } catch (err) {
      error('Download failed');
    }
  };

  const handleSendReminder = async (studentId, studentName) => {
    try {
      const res = await api.post('/fees/send-reminder', { studentId });
      if (res.data.success) {
        success(`Fee reminder sent to ${studentName}`);
      }
    } catch (err) {
      error('Failed to dispatch reminder');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments', {
        ...form,
        amount: Number(form.amount),
      });
      if (res.data.success) {
        success(res.data.message);
        setShowPaymentModal(false);
        setForm({ studentId: '', amount: '', paymentMode: 'UPI', transactionReference: '', remarks: '' });
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Payment recording failed');
    }
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalOutstanding = pendingReminders.reduce((acc, r) => acc + (r.outstandingBalance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fee Collection & Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Installment Tracking, Automatic Balance Calculations & Instant Branded PDF Receipts
          </p>
        </div>

        {(isAdmin || isStaff) && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Fees Collected</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">₹{totalCollected.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Recorded across all modes</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Outstanding Course Balances</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-slate-400 font-medium">{pendingReminders.length} students with pending dues</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Receipt Count</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{payments.length} Receipts</span>
          <span className="text-[11px] text-slate-400 font-medium">Audited & electronically signed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment Transactions ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending Fee Reminders ({pendingReminders.length})
        </button>
      </div>

      {/* Tab: Payments Table */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Mode & Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Download Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {p.receiptNumber}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.studentId?.name || 'Student'}
                      <span className="block font-mono text-[10px] text-slate-400 font-normal">
                        {p.studentId?.studentId}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.studentId?.courseName}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{p.paymentMode}</span>
                      {p.transactionReference && (
                        <span className="block font-mono text-[10px] text-slate-400">{p.transactionReference}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(p._id, p.receiptNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Pending Fee Reminders Table */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Total Fee</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Outstanding Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Dispatch Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReminders.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {fee.studentId?.name}
                      <span className="block font-mono text-[10px] text-blue-600 font-bold">
                        {fee.studentId?.studentId}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {fee.studentId?.mobile}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      ₹{fee.finalFee?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-600">
                      ₹{fee.totalPaid?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-black text-rose-600 text-sm">
                      ₹{fee.outstandingBalance?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={fee.paymentStatus} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendReminder(fee.studentId?._id, fee.studentId?.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 border border-amber-200 transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Send Reminder</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Fee Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Student *</label>
            <select
              required
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
            >
              <option value="">-- Choose Student --</option>
              {studentsList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId}) - {s.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Paid (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-blue-700"
                placeholder="e.g. 5000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Reference Number</label>
            <input
              type="text"
              value={form.transactionReference}
              onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="UPI transaction ID or Cheque / NEFT number"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Receipt Remarks</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Second term installment fee payment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20">Generate Receipt</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
