import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  PhoneCall,
  UserCheck,
  GraduationCap,
  BookOpen,
  CalendarDays,
  UserCog,
  TrendingUp,
  ClipboardCheck,
  FileCheck2,
  Award,
  CreditCard,
  ScrollText,
  Briefcase,
  BarChart3,
  Bell,
  Share2,
  ShieldCheck,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, isAdmin, isStaff, isTrainer, isStudent } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
    { name: 'Leads', to: '/leads', icon: Users2, roles: ['admin', 'staff'] },
    { name: 'Counselling', to: '/counselling', icon: PhoneCall, roles: ['admin', 'staff'] },
    { name: 'Admissions', to: '/admissions', icon: UserCheck, roles: ['admin', 'staff'] },
    { name: 'Students', to: '/students', icon: GraduationCap, roles: ['admin', 'staff'] },
    { name: 'Courses', to: '/courses', icon: BookOpen, roles: ['admin', 'staff'] },
    { name: 'Batches', to: '/batches', icon: CalendarDays, roles: ['admin', 'staff'] },
    { name: 'Trainers', to: '/trainers', icon: UserCog, roles: ['admin', 'staff'] },
    { name: 'Weekly Progress', to: '/progress', icon: TrendingUp, roles: ['admin', 'staff'] },
    { name: 'Attendance', to: '/attendance', icon: ClipboardCheck, roles: ['admin', 'staff'] },
    { name: 'Assignments', to: '/assignments', icon: FileCheck2, roles: ['admin', 'staff'] },
    { name: 'Examinations', to: '/examinations', icon: Award, roles: ['admin', 'staff'] },
    { name: 'Fees & Receipts', to: '/fees', icon: CreditCard, roles: ['admin', 'staff'] },
    { name: 'Certificates', to: '/certificates', icon: ScrollText, roles: ['admin', 'staff'] },
    { name: 'Placements', to: '/placements', icon: Briefcase, roles: ['admin', 'staff'] },
    { name: 'Reports', to: '/reports', icon: BarChart3, roles: ['admin', 'staff'] },
    { name: 'Notifications', to: '/notifications', icon: Bell, roles: ['admin', 'staff'] },
    { name: 'Meta Integration', to: '/meta-integration', icon: Share2, roles: ['admin'] },
    { name: 'Users & Roles', to: '/users', icon: ShieldCheck, roles: ['admin'] },
    { name: 'Settings', to: '/settings', icon: Sliders, roles: ['admin'] },
  ];

  const allowedNav = navigation.filter((item) => item.roles.includes(user?.role || 'staff'));

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar sidebar element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-[#0f172a]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              W
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-wide leading-none">WHITEHOUSE</h1>
              <span className="text-[10px] text-sky-400 font-medium tracking-wider uppercase">Institute CRM</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Scope Pill */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 font-semibold text-xs">
              {user?.name?.slice(0, 2).toUpperCase() || 'WH'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {user?.staffIdentifier || user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#0f172a]/40 text-center">
          <p className="text-[11px] font-medium text-slate-400">Madurai Campus, Ponmeni</p>
          <p className="text-[10px] text-slate-500 mt-0.5">v1.0 Production Ready</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
