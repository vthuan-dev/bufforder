import React, { useEffect, useRef, useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { BottomNav } from './components/BottomNav';
import { Toaster } from './components/ui/sonner';
import { io, Socket } from 'socket.io-client';

// Lazy load components for better performance
const HomePage = lazy(() => import('./components/HomePage').then(module => ({ default: module.HomePage })));
const OrdersPage = lazy(() => import('./components/OrdersPage').then(module => ({ default: module.OrdersPage })));
const RecordPage = lazy(() => import('./components/RecordPage').then(module => ({ default: module.RecordPage })));
const HelpPage = lazy(() => import('./components/HelpPage').then(module => ({ default: module.HelpPage })));
const MyPage = lazy(() => import('./components/MyPage').then(module => ({ default: module.MyPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./components/RegisterPage').then(module => ({ default: module.RegisterPage })));
const AdminApp = lazy(() => import('./components/admin/AdminApp').then(module => ({ default: module.AdminApp })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const bannerImage = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80';
  const clientSocketRef = useRef<Socket | null>(null);
  const clientAudioRef = useRef<HTMLAudioElement | null>(null);
  const focusRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);

  // All hooks must be called before any conditional returns
  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleRegister = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Memoized content renderer for better performance
  const renderContent = useCallback(() => {
    const content = (() => {
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
    })();

    return (
      <Suspense fallback={<PageLoader />}>
        {content}
      </Suspense>
    );
  }, [activeTab, bannerImage]);

  // Memoized admin mode
  const adminModeContent = useMemo(() => (
    <Suspense fallback={<PageLoader />}>
      <AdminApp />
    </Suspense>
  ), []);

  // Memoized auth screens
  const authContent = useMemo(() => {
    if (authView === 'login') {
      return (
        <Suspense fallback={<PageLoader />}>
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToAdmin={() => setIsAdminMode(true)}
          />
        </Suspense>
      );
    } else {
      return (
        <Suspense fallback={<PageLoader />}>
          <RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        </Suspense>
      );
    }
  }, [authView, handleLogin, handleRegister]);

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
      // Suppress sound only when: user is on Help tab, tab focused, and
      // currently viewing the same thread as the event threadId
      const isHelpActive = activeTab === 'help';
      const isFocused = focusRef.current && !document.hidden;
      let isSameActiveThread = false;
      try {
        const activeThreadId = localStorage.getItem('client:activeThreadId');
        if (activeThreadId && evt?.threadId) {
          isSameActiveThread = String(activeThreadId) === String(evt.threadId);
        }
      } catch {}
      // Play unless user is actively viewing the same thread in Help and focused
      const shouldPlay = !(isHelpActive && isFocused && isSameActiveThread);
      if (shouldPlay) play();
    });
    return () => {
      s.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [isAdminMode, isAuthenticated, activeTab]);

  // Admin Mode
  if (isAdminMode) {
    return (
      <>
        {adminModeContent}
        <Toaster position="top-right" />
      </>
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    return authContent;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        <audio ref={clientAudioRef} src={new URL('./assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />
        {renderContent()}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
