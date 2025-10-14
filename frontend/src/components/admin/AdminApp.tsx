import React, { useEffect, useState } from "react";
import { AdminLoginPage } from "./AdminLoginPage";
import { AdminLayout } from "./AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminUsersPage } from "./AdminUsersPage";
import { AdminDepositsPage } from "./AdminDepositsPage";
import { AdminWithdrawalsPage } from "./AdminWithdrawalsPage";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { AdminChatPage } from "./AdminChatPage";
import { AdminSettingsPage } from "./AdminSettingsPage";

export function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };

  if (!isLoggedIn) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <AdminUsersPage />;
      case "deposits":
        return <AdminDepositsPage />;
      case "withdrawals":
        return <AdminWithdrawalsPage />;
      case "orders":
        return <AdminOrdersPage />;
      case "chat":
        return <AdminChatPage />;
      case "settings":
        return <AdminSettingsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AdminLayout>
  );
}
