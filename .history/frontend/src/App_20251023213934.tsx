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

// Optimized loading component - minimal, fast render
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
      <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
    </div>
  </div>
);

export default function App() {
  // Debug: Unique identifier to ensure new code is running
  console.log('🚀 App.tsx loaded - Version 2.0 - Sound fix applied');
  
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

  // Preload critical components on hover/focus for instant navigation
  const preloadComponent = useCallback((tab: string) => {
    if (tab === 'help') {
      import('./components/HelpPage').then(module => module.HelpPage);
    } else if (tab === 'my') {
      import('./components/MyPage').then(module => module.MyPage);
    } else if (tab === 'orders') {
      import('./components/OrdersPage').then(module => module.OrdersPage);
    }
  }, []);

  // Memoized tab change handler with instant transition
  const handleTabChange = useCallback((tab: string) => {
    console.log('[App] Tab change requested:', tab, '→ from:', activeTab);
    // Instant tab switch without waiting for component load
    setActiveTab(tab);
    try { localStorage.setItem('client:activeBottomTab', tab); } catch {}
    if (tab === 'help') {
      try { localStorage.setItem('client:helpUnread', '0'); window.dispatchEvent(new CustomEvent('client:chatUnreadUpdated', { detail: 0 })); } catch {}
    }
  }, [activeTab]);

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

  // Global audio play listener to debug
  useEffect(() => {
    console.log('🔧 Setting up global audio play listener');
    
    const handleAudioPlay = (event: any) => {
      console.log('🔊 AUDIO PLAY DETECTED:', {
        target: event.target,
        src: event.target?.src,
        currentTime: event.target?.currentTime,
        volume: event.target?.volume,
        stack: new Error().stack
      });
      
      // Check if this is our expected audio element
      const isOurAudio = event.target === clientAudioRef.current;
      console.log('🔊 Is this our audio element?', isOurAudio);
      
      if (!isOurAudio) {
        console.log('⚠️ UNEXPECTED AUDIO PLAY - NOT OUR AUDIO ELEMENT!');
        console.log('🔊 Unexpected audio src:', event.target?.src);
        console.log('🔊 Our audio src:', clientAudioRef.current?.src);
        
        // Try to stop the unexpected audio
        try {
          event.target.pause();
          console.log('🛑 Attempted to pause unexpected audio');
        } catch (err) {
          console.log('❌ Failed to pause unexpected audio:', err);
        }
      }
    };

    // Listen for all audio play events
    document.addEventListener('play', handleAudioPlay, true);
    
    return () => {
      document.removeEventListener('play', handleAudioPlay, true);
    };
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
      console.log('[App] 🎵 play() function called - Version 2.0');
      try {
        const pref = localStorage.getItem('client:soundEnabled') === '1';
        if (!pref) {
          console.log('[App] Sound disabled by preference');
          return;
        }
      } catch {}
      const a = clientAudioRef.current;
      if (a) { 
        console.log('[App] 🎵 PLAYING SOUND via clientAudioRef - THIS IS THE ONLY PLACE THAT SHOULD PLAY SOUND - Version 2.0');
        a.currentTime = 0; 
        a.volume = 1; 
        a.play().catch((err) => {
          console.error('[App] Audio play failed:', err);
        }); 
      } else {
        console.log('[App] No audio element found');
      }
    };
    s.on('chat:threadUpdated', (evt: any) => {
      // Suppress sound only when: user is on Help tab, tab focused, and
      // currently viewing the same thread as the event threadId
      const isHelpActive = activeTab === 'help';
      const isFocused = !(focusRef.current && !document.hidden);
      let isSameActiveThread = false;
      try {
        const activeThreadId = localStorage.getItem('client:activeThreadId');
        if (activeThreadId && evt?.threadId) {
          isSameActiveThread = String(activeThreadId) === String(evt.threadId);
        }
      } catch {}
      // Play when shouldPlay is false (user not actively viewing same thread in Help and focused)
      const shouldPlay = (!isHelpActive && (!isFocused && isSameActiveThread));
      console.log('shouldPlay', shouldPlay);
      if (shouldPlay == true) {
        console.log('🎵 Playing sound - shouldPlay is false');
        play();
      } else {
        console.log('🔇 Not playing sound - shouldPlay is true');
        // Debug: check if there are other audio elements
        const allAudio = document.querySelectorAll('audio');
        console.log('[App] Found audio elements:', allAudio.length);
        allAudio.forEach((audio, index) => {
          console.log(`[App] Audio ${index}:`, {
            src: audio.src,
            currentTime: audio.currentTime,
            paused: audio.paused,
            volume: audio.volume
          });
        });
        
        // Check if any audio is currently playing
        const playingAudio = Array.from(allAudio).filter(audio => !audio.paused);
        if (playingAudio.length > 0) {
          console.log('⚠️ WARNING: Found playing audio elements:', playingAudio.length);
          playingAudio.forEach((audio, index) => {
            console.log(`[App] Playing Audio ${index}:`, {
              src: audio.src,
              currentTime: audio.currentTime,
              volume: audio.volume
            });
          });
        }
        
        // Force pause all audio elements when shouldPlay is true
        allAudio.forEach((audio, index) => {
          if (!audio.paused) {
            console.log(`🛑 Force pausing audio ${index} because shouldPlay is true`);
            audio.pause();
          }
        });
        
        // Additional check: if we still hear sound, there might be another source
        setTimeout(() => {
          const stillPlaying = Array.from(document.querySelectorAll('audio')).filter(audio => !audio.paused);
          if (stillPlaying.length > 0) {
            console.log('🚨 CRITICAL: Audio still playing after force pause!', stillPlaying.length);
            stillPlaying.forEach((audio, index) => {
              console.log(`[App] Still playing Audio ${index}:`, {
                src: audio.src,
                currentTime: audio.currentTime,
                volume: audio.volume
              });
              // Force stop
              audio.pause();
              audio.currentTime = 0;
            });
          }
        }, 100);
      }
    });

    // Handle chat messages and forward to HelpPage
    s.on('chat:message', (msg: any) => {
      console.log('[App] Received chat:message:', msg);
      // Forward to HelpPage via custom event
      try {
        window.dispatchEvent(new CustomEvent('client:chatMessage', { detail: msg }));
      } catch {}
      
      // Debug: check if this message should trigger sound
      const isHelpActive = activeTab === 'help';
      const isFocused = focusRef.current && !document.hidden;
      let isSameActiveThread = false;
      try {
        const activeThreadId = localStorage.getItem('client:activeThreadId');
        if (activeThreadId && msg?.threadId) {
          isSameActiveThread = String(activeThreadId) === String(msg.threadId);
        }
      } catch {}
      const shouldPlayForMessage = (!isHelpActive || !isFocused && isSameActiveThread);
      console.log('[App] chat:message shouldPlay:', shouldPlayForMessage, {
        isHelpActive,
        isFocused,
        isSameActiveThread,
        msgThreadId: msg.threadId,
        activeThreadId: localStorage.getItem('client:activeThreadId')
      });
      
      // Force pause all audio elements when shouldPlay is true for chat:message
      if (!shouldPlayForMessage) {
        const allAudio = document.querySelectorAll('audio');
        allAudio.forEach((audio, index) => {
          if (!audio.paused) {
            console.log(`🛑 Force pausing audio ${index} because chat:message shouldPlay is true`);
            audio.pause();
          }
        });
        
        // Additional check: if we still hear sound, there might be another source
        setTimeout(() => {
          const stillPlaying = Array.from(document.querySelectorAll('audio')).filter(audio => !audio.paused);
          if (stillPlaying.length > 0) {
            console.log('🚨 CRITICAL: Audio still playing after chat:message force pause!', stillPlaying.length);
            stillPlaying.forEach((audio, index) => {
              console.log(`[App] Still playing Audio ${index}:`, {
                src: audio.src,
                currentTime: audio.currentTime,
                volume: audio.volume
              });
              // Force stop
              audio.pause();
              audio.currentTime = 0;
            });
          }
        }, 100);
      }
    });

    // Handle typing events and forward to HelpPage
    s.on('chat:typing', (evt: any) => {
      console.log('[App] Received chat:typing:', evt);
      // Forward to HelpPage via custom event
      try {
        window.dispatchEvent(new CustomEvent('client:chatTyping', { detail: evt }));
      } catch {}
    });

    // Listen for events from HelpPage and emit to server
    const handleEmitMessage = (event: any) => {
      const { threadId, text } = event.detail;
      console.log('[App] Emitting chat:send:', { threadId, text });
      s.emit('chat:send', { threadId, text });
    };

    const handleEmitTyping = (event: any) => {
      const { threadId, typing } = event.detail;
      console.log('[App] Emitting chat:typing:', { threadId, typing });
      s.emit('chat:typing', { threadId, typing });
    };

    window.addEventListener('client:emitMessage', handleEmitMessage);
    window.addEventListener('client:emitTyping', handleEmitTyping);
    return () => {
      s.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('client:emitMessage', handleEmitMessage);
      window.removeEventListener('client:emitTyping', handleEmitTyping);
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
