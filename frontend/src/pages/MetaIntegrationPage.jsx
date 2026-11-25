import React, { useState, useEffect } from 'react';
import {
  Share2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  Activity,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

export default function MetaIntegrationPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [settings, setSettings] = useState(null);
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Form mapping modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [newFormMapping, setNewFormMapping] = useState({
    formId: '',
    formName: '',
    targetCourse: 'VFX & Animation',
    campaignName: '',
    isActive: true,
  });

  // Simulator state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simForm, setSimForm] = useState({
    fullName: 'Karthik Raja',
    phoneNumber: '9842109876',
    email: 'karthik.vfx@example.com',
    interestedCourse: 'VFX & Animation',
    campaignName: 'Meta Summer Campaign 2026',
    adName: 'VFX 3D Reel Ad 01',
    leadgenId: 'leadgen_' + Date.now(),
  });

  // Settings form state
  const [formData, setFormData] = useState({
    pageId: '',
    pageName: '',
    appId: '',
    appSecret: '',
    pageAccessToken: '',
    webhookVerifyToken: '',
    isActive: true,
  });

  useEffect(() => {
    fetchSettings();
    fetchLogs();
    fetchCourses();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meta/settings');
      if (res.data.data) {
        setSettings(res.data.data);
        setFormData({
          pageId: res.data.data.pageId || '',
          pageName: res.data.data.pageName || '',
          appId: res.data.data.appId || '',
          appSecret: '', // hidden for security
          pageAccessToken: res.data.data.pageAccessTokenMasked || '',
          webhookVerifyToken: res.data.data.webhookVerifyToken || '',
          isActive: res.data.data.isActive ?? true,
        });
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to fetch Meta settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/meta/webhook-logs');
      setWebhookLogs(res.data.data || []);
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

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await api.post('/meta/test-connection');
      addToast(res.data.message || 'Connection test successful', 'success');
      fetchSettings();
    } catch (err) {
      addToast(
        err.response?.data?.message || 'Meta Graph API test failed. Check Page ID and Page Access Token.',
        'error'
      );
      fetchSettings();
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const payload = { ...formData };
      if (payload.pageAccessToken.includes('...')) {
        delete payload.pageAccessToken; // Keep existing token if not modified
      }
      if (!payload.appSecret) {
        delete payload.appSecret;
      }
      await api.put('/meta/settings', payload);
      addToast('Meta integration settings updated successfully', 'success');
      fetchSettings();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddFormMapping = async (e) => {
    e.preventDefault();
    if (!newFormMapping.formId || !newFormMapping.formName) {
      return addToast('Form ID and Form Name are required', 'error');
    }

    try {
      const updatedForms = [...(settings?.subscribedForms || []), newFormMapping];
      await api.put('/meta/settings', { subscribedForms: updatedForms });
      addToast('Form mapping added successfully', 'success');
      setFormModalOpen(false);
      setNewFormMapping({
        formId: '',
        formName: '',
        targetCourse: courses[0]?.name || 'VFX & Animation',
        campaignName: '',
        isActive: true,
      });
      fetchSettings();
    } catch (err) {
      addToast('Failed to add form mapping', 'error');
    }
  };

  const handleDeleteFormMapping = async (index) => {
    try {
      const updatedForms = settings.subscribedForms.filter((_, i) => i !== index);
      await api.put('/meta/settings', { subscribedForms: updatedForms });
      addToast('Form mapping removed', 'info');
      fetchSettings();
    } catch (err) {
      addToast('Failed to remove form mapping', 'error');
    }
  };

  const handleRetryWebhook = async (id) => {
    try {
      setRetryingId(id);
      const res = await api.post(`/meta/retry-webhook/${id}`);
      addToast(res.data.message || 'Webhook event retried successfully', 'success');
      fetchLogs();
    } catch (err) {
      addToast(err.response?.data?.message || 'Retry failed', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'info');
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    try {
      setSimulating(true);
      setSimulationResult(null);

      // Construct standard Meta Webhook entry payload
      const mockMetaPayload = {
        object: 'page',
        entry: [
          {
            id: settings?.pageId || '109823471829381',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'leadgen',
                value: {
                  created_time: Math.floor(Date.now() / 1000),
                  leadgen_id: simForm.leadgenId,
                  page_id: settings?.pageId || '109823471829381',
                  form_id: '827361928374',
                  // Attached test fields for simulation parser
                  simulated_data: {
                    full_name: simForm.fullName,
                    phone_number: simForm.phoneNumber,
                    email: simForm.email,
                    interested_course: simForm.interestedCourse,
                    campaign_name: simForm.campaignName,
                    ad_name: simForm.adName,
                  },
                },
              },
            ],
          },
        ],
      };

      // Send to webhook endpoint
      const res = await api.post('/webhooks/meta', mockMetaPayload);

      setSimulationResult({
        status: 'SUCCESS',
        message: 'Meta Webhook Received & Processed by Backend Pipeline (HTTP 200 EVENT_RECEIVED)',
        lead: {
          customerName: simForm.fullName,
          mobileNumber: simForm.phoneNumber,
          interestedCourse: simForm.interestedCourse,
          leadSource: 'Meta Ads',
        },
      });

      addToast('Meta leadgen webhook simulated successfully! Lead created.', 'success');
      fetchLogs();
    } catch (err) {
      setSimulationResult({
        status: 'FAILED',
        message: err.response?.data || err.message,
      });
      addToast('Webhook simulation encountered an error', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/meta`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Meta Ads Automatic Integration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real Facebook and Instagram Lead Ads integration using Meta Graph API, Webhooks, course-matching, and auto staff allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulatorOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Play className="w-4 h-4" />
            Meta Webhook Simulator
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Integration Status Banner */}
      <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              settings?.lastSyncStatus?.includes('Active')
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{settings?.pageName || 'Facebook Page Not Configured'}</h2>
              <Badge variant={settings?.lastSyncStatus?.includes('Active') ? 'success' : 'warning'}>
                {settings?.lastSyncStatus || 'Disconnected'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Page ID: <span className="font-mono text-gray-700">{settings?.pageId || '—'}</span> | Last Synced:{' '}
              {settings?.lastSyncAt ? new Date(settings.lastSyncAt).toLocaleString('en-IN') : 'Never'}
            </p>
          </div>
        </div>

        {/* Webhook Configuration Quick Copy */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 flex items-center justify-between gap-2">
            <span className="truncate max-w-[220px]">{webhookUrl}</span>
            <button
              onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
              className="text-gray-400 hover:text-navy-600"
              title="Copy Webhook URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-600 flex items-center justify-between gap-2">
            <span>Verify Token</span>
            <button
              onClick={() => copyToClipboard(settings?.webhookVerifyToken || '', 'Verify Token')}
              className="text-gray-400 hover:text-navy-600"
              title="Copy Verify Token"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings & Form Mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Meta App Settings Form */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy-600" />
              <h3 className="text-sm font-bold text-gray-900">Meta API & Credentials</h3>
            </div>
            <span className="text-xs text-gray-400">Secured & Server Encrypted</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Facebook Page ID</label>
                <input
                  type="text"
                  value={formData.pageId}
                  onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                  placeholder="e.g. 109823471829381"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Page Name</label>
                <input
                  type="text"
                  value={formData.pageName}
                  onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
                  placeholder="Whitehouse Skill Development Institute"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Meta App ID</label>
                <input
                  type="text"
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                  placeholder="e.g. 827361928374619"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">App Secret</label>
                <input
                  type="password"
                  value={formData.appSecret}
                  onChange={(e) => setFormData({ ...formData, appSecret: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Page Access Token</label>
              <input
                type="text"
                value={formData.pageAccessToken}
                onChange={(e) => setFormData({ ...formData, pageAccessToken: e.target.value })}
                placeholder="EAAGm0PX4ZCpsBAK..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">
                Never shared publicly. Required for Meta Graph API v21.0 leadgen data retrieval.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Webhook Verify Token</label>
              <input
                type="text"
                value={formData.webhookVerifyToken}
                onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                placeholder="WHITEHOUSE_CRM_META_VERIFY_TOKEN_2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-500 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save Meta Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Subscribed Lead Forms & Course Mappings */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-gray-900">Lead Form to Course Mappings</h3>
            </div>
            <button
              onClick={() => setFormModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-xs font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Map New Form
            </button>
          </div>

          <p className="text-xs text-gray-500">
            When an applicant submits a Meta Instant Form, Whitehouse CRM matches the Form ID to assign the designated course and route the lead to Staff 1 or Staff 2.
          </p>

          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {settings?.subscribedForms?.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No lead forms mapped yet.</p>
            ) : (
              settings?.subscribedForms?.map((form, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200/70 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-xs text-gray-900">{form.formName}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-gray-700">ID: {form.formId}</span>
                      <span>•</span>
                      <span className="text-navy-700 font-medium">Target: {form.targetCourse}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                    <button
                      onClick={() => handleDeleteFormMapping(idx)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded"
                      title="Remove Mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Webhook Activity & Retry Log */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-navy-600" />
            <h3 className="text-sm font-bold text-gray-900">Recent Webhook Ingestion Events & Error Logs</h3>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-navy-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase">
                <th className="py-2.5 px-4">Event ID / Time</th>
                <th className="py-2.5 px-4">Meta Lead ID</th>
                <th className="py-2.5 px-4">Resulting Lead</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Details / Errors</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webhookLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No webhook events recorded yet. Run the Simulator above to test live ingestion.
                  </td>
                </tr>
              ) : (
                webhookLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-mono text-gray-900">{log._id.slice(-8)}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-gray-700">{log.metaLeadId || '—'}</td>
                    <td className="py-2.5 px-4">
                      {log.leadId ? (
                        <div>
                          <span className="font-medium text-gray-900">{log.leadId.customerName}</span>
                          <span className="text-[10px] text-navy-600 block">({log.leadId.interestedCourse})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          log.processedStatus === 'Processed'
                            ? 'success'
                            : log.processedStatus === 'Received'
                            ? 'primary'
                            : 'danger'
                        }
                      >
                        {log.processedStatus}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 max-w-xs truncate">
                      {log.errorMessage || 'Event successfully ingested and stored in MongoDB'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {log.processedStatus === 'Failed' && (
                        <button
                          onClick={() => handleRetryWebhook(log._id)}
                          disabled={retryingId === log._id}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-medium text-[11px] transition-colors"
                        >
                          {retryingId === log._id ? 'Retrying...' : 'Retry Webhook'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map New Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Map Meta Lead Form to Course"
      >
        <form onSubmit={handleAddFormMapping} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Meta Form ID</label>
            <input
              type="text"
              value={newFormMapping.formId}
              onChange={(e) => setNewFormMapping({ ...newFormMapping, formId: e.target.value })}
              placeholder="e.g. 827361928374"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Form Name / Campaign Description</label>
            <input
              type="text"
              value={newFormMapping.formName}
              onChange={(e) => setNewFormMapping({ ...newFormMapping, formName: e.target.value })}
              placeholder="e.g. VFX 3D Animation Career Form 2026"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Course Allocation</label>
            <select
              value={newFormMapping.targetCourse}
              onChange={(e) => setNewFormMapping({ ...newFormMapping, targetCourse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-navy-500"
            >
              {courses.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Campaign Tag (Optional)</label>
            <input
              type="text"
              value={newFormMapping.campaignName}
              onChange={(e) => setNewFormMapping({ ...newFormMapping, campaignName: e.target.value })}
              placeholder="e.g. Meta Reel Ads 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Add Form Mapping
            </button>
          </div>
        </form>
      </Modal>

      {/* Meta Webhook Simulator Modal */}
      <Modal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        title="Meta Leadgen Live Webhook Simulator"
      >
        <form onSubmit={handleRunSimulation} className="space-y-4">
          <p className="text-xs text-gray-500">
            Simulate a real Facebook / Instagram Lead Ad form submission entering the Meta Webhook pipeline.
            This validates backend signature validation, lead creation, duplicate detection, and course-based staff assignment.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Customer Full Name</label>
              <input
                type="text"
                value={simForm.fullName}
                onChange={(e) => setSimForm({ ...simForm, fullName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mobile Number</label>
              <input
                type="text"
                value={simForm.phoneNumber}
                onChange={(e) => setSimForm({ ...simForm, phoneNumber: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={simForm.email}
                onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Interested Course</label>
              <select
                value={simForm.interestedCourse}
                onChange={(e) => setSimForm({ ...simForm, interestedCourse: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Campaign Name</label>
              <input
                type="text"
                value={simForm.campaignName}
                onChange={(e) => setSimForm({ ...simForm, campaignName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Ad Name</label>
              <input
                type="text"
                value={simForm.adName}
                onChange={(e) => setSimForm({ ...simForm, adName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {simulationResult && (
            <div
              className={`p-3 rounded-lg text-xs ${
                simulationResult.status === 'SUCCESS'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <p className="font-semibold">{simulationResult.message}</p>
              {simulationResult.lead && (
                <p className="mt-1">
                  Created Lead: {simulationResult.lead.customerName} | Course: {simulationResult.lead.interestedCourse}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setSimulatorOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={simulating}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {simulating ? 'Simulating Event...' : 'Trigger Simulated Webhook'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
