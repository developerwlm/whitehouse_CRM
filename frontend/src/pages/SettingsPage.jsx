import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Users,
  Award,
  ShieldCheck,
  Save,
  CheckCircle2,
  RefreshCw,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [settings, setSettings] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    instituteName: '',
    tagline: '',
    phone: '',
    email: '',
    website: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [eligibilityForm, setEligibilityForm] = useState({
    minAttendancePercent: 75,
    minAssignmentPercent: 60,
    requireExamPassed: true,
    requireFeesCleared: true,
  });

  const [courseAssignments, setCourseAssignments] = useState([]);

  useEffect(() => {
    fetchSettingsAndStaff();
  }, []);

  const fetchSettingsAndStaff = async () => {
    try {
      setLoading(true);
      const [settingsRes, staffRes] = await Promise.all([
        api.get('/settings'),
        api.get('/users?role=staff'),
      ]);

      const s = settingsRes.data.data;
      setSettings(s);
      setStaffUsers(staffRes.data.data || []);

      if (s) {
        setGeneralForm({
          instituteName: s.instituteName || 'Whitehouse Skill Development Institute',
          tagline: s.tagline || 'Premier Professional & Creative Skills Training',
          phone: s.phone || '+91 98765 43210',
          email: s.email || 'info@whitehouseinstitute.in',
          website: s.website || 'https://whitehouseinstitute.in',
          street: s.address?.street || 'Pasumalai',
          city: s.address?.city || 'Madurai',
          state: s.address?.state || 'Tamil Nadu',
          pincode: s.address?.pincode || '625004',
        });

        if (s.eligibilityCriteria) {
          setEligibilityForm({
            minAttendancePercent: s.eligibilityCriteria.minAttendancePercent ?? 75,
            minAssignmentPercent: s.eligibilityCriteria.minAssignmentPercent ?? 60,
            requireExamPassed: s.eligibilityCriteria.requireExamPassed ?? true,
            requireFeesCleared: s.eligibilityCriteria.requireFeesCleared ?? true,
          });
        }

        if (s.courseAssignments) {
          setCourseAssignments(s.courseAssignments);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load institute settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (index, staffId) => {
    const selectedStaff = staffUsers.find((u) => u._id === staffId);
    const updated = [...courseAssignments];
    updated[index] = {
      ...updated[index],
      assignedStaffId: staffId || null,
      assignedStaffName: selectedStaff ? selectedStaff.name : 'Unassigned',
    };
    setCourseAssignments(updated);
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        instituteName: generalForm.instituteName,
        tagline: generalForm.tagline,
        phone: generalForm.phone,
        email: generalForm.email,
        website: generalForm.website,
        address: {
          street: generalForm.street,
          city: generalForm.city,
          state: generalForm.state,
          pincode: generalForm.pincode,
          country: 'India',
        },
        eligibilityCriteria: eligibilityForm,
        courseAssignments,
      };

      const res = await api.put('/settings', payload);
      addToast('Institute configuration & assignment rules saved successfully!', 'success');
      setSettings(res.data.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-gray-400">Loading institute settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Institute Settings & Workflow Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure institute profile, dynamic course-to-staff lead routing, and certificate eligibility thresholds.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Course-wise Staff Assignment Rules */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Users className="w-5 h-5 text-navy-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Course-Wise Staff Lead Allocation</h2>
              <p className="text-xs text-gray-500">
                Incoming leads from Meta Ads, Website, and Manual sources are automatically routed based on these assignments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courseAssignments.map((ca, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-gray-50 rounded-lg border border-gray-200/80 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-bold text-gray-900">{ca.courseName}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Currently Assigned:{' '}
                    <span className="font-semibold text-navy-700">{ca.assignedStaffName || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="w-48">
                  <select
                    value={ca.assignedStaffId || ''}
                    onChange={(e) => handleAssignmentChange(idx, e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-2 focus:ring-navy-500"
                  >
                    <option value="">-- Unassigned Queue --</option>
                    {staffUsers.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name} ({st.staffIdentifier || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Certificate Eligibility Rules */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Award className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Certificate Issuance Eligibility Thresholds</h2>
              <p className="text-xs text-gray-500">
                Multi-factor criteria verified by the CRM before an official QR-verified certificate can be issued.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Minimum Attendance Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={eligibilityForm.minAttendancePercent}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, minAttendancePercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Minimum Assignment Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={eligibilityForm.minAssignmentPercent}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, minAssignmentPercent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
                />
              </div>
            </div>

            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityForm.requireExamPassed}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, requireExamPassed: e.target.checked })
                  }
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Mandatory MCQ Examination Pass Status</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityForm.requireFeesCleared}
                  onChange={(e) =>
                    setEligibilityForm({ ...eligibilityForm, requireFeesCleared: e.target.checked })
                  }
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Zero Fee Outstanding Balance (All installments cleared)</span>
              </label>

              <p className="text-[11px] text-teal-800 pt-2 border-t border-teal-200/60 leading-relaxed">
                When a trainer recommends completion, the CRM snapshots these metrics directly into the certificate record for the Admin to inspect.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Institute Identity & Contact Details */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building className="w-5 h-5 text-gray-700" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Institute Identity & Branding</h2>
              <p className="text-xs text-gray-500">
                Printed on official PDF receipts, verification portals, and course completion certificates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Institute Legal Name</label>
              <input
                type="text"
                value={generalForm.instituteName}
                onChange={(e) => setGeneralForm({ ...generalForm, instituteName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={generalForm.tagline}
                onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={generalForm.phone}
                onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={generalForm.email}
                onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Official Website</label>
              <input
                type="url"
                value={generalForm.website}
                onChange={(e) => setGeneralForm({ ...generalForm, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Street Address</label>
              <input
                type="text"
                value={generalForm.street}
                onChange={(e) => setGeneralForm({ ...generalForm, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">City & State</label>
              <input
                type="text"
                value={`${generalForm.city}, ${generalForm.state}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Postal Code</label>
              <input
                type="text"
                value={generalForm.pincode}
                onChange={(e) => setGeneralForm({ ...generalForm, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          {/* Interactive Google Map of Campus Location */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Institute Location Map</h4>
                  <p className="text-xs text-gray-500">
                    {generalForm.street || '12, Bypass Road, Ponmeni'}, {generalForm.city || 'Madurai'}, {generalForm.state || 'Tamil Nadu'} {generalForm.pincode || '625004'}
                  </p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${generalForm.instituteName || 'Whitehouse Skill Development Institute'}, ${generalForm.street || 'Ponmeni Bypass Road'}, ${generalForm.city || 'Madurai'}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-50 text-navy-700 text-xs font-semibold hover:bg-navy-100 transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="w-full h-72 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
              <iframe
                title="Institute Campus Google Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  `Whitehouse Skill Development Institute, ${generalForm.street || 'Ponmeni Bypass Road'}, ${generalForm.city || 'Madurai'}, Tamil Nadu`
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
