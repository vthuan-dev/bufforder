import React, { useEffect, useRef, useState } from 'react';
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
import { io, Socket } from 'socket.io-client';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const bannerImage = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80';
  const clientSocketRef = useRef<Socket | null>(null);
  const clientAudioRef = useRef<HTMLAudioElement | null>(null);
  const focusRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);

  // Admin mode: auto-enable when visiting /admin
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      setIsAdminMode(true);
    }
  }, []);

  // Global client chat notifications (works when not on Help tab)
  useEffect(() => {
    if (isAdminMode || !isAuthenticated) return;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
    const s = io(API_BASE, { auth: { token } });
    clientSocketRef.current = s;
    const onVis = () => { focusRef.current = !document.hidden; };
    const onFocus = () => { focusRef.current = true; };
    const onBlur = () => { focusRef.current = false; };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    const play = () => {
      try {
        const pref = localStorage.getItem('client:soundEnabled') === '1';
        if (!pref) return;
      } catch {}
      const a = clientAudioRef.current;
      if (a) { a.currentTime = 0; a.volume = 1; a.play().catch(() => {}); }
    };
    s.on('chat:threadUpdated', (evt: any) => {
      // If user is not on Help tab or tab hidden, play
      const isHelpActive = activeTab === 'help';
      const isFocused = focusRef.current && !document.hidden;
      if (!isHelpActive || !isFocused) play();
    });
    return () => {
      s.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [isAdminMode, isAuthenticated, activeTab]);

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
        <audio ref={clientAudioRef} src={new URL('./assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        
      </div>
    </div>
  );
}
