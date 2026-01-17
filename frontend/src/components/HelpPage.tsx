import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

  // ⚡ NO SOCKET HERE - Use events from App.tsx global socket

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
          const list = await api.chatListMessages(threadId);
          const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({
            id: m._id || m.id,
            text: m.text || '',
            imageUrl: m.imageUrl ? (String(m.imageUrl).startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,
            isUser: m.senderType === 'user',
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          // For new thread, just set messages (no merge needed)
          setMessages(arr);
          try {
            localStorage.setItem('client:threadId', String(threadId));
            localStorage.setItem('client:activeThreadId', String(threadId));
          } catch { }
          // Join thread room via App.tsx global socket
          try { window.dispatchEvent(new CustomEvent('client:joinThread', { detail: { threadId } })); } catch { }
          console.log('[client] Created new thread:', threadId, 'with', arr.length, 'messages');
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

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputMessage;
    if (!messageText.trim()) return;

    const threadId = threadIdRef.current;
    if (!threadId) return;

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

    // ⚡ Emit via App.tsx global socket using custom event
    try {
      window.dispatchEvent(new CustomEvent('client:emitMessage', { detail: { threadId, text: messageText } }));
    } catch { }

    // 🔴 API FALLBACK: Also save via HTTP API to ensure persistence
    try {
      const result = await api.chatSendMessage(threadId, messageText);
      console.log('[client] 📤 Message saved via API:', result?.data?.message?._id);

      // Update optimistic message with real ID from server
      if (result?.data?.message?._id) {
        setMessages(prev => prev.map(m =>
          m.id === tempId
            ? { ...m, id: result.data.message._id }
            : m
        ));
      }
    } catch (err) {
      console.error('[client] ❌ Failed to save message via API:', err);
      // Mark message as failed (optional: add error styling)
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: `failed-${tempId}` }
          : m
      ));
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

  return (
    <div className="pb-16 flex flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50" style={{ height: 'calc(100vh - 64px)' }}>
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
              type="text"
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="w-full bg-gray-100 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </motion.button>

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
    </div>
  );
}
