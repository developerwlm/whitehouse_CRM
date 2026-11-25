import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import { ClipboardCheck, Calendar, Users, Check, X, AlertCircle } from 'lucide-react';

export const AttendancePage = () => {
  const { user, isAdmin, isStaff, isTrainer } = useAuth();
  const { success, error } = useToast();

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load batches
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await api.get('/batches');
        if (res.data.success && res.data.data.length > 0) {
          setBatches(res.data.data);
          setSelectedBatchId(res.data.data[0]._id);
        }
      } catch (e) {}
    };
    loadBatches();
  }, []);

  // Fetch batch details and enrolled students
  useEffect(() => {
    if (!selectedBatchId) return;
    const fetchBatchStudentsAndAttendance = async () => {
      setLoading(true);
      try {
        const [bRes, aRes] = await Promise.all([
          api.get(`/batches/${selectedBatchId}`),
          api.get(`/attendance/batch/${selectedBatchId}?date=${selectedDate}`),
        ]);

        if (bRes.data.success) {
          const enrolled = bRes.data.data.enrolledStudents || [];
          setStudents(enrolled);

          // Populate existing attendance if already marked on this date
          const initialMap = {};
          if (aRes.data.success && aRes.data.data.length > 0) {
            aRes.data.data.forEach((rec) => {
              if (rec.studentId) {
                initialMap[rec.studentId._id] = {
                  status: rec.status,
                  remarks: rec.remarks || '',
                };
              }
            });
            if (aRes.data.data[0]?.sessionTopic) {
              setTopic(aRes.data.data[0].sessionTopic);
            }
          } else {
            // Default all enrolled students to Present
            enrolled.forEach((s) => {
              initialMap[s._id] = { status: 'Present', remarks: '' };
            });
            setTopic('');
          }
          setAttendanceMap(initialMap);
        }
      } catch (e) {
        error('Failed to load batch students');
      } finally {
        setLoading(false);
      }
    };
    fetchBatchStudentsAndAttendance();
  }, [selectedBatchId, selectedDate]);

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '' }),
        status,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceMap[s._id]?.status || 'Present',
        remarks: attendanceMap[s._id]?.remarks || '',
      }));

      const res = await api.post('/attendance/mark', {
        batchId: selectedBatchId,
        classDate: selectedDate,
        topic,
        attendanceRecords: records,
      });

      if (res.data.success) {
        success(res.data.message);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = {
        ...(attendanceMap[s._id] || {}),
        status,
      };
    });
    setAttendanceMap(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Attendance Register</h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 11 Attendance Tracking • Duplicate Session Protection & Consecutive Absence Alerts
          </p>
        </div>

        {(isAdmin || isStaff || isTrainer) && (
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            {saving ? 'Saving Records...' : 'Save & Submit Attendance'}
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Batch</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.name} ({b.batchId})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Session Lesson Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
              placeholder="e.g. Maya Character Rigging - Joint Hierarchies"
            />
          </div>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center gap-1.5 pt-2 sm:pt-0">
          <button
            onClick={() => markAll('Present')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hover:bg-emerald-100"
          >
            Mark All Present
          </button>
          <button
            onClick={() => markAll('Absent')}
            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading batch students...</div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No students currently enrolled in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student._id]?.status || 'Present';
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-blue-700 font-bold text-[11px]">{student.studentId}</span>
                        <p className="font-bold text-slate-900 mt-0.5">{student.name}</p>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {student.mobile}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'Present')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'Absent')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentStatus(student._id, 'Leave')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                              currentStatus === 'Leave'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={attendanceMap[student._id]?.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttendanceMap((prev) => ({
                              ...prev,
                              [student._id]: {
                                ...(prev[student._id] || { status: 'Present' }),
                                remarks: val,
                              },
                            }));
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white"
                          placeholder="Optional remarks"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
