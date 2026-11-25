import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Lock, Mail, ArrowRight, Shield, User, GraduationCap, Laptop, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@whitehouse.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await api.get('/auth/setup-status');
        if (res.data.success && res.data.needsSetup) {
          setNeedsSetup(true);
        }
      } catch (e) {}
    };
    checkSetup();
  }, []);

  const handleLoginWithCredentials = async (loginEmail, loginPass) => {
    setLoading(true);
    try {
      const cleanEmail = (loginEmail || '').trim();
      const cleanPass = (loginPass || '').trim();

      if (needsSetup) {
        // Automatically setup initial admin
        const res = await api.post('/auth/setup-admin', {
          name: 'Director Admin',
          email: cleanEmail,
          password: cleanPass,
        });
        if (res.data.success) {
          success('Administrator created successfully!');
          await login(cleanEmail, cleanPass);
          navigate('/dashboard');
          return;
        }
      }

      await login(cleanEmail, cleanPass);
      success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLoginWithCredentials(email, password);
  };

  const setDemoUserAndLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    await handleLoginWithCredentials(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/25 border border-white/20">
            W
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          WHITEHOUSE CRM
        </h2>
        <p className="mt-1 text-center text-xs text-sky-400 font-medium">
          Whitehouse Skill Development Institute, Madurai
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          {needsSetup && (
            <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-200">Database Empty — Setup Mode</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  No accounts exist in your database. Enter credentials below or click 1-Click Setup to initialize Director Admin.
                </p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="name@whitehouse.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-lg shadow-blue-600/30 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{needsSetup ? 'Initialize Administrator & Sign In' : 'Sign into CRM'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Admin Access */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
              {needsSetup ? 'Quick Administrator Setup' : 'Administrator Access'}
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => setDemoUserAndLogin('admin@whitehouse.com', 'admin123')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 active:scale-95 text-slate-200 border border-slate-700 transition-all text-left disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Director Admin</p>
                  <p className="text-[10px] text-slate-400">admin@whitehouse.com ({needsSetup ? 'Default Admin' : 'Full Control'})</p>
                </div>
              </div>
              <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/20 group-hover:bg-purple-500/20">
                {needsSetup ? '1-Click Setup' : '1-Click Sign In'}
              </span>
            </button>
            <p className="mt-2.5 text-center text-[10px] text-slate-500">
              Staff members & Courses can be added directly inside CRM by the Admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
