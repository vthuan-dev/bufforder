import { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { HomePage } from './components/HomePage';
import { OrdersPage } from './components/OrdersPage';
import { RecordPage } from './components/RecordPage';
import { HelpPage } from './components/HelpPage';
import { MyPage } from './components/MyPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AdminApp } from './components/admin/AdminApp';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const bannerImage = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80';

  // Admin mode: auto-enable when visiting /admin
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      setIsAdminMode(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage bannerImage={bannerImage} />;
      case 'orders':
        return <OrdersPage />;
      case 'record':
        return <RecordPage />;
      case 'help':
        return <HelpPage />;
      case 'my':
        return <MyPage />;
      default:
        return <HomePage bannerImage={bannerImage} />;
    }
  };

  // Admin Mode
  if (isAdminMode) {
    return (
      <>
        <AdminApp />
        <Toaster position="top-right" />
      </>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authView === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToAdmin={() => setIsAdminMode(true)}
        />
      );
    } else {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Admin Mode Toggle - Hidden button for demo */}
        <button
          onClick={() => setIsAdminMode(true)}
          className="fixed bottom-24 right-4 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 text-xs opacity-20 hover:opacity-100 transition-opacity z-50"
          title="Switch to Admin Mode"
        >
          Admin
        </button>
      </div>
    </div>
  );
}
