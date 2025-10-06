import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { OrdersPage } from './components/OrdersPage';
import { RecordPage } from './components/RecordPage';
import { MyPage } from './components/MyPage';
import { HelpPage } from './components/HelpPage';
import { BottomNavigation } from './components/BottomNavigation';
import { AdminApp } from './components/AdminApp';

function AppContent() {
  const { user, isAuthenticated, isLoading, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Check if we're on admin route
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // Show admin app if on admin route
  if (isAdminRoute) {
    return <AdminApp />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show authentication pages if not logged in and not on home page
  if (!isAuthenticated && activeTab !== 'home') {
    if (authMode === 'login') {
      return (
        <LoginPage
          onLogin={async (phoneNumber, password) => {
            try {
              await login(phoneNumber, password);
            } catch (error) {
              // Error handling is done in LoginPage component
            }
          }}
          onSwitchToRegister={() => setAuthMode('register')}
          onBack={() => {
            // Go back to HomePage
            setActiveTab('home');
          }}
        />
      );
    } else {
      return (
        <RegisterPage
          onRegister={async (userData) => {
            try {
              await register(userData);
            } catch (error) {
              // Error handling is done in RegisterPage component
            }
          }}
          onSwitchToLogin={() => setAuthMode('login')}
          onBack={() => {
            // Go back to HomePage
            setActiveTab('home');
          }}
        />
      );
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigateToMy={() => setActiveTab('my')} />;
      case 'orders':
        if (!isAuthenticated) {
          setAuthMode('login');
          return null; // Will be handled by the auth check above
        }
        return <OrdersPage />;
      case 'record':
        if (!isAuthenticated) {
          setAuthMode('login');
          return null; // Will be handled by the auth check above
        }
        return <RecordPage />;
      case 'help':
        return <HelpPage />;
      case 'my':
        if (!isAuthenticated) {
          setAuthMode('login');
          return null; // Will be handled by the auth check above
        }
        return <MyPage />;
      default:
        return <HomePage onNavigateToMy={() => setActiveTab('my')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-sm bg-white min-h-screen shadow-lg relative">
        <Header />
        <main className="pb-16">
          {renderContent()}
        </main>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </AuthProvider>
  );
}