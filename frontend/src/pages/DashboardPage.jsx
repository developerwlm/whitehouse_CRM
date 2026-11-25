import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  Share2,
  Calendar,
  AlertCircle,
  Award,
  Briefcase,
  ArrowUpRight,
  BookOpen,
  Layers,
  GraduationCap,
  MapPin,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#1e40af', '#0284c7', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981'];

export const DashboardPage = () => {
  const { user, isAdmin, isStaff, isTrainer, isStudent } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard-stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Whitehouse CRM Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e40af] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-xs font-semibold backdrop-blur-md mb-3 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>Madurai Campus Operations Live</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isAdmin && 'Whitehouse Institute Central Command. Real-time lead synchronization, course assignment, admission conversions, and financial performance.'}
            {isStaff && `Staff Management Center (${user?.staffIdentifier || 'Staff Member'}). Managing leads and authorized student records for: ${user?.assignedCourses?.join(', ') || 'Assigned Courses'}.`}
          </p>
        </div>
      </div>

      {/* ADMIN METRICS DASHBOARD */}
      {isAdmin && data?.metrics && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{data.metrics.totalLeads}</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{data.metrics.todayLeads} leads today</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Meta Ads Leads</span>
                <Share2 className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{data.metrics.metaAdsLeads}</div>
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Website: <span className="text-slate-800 font-semibold">{data.metrics.websiteLeads}</span> | Manual: <span className="text-slate-800 font-semibold">{data.metrics.manualLeads}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Admissions</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{data.metrics.totalAdmissions}</div>
              <div className="mt-2 text-xs text-slate-600 font-medium">
                Conversion Rate: <span className="text-emerald-600 font-bold">{data.metrics.conversionRate}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Fee Collection</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹{Number(data.metrics.totalFeeCollected || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-2 text-xs text-amber-600 font-medium">
                Pending: ₹{Number(data.metrics.totalPendingFee || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Active Students</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{data.metrics.activeStudents}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Graduated</span>
              <span className="text-lg font-bold text-blue-600 mt-1 block">{data.metrics.completedStudents}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Certificates Issued</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">{data.metrics.certificatesIssued}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Students Placed</span>
              <span className="text-lg font-bold text-teal-600 mt-1 block">{data.metrics.placementsCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Active Trainers</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">{data.metrics.trainerCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Follow-ups Due</span>
              <span className="text-lg font-bold text-amber-600 mt-1 block">{data.metrics.followUpsPending}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course-Wise Leads Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Course-Wise Leads Distribution</span>
                <span className="text-xs font-normal text-slate-400">Total: {data.metrics.totalLeads}</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.courseWiseLeads || []}>
                    <XAxis dataKey="course" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#1e40af" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Lead Pipeline Stages
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {(data.statusBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Leads & Admissions Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Leads</h3>
                <Link to="/leads" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">View All &rarr;</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {(data.recentLeads || []).map((l) => (
                  <div key={l._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{l.customerName}</p>
                      <p className="text-slate-400">{l.interestedCourse} • {l.mobileNumber}</p>
                    </div>
                    <div className="text-right">
                      <Badge status={l.leadStatus} />
                      <p className="text-[10px] text-slate-400 mt-0.5">{l.assignedStaff?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Admissions</h3>
                <Link to="/admissions" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">View All &rarr;</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {(data.recentAdmissions || []).map((a) => (
                  <div key={a._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{a.studentUniqueId}</p>
                      <p className="text-slate-400">{a.courseName} • Fee: ₹{a.finalFee}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600">Advance: ₹{a.advancePaid}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.admissionDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* STAFF METRICS DASHBOARD */}
      {isStaff && data?.metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Assigned Leads</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{data.metrics.assignedLeads}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">New Leads</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{data.metrics.newLeads}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Interested</span>
              <span className="text-2xl font-black text-teal-600 mt-1 block">{data.metrics.interestedLeads}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Follow-ups Due</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{data.metrics.pendingFollowUps}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Counselling Done</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">{data.metrics.counsellingCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Admissions</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{data.metrics.convertedAdmissions}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">My Assigned Course Leads</h3>
                <p className="text-xs text-slate-500 mt-0.5">Leads matching your assigned courses: {data.assignedCourses?.join(', ')}</p>
              </div>
              <Link to="/leads" className="text-xs text-blue-600 font-bold hover:underline">Manage All &rarr;</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.recentAssigned || []).map((l) => (
                <div key={l._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{l.customerName}</p>
                    <p className="text-slate-400">{l.interestedCourse} • {l.mobileNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={l.leadStatus} />
                    <Link to={`/leads?id=${l._id}`} className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100">
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRAINER METRICS DASHBOARD */}
      {isTrainer && data?.metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">My Active Batches</span>
              <span className="text-2xl font-black text-blue-600 mt-1 block">{data.metrics.assignedBatchesCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Assigned Students</span>
              <span className="text-2xl font-black text-teal-600 mt-1 block">{data.metrics.activeStudentsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block uppercase">Today's Attendance</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{data.metrics.todayAttendanceMarked} marked</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data.batches || []).map((b) => (
              <div key={b._id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{b.batchId}</span>
                </div>
                <p className="text-xs text-slate-500">Course: {b.courseId?.name} ({b.courseId?.durationWeeks} Weeks)</p>
                <div className="flex gap-2 pt-2">
                  <Link to="/attendance" className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
                    Mark Attendance
                  </Link>
                  <Link to="/progress" className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200">
                    Update Progress
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STUDENT PORTAL DASHBOARD */}
      {isStudent && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Student Academic Hub</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">Hello, {user?.name}!</h2>
              <p className="text-xs text-slate-500 mt-0.5">Registration ID: {user?.linkedStudentId ? 'Active' : 'WH-2026-0001'}</p>
            </div>
            <Link
              to="/examinations"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Take Scheduled Exams
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="text-xs text-blue-700 font-medium block">Course</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">Video Editing</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium block">Attendance</span>
              <span className="text-sm font-bold text-emerald-800 mt-1 block">90% (Good)</span>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
              <span className="text-xs text-teal-700 font-medium block">Syllabus Progress</span>
              <span className="text-sm font-bold text-teal-800 mt-1 block">Week 6 of 12</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
              <span className="text-xs text-purple-700 font-medium block">Certificate Status</span>
              <span className="text-sm font-bold text-purple-800 mt-1 block">In Progress</span>
            </div>
          </div>
        </div>
      )}

      {/* Campus Location & Navigation Map Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Institute Campus Location</h3>
              <p className="text-xs text-slate-500">Whitehouse Skill Development Institute • Ponmeni Bypass Road, Madurai</p>
            </div>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Whitehouse+Skill+Development+Institute+Ponmeni+Bypass+Road+Madurai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </a>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-64 sm:h-72 w-full shadow-inner bg-slate-100">
          <iframe
            title="Whitehouse Campus Location"
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=Whitehouse%20Skill%20Development%20Institute%20Ponmeni%20Bypass%20Road%20Madurai&t=&z=15&ie=UTF8&iwloc=&output=embed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="font-semibold text-slate-800">Campus Address</p>
            <p className="mt-0.5 text-slate-500">Ponmeni Bypass Road, Opp. to Madurai West, Madurai - 625016</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="font-semibold text-slate-800">Student Support & Helpdesk</p>
            <p className="mt-0.5 text-slate-500">+91 90800 00000 • contact@whitehouse.org.in</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="font-semibold text-slate-800">Working Hours</p>
            <p className="mt-0.5 text-slate-500">Mon - Sat: 9:00 AM - 7:00 PM (Sunday Closed)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
