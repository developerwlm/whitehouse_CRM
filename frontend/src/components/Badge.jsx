import React from 'react';

const statusColors = {
  // Lead statuses
  'New Lead': 'bg-blue-100 text-blue-800 border-blue-200',
  'Contacted': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Interested': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Follow-up Pending': 'bg-amber-100 text-amber-800 border-amber-200',
  'Counselling Scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
  'Visited Institute': 'bg-teal-100 text-teal-800 border-teal-200',
  'Admission Confirmed': 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
  'Not Interested': 'bg-slate-100 text-slate-700 border-slate-200',
  'No Response': 'bg-orange-100 text-orange-800 border-orange-200',
  'Lost': 'bg-rose-100 text-rose-800 border-rose-200',

  // Student statuses
  'Active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'On Hold': 'bg-amber-100 text-amber-800 border-amber-200',
  'Completed': 'bg-blue-100 text-blue-800 border-blue-200',
  'Discontinued': 'bg-rose-100 text-rose-800 border-rose-200',
  'Transferred': 'bg-purple-100 text-purple-800 border-purple-200',
  'Alumni': 'bg-teal-100 text-teal-800 border-teal-200 font-semibold',

  // Attendance & Fees
  'Present': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Absent': 'bg-rose-100 text-rose-800 border-rose-200',
  'Leave': 'bg-amber-100 text-amber-800 border-amber-200',
  'Paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Partial': 'bg-amber-100 text-amber-800 border-amber-200',
  'Pending': 'bg-slate-100 text-slate-800 border-slate-200',
  'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Pending Approval': 'bg-amber-100 text-amber-800 border-amber-200',
  'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
  'Placed': 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
  'Job Seeking': 'bg-blue-100 text-blue-800 border-blue-200',

  // Variants
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
  secondary: 'bg-teal-100 text-teal-800 border-teal-200',
  default: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const Badge = ({ status, variant, children, className = '' }) => {
  const key = variant || status || (typeof children === 'string' ? children : '');
  const colorClass = statusColors[key] || 'bg-slate-100 text-slate-800 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}
    >
      {children || status}
    </span>
  );
};

export default Badge;
