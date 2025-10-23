import React, { useState, useRef, useEffect, useCallback } from "react";import React, { useState, useRef, useEffect, useCallback } from "react";

import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";import { Send, Smile, Paperclip, ArrowLeft } from "lucide-react";

import { motion, AnimatePresence } from "motion/react";import { motion, AnimatePresence } from "motion/react";

import api from "../services/api";import api from "../services/api";

import { io, Socket } from "socket.io-client";import { io, Socket } from "socket.io-client";

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';



interface Message {interface Message {

  id: string;  id: string;

  text: string;  text: string;

  imageUrl?: string;  imageUrl?: string;

  isUser: boolean;  isUser: boolean;

  timestamp: string;  timestamp: string;

}}



export function HelpPage() {export function HelpPage() {

  const [messages, setMessages] = useState<Message[]>([]);  const [messages, setMessages] = useState<Message[]>([]);

  const [inputMessage, setInputMessage] = useState('');  const [inputMessage, setInputMessage] = useState('');

  const [isTyping, setIsTyping] = useState(false);  const [isTyping, setIsTyping] = useState(false);

  const partnerTypingRef = useRef<boolean>(false);  const partnerTypingRef = useRef<boolean>(false);

  const typingTimerRef = useRef<number | null>(null);  const typingTimerRef = useRef<number | null>(null);

  const [showQuickReplies, setShowQuickReplies] = useState(true);  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadIdRef = useRef<string | null>(null);  const threadIdRef = useRef<string | null>(null);

  const socketRef = useRef<Socket | null>(null);  const socketRef = useRef<Socket | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  const soundEnabledRef = useRef<boolean>(false);  const soundEnabledRef = useRef<boolean>(false);

  const isWindowFocusedRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);  const isWindowFocusedRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);

  const hasLoadedRef = useRef<boolean>(false);  const hasLoadedRef = useRef<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);  const audioRef = useRef<HTMLAudioElement | null>(null);



  // Direct sound handler - LIKE ADMIN  // Direct socket message handler - INSTANT like admin

  const playNotificationSound = useCallback(async () => {  const playNotificationSound = useCallback(async () => {

    if (!soundEnabledRef.current) return;    if (!soundEnabledRef.current) return;

    try {    try {

      const a = audioRef.current;      const a = audioRef.current;

      if (a) {      if (a) {

        a.currentTime = 0;        a.currentTime = 0;

        a.volume = 1;        a.volume = 1;

        await a.play();        await a.play();

      }      }

    } catch (err) {    } catch (err) {

      console.error('[client] Sound play error:', err);      console.error('[client] Sound play error:', err);

    }    }

  }, []);  }, []);



  const quickReplies = [  const quickReplies = [

    "📦 Track my order",    "📦 Track my order",

    "💳 Payment issue",    "💳 Payment issue",

    "🔄 Return request",    "🔄 Return request",

    "📞 Talk to agent"    "📞 Talk to agent"

  ];  ];



  const scrollToBottom = () => {  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  };  };



  useEffect(() => {  useEffect(() => {

    scrollToBottom();    scrollToBottom();

  }, [messages, isTyping]);  }, [messages, isTyping]);



  // Connect socket DIRECTLY - LIKE ADMIN for instant updates// Init: reuse saved threadId if available; otherwise open a thread. Then load messages and connect socket

  const connectSocket = useCallback(() => {useEffect(() => {

    try {  // Prevent double initialization in React Strict Mode

      const token = localStorage.getItem('token');  if (hasLoadedRef.current) return;

      if (!token) return;  hasLoadedRef.current = true;

      

      console.log('[client] 🚀 Connecting socket DIRECTLY to server...');  const initChat = async () => {

      const s = io(API_BASE, { auth: { token } });    try {

      socketRef.current = s;      // 1) Try to reuse saved thread id

            let threadId: string | null = null;

      s.on('connect', () => {      try { threadId = localStorage.getItem('client:threadId'); } catch {}

        console.log('[client] ✅ Socket connected DIRECTLY!');      

        if (threadIdRef.current) {      if (threadId) {

          s.emit('chat:joinThread', threadIdRef.current);        try {

          console.log('[client] Joined thread:', threadIdRef.current);          const list = await api.chatListMessages(threadId);

        }          threadIdRef.current = threadId;

      });          const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 

                  id: m._id, 

      // DIRECT MESSAGE HANDLER - INSTANT LIKE ADMIN!            text: m.text || '', 

      s.on('chat:message', (msg: any) => {            imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 

        console.log('[client] 📨 DIRECT socket message received:', msg);            isUser: m.senderType === 'user', 

                    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 

        if (String(msg.threadId) !== String(threadIdRef.current)) return;          }));

                  setMessages(arr);

        // Play sound for admin messages          console.log('[client] Loaded', arr.length, 'messages from saved threadId:', threadId);

        if (msg.senderType === 'admin') {        } catch (err) {

          playNotificationSound();          console.error('[client] Failed to load saved thread:', err);

        }          // saved id invalid -> clear it

                  try { localStorage.removeItem('client:threadId'); } catch {}

        const img = msg.imageUrl ? (String(msg.imageUrl).startsWith('/') ? `${API_BASE}${msg.imageUrl}` : msg.imageUrl) : undefined;          threadId = null;

        const newMessage = {         }

          id: msg._id || `temp-${Date.now()}`,       }

          text: msg.text || '', 

          imageUrl: img,       // 2) If no saved id, open/create a thread on server (which reuses latest by server logic)

          isUser: msg.senderType === 'user',       if (!threadId) {

          timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })         const open = await api.chatOpenThread();

        };        threadId = open?.data?.threadId || null;

                if (!threadId) {

        // INSTANT state update - NO DELAY!          console.error('[client] Failed to open/create thread');

        setMessages(prev => {          return;

          const exists = prev.some(m => {        }

            if (m.id === newMessage.id) return true;        threadIdRef.current = threadId;

            if (m.id.startsWith('temp-') && m.text === newMessage.text && m.isUser === newMessage.isUser) return true;        const list = await api.chatListMessages(threadId);

            return false;        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 

          });          id: m._id, 

                    text: m.text || '', 

          if (exists) {          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 

            return prev.map(m => {          isUser: m.senderType === 'user', 

              if (m.id.startsWith('temp-') && m.text === newMessage.text && m.isUser === newMessage.isUser) {          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 

                return newMessage;        }));

              }        setMessages(arr);

              return m;        try { localStorage.setItem('client:threadId', String(threadId)); } catch {}

            });        console.log('[client] Created new thread:', threadId, 'with', arr.length, 'messages');

          }      }

          

          return [...prev, newMessage];      // 3) Socket is now handled globally in App.tsx to avoid duplicates

        });      // No need to create separate socket connection here

      });      console.log('[client] Using global socket from App.tsx');

            

      // TYPING HANDLER - DIRECT      // Mark this thread as active for notification suppression

      s.on('chat:typing', (evt: any) => {      try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}

        if (String(evt?.threadId) !== String(threadIdRef.current)) return;      

        if (evt?.senderType === 'admin') {      // Listen for messages from global socket via custom events

          partnerTypingRef.current = !!evt.typing;      window.addEventListener('client:chatMessage', handleGlobalMessage);

          setIsTyping(!!evt.typing);      window.addEventListener('client:chatTyping', handleGlobalTyping);

        }    } catch (err) {

      });      console.error('[client] Chat initialization error:', err);

          }

    } catch (err) {  };

      console.error('[client] Socket connection error:', err);

    }  // Handle visibility change - reload messages when tab becomes visible

  }, [playNotificationSound]);  const handleVisibilityChange = async () => {

    if (!document.hidden && threadIdRef.current) {

// Init chat and connect socket      console.log('[client] Tab became visible, reloading messages');

useEffect(() => {      isWindowFocusedRef.current = true;

  if (hasLoadedRef.current) return;      try {

  hasLoadedRef.current = true;        const list = await api.chatListMessages(threadIdRef.current);

        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 

  const initChat = async () => {          id: m._id, 

    try {          text: m.text || '', 

      // 1) Get or create thread          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, 

      let threadId: string | null = null;          isUser: m.senderType === 'user', 

      try { threadId = localStorage.getItem('client:threadId'); } catch {}          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 

              }));

      if (threadId) {        setMessages(arr);

        try {        console.log('[client] Reloaded', arr.length, 'messages after tab became visible');

          const list = await api.chatListMessages(threadId);        

          threadIdRef.current = threadId;        // Mark thread as active (socket handled globally in App.tsx)

          const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({         try { localStorage.setItem('client:activeThreadId', String(threadIdRef.current)); } catch {}

            id: m._id,       } catch (err) {

            text: m.text || '',         console.error('[client] Failed to reload messages on visibility change:', err);

            imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,       }

            isUser: m.senderType === 'user',     } else if (document.hidden) {

            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })       isWindowFocusedRef.current = false;

          }));      // Clear active marker when tab is hidden

          setMessages(arr);      try { localStorage.removeItem('client:activeThreadId'); } catch {}

          console.log('[client] Loaded', arr.length, 'messages');    }

        } catch (err) {  };

          console.error('[client] Failed to load saved thread:', err);

          try { localStorage.removeItem('client:threadId'); } catch {}  // Track focus/visibility

          threadId = null;  const onFocus = () => { 

        }    isWindowFocusedRef.current = true;

      }    handleVisibilityChange();

  };

      if (!threadId) {  const onBlur = () => { 

        const open = await api.chatOpenThread();    isWindowFocusedRef.current = false; 

        threadId = open?.data?.threadId || null;  };

        if (!threadId) {

          console.error('[client] Failed to open/create thread');  window.addEventListener('focus', onFocus);

          return;  window.addEventListener('blur', onBlur);

        }  document.addEventListener('visibilitychange', handleVisibilityChange);

        threadIdRef.current = threadId;

        const list = await api.chatListMessages(threadId);  initChat();

        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ 

          id: m._id,   return () => {

          text: m.text || '',     hasLoadedRef.current = false;

          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,     window.removeEventListener('focus', onFocus);

          isUser: m.senderType === 'user',     window.removeEventListener('blur', onBlur);

          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })     document.removeEventListener('visibilitychange', handleVisibilityChange);

        }));    

        setMessages(arr);    // Disconnect socket

        try { localStorage.setItem('client:threadId', threadId); } catch {}    socketRef.current?.disconnect();

        console.log('[client] Created new thread with', arr.length, 'messages');    

      }    // DON'T remove the threadId from localStorage - keep it for next time

          // Only clear the active marker

      // 2) Connect socket DIRECTLY - NO GLOBAL EVENTS!    try { localStorage.removeItem('client:activeThreadId'); } catch {}

      connectSocket();    // Clear unread when leaving Help page

    try { localStorage.setItem('client:helpUnread', '0'); window.dispatchEvent(new CustomEvent('client:chatUnreadUpdated', { detail: 0 })); } catch {}

    } catch (err) {  };

      console.error('[client] Init error:', err);}, [connectSocket]);

    }

  };  const enableSound = async () => {

    try {

  const handleVisibilityChange = async () => {      setSoundEnabled(true);

    if (!document.hidden && threadIdRef.current) {      try { localStorage.setItem('client:soundEnabled', '1'); } catch {}

      console.log('[client] Tab visible, reloading...');      console.log('[client] Sound enabled - handled by App.tsx');

      isWindowFocusedRef.current = true;    } catch {}

      try {  };

        const list = await api.chatListMessages(threadIdRef.current);

        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({   // Restore preference on mount

          id: m._id,   useEffect(() => {

          text: m.text || '',     try {

          imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,       const v = localStorage.getItem('client:soundEnabled');

          isUser: m.senderType === 'user',       if (v === '1') setSoundEnabled(true);

          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })     } catch {}

        }));  }, []);

        setMessages(arr);

      } catch (err) {  // Keep ref in sync to avoid stale closures in socket handlers

        console.error('[client] Reload error:', err);  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

      }

    } else if (document.hidden) {  // Auto-unlock audio on first user interaction if previously enabled

      isWindowFocusedRef.current = false;  // useEffect(() => {

    }  //   // Track focus/visibility

  };  //   const onFocus = () => { isWindowFocusedRef.current = true; };

  //   const onBlur = () => { isWindowFocusedRef.current = false; };

  const onFocus = () => {   //   const onVis = () => { isWindowFocusedRef.current = !document.hidden; };

    isWindowFocusedRef.current = true;  //   window.addEventListener('focus', onFocus);

    handleVisibilityChange();  //   window.addEventListener('blur', onBlur);

  };  //   document.addEventListener('visibilitychange', onVis);

  const onBlur = () => { 

    isWindowFocusedRef.current = false;   //   const onFirstInteract = async () => {

  };  //     try {

  //       const prefEnabled = (() => { try { return localStorage.getItem('client:soundEnabled') === '1'; } catch { return false; } })();

  window.addEventListener('focus', onFocus);  //       if (!prefEnabled && !soundEnabled) return;

  window.addEventListener('blur', onBlur);  //       // Ensure flag is true so playNoti will run

  document.addEventListener('visibilitychange', handleVisibilityChange);  //       if (!soundEnabled) setSoundEnabled(true);

  //       // Initialize WebAudio buffer if not ready yet

  initChat();  //       try {

  //         if (!audioCtxRef.current) {

  return () => {  //           const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;

    hasLoadedRef.current = false;  //           if (Ctx) {

    window.removeEventListener('focus', onFocus);  //             const ctx: AudioContext = new Ctx();

    window.removeEventListener('blur', onBlur);  //             audioCtxRef.current = ctx;

    document.removeEventListener('visibilitychange', handleVisibilityChange);  //             const url = new URL('../assets/sound/noti.mp3', import.meta.url).toString();

      //             const res = await fetch(url);

    // Disconnect socket  //             const arr = await res.arrayBuffer();

    socketRef.current?.disconnect();  //             audioBufferRef.current = await ctx.decodeAudioData(arr);

    console.log('[client] Socket disconnected');  //             await ctx.resume().catch(() => {});

      //           }

    // Clear unread  //         } else if (audioCtxRef.current?.state === 'suspended') {

    try { localStorage.setItem('client:helpUnread', '0'); window.dispatchEvent(new CustomEvent('client:chatUnreadUpdated', { detail: 0 })); } catch {}  //           await audioCtxRef.current.resume().catch(() => {});

  };  //         }

}, [connectSocket]);  //       } catch {}

  //       // Try a ping to unlock element path too

  const enableSound = async () => {  //       // await playNoti();

    try {  //     } catch {}

      setSoundEnabled(true);  //   };

      soundEnabledRef.current = true;  //   // Attach once listeners

      try { localStorage.setItem('client:soundEnabled', '1'); } catch {}  //   const opts: any = { once: true };

      await playNotificationSound();  //   window.addEventListener('pointerdown', onFirstInteract, opts);

    } catch {}  //   window.addEventListener('keydown', onFirstInteract, opts);

  };  //   window.addEventListener('touchstart', onFirstInteract, opts);

  //   return () => {

  // Restore sound preference  //     window.removeEventListener('focus', onFocus);

  useEffect(() => {  //     window.removeEventListener('blur', onBlur);

    try {  //     document.removeEventListener('visibilitychange', onVis);

      const v = localStorage.getItem('client:soundEnabled');  //     window.removeEventListener('pointerdown', onFirstInteract as any);

      if (v === '1') {  //     window.removeEventListener('keydown', onFirstInteract as any);

        setSoundEnabled(true);  //     window.removeEventListener('touchstart', onFirstInteract as any);

        soundEnabledRef.current = true;  //   };

      }  // }, [soundEnabled]);

    } catch {}

  }, []);  const handleSendMessage = useCallback((text?: string) => {

    const messageText = text || inputMessage;

  // SEND MESSAGE - DIRECT SOCKET EMIT    if (!messageText.trim()) return;

  const handleSendMessage = useCallback((text?: string) => {    

    const messageText = text || inputMessage;    const threadId = threadIdRef.current;

    if (!messageText.trim()) return;    if (!threadId) return;

        

    const threadId = threadIdRef.current;    // Clear input immediately

    if (!threadId) return;    setInputMessage('');

        setShowQuickReplies(false);

    setInputMessage('');    

    setShowQuickReplies(false);    // Optimistic UI update - show message immediately

        const tempId = `temp-${Date.now()}`;

    // Optimistic UI - show immediately    const optimisticMessage: Message = {

    const tempId = `temp-${Date.now()}`;      id: tempId,

    const optimisticMessage: Message = {      text: messageText,

      id: tempId,      isUser: true,

      text: messageText,      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      isUser: true,    };

      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })    

    };    // Add message to UI instantly

        setMessages(prev => [...prev, optimisticMessage]);

    setMessages(prev => [...prev, optimisticMessage]);    

        // Then emit to server

    // Emit DIRECTLY via socket - NO CUSTOM EVENTS!    try {

    socketRef.current?.emit('chat:send', { threadId, text: messageText });      window.dispatchEvent(new CustomEvent('client:emitMessage', { 

    console.log('[client] Message sent DIRECTLY via socket');        detail: { threadId, text: messageText } 

  }, [inputMessage]);      }));

    } catch (err) {

  // TYPING INDICATOR - DIRECT EMIT      console.error('[client] Failed to emit message:', err);

  const handleInputChange = (val: string) => {    }

    setInputMessage(val);  }, [inputMessage]);

    const threadId = threadIdRef.current;

    if (!threadId) return;  // Emit typing events while user is composing

      const handleInputChange = (val: string) => {

    socketRef.current?.emit('chat:typing', { threadId, typing: true });    setInputMessage(val);

        const threadId = threadIdRef.current;

    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);    if (!threadId) return;

    typingTimerRef.current = window.setTimeout(() => {    try {

      socketRef.current?.emit('chat:typing', { threadId, typing: false });      // Emit typing via global socket in App.tsx

    }, 1200);      window.dispatchEvent(new CustomEvent('client:emitTyping', { 

  };        detail: { threadId, typing: true } 

      }));

  const handleQuickReply = (reply: string) => {      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);

    handleSendMessage(reply);      typingTimerRef.current = window.setTimeout(() => {

  };        window.dispatchEvent(new CustomEvent('client:emitTyping', { 

          detail: { threadId, typing: false } 

  const handlePickImage = () => {        }));

    fileInputRef.current?.click();      }, 1200);

  };    } catch {}

  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];  const handleQuickReply = (reply: string) => {

    if (!file) return;    handleSendMessage(reply);

    try {  };

      const threadId = threadIdRef.current!;

      await api.chatSendImage(threadId, file);  const handlePickImage = () => {

      // Message will appear via socket 'chat:message'    fileInputRef.current?.click();

    } catch (err: any) {  };

      alert(err?.message || 'Upload failed');

    } finally {  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

      e.target.value = '';    const file = e.target.files?.[0];

    }    if (!file) return;

  };    try {

      const threadId = threadIdRef.current!;

  return (      await api.chatSendImage(threadId, file);

    <div className="pb-16 h-screen flex flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50">      // message will appear via global socket 'chat:message'

      {/* Hidden audio for notifications */}    } catch (err: any) {

      <audio ref={audioRef} src={new URL('../assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />      alert(err?.message || 'Upload failed');

          } finally {

      {/* Header */}      e.target.value = '';

      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">    }

        <div className="flex items-center gap-3">  };

          <motion.button

            whileTap={{ scale: 0.9 }}  return (

            className="p-2 hover:bg-gray-100 rounded-full transition-colors"    <div className="pb-16 h-screen flex flex-col bg-gradient-to-b from-purple-50 via-blue-50 to-pink-50">

          >      {/* Audio is handled globally in App.tsx */}

            <ArrowLeft className="w-5 h-5 text-gray-700" />      {/* Header */}

          </motion.button>      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="relative">          <motion.button

            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">            whileTap={{ scale: 0.9 }}

              <span className="text-blue-600">A</span>            className="p-2 hover:bg-gray-100 rounded-full transition-colors"

            </div>          >

            {/* Online indicator */}            <ArrowLeft className="w-5 h-5 text-gray-700" />

            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />          </motion.button>

          </div>

          <div className="relative">

          <div className="flex-1">            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">

            <h2 className="text-gray-900">Ashford Support</h2>              <span className="text-blue-600">A</span>

            <div className="flex items-center gap-1.5 text-xs text-gray-500">            </div>

              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />            {/* Online indicator */}

              <span>Online • Reply in ~1 min</span>            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />

            </div>          </div>

          </div>

          <button onClick={enableSound} className="ml-auto px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">          <div className="flex-1">

            {soundEnabled ? 'Test sound' : 'Enable & test sound'}            <h2 className="text-gray-900">Ashford Support</h2>

          </button>            <div className="flex items-center gap-1.5 text-xs text-gray-500">

        </div>              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />

      </div>              <span>Online • Reply in ~1 min</span>

            </div>

      {/* Chat Messages */}          </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">          <button onClick={enableSound} className="ml-auto px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">

        <div className="space-y-4 max-w-2xl mx-auto">            {soundEnabled ? 'Test sound' : 'Enable & test sound'}

          <AnimatePresence>          </button>

            {messages.map((message, index) => (        </div>

              <motion.div      </div>

                key={message.id}

                initial={{ opacity: 0, y: 20, scale: 0.9 }}      {/* Chat Messages */}

                animate={{ opacity: 1, y: 0, scale: 1 }}      <div className="flex-1 overflow-y-auto px-4 py-6">

                exit={{ opacity: 0, scale: 0.9 }}        <div className="space-y-4 max-w-2xl mx-auto">

                transition={{ type: "spring", stiffness: 200, damping: 20 }}          <AnimatePresence>

                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}            {messages.map((message, index) => (

              >              <motion.div

                {/* Bot Avatar */}                key={message.id}

                {!message.isUser && (                initial={{ opacity: 0, y: 20, scale: 0.9 }}

                  <motion.div                animate={{ opacity: 1, y: 0, scale: 1 }}

                    initial={{ scale: 0 }}                exit={{ opacity: 0, scale: 0.9 }}

                    animate={{ scale: 1 }}                transition={{ type: "spring", stiffness: 200, damping: 20 }}

                    transition={{ delay: 0.2 }}                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}

                    className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-1"              >

                  >                {/* Bot Avatar */}

                    <span className="text-white text-xs">A</span>                {!message.isUser && (

                  </motion.div>                  <motion.div

                )}                    initial={{ scale: 0 }}

                    animate={{ scale: 1 }}

                <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>                    transition={{ delay: 0.2 }}

                  <motion.div                    className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg mb-1"

                    whileHover={{ scale: 1.02 }}                  >

                    className={`${                    <span className="text-white text-xs">A</span>

                      message.imageUrl                  </motion.div>

                        ? 'rounded-xl p-0 shadow-lg bg-transparent'                )}

                        : `rounded-3xl px-5 py-3 shadow-lg ${

                            message.isUser                <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>

                              ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-br-md'                  <motion.div

                              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'                    whileHover={{ scale: 1.02 }}

                          }`                    className={`${

                    }`}                      message.imageUrl

                  >                        ? 'rounded-xl p-0 shadow-lg bg-transparent'

                    {message.imageUrl ? (                        : `rounded-3xl px-5 py-3 shadow-lg ${

                      <a href={message.imageUrl} target="_blank" rel="noreferrer" download>                            message.isUser

                        <img src={message.imageUrl} alt="image" className="max-w-[320px] rounded-xl" />                              ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white rounded-br-md'

                      </a>                              : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'

                    ) : (                          }`

                      <p className="text-sm leading-relaxed">{message.text}</p>                    }`}

                    )}                  >

                  </motion.div>                    {message.imageUrl ? (

                  <motion.p                      <a href={message.imageUrl} target="_blank" rel="noreferrer" download>

                    initial={{ opacity: 0 }}                        <img src={message.imageUrl} alt="image" className="max-w-[320px] rounded-xl" />

                    animate={{ opacity: 1 }}                      </a>

                    transition={{ delay: 0.3 }}                    ) : (

                    className={`text-xs mt-1 px-2 ${                      <p className="text-sm leading-relaxed">{message.text}</p>

                      message.isUser ? 'text-gray-600' : 'text-gray-500'                    )}

                    }`}                  </motion.div>

                  >                  <motion.p

                    {message.timestamp}                    initial={{ opacity: 0 }}

                  </motion.p>                    animate={{ opacity: 1 }}

                </div>                    transition={{ delay: 0.3 }}

              </motion.div>                    className={`text-xs mt-1 px-2 ${

            ))}                      message.isUser ? 'text-gray-600' : 'text-gray-500'

          </AnimatePresence>                    }`}

                  >

          {/* Typing Indicator */}                    {message.timestamp}

          <AnimatePresence>                  </motion.p>

            {isTyping && (                </div>

              <motion.div              </motion.div>

                initial={{ opacity: 0, y: 20 }}            ))}

                animate={{ opacity: 1, y: 0 }}          </AnimatePresence>

                exit={{ opacity: 0, y: -20 }}

                className="flex items-end gap-2"          {/* Typing Indicator */}

              >          <AnimatePresence>

                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">            {isTyping && (

                  <span className="text-white text-xs">A</span>              <motion.div

                </div>                initial={{ opacity: 0, y: 20 }}

                <div className="bg-white rounded-3xl rounded-bl-md px-5 py-4 shadow-lg border border-gray-100">                animate={{ opacity: 1, y: 0 }}

                  <div className="flex gap-1">                exit={{ opacity: 0, y: -20 }}

                    {[0, 1, 2].map((i) => (                className="flex items-end gap-2"

                      <motion.div              >

                        key={i}                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">

                        animate={{ y: [0, -8, 0] }}                  <span className="text-white text-xs">A</span>

                        transition={{                </div>

                          duration: 0.6,                <div className="bg-white rounded-3xl rounded-bl-md px-5 py-4 shadow-lg border border-gray-100">

                          repeat: Infinity,                  <div className="flex gap-1">

                          delay: i * 0.15                    {[0, 1, 2].map((i) => (

                        }}                      <motion.div

                        className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"                        key={i}

                      />                        animate={{ y: [0, -8, 0] }}

                    ))}                        transition={{

                  </div>                          duration: 0.6,

                </div>                          repeat: Infinity,

              </motion.div>                          delay: i * 0.15

            )}                        }}

          </AnimatePresence>                        className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"

                      />

          <div ref={messagesEndRef} />                    ))}

        </div>                  </div>

      </div>                </div>

              </motion.div>

      {/* Quick Replies */}            )}

      <AnimatePresence>          </AnimatePresence>

        {showQuickReplies && (

          <motion.div          <div ref={messagesEndRef} />

            initial={{ opacity: 0, y: 20 }}        </div>

            animate={{ opacity: 1, y: 0 }}      </div>

            exit={{ opacity: 0, y: 20 }}

            className="px-4 pb-2"      {/* Quick Replies */}

          >      <AnimatePresence>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">        {showQuickReplies && (

              {quickReplies.map((reply, index) => (          <motion.div

                <motion.button            initial={{ opacity: 0, y: 20 }}

                  key={reply}            animate={{ opacity: 1, y: 0 }}

                  initial={{ opacity: 0, x: -20 }}            exit={{ opacity: 0, y: 20 }}

                  animate={{ opacity: 1, x: 0 }}            className="px-4 pb-2"

                  transition={{ delay: index * 0.1 }}          >

                  whileHover={{ scale: 1.05 }}            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

                  whileTap={{ scale: 0.95 }}              {quickReplies.map((reply, index) => (

                  onClick={() => handleQuickReply(reply)}                <motion.button

                  className="bg-white border-2 border-purple-200 hover:border-purple-400 text-gray-700 px-4 py-2 rounded-full text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"                  key={reply}

                >                  initial={{ opacity: 0, x: -20 }}

                  {reply}                  animate={{ opacity: 1, x: 0 }}

                </motion.button>                  transition={{ delay: index * 0.1 }}

              ))}                  whileHover={{ scale: 1.05 }}

            </div>                  whileTap={{ scale: 0.95 }}

          </motion.div>                  onClick={() => handleQuickReply(reply)}

        )}                  className="bg-white border-2 border-purple-200 hover:border-purple-400 text-gray-700 px-4 py-2 rounded-full text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"

      </AnimatePresence>                >

                  {reply}

      {/* Input Area */}                </motion.button>

      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-4">              ))}

        <div className="flex items-center gap-2 max-w-2xl mx-auto">            </div>

          <motion.button          </motion.div>

            whileTap={{ scale: 0.9 }}        )}

            className="p-3 hover:bg-gray-100 rounded-full transition-colors"      </AnimatePresence>

            onClick={handlePickImage}

          >      {/* Input Area */}

            <Paperclip className="w-5 h-5 text-gray-600" />      <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-4">

          </motion.button>        <div className="flex items-center gap-2 max-w-2xl mx-auto">

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />          <motion.button

            whileTap={{ scale: 0.9 }}

          <div className="flex-1 relative">            className="p-3 hover:bg-gray-100 rounded-full transition-colors"

            <input            onClick={handlePickImage}

              type="text"          >

              value={inputMessage}            <Paperclip className="w-5 h-5 text-gray-600" />

              onChange={(e) => handleInputChange(e.target.value)}          </motion.button>

              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              placeholder="Type your message..."

              className="w-full bg-gray-100 hover:bg-gray-150 focus:bg-white rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all border border-transparent focus:border-purple-300"          <div className="flex-1 relative">

            />            <input

          </div>              type="text"

              value={inputMessage}

          <motion.button              onChange={(e) => handleInputChange(e.target.value)}

            whileTap={{ scale: 0.9 }}              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}

            className="p-3 hover:bg-gray-100 rounded-full transition-colors"              placeholder="Type your message..."

          >              className="w-full bg-gray-100 hover:bg-gray-150 focus:bg-white rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all border border-transparent focus:border-purple-300"

            <Smile className="w-5 h-5 text-gray-600" />            />

          </motion.button>          </div>



          <motion.button          <motion.button

            whileHover={{ scale: 1.05 }}            whileTap={{ scale: 0.9 }}

            whileTap={{ scale: 0.95 }}            className="p-3 hover:bg-gray-100 rounded-full transition-colors"

            onClick={() => handleSendMessage()}          >

            disabled={!inputMessage.trim()}            <Smile className="w-5 h-5 text-gray-600" />

            className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"          </motion.button>

          >

            <Send className="w-5 h-5" />          <motion.button

          </motion.button>            whileHover={{ scale: 1.05 }}

        </div>            whileTap={{ scale: 0.95 }}

      </div>            onClick={() => handleSendMessage()}

    </div>            disabled={!inputMessage.trim()}

  );            className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"

}          >

            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
