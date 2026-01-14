import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AdminLoginPage } from "./AdminLoginPage";
import { AdminLayout } from "./AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsersPage } from "./AdminUsersPage";
import { AdminProductsPage } from "./AdminProductsPage";
import { AdminDepositsPage } from "./AdminDepositsPage";
import { AdminWithdrawalsPage } from "./AdminWithdrawalsPage";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { AdminChatPage } from "./AdminChatPage";
import { AdminSettingsPage } from "./AdminSettingsPage";

// Inner component that uses router hooks
function AdminRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsLoggedIn(false);
    navigate('/admin/login');
  };

  const handleNavigate = (page: string) => {
    navigate(`/admin/${page}`);
  };

  // Get current page from URL
  const getCurrentPage = () => {
    const path = location.pathname.replace('/admin/', '').replace('/admin', '');
    return path || 'dashboard';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <AdminLayout
      currentPage={getCurrentPage()}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <Routes>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/users" element={<AdminUsersPage />} />
        <Route path="/products" element={<AdminProductsPage />} />
        <Route path="/deposits" element={<AdminDepositsPage />} />
        <Route path="/withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="/orders" element={<AdminOrdersPage />} />
        <Route path="/chat" element={<AdminChatPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export function AdminApp() {
  return (
    <BrowserRouter basename="">
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
