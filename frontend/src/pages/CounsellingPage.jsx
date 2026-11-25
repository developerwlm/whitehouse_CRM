import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { PhoneCall, Plus, Calendar, Clock, DollarSign, UserCheck, MessageSquare } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const CounsellingPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillLeadId = searchParams.get('leadId');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [leadsList, setLeadsList] = useState([]);

  const [form, setForm] = useState({
    leadId: prefillLeadId || '',
    interestedCourse: 'VFX & Animation',
    courseFee: 35000,
    discount: 2000,
    finalQuotedFee: 33000,
    customerDecision: 'Considering',
    counsellingMode: 'In-Person at Campus',
    remarks: '',
    nextFollowUpDate: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/counselling');
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      error('Failed to load counselling records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // Load leads for dropdown selection
    const loadLeads = async () => {
      try {
        const res = await api.get('/leads?limit=200');
        if (res.data.success) {
          let leads = res.data.data || [];
          setLeadsList(leads);

          if (prefillLeadId) {
            setShowModal(true);
            const matchedLead = leads.find((l) => l._id === prefillLeadId);
            if (matchedLead) {
              setForm((prev) => ({
                ...prev,
                leadId: matchedLead._id,
                interestedCourse: matchedLead.interestedCourse || prev.interestedCourse,
              }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load leads for counselling:', e);
      }
    };
    loadLeads();
  }, [prefillLeadId]);

  const handleFeeChange = (fee, discount) => {
    const f = Number(fee || 0);
    const d = Number(discount || 0);
    setForm((prev) => ({
      ...prev,
      courseFee: f,
      discount: d,
      finalQuotedFee: Math.max(0, f - d),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/counselling', form);
      if (res.data.success) {
        success('Counselling session recorded successfully');
        setShowModal(false);
        fetchRecords();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save counselling record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Counselling</h1>
          <p className="text-xs text-slate-500 mt-1">
            Campus visits, phone consultations, fee quotation & enrollment decisions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Counselling Session</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading counselling sessions...</div>
        ) : records.length === 0 ? (
          <EmptyState
            title="No counselling records"
            description="Record in-person campus visits, consultations, and fee agreements."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Record Session
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Mode</th>
                  <th className="py-3 px-4">Prospective Student</th>
                  <th className="py-3 px-4">Interested Course</th>
                  <th className="py-3 px-4">Quoted Fee</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Counsellor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{new Date(r.counsellingDate).toLocaleDateString('en-IN')}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{r.counsellingMode}</span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{r.leadId?.customerName || 'Lead'}</p>
                      <p className="text-slate-400 text-[11px]">{r.leadId?.mobileNumber} ({r.leadId?.leadId})</p>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.interestedCourse}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-blue-700">₹{r.finalQuotedFee?.toLocaleString('en-IN')}</span>
                      {r.discount > 0 && (
                        <span className="block text-[10px] text-emerald-600">
                          (₹{r.discount} disc off ₹{r.courseFee})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.customerDecision === 'Ready to Enroll'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.customerDecision === 'Declined'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.customerDecision}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {r.counsellorId?.name || 'Staff'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {r.customerDecision === 'Ready to Enroll' && (
                        <button
                          onClick={() => navigate(`/admissions?convertLeadId=${r.leadId?._id}`)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs"
                        >
                          Admit Student &rarr;
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

      {/* New Counselling Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Counselling Consultation">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Prospective Lead *</label>
            <select
              required
              value={form.leadId}
              onChange={(e) => {
                const lead = leadsList.find((l) => l._id === e.target.value);
                setForm({
                  ...form,
                  leadId: e.target.value,
                  interestedCourse: lead ? lead.interestedCourse : form.interestedCourse,
                });
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
            >
              <option value="">-- Choose Lead --</option>
              {leadsList.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.customerName} ({l.mobileNumber}) - {l.interestedCourse}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Counselling Mode</label>
              <select
                value={form.counsellingMode}
                onChange={(e) => setForm({ ...form, counsellingMode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="In-Person at Campus">In-Person at Madurai Campus</option>
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp Video">WhatsApp Video</option>
                <option value="Google Meet">Google Meet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Decision</label>
              <select
                value={form.customerDecision}
                onChange={(e) => setForm({ ...form, customerDecision: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-blue-900"
              >
                <option value="Ready to Enroll">Ready to Enroll (Confirmed)</option>
                <option value="Considering">Considering / Reviewing</option>
                <option value="Need Discussion with Parents">Need Discussion with Parents</option>
                <option value="Comparing Institutes">Comparing Institutes</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Course Fee (₹)</label>
              <input
                type="number"
                value={form.courseFee}
                onChange={(e) => handleFeeChange(e.target.value, form.discount)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scholarship / Discount (₹)</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => handleFeeChange(form.courseFee, e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Final Quoted Fee (₹)</label>
              <input
                type="number"
                readOnly
                value={form.finalQuotedFee}
                className="w-full px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={form.nextFollowUpDate}
              onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Consultation Remarks / Parent Discussion</label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Student visited with father. RequestedDaVinci Resolve lab demo. Promoted to commit by Saturday."
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              Save Consultation Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
