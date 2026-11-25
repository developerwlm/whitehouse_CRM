import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart2,
  Calendar,
  Users,
  CreditCard,
  GraduationCap,
  Award,
  Briefcase,
  Search,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const REPORT_DEFINITIONS = [
  // Leads Category
  { id: 'daily-leads', name: "Today's Enquiries Report", category: 'Leads', icon: Calendar },
  { id: 'monthly-leads', name: 'Monthly Leads & Sources', category: 'Leads', icon: BarChart2 },
  { id: 'course-wise-leads', name: 'Course-wise Lead Distribution', category: 'Leads', icon: Filter },
  { id: 'source-wise-leads', name: 'Lead Acquisition Sources (Meta / Web / Manual)', category: 'Leads', icon: BarChart2 },
  { id: 'staff-wise-leads', name: 'Staff Lead Allocation & Conversions', category: 'Leads', icon: Users },

  // Admissions & Students Category
  { id: 'admission-conversion', name: 'Admission Conversions & Revenue', category: 'Students', icon: GraduationCap },
  { id: 'student-registration', name: 'Complete Student Directory', category: 'Students', icon: Users },
  { id: 'active-students', name: 'Currently Active Students', category: 'Students', icon: Users },
  { id: 'batch-wise-students', name: 'Batch Capacity & Enrollment', category: 'Students', icon: Filter },

  // Academics Category
  { id: 'weekly-progress', name: 'Weekly Syllabus & Learning Delays', category: 'Academics', icon: BarChart2 },
  { id: 'attendance-report', name: 'Student Attendance & Absence Analysis', category: 'Academics', icon: Calendar },
  { id: 'assignment-report', name: 'Assignment Submissions & Marks', category: 'Academics', icon: FileSpreadsheet },
  { id: 'examination-report', name: 'MCQ Examination Scores & Pass Rates', category: 'Academics', icon: Award },

  // Financial Category
  { id: 'fee-collection', name: 'Fee Collection & Transaction Log', category: 'Financial', icon: CreditCard },
  { id: 'pending-fees', name: 'Outstanding Fee Dues & Reminders', category: 'Financial', icon: CreditCard },

  // Outcomes Category
  { id: 'certificate-report', name: 'Issued Certificates & Verifications', category: 'Outcomes', icon: Award },
  { id: 'placement-report', name: 'Placement & Career Outcomes', category: 'Outcomes', icon: Briefcase },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeReport, setActiveReport] = useState('daily-leads');
  const [reportData, setReportData] = useState({ columns: [], data: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const fetchReport = async (reportType) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${reportType}`);
      setReportData({
        columns: res.data.columns || [],
        data: res.data.data || [],
        sheetName: res.data.sheetName || 'Report',
      });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await api.get(`/reports/${activeReport}`, {
        params: { exportFormat: 'excel' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeReport}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast(`Excel export downloaded successfully: ${activeReport}.xlsx`, 'success');
    } catch (err) {
      addToast('Failed to export Excel spreadsheet', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Filter categories
  const categories = ['All', 'Leads', 'Students', 'Academics', 'Financial', 'Outcomes'];
  const filteredReportsList = REPORT_DEFINITIONS.filter((r) =>
    categoryFilter === 'All' ? true : r.category === categoryFilter
  );

  const selectedDef = REPORT_DEFINITIONS.find((r) => r.id === activeReport) || REPORT_DEFINITIONS[0];

  // In-table search filter
  const tableRows = reportData.data.filter((row) => {
    if (!search) return true;
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Access 16 comprehensive institute reports with instantaneous dynamic Excel export, filtered views, and real-time database aggregations.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export to Excel (.xlsx)'}
        </button>
      </div>

      {/* Main Grid: Left Selector, Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Category Filter & Report Directory */}
        <div className="lg:col-span-1 space-y-4">
          {/* Category Tabs */}
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category Filter</p>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    categoryFilter === cat
                      ? 'bg-navy-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Reports */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden p-2 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">Available Reports</p>
            <div className="max-h-[600px] overflow-y-auto space-y-1">
              {filteredReportsList.map((r) => {
                const IconComponent = r.icon;
                const isActive = activeReport === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveReport(r.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-navy-50 text-navy-900 border border-navy-200 shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-navy-600' : 'text-gray-400'}`} />
                    <span className="truncate">{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Report View */}
        <div className="lg:col-span-3 space-y-4">
          {/* Report Metadata and Controls */}
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-medium bg-navy-100 text-navy-800 rounded">
                  {selectedDef.category}
                </span>
                <h2 className="text-lg font-bold text-gray-900">{selectedDef.name}</h2>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {tableRows.length} total entries generated from database
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search table rows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-gray-400">Aggregating live report metrics...</div>
            ) : tableRows.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="No records found for this report"
                description="There are currently no rows matching the query criteria."
              />
            ) : (
              <div className="overflow-x-auto max-h-[560px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200 shadow-xs">
                    <tr>
                      {reportData.columns.map((col) => (
                        <th key={col.key} className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-normal">
                    {tableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/75 transition-colors">
                        {reportData.columns.map((col) => {
                          const val = row[col.key];
                          const isNumeric = typeof val === 'number';
                          const isSpecial =
                            col.key.toLowerCase().includes('status') ||
                            col.key.toLowerCase().includes('result') ||
                            col.key.toLowerCase().includes('rate');

                          return (
                            <td key={col.key} className="py-2.5 px-4 text-gray-800 whitespace-nowrap">
                              {isNumeric && col.key.toLowerCase().includes('fee') ? (
                                `₹${val.toLocaleString('en-IN')}`
                              ) : isSpecial ? (
                                <span className="font-semibold text-navy-800">{String(val ?? '—')}</span>
                              ) : (
                                String(val ?? '—')
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
