import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  History,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

const COURSES = [
  'VFX & Animation',
  'Video Editing',
  'AI Video Editing',
  'Graphic Design',
  'Coding',
  'Drone Photography',
  'Digital Marketing',
];

const STATUSES = [
  'New Lead',
  'Contacted',
  'Interested',
  'Follow-up Pending',
  'Counselling Scheduled',
  'Visited Institute',
  'Admission Confirmed',
  'Not Interested',
  'No Response',
  'Lost',
];

const SOURCES = ['Facebook Ads', 'Instagram Ads', 'Website enquiries', 'Manual entry', 'Meta Ads', 'WhatsApp enquiries', 'Google Ads'];

export const LeadsPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Form states
  const [newLeadForm, setNewLeadForm] = useState({
    customerName: '',
    mobileNumber: '',
    whatsappNumber: '',
    email: '',
    interestedCourse: 'VFX & Animation',
    leadSource: 'Manual entry',
    campaignName: '',
    remarks: '',
    followUpDate: '',
  });

  const [activityForm, setActivityForm] = useState({
    activityType: 'call',
    callOutcome: 'Connected',
    description: '',
    newStatus: '',
    followUpDate: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        search,
        status: statusFilter,
        course: courseFilter,
        source: sourceFilter,
        form: formFilter,
      };
      const res = await api.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.data);
        setTotalLeads(res.data.pagination.total);
      }
    } catch (err) {
      error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, courseFilter, sourceFilter, formFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/leads', newLeadForm);
      if (res.data.success) {
        success(`Lead created & assigned to ${res.data.assignment?.staffName || 'Staff'}`);
        setShowCreateModal(false);
        setNewLeadForm({
          customerName: '',
          mobileNumber: '',
          whatsappNumber: '',
          email: '',
          interestedCourse: 'VFX & Animation',
          leadSource: 'Manual entry',
          campaignName: '',
          remarks: '',
          followUpDate: '',
        });
        fetchLeads();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/leads/${selectedLead._id}/activities`, activityForm);
      if (res.data.success) {
        success('Activity logged successfully');
        setShowActivityModal(false);
        setActivityForm({ activityType: 'call', callOutcome: 'Connected', description: '', newStatus: '', followUpDate: '' });
        // Refresh single lead view
        const updatedLead = await api.get(`/leads/${selectedLead._id}`);
        setSelectedLead(updatedLead.data.data);
        fetchLeads();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to log activity');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/leads/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Whitehouse_Leads_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Leads Excel export downloaded');
    } catch (err) {
      error('Export failed');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/leads/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        success(res.data.message);
        fetchLeads();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Excel import failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openLeadDetail = async (leadId) => {
    try {
      const res = await api.get(`/leads/${leadId}`);
      if (res.data.success) {
        setSelectedLead(res.data.data);
      }
    } catch (err) {
      error('Failed to load lead details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lead Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Meta Lead Ads, Website, Manual & Referral Enquiries ({totalLeads} total)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, mobile, email, lead ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none"
          >
            <option value="">All Courses</option>
            {COURSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none"
          >
            <option value="">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Website Form Filter */}
          <select
            value={formFilter}
            onChange={(e) => {
              setFormFilter(e.target.value);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
              formFilter
                ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All Website Forms</option>
            <option value="contact-page">📄 Contact Page Form (contact-page)</option>
            <option value="home-enquiry-popup">💬 Home Popup Form (home-enquiry-popup)</option>
          </select>

          {(statusFilter || courseFilter || sourceFilter || formFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setCourseFilter('');
                setSourceFilter('');
                setFormFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="No prospective students matching your active filter criteria."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Create New Lead
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lead ID & Customer</th>
                  <th className="py-3 px-4">Course & Source</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Follow-up Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          {lead.leadId}
                        </span>
                        {lead.isDuplicate && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-semibold border border-amber-200" title="Flagged duplicate contact">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Duplicate
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 mt-1">{lead.customerName}</p>
                      <p className="text-slate-400 text-[11px]">{lead.mobileNumber} {lead.email && `• ${lead.email}`}</p>
                      {(lead.city || lead.gender) && (
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          📍 {lead.city || 'Madurai'} {lead.gender && `• ${lead.gender}`}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{lead.interestedCourse}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {lead.leadSource}
                        </span>
                        {(lead.websiteForm || (lead.leadSource === 'Website enquiries' && lead.campaignName)) && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                              (lead.websiteForm || lead.campaignName) === 'contact-page'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                            }`}
                          >
                            🌐 {lead.websiteForm || lead.campaignName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {lead.assignedStaff ? (
                        <div>
                          <p className="font-medium text-slate-800">{lead.assignedStaff.name}</p>
                          <span className="text-[10px] text-slate-400 capitalize">{lead.assignedStaff.staffIdentifier || 'Staff'}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Unassigned Queue
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={lead.leadStatus} />
                    </td>

                    <td className="py-3 px-4">
                      {lead.followUpDate ? (
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{new Date(lead.followUpDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Click-to-chat */}
                        <a
                          href={`https://wa.me/91${lead.whatsappNumber || lead.mobileNumber}?text=Hello%20${encodeURIComponent(lead.customerName)},%20greetings%20from%20Whitehouse%20Institute%20Madurai%20regarding%20your%20interest%20in%20${encodeURIComponent(lead.interestedCourse)}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Open WhatsApp Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        {/* View & Activity Button */}
                        <button
                          onClick={() => openLeadDetail(lead._id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                        >
                          View & Log
                        </button>

                        {/* Convert to Student shortcut if not converted */}
                        {!lead.isConverted && (
                          <button
                            onClick={() => navigate(`/admissions?convertLeadId=${lead._id}`)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
                            title="Convert to Registered Student"
                          >
                            Admit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead Detail / Activity History Modal */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={`Lead File: ${selectedLead.leadId} - ${selectedLead.customerName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Quick summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Interested Course</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedLead.interestedCourse}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Mobile Contact</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedLead.mobileNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assigned Staff</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedLead.assignedStaff?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Lead Status</span>
                <div className="mt-1"><Badge status={selectedLead.leadStatus} /></div>
              </div>
            </div>

            {/* Website Form Source & Location details if present */}
            {(selectedLead.websiteForm || selectedLead.campaignName || selectedLead.city || selectedLead.gender || selectedLead.remarks) && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-slate-700">Origin Form: </span>
                    <span className="font-bold text-blue-700">
                      🌐 {selectedLead.websiteForm || selectedLead.campaignName || selectedLead.leadSource}
                    </span>
                    {selectedLead.city && <span className="ml-3 text-slate-600">City: <strong>{selectedLead.city}</strong></span>}
                    {selectedLead.gender && <span className="ml-3 text-slate-600">Gender: <strong>{selectedLead.gender}</strong></span>}
                  </div>
                </div>
                {selectedLead.remarks && (
                  <div className="text-slate-600 text-[11px] pt-2 mt-2 border-t border-blue-100">
                    <strong>Message:</strong> {selectedLead.remarks}
                  </div>
                )}
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
              <button
                onClick={() => setShowActivityModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Log Call / Activity</span>
              </button>

              <button
                onClick={() => navigate(`/counselling?leadId=${selectedLead._id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-semibold hover:bg-purple-100"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Counselling</span>
              </button>

              {!selectedLead.isConverted && (
                <button
                  onClick={() => navigate(`/admissions?convertLeadId=${selectedLead._id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 ml-auto"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Convert to Student Admission</span>
                </button>
              )}
            </div>

            {/* Customer Activity Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Customer Touchpoint History</span>
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {(selectedLead.activities || []).length === 0 ? (
                  <p className="text-slate-400 py-3 pl-7">No logged activities yet.</p>
                ) : (
                  selectedLead.activities.map((act) => (
                    <div key={act._id} className="relative flex items-start gap-3 pl-7">
                      <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                      <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{act.title}</span>
                          <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        {act.description && <p className="text-slate-600 mt-1">{act.description}</p>}
                        {act.callOutcome && (
                          <span className="inline-block mt-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Outcome: {act.callOutcome}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-1">Logged by: {act.performedByName || 'Staff'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Lead"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={newLeadForm.customerName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, customerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Anand Murugan"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={newLeadForm.mobileNumber}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, mobileNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={newLeadForm.whatsappNumber}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="WhatsApp contact"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="name@gmail.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interested Course *</label>
              <select
                required
                value={newLeadForm.interestedCourse}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, interestedCourse: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[10px] text-blue-600 mt-1">
                * Automatically assigned according to course allocation rules (Staff 1 / Staff 2)
              </p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={newLeadForm.leadSource}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, leadSource: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheduled Follow-up Date</label>
            <input
              type="date"
              value={newLeadForm.followUpDate}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, followUpDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Requirements</label>
            <textarea
              rows={3}
              value={newLeadForm.remarks}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Inquired about weekend batch options or portfolio training."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
            >
              Save & Auto-Assign Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Record Call / Follow-up Note"
      >
        <form onSubmit={handleAddActivity} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Activity Type</label>
              <select
                value={activityForm.activityType}
                onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="call">Phone Call</option>
                <option value="whatsapp">WhatsApp Chat</option>
                <option value="note">Internal Staff Note</option>
                <option value="counselling">Campus Counselling</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Call Outcome</label>
              <select
                value={activityForm.callOutcome}
                onChange={(e) => setActivityForm({ ...activityForm, callOutcome: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="Connected">Connected & Interested</option>
                <option value="Requested Callback">Requested Callback</option>
                <option value="Ringing Unanswered">Ringing Unanswered</option>
                <option value="Busy">Line Busy</option>
                <option value="Switched Off">Switched Off</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Update Status (Optional)</label>
              <select
                value={activityForm.newStatus}
                onChange={(e) => setActivityForm({ ...activityForm, newStatus: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="">Keep current status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={activityForm.followUpDate}
                onChange={(e) => setActivityForm({ ...activityForm, followUpDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Call Notes / Discussion Summary</label>
            <textarea
              required
              rows={3}
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              placeholder="e.g. Student is currently in final semester of college, wants DaVinci color grading module."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowActivityModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Save Activity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
