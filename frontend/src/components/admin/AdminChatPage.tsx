import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Paperclip, MoreVertical, User, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import api from "../../services/api";
import { io, Socket } from "socket.io-client";

interface ChatThread {
  id: string;
  user: { name: string; email: string; avatar?: string };
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: "online" | "offline";
  userIp?: string;
  lastSeenAt?: string | null;
}

interface Message {
  id: number;
  sender: "user" | "admin";
  text: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

export function AdminChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedThreadIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const soundEnabledRef = useRef<boolean>(false);
  const prevUnreadRef = useRef<number>(0);

  // Restore sound preference
  useEffect(() => {
    try {
      const v = localStorage.getItem('admin:soundEnabled');
      setSoundEnabled(v === '1');
    } catch {}
  }, []);

  // Auto-unlock audio on first interaction if previously enabled
  useEffect(() => {
    const onFirstInteract = async () => {
      try {
        const prefEnabled = (() => { try { return localStorage.getItem('admin:soundEnabled') === '1'; } catch { return false; } })();
        if (!prefEnabled && !soundEnabled) return;
        if (!soundEnabled) setSoundEnabled(true);
        const a = audioRef.current;
        if (a) {
          try { a.currentTime = 0; a.volume = 1; await a.play(); } catch {}
        }
      } catch {}
    };
    const opts: any = { once: true };
    window.addEventListener('pointerdown', onFirstInteract, opts);
    window.addEventListener('keydown', onFirstInteract, opts);
    window.addEventListener('touchstart', onFirstInteract, opts);
    return () => {
      window.removeEventListener('pointerdown', onFirstInteract as any);
      window.removeEventListener('keydown', onFirstInteract as any);
      window.removeEventListener('touchstart', onFirstInteract as any);
    };
  }, [soundEnabled]);

  // Keep ref in sync to avoid stale closures
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  const enableSound = async () => {
    try {
      // Set the flag first so subsequent events can play even if play() rejects
      setSoundEnabled(true);
      try { localStorage.setItem('admin:soundEnabled', '1'); } catch {}
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = 0;
      a.volume = 1;
      await a.play().catch(() => {});
    } catch {}
  };

  const scrollToBottom = (smooth = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
    try {
      container.scrollTo({ top: container.scrollHeight, behavior });
    } catch {
      container.scrollTop = container.scrollHeight;
    }
  };

  const connectSocket = () => {
    try {
      const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) return;
      const s = io(`${API_BASE}`, { auth: { adminToken } });
      socketRef.current = s;
      s.on('connect', () => {});
      s.on('chat:message', (msg: any) => {
        const currentId = selectedThreadIdRef.current;
        // Play sound for any incoming user message
        try {
          if (msg.senderType !== 'admin' && soundEnabledRef.current) {
            const a = audioRef.current;
            if (a) { a.currentTime = 0; a.volume = 1; a.play().catch(() => {}); }
          }
        } catch {}
        if (!currentId || String(msg.threadId) !== String(currentId)) return;
        const img = msg.imageUrl ? (String(msg.imageUrl).startsWith('/') ? `${API_BASE}${msg.imageUrl}` : msg.imageUrl) : undefined;
        setMessages(prev => [...prev, { id: Date.now(), sender: msg.senderType === 'admin' ? 'admin' : 'user', text: msg.text || '', imageUrl: img, timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isRead: true }]);
      });
      s.on('chat:threadUpdated', () => {
        loadThreads();
      });
      // presence updates
      s.on('presence:update', (evt: any) => {
        // re-fetch threads to reflect online state; lightweight approach for now
        loadThreads();
      });
    } catch {}
  };

  const loadThreads = async () => {
    const res = await api.adminChatListThreads({ page: 1, limit: 50 });
    const list = (res?.data?.threads || []).map((t: any) => ({
      id: t._id,
      user: { name: t.userId?.fullName || t.userId?.phoneNumber || 'User', email: t.userId?.email || '' },
      lastMessage: t.lastMessageText || '',
      timestamp: t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      unread: Number(t.unreadForAdmin || 0),
      status: t.userOnline ? 'online' : 'offline',
      userIp: t.userIp || '',
      // carry last seen for UI (optional)
      lastSeenAt: t.userLastSeenAt || null
    }));
    setThreads(list);
    // Play sound if unread increased
    try {
      const newUnread = list.reduce((s: number, th: any) => s + Number(th.unread || 0), 0);
      if (soundEnabled && newUnread > (prevUnreadRef.current || 0)) {
        const a = audioRef.current; if (a) { a.currentTime = 0; a.play().catch(() => {}); }
      }
      prevUnreadRef.current = newUnread;
    } catch {}
    if (!selectedThread && list.length) setSelectedThread(list[0]);
  };

  const loadMessages = async (threadId: string) => {
    const res = await api.adminChatListMessages(threadId);
    const list: Message[] = (res?.data?.messages || []).map((m: any) => ({
      id: m._id,
      sender: m.senderType === 'admin' ? 'admin' : 'user',
      text: m.text || '',
      imageUrl: m.imageUrl ? (String(m.imageUrl).startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined,
      timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    }));
    setMessages(list);
    // scroll after messages render
    setTimeout(() => scrollToBottom(false), 0);
  };

  useEffect(() => {
    loadThreads();
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    loadMessages(selectedThread.id);
    socketRef.current?.emit('chat:joinThread', selectedThread.id);
    selectedThreadIdRef.current = selectedThread.id;
    // mark as read when opened
    api.adminChatMarkRead(selectedThread.id).catch(() => {});
  }, [selectedThread?.id]);

  // Auto scroll when new messages come
  useEffect(() => {
    scrollToBottom(true);
  }, [messages]);

  const filteredThreads = useMemo(() => threads.filter((thread) =>
    thread.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [threads, searchQuery]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const threadId = selectedThread?.id;
    if (!threadId) return;
    // send via socket for realtime (UI updates from socket event).
    // IMPORTANT: avoid REST call here to prevent duplicate messages
    socketRef.current?.emit('chat:send', { threadId, text: messageInput });
    setMessageInput("");
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const threadId = selectedThreadIdRef.current || selectedThread?.id;
      if (!threadId) return;
      // use admin upload endpoint so senderType=admin
      await api.adminChatSendImage(threadId, file as any);
      // message will appear through socket 'chat:message'
    } catch (err) {
      // optional: toast can be added
    } finally {
      e.target.value = '';
    }
  };

  const totalUnread = threads.reduce((sum, thread) => sum + (thread.unread || 0), 0);
  // Broadcast unread to layout
  useEffect(() => {
    try {
      const evt = new CustomEvent('chatUnreadUpdated', { detail: totalUnread });
      window.dispatchEvent(evt);
    } catch {}
  }, [totalUnread]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      {/* Hidden audio for notifications */}
      <audio ref={audioRef} src={new URL('../../assets/sound/noti.mp3', import.meta.url).toString()} preload="auto" />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Chat Support</h1>
          <p className="text-gray-600">Manage customer support conversations</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={enableSound} className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
            {soundEnabled ? 'Test sound' : 'Enable & test sound'}
          </button>
          <Badge variant="secondary" className="bg-red-100 text-red-700 px-4 py-2">
            {totalUnread} Unread
          </Badge>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex min-h-0 h-full overflow-hidden">
        {/* Threads List */}
        <div className="w-full md:w-80 border-r border-gray-100 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="p-2">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-3 rounded-lg text-left transition-colors mb-1 ${
                    selectedThread?.id === thread.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={thread.user.avatar} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {thread.user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {thread.status === "online" ? (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      ) : (
                        <div className="absolute bottom-0 right-0 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
                          {thread.lastSeenAt ? new Date(thread.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-gray-900 truncate">{thread.user.name}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {thread.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
                    </div>
                    {thread.unread > 0 && (
                      <Badge variant="secondary" className="bg-red-500 text-white text-xs ml-2">
                        {thread.unread}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedThread.user.avatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedThread.user.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedThread.status === "online" && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900">{selectedThread.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedThread.user.email}</p>
                  {selectedThread.userIp && (
                    <p className="text-xs text-gray-400">IP: {selectedThread.userIp}</p>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 h-full w-full p-4 overflow-y-auto overscroll-contain scroll-smooth bg-gray-50"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    {(() => {
                      const isImage = !!message.imageUrl;
                      const sideBase = message.sender === "admin" ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm";
                      const bubbleBase = message.sender === "admin" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900";
                      const bubbleClasses = isImage ? `${sideBase} p-0` : `${bubbleBase} ${sideBase} px-4 py-2`;
                      return (
                        <div className={`max-w-md ${bubbleClasses}`}>
                          {isImage ? (
                            <img src={message.imageUrl} alt="image" className="max-w-[320px] max-h-[380px] rounded-lg object-contain" />
                          ) : (
                            <p className="text-sm">{message.text}</p>
                          )}
                          {!isImage && (
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === "admin" ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white z-10 flex-shrink-0">
              <div className="flex items-end gap-3">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={handlePickImage} disabled={!selectedThread}>
                  <Paperclip className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
