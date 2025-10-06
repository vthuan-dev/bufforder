import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../admin/layout/AdminLayout';
import { DashboardPage } from '../admin/pages/DashboardPage';
import { UserManagementPage } from '../admin/pages/users/UserManagementPage';
import { ChatPage } from '../admin/pages/chat/ChatPage';
import { AdminLoginPage } from './AdminLoginPage';
import { DepositsPage } from '../admin/pages/deposits/DepositsPage';
import { AuthProvider, useAuth } from '../contexts/AdminAuthContext';

function AdminAppContent() {
  const { isAuthenticated, isLoading, adminData, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <AdminLayout onLogout={logout} adminData={adminData}>
      <Routes>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/deposits" element={<DepositsPage />} />
        <Route path="/admin/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export function AdminApp() {
  return (
    <AuthProvider>
      <AdminAppContent />
    </AuthProvider>
  );
}


