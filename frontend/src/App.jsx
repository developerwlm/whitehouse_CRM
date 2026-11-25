import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import MainLayout from './components/MainLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { CounsellingPage } from './pages/CounsellingPage';
import { AdmissionsPage } from './pages/AdmissionsPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { CoursesPage } from './pages/CoursesPage';
import { BatchesPage } from './pages/BatchesPage';
import { TrainersPage } from './pages/TrainersPage';
import { WeeklyProgressPage } from './pages/WeeklyProgressPage';
import { AttendancePage } from './pages/AttendancePage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { ExaminationsPage } from './pages/ExaminationsPage';
import { FeesPage } from './pages/FeesPage';
import CertificatesPage from './pages/CertificatesPage';
import PlacementsPage from './pages/PlacementsPage';
import ReportsPage from './pages/ReportsPage';
import MetaIntegrationPage from './pages/MetaIntegrationPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Authenticating Whitehouse CRM Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify-certificate/:certificateId?" element={<VerifyCertificatePage />} />

              {/* Protected App Routes inside MainLayout (Admin & 2 Staff) */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/counselling" element={<CounsellingPage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/students/:id" element={<StudentProfilePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/trainers" element={<TrainersPage />} />
                <Route path="/progress" element={<WeeklyProgressPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/examinations" element={<ExaminationsPage />} />
                <Route path="/fees" element={<FeesPage />} />
                <Route path="/certificates" element={<CertificatesPage />} />
                <Route path="/placements" element={<PlacementsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route
                  path="/meta-integration"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <MetaIntegrationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
