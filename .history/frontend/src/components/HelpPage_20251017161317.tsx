import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";
import { io, Socket } from "socket.io-client";
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  isUser: boolean;
  timestamp: string;
}

export function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const partnerTypingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef<boolean>(false);
  const lastPlayRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const isWindowFocusedRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const hasLoadedRef = useRef<boolean>(false);

  const playNoti = async () => {
    try {
      // Try to play regardless; browsers will simply reject if not unlocked yet
      const now = Date.now();
      if (now - (lastPlayRef.current || 0) < 300) return; // throttle
      lastPlayRef.current = now;
      // Try element path first for reliability
      try {
        const a = audioRef.current;
        if (a) { a.currentTime = 0; a.volume = 1; await a.play().catch(() => {}); }
      } catch {}
      // WebAudio path (works when element state stalls)
      if (audioCtxRef.current && audioBufferRef.current) {
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const src = ctx.createBufferSource();
        src.buffer = audioBufferRef.current;
        src.connect(ctx.destination);
        src.start(0);
        return;
      }
      // Fallback: create a new Audio element each time
      const url = new URL('../assets/sound/noti.mp3', import.meta.url).toString();
      const el = new Audio(url);
      el.volume = 1;
      el.play().catch(() => {});
    } catch {}
  };

  const quickReplies = [
    "📦 Track my order",
    "💳 Payment issue",
    "🔄 Return request",
    "📞 Talk to agent"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

// Init: reuse saved threadId if available; otherwise open a thread. Then load messages and connect socket
useEffect(() => {
  // Prevent double initialization in React Strict Mode
  if (hasLoadedRef.current) return;
  hasLoadedRef.current = true;

  const initChat = async () => {
    try {
      // 1) Try to reuse saved thread id
      let threadId: string | null = null;
      try { threadId = localStorage.getItem('client:threadId'); } catch {}
      
      if (threadId) {
        try {
          const list = await api.chatListMessages(threadId);
          threadIdRef.current = threadId;
          const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 
            id: m._id, 
            text: m.text || '', 
            imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 
            isUser: m.senderType === 'user', 
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }));
          setMessages(arr);
          console.log('[client] Loaded', arr.length, 'messages from saved threadId:', threadId);
        } catch (err) {
          console.error('[client] Failed to load saved thread:', err);
          // saved id invalid -> clear it
          try { localStorage.removeItem('client:threadId'); } catch {}
          threadId = null;
        }
      }

      // 2) If no saved id, open/create a thread on server (which reuses latest by server logic)
      if (!threadId) {
        const open = await api.chatOpenThread();
        threadId = open?.data?.threadId || null;
        if (!threadId) {
          console.error('[client] Failed to open/create thread');
          return;
        }
        threadIdRef.current = threadId;
        const list = await api.chatListMessages(threadId);
        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 
          id: m._id, 
          text: m.text || '', 
          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 
          isUser: m.senderType === 'user', 
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }));
        setMessages(arr);
        try { localStorage.setItem('client:threadId', String(threadId)); } catch {}
        console.log('[client] Created new thread:', threadId, 'with', arr.length, 'messages');
      }

      // 3) Connect socket and join thread
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.error('[client] No auth token found');
        return;
      }
      
      const s = io(API_BASE, { auth: { token } });
      socketRef.current = s;
      
      // Handle reconnection when socket reconnects
      s.on('connect', () => {
        console.log('[socket] connected, joining thread:', threadIdRef.current);
        if (threadIdRef.current) {
          s.emit('chat:joinThread', threadIdRef.current);
          // Mark this thread as active for notification suppression
          try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}
        }
      });

      // Handle disconnect
      s.on('disconnect', (reason) => {
        console.log('[socket] disconnected:', reason);
      });

      // Join thread immediately on first connection
      s.emit('chat:joinThread', threadIdRef.current);
      try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}
      
      s.on('chat:message', (msg: any) => {
        if (msg.threadId !== threadIdRef.current) return;
        
        // Play sound on messages from admin only when:
        // 1. Message is from admin (not user)
        // 2. Sound is enabled
        // 3. User is not actively in this conversation (tab not focused/visible)
        try {
          const isFocused = (isWindowFocusedRef.current !== false && !document.hidden);

          if (msg.senderType !== 'user' && soundEnabledRef.current) {
            console.log('[client sound debug]', {
              senderType: msg.senderType,
              soundEnabled: soundEnabledRef.current,
              isFocused,
              windowFocused: isWindowFocusedRef.current,
              documentHidden: document.hidden
            });
            // Only play sound if tab is not focused/visible (user is not actively in conversation)
            if (!isFocused) {
              console.log('[client] Playing notification sound - not actively in conversation');
              playNoti();
            } else {
              console.log('[client] Not playing sound - actively in conversation');
            }
          }
        } catch {}
        
        try { console.log('[client chat:message]', msg); } catch {}
        const img = msg.imageUrl ? (String(msg.imageUrl).startsWith('/') ? `${API_BASE}${msg.imageUrl}` : msg.imageUrl) : undefined;
        setMessages(prev => [...prev, { 
          id: msg._id, 
          text: msg.text || '', 
          imageUrl: img, 
          isUser: msg.senderType === 'user', 
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      });
      
      s.on('chat:typing', (evt: any) => {
        if (evt?.threadId !== threadIdRef.current) return;
        // Only show when admin is typing (not user)
        if (evt?.senderType === 'admin') {
          partnerTypingRef.current = !!evt.typing;
          setIsTyping(!!evt.typing);
        }
      });
    } catch (err) {
      console.error('[client] Chat initialization error:', err);
    }
  };

  // Handle visibility change - reload messages when tab becomes visible
  const handleVisibilityChange = async () => {
    if (!document.hidden && threadIdRef.current) {
      console.log('[client] Tab became visible, reloading messages');
      isWindowFocusedRef.current = true;
      try {
        const list = await api.chatListMessages(threadIdRef.current);
        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 
          id: m._id, 
          text: m.text || '', 
          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 
          isUser: m.senderType === 'user', 
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }));
        setMessages(arr);
        console.log('[client] Reloaded', arr.length, 'messages after tab became visible');
        
        // Rejoin thread to ensure we're still subscribed
        if (socketRef.current?.connected) {
          socketRef.current.emit('chat:joinThread', threadIdRef.current);
          try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}
        }
      } catch (err) {
        console.error('[client] Failed to reload messages on visibility change:', err);
      }
    } else if (document.hidden) {
      isWindowFocusedRef.current = false;
      // Clear active marker when tab is hidden
      try { localStorage.removeItem('client:activeThreadId'); } catch {}
    }
  };

  // Track focus/visibility
  const onFocus = () => { 
    isWindowFocusedRef.current = true;
    handleVisibilityChange();
  };
  const onBlur = () => { 
    isWindowFocusedRef.current = false; 
  };

  window.addEventListener('focus', onFocus);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  initChat();

  return () => {
    hasLoadedRef.current = false;
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // DON'T remove the threadId from localStorage - keep it for next time
    // Only clear the active marker and disconnect socket
    try { localStorage.removeItem('client:activeThreadId'); } catch {}
    socketRef.current?.disconnect();
  };
}, []);

  const enableSound = async () => {
    try {
      // WebAudio init & decode buffer once
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const ctx: AudioContext = new Ctx();
          audioCtxRef.current = ctx;
          const url = new URL('../assets/sound/noti.mp3', import.meta.url).toString();
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          audioBufferRef.current = await ctx.decodeAudioData(arr);
          await ctx.resume().catch(() => {});
        }
      } catch {}
      // Unlock by playing once (using whichever path available)
      // await playNoti();
      setSoundEnabled(true);
      try { localStorage.setItem('client:soundEnabled', '1'); } catch {}
    } catch {}
  };

  // Restore preference on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem('client:soundEnabled');
      if (v === '1') setSoundEnabled(true);
    } catch {}
  }, []);

  // Keep ref in sync to avoid stale closures in socket handlers
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // Auto-unlock audio on first user interaction if previously enabled
  // useEffect(() => {
  //   // Track focus/visibility
  //   const onFocus = () => { isWindowFocusedRef.current = true; };
  //   const onBlur = () => { isWindowFocusedRef.current = false; };
  //   const onVis = () => { isWindowFocusedRef.current = !document.hidden; };
  //   window.addEventListener('focus', onFocus);
  //   window.addEventListener('blur', onBlur);
  //   document.addEventListener('visibilitychange', onVis);

  //   const onFirstInteract = async () => {
  //     try {
  //       const prefEnabled = (() => { try { return localStorage.getItem('client:soundEnabled') === '1'; } catch { return false; } })();
  //       if (!prefEnabled && !soundEnabled) return;
  //       // Ensure flag is true so playNoti will run
  //       if (!soundEnabled) setSoundEnabled(true);
  //       // Initialize WebAudio buffer if not ready yet
  //       try {
  //         if (!audioCtxRef.current) {
  //           const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  //           if (Ctx) {
  //             const ctx: AudioContext = new Ctx();
  //             audioCtxRef.current = ctx;
  //             const url = new URL('../assets/sound/noti.mp3', import.meta.url).toString();
  //             const res = await fetch(url);
  //             const arr = await res.arrayBuffer();
  //             audioBufferRef.current = await ctx.decodeAudioData(arr);
  //             await ctx.resume().catch(() => {});
  //           }
  //         } else if (audioCtxRef.current?.state === 'suspended') {
  //           await audioCtxRef.current.resume().catch(() => {});
  //         }
  //       } catch {}
  //       // Try a ping to unlock element path too
  //       // await playNoti();
  //     } catch {}
  //   };
  //   // Attach once listeners
  //   const opts: any = { once: true };
  //   window.addEventListener('pointerdown', onFirstInteract, opts);
  //   window.addEventListener('keydown', onFirstInteract, opts);
  //   window.addEventListener('touchstart', onFirstInteract, opts);
  //   return () => {
  //     window.removeEventListener('focus', onFocus);
  //     window.removeEventListener('blur', onBlur);
  //     document.removeEventListener('visibilitychange', onVis);
  //     window.removeEventListener('pointerdown', onFirstInteract as any);
  //     window.removeEventListener('keydown', onFirstInteract as any);
  //     window.removeEventListener('touchstart', onFirstInteract as any);
  //   };
  // }, [soundEnabled]);

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputMessage;
    if (!messageText.trim()) return;
    setInputMessage('');
    setShowQuickReplies(false);
    // emit via socket + REST fallback (UI will update from socket 'chat:message')
    const threadId = threadIdRef.current!;
    // Only socket emit to avoid duplicates (server will broadcast back)
    socketRef.current?.emit('chat:send', { threadId, text: messageText });
  };

  // Emit typing events while user is composing
  const handleInputChange = (val: string) => {
    setInputMessage(val);
    const threadId = threadIdRef.current;
    if (!threadId) return;
    try {
      socketRef.current?.emit('chat:typing', { threadId, typing: true });
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        socketRef.current?.emit('chat:typing', { threadId, typing: false });
      }, 1200);
    } catch {}
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const threadId = threadIdRef.current!;
      await api.chatSendImage(threadId, file);
      // message will appear via socket 'chat:message'
    } catch (err: any) {
      alert(err?.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="pb-20 h-screen flex flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50">
      <audio ref={audioRef} src={new URL('../assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>

          <div className="relative">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">A</span>
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-gray-900">Ashford Support</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Online • Reply in ~1 min</span>
            </div>
          </div>
          <button onClick={enableSound} className="ml-auto px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">Enable/Test sound</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4 max-w-2xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {/* Bot Avatar */}
                {!message.isUser && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-1"
                  >
                    <span className="text-white text-xs">A</span>
                  </motion.div>
                )}

                <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`${
                      message.imageUrl
                        ? 'rounded-xl p-0 shadow-lg bg-transparent'
                        : `rounded-3xl px-5 py-3 shadow-lg ${
                            message.isUser
                              ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-br-md'
                              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                          }`
                    }`}
                  >
                    {message.imageUrl ? (
                      <a href={message.imageUrl} target="_blank" rel="noreferrer" download>
                        <img src={message.imageUrl} alt="image" className="max-w-[320px] rounded-xl" />
                      </a>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    )}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-xs mt-1 px-2 ${
                      message.isUser ? 'text-gray-600' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </motion.p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-end gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs">A</span>
                </div>
                <div className="bg-white rounded-3xl rounded-bl-md px-5 py-4 shadow-lg border border-gray-100">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15
                        }}
                        className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      <AnimatePresence>
        {showQuickReplies && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-2"
          >
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickReplies.map((reply, index) => (
                <motion.button
                  key={reply}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickReply(reply)}
                  className="bg-white border-2 border-purple-200 hover:border-purple-400 text-gray-700 px-4 py-2 rounded-full text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
                >
                  {reply}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handlePickImage}
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </motion.button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="w-full bg-gray-100 hover:bg-gray-150 focus:bg-white rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all border border-transparent focus:border-purple-300"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
