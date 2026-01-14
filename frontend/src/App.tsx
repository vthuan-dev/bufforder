import { useEffect, useRef, useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Optimized loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

const bannerImage = 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80';

// Client App with routing
function ClientApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const clientSocketRef = useRef<Socket | null>(null);
  const clientAudioRef = useRef<HTMLAudioElement | null>(null);
  const focusRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  
  // Get active tab from current path
  const activeTab = useMemo(() => {
    const path = location.pathname.replace('/', '') || 'home';
    return ['home', 'orders', 'record', 'help', 'my'].includes(path) ? path : 'home';
  }, [location.pathname]);
  
  const activeTabRef = useRef<string>(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Handle tab change - navigate to route
  const handleTabChange = useCallback((tab: string) => {
    console.log('[ClientApp] Navigating to:', tab);
    navigate(`/${tab}`);
    if (tab === 'help') {
      try { 
        localStorage.setItem('client:helpUnread', '0'); 
        window.dispatchEvent(new CustomEvent('client:chatUnreadUpdated', { detail: 0 })); 
      } catch { }
    }
  }, [navigate]);

  // Socket connection for chat notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    if (clientSocketRef.current?.connected) return;
    if (clientSocketRef.current) {
      clientSocketRef.current.disconnect();
      clientSocketRef.current = null;
    }
    
    const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
    const s = io(API_BASE, { 
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });
    clientSocketRef.current = s;
    
    const onVis = () => { focusRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', onVis);
    
    const play = () => {
      try {
        if (localStorage.getItem('client:soundEnabled') !== '1') return;
      } catch { }
      const a = clientAudioRef.current;
      if (a) {
        a.currentTime = 0;
        a.volume = 1;
        a.play().catch(() => {});
      }
    };

    s.on('chat:threadUpdated', (evt: any) => {
      const isHelpActive = activeTabRef.current === 'help';
      const isFocused = focusRef.current && !document.hidden;
      let isSameActiveThread = false;
      try {
        const activeThreadId = localStorage.getItem('client:activeThreadId');
        if (activeThreadId && evt?.threadId) {
          isSameActiveThread = String(activeThreadId) === String(evt.threadId);
        }
      } catch { }
      if (!isHelpActive || !isFocused || !isSameActiveThread) {
        play();
      }
    });

    s.on('chat:message', (msg: any) => {
      window.dispatchEvent(new CustomEvent('client:chatMessage', { detail: msg }));
    });

    s.on('chat:typing', (evt: any) => {
      window.dispatchEvent(new CustomEvent('client:chatTyping', { detail: evt }));
    });

    const handleEmitMessage = (event: any) => {
      const { threadId, text } = event.detail;
      s.emit('chat:send', { threadId, text });
    };
    const handleEmitTyping = (event: any) => {
      const { threadId, typing } = event.detail;
      s.emit('chat:typing', { threadId, typing });
    };
    const handleJoinThread = (event: any) => {
      const { threadId } = event.detail;
      if (threadId) s.emit('chat:joinThread', threadId);
    };

    window.addEventListener('client:emitMessage', handleEmitMessage);
    window.addEventListener('client:emitTyping', handleEmitTyping);
    window.addEventListener('client:joinThread', handleJoinThread);
    
    return () => {
      s.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('client:emitMessage', handleEmitMessage);
      window.removeEventListener('client:emitTyping', handleEmitTyping);
      window.removeEventListener('client:joinThread', handleJoinThread);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        <audio ref={clientAudioRef} src={new URL('./assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/home" element={<HomePage bannerImage={bannerImage} />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/my" element={<MyPage />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      <Toaster position="top-center" style={{ zIndex: 9999 }} />
    </div>
  );
}

// Auth wrapper component
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try { return !!localStorage.getItem('token'); } catch { return false; }
  });
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/home');
  }, [navigate]);

  const handleRegister = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/home');
  }, [navigate]);

  // Validate token on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/orders/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch { }
    };
    validateSession();
  }, []);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => setIsAuthenticated(false);
    window.addEventListener('client:logout', handleLogout);
    return () => window.removeEventListener('client:logout', handleLogout);
  }, []);

  // Check if on login/register route
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Suspense fallback={<PageLoader />}>
        {location.pathname === '/login' ? (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => navigate('/register')}
            onSwitchToAdmin={() => navigate('/admin')}
          />
        ) : (
          <RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => navigate('/login')}
          />
        )}
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        {authView === 'login' ? (
          <LoginPage
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToAdmin={() => navigate('/admin')}
          />
        ) : (
          <RegisterPage
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </Suspense>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary name="App">
        <Routes>
          {/* Admin routes */}
          <Route path="/admin/*" element={
            <Suspense fallback={<PageLoader />}>
              <AdminApp />
              <Toaster position="top-right" style={{ zIndex: 9999 }} />
            </Suspense>
          } />
          
          {/* Auth routes */}
          <Route path="/login" element={
            <AuthWrapper><Navigate to="/home" replace /></AuthWrapper>
          } />
          <Route path="/register" element={
            <AuthWrapper><Navigate to="/home" replace /></AuthWrapper>
          } />
          
          {/* Client routes - protected */}
          <Route path="/*" element={
            <AuthWrapper>
              <ClientApp />
            </AuthWrapper>
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
