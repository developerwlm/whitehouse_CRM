import React, { useState } from 'react';
import { Menu, Bell, LogOut, CheckCheck, ExternalLink, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';

export const TopNavbar = ({ setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Institute Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-blue-900 tracking-wide uppercase">Whitehouse Skill Development Institute</span>
          <span className="text-xs text-slate-400 block -mt-0.5 font-medium">Integrated CRM & Academic Operations</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Public Certificate Verification Quick Link */}
        <Link
          to="/verify-certificate/WH-CERT-2026-0042"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
          title="Open Public QR Certificate Verification Page"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Certificate</span>
        </Link>

        {/* Public Enquiry Form Link */}
        <Link
          to="http://whitehouse.org.in/"
          target="_blank"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          title="Open Public Website Lead Enquiry Demo"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Website Form Demo</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-800 text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block max-w-[120px] truncate">
              {user?.name}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {user?.staffIdentifier || user?.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
