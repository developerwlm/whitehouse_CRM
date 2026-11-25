import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Calendar,
  User,
  Phone,
  Mail,
} from 'lucide-react';

const STATUSES = ['Active', 'On Hold', 'Completed', 'Discontinued', 'Transferred', 'Alumni'];

export const StudentsPage = () => {
  const { user } = useAuth();
  const { error } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: { page, limit: 12, search, status: statusFilter, courseId: courseFilter },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setTotalStudents(res.data.pagination.total);
      }
    } catch (err) {
      error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) setCourses(res.data.data);
      } catch (e) {}
    };
    loadCourses();
  }, [page, statusFilter, courseFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered Active & Alumni Students ({totalStudents} Enrolled)
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student ID (e.g. WH-2026-0001), name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none"
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
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student profiles...</div>
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try modifying search keywords or check admissions list."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                      alt={student.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {student.studentId}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{student.name}</h3>
                    </div>
                  </div>
                  <Badge status={student.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{student.courseName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Batch: {student.batchName || 'Unassigned Batch'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{student.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Trainer: {student.trainerName || 'Assigned Lead Trainer'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/students/${student._id}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  <span>Open Full 15-Section Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
