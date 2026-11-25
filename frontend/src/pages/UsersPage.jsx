import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const ALL_COURSES = [
  'VFX & Animation',
  'Video Editing',
  'AI Video Editing',
  'Drone Photography',
  'Coding',
  'Graphic Design',
  'Digital Marketing',
];

const ROLE_BADGES = {
  admin: 'danger',
  staff: 'primary',
  trainer: 'secondary',
  student: 'default',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    staffIdentifier: '',
    phone: '',
    assignedCourses: [],
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      staffIdentifier: '',
      phone: '',
      assignedCourses: [],
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // blank unless changing
      role: u.role,
      staffIdentifier: u.staffIdentifier || '',
      phone: u.phone || '',
      assignedCourses: u.assignedCourses || [],
      isActive: u.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleCourseToggle = (courseName) => {
    const current = [...formData.assignedCourses];
    const index = current.indexOf(courseName);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(courseName);
    }
    setFormData({ ...formData, assignedCourses: current });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editingUser._id}`, payload);
        addToast('User updated successfully', 'success');
      } else {
        await api.post('/users', formData);
        addToast('New user account created successfully', 'success');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save user account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user account for ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      addToast('User deleted successfully', 'info');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const match =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.staffIdentifier || '').toLowerCase().includes(search.toLowerCase());
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage Admin, Staff members (Staff 1 & Staff 2), Trainers, and individual course allocations.
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="staff">Staff Members</option>
            <option value="trainer">Trainers</option>
            <option value="student">Students</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Create user accounts and assign relevant course permissions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Staff Identifier</th>
                  <th className="py-3 px-4">Assigned Course Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={ROLE_BADGES[u.role] || 'default'}>
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {u.staffIdentifier || '—'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-gray-500 italic">Complete Institute Access</span>
                      ) : u.assignedCourses && u.assignedCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedCourses.map((c, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No courses allocated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {currentUser?.role === 'admin' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-gray-500 hover:text-navy-600 rounded-lg hover:bg-gray-100"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u._id !== currentUser?._id && (
                            <button
                              onClick={() => handleDelete(u._id, u.name)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                {editingUser ? 'Password (leave blank to keep unchanged)' : 'Password'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">System Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-navy-500"
              >
                <option value="admin">Administrator</option>
                <option value="staff">Staff Member</option>
                <option value="trainer">Trainer</option>
                <option value="student">Student</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Staff Identifier</label>
              <select
                value={formData.staffIdentifier}
                onChange={(e) => setFormData({ ...formData, staffIdentifier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-navy-500"
              >
                <option value="">None / Not Applicable</option>
                <option value="Staff 1">Staff 1</option>
                <option value="Staff 2">Staff 2</option>
              </select>
            </div>
          </div>

          {/* Assigned Courses Selection */}
          {(formData.role === 'staff' || formData.role === 'trainer') && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                Assigned Course Scope (Lead & Student Visibility)
              </label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {ALL_COURSES.map((course) => {
                  const checked = formData.assignedCourses.includes(course);
                  return (
                    <label key={course} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCourseToggle(course)}
                        className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                      />
                      <span>{course}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {editingUser && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
              />
              <label htmlFor="activeToggle" className="text-xs font-medium text-gray-700">
                Account Active & Allowed to Sign In
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
