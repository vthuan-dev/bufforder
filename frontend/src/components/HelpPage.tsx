import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import api from "../services/api";
const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  isUser: boolean;
  timestamp: string;
}

export function HelpPage() {
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const partnerTypingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef<boolean>(false);
  const isWindowFocusedRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // ⚡ NO SOCKET HERE - Use events from App.tsx global socket

  // 🎯 GPS Location Request Function
  const requestGPSLocation = async (threadId: string) => {
    try {
      // Check if already sent location in this session
      const locationSent = sessionStorage.getItem(`gps-sent-${threadId}`);
      if (locationSent) {
        console.log('[GPS] Location already sent for this session');
        return;
      }

      if (!navigator.geolocation) {
        console.log('[GPS] Geolocation not supported');
        setLocationDenied(true);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('[GPS] Got coordinates:', latitude, longitude);

          // Reverse geocoding using Nominatim (OpenStreetMap)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'User-Agent': 'AshfordApp/1.0' } }
            );
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            
            console.log('[GPS] Reverse geocoded address:', address);

            // Send to backend
            await api.chatUpdateLocation(threadId, latitude, longitude, address);
            sessionStorage.setItem(`gps-sent-${threadId}`, '1');
            setShowLocationModal(false);
            console.log('[GPS] Location sent to server successfully');
          } catch (err) {
            console.error('[GPS] Reverse geocoding failed:', err);
            // Send coordinates only if geocoding fails
            await api.chatUpdateLocation(threadId, latitude, longitude, `${latitude}, ${longitude}`);
            sessionStorage.setItem(`gps-sent-${threadId}`, '1');
            setShowLocationModal(false);
          }
        },
        (error) => {
          console.log('[GPS] User denied or error:', error.message);
          setLocationDenied(true);
          setShowLocationModal(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      );
    } catch (err) {
      console.error('[GPS] Request failed:', err);
      setLocationDenied(true);
    }
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

  // 🎯 GREETING MESSAGE - Always show at the top (frontend only, not saved to DB)
  const GREETING_MESSAGE: Message = {
    id: 'greeting-permanent',
    text: 'Hello! 👋 Welcome to Ashford Support. How can we help you today?',
    isUser: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Init: reuse saved threadId if available; otherwise open a thread. Then load messages
  // ⚡ NO SOCKET CONNECTION HERE - Use global socket from App.tsx
  useEffect(() => {
    // Only debounce truly rapid re-initialization (React Strict Mode - ~50-100ms)
    const now = Date.now();
    const lastInit = (window as any).__helpPageLastInit || 0;
    if (now - lastInit < 100) {
      console.log('[HelpPage] Skipping rapid re-init (Strict Mode)');
      return;
    }
    (window as any).__helpPageLastInit = now;

    const initChat = async () => {
      console.log('[HelpPage] initChat called, loading messages from server...');

      try {
        // 1) Try to reuse saved thread id
        let threadId: string | null = null;
        try { threadId = localStorage.getItem('client:threadId'); } catch { }

        if (threadId) {
          try {
            // Small delay to ensure DB has committed recent writes (race condition fix)
            await new Promise(resolve => setTimeout(resolve, 200));
            const list = await api.chatListMessages(threadId);
            threadIdRef.current = threadId;
            const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({
              id: m._id || m.id,
              text: m.text || '',
              imageUrl: m.imageUrl ? (String(m.imageUrl).startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,
              isUser: m.senderType === 'user',
              timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            // Merge API messages with existing messages (keep socket messages that aren't in API yet)
            setMessages(prev => {
              const apiIds = new Set(arr.map(m => m.id));
              // Keep existing messages that are temp/failed or not in API response
              const socketOnlyMessages = prev.filter(m =>
                (String(m.id).startsWith('temp-') || String(m.id).startsWith('failed-')) ||
                !apiIds.has(m.id)
              );
              // Merge: API messages first, then any socket-only messages
              const merged = [...arr];
              socketOnlyMessages.forEach(m => {
                if (!merged.some(existing => existing.text === m.text && existing.isUser === m.isUser)) {
                  merged.push(m);
                }
              });
              console.log('[client] Merged', arr.length, 'API +', socketOnlyMessages.length, 'socket messages');
              return merged;
            });
            console.log('[client] Loaded messages from saved threadId:', threadId);
            // Mark as active thread
            try { localStorage.setItem('client:activeThreadId', String(threadId)); } catch { }
            // Join thread room via App.tsx global socket
            try { window.dispatchEvent(new CustomEvent('client:joinThread', { detail: { threadId } })); } catch { }
          } catch (err) {
            console.error('[client] Failed to load saved thread:', err);
            // saved id invalid -> clear it
            try { localStorage.removeItem('client:threadId'); } catch { }
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
          
          // 🎯 Show location permission modal
          const locationSent = sessionStorage.getItem(`gps-sent-${threadId}`);
          if (!locationSent) {
            setShowLocationModal(true);
          }
          
          const list = await api.chatListMessages(threadId);
          const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({
            id: m._id || m.id,
            text: m.text || '',
            imageUrl: m.imageUrl ? (String(m.imageUrl).startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,
            isUser: m.senderType === 'user',
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          
          // ❌ REMOVED: Don't add greeting to messages array anymore - it's now permanent in UI
          
          // For new thread, just set messages (no merge needed)
          setMessages(arr);
          try {
            localStorage.setItem('client:threadId', String(threadId));
            localStorage.setItem('client:activeThreadId', String(threadId));
          } catch { }
          // Join thread room via App.tsx global socket
          try { window.dispatchEvent(new CustomEvent('client:joinThread', { detail: { threadId } })); } catch { }
          console.log('[client] Created new thread:', threadId, 'with', arr.length, 'messages');
        } else {
          // 🎯 Show location modal for existing thread if not sent yet
          const locationSent = sessionStorage.getItem(`gps-sent-${threadId}`);
          if (!locationSent) {
            setShowLocationModal(true);
          }
        }
      } catch (err) {
        console.error('[client] Chat initialization error:', err);
      }
    };

    // ⚡ Listen for messages from App.tsx global socket
    const handleChatMessage = (event: any) => {
      const msg = event.detail;
      if (String(msg.threadId) !== String(threadIdRef.current)) return;

      const img = msg.imageUrl ? (String(msg.imageUrl).startsWith('/') ? `${API_BASE}${msg.imageUrl}` : msg.imageUrl) : undefined;
      const newMessage = {
        id: msg._id || `temp-${Date.now()}`,
        text: msg.text || '',
        imageUrl: img,
        isUser: msg.senderType === 'user',
        timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => {
        // Check for duplicates - by ID or by temp/failed ID with same text
        const exists = prev.some(m => {
          if (m.id === newMessage.id) return true;
          // Match temp-* or failed-* messages by text content
          if ((String(m.id).startsWith('temp-') || String(m.id).startsWith('failed-')) &&
            m.text === newMessage.text && m.isUser === newMessage.isUser) return true;
          return false;
        });

        if (exists) {
          // Replace temp/failed message with real one from server
          return prev.map(m => {
            if ((String(m.id).startsWith('temp-') || String(m.id).startsWith('failed-')) &&
              m.text === newMessage.text && m.isUser === newMessage.isUser) {
              return newMessage;
            }
            return m;
          });
        }

        return [...prev, newMessage];
      });
    };

    // ⚡ Listen for typing from App.tsx global socket
    const handleChatTyping = (event: any) => {
      const evt = event.detail;
      if (String(evt?.threadId) !== String(threadIdRef.current)) return;
      if (evt?.senderType === 'admin') {
        partnerTypingRef.current = !!evt.typing;
        setIsTyping(!!evt.typing);
      }
    };

    window.addEventListener('client:chatMessage', handleChatMessage);
    window.addEventListener('client:chatTyping', handleChatTyping);

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
            imageUrl: m.imageUrl ? (String(m.imageUrl).startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,
            isUser: m.senderType === 'user',
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(arr);
          console.log('[client] Reloaded', arr.length, 'messages after tab became visible');

          // Mark thread as active
          try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch { }
        } catch (err) {
          console.error('[client] Failed to reload messages on visibility change:', err);
        }
      } else if (document.hidden) {
        isWindowFocusedRef.current = false;
        // Clear active marker when tab is hidden
        try { localStorage.removeItem('client:activeThreadId'); } catch { }
      }
    };

    // Track focus/visibility - DON'T reload on focus, only on visibility change
    const onFocus = () => {
      isWindowFocusedRef.current = true;
      // ❌ REMOVED: handleVisibilityChange() - this was causing messages to disappear on input click
    };
    const onBlur = () => {
      isWindowFocusedRef.current = false;
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    initChat();

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('client:chatMessage', handleChatMessage);
      window.removeEventListener('client:chatTyping', handleChatTyping);

      // Clear unread when leaving Help page
      try { localStorage.setItem('client:helpUnread', '0'); window.dispatchEvent(new CustomEvent('client:chatUnreadUpdated', { detail: 0 })); } catch { }
    };
  }, [location.key]); // Re-run when navigating to this page (location.key changes)

  const enableSound = async () => {
    try {
      setSoundEnabled(true);
      try { localStorage.setItem('client:soundEnabled', '1'); } catch { }
      console.log('[client] Sound enabled - handled by App.tsx');
    } catch { }
  };

  // Restore preference on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem('client:soundEnabled');
      if (v === '1') setSoundEnabled(true);
    } catch { }
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

  const isSendingRef = useRef(false);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputMessage;
    if (!messageText.trim() || isSendingRef.current) return;

    const threadId = threadIdRef.current;
    if (!threadId) return;

    console.log('[HelpPage] 🚀 handleSendMessage triggered:', { threadId, text: messageText });
    isSendingRef.current = true;

    setInputMessage('');
    setShowQuickReplies(false);

    // Optimistic UI - show immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: messageText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, optimisticMessage]);

    // 🔴 API IS NOW THE PRIMARY WAY TO SAVE
    try {
      console.log('[HelpPage] � Calling API chatSendMessage...');
      const result = await api.chatSendMessage(threadId, messageText);
      console.log('[HelpPage] ✅ API Response:', result?.data?.message?._id);

      // Update optimistic message with real ID from server
      if (result?.data?.message?._id) {
        setMessages(prev => prev.map(m =>
          m.id === tempId
            ? { ...m, id: result.data.message._id }
            : m
        ));
      }
    } catch (err) {
      console.error('[HelpPage] ❌ API Error:', err);
      // Mark message as failed
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: `failed-${tempId}` }
          : m
      ));
    } finally {
      isSendingRef.current = false;
    }
  };

  // ⚡ Emit typing via App.tsx global socket
  const handleInputChange = (val: string) => {
    setInputMessage(val);
    const threadId = threadIdRef.current;
    if (!threadId) return;

    // Emit via global socket
    try {
      window.dispatchEvent(new CustomEvent('client:emitTyping', { detail: { threadId, typing: true } }));
    } catch { }

    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('client:emitTyping', { detail: { threadId, typing: false } }));
      } catch { }
    }, 1200);
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
      // message will appear via global socket 'chat:message'
    } catch (err: any) {
      alert(err?.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  // Emoji picker handlers
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setInputMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div className="flex flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-20">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">A</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-gray-900">Ashford Support</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Online • Reply in ~1 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="space-y-4 max-w-md mx-auto">
          {/* 🎯 GREETING MESSAGE - Always show first */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-start items-end gap-2"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-1"
            >
              <span className="text-white text-xs">A</span>
            </motion.div>

            <div className="flex flex-col items-start max-w-[75%]">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-3xl px-5 py-3 shadow-lg bg-white text-gray-800 rounded-bl-md border border-gray-100"
              >
                <p className="text-sm leading-relaxed">{GREETING_MESSAGE.text}</p>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs mt-1 px-2 text-gray-500"
              >
                {GREETING_MESSAGE.timestamp}
              </motion.p>
            </div>
          </motion.div>

          {/* Regular messages from API/socket */}
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={`${message.id}-${index}`}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
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
                    className={`${message.imageUrl
                      ? 'rounded-xl p-0 shadow-lg bg-transparent'
                      : `rounded-3xl px-5 py-3 shadow-lg ${message.isUser
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
                    className={`text-xs mt-1 px-2 ${message.isUser ? 'text-gray-600' : 'text-gray-500'}`}
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
                        key={`typing-dot-${i}`}
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
            className="flex-shrink-0 w-full max-w-md mx-auto px-4 pb-2"
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
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handlePickImage}
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </motion.button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="w-full bg-gray-100 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
            />
          </div>

          {/* Emoji Picker Button & Popup */}
          <div className="relative" ref={emojiPickerRef}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Smile className="w-5 h-5" />
            </motion.button>

            {/* Emoji Picker Popup */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="fixed left-1/2 z-[9999] shadow-2xl rounded-2xl overflow-hidden"
                  style={{ bottom: 'calc(56px + 60px + 10px)', transform: 'translateX(-50%)' }}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    emojiStyle={EmojiStyle.NATIVE}
                    lazyLoadEmojis={false}
                    width={320}
                    height={350}
                    searchPlaceHolder="Search emoji..."
                    previewConfig={{ showPreview: false }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white p-2.5 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Location Permission Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Share Your Location
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  To provide you with better support, we need to know your location. This helps our team assist you faster with delivery, local promotions, and personalized service.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>
                      Your location is only used for support purposes and will be kept secure. You can deny this request, but it may affect our ability to help you quickly.
                    </span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowLocationModal(false);
                      setLocationDenied(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    Not Now
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (threadIdRef.current) {
                        requestGPSLocation(threadIdRef.current);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg"
                  >
                    Allow Location
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
