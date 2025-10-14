import React, { useState, useRef, useEffect } from "react";
import { Send, Smile, Paperclip, MoreVertical, Phone, Video, ArrowLeft } from "lucide-react";
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
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Init: open thread, load messages, connect socket
  useEffect(() => {
    (async () => {
      try {
        const open = await api.chatOpenThread();
        const threadId = open?.data?.threadId;
        if (!threadId) return;
        threadIdRef.current = threadId;
        const list = await api.chatListMessages(threadId);
        const arr: Message[] = (list?.data?.messages || []).map((m: any) => ({ id: m._id, text: m.text || '', imageUrl: m.imageUrl ? (m.imageUrl.startsWith('/') ? `${API_BASE}${m.imageUrl}` : m.imageUrl) : undefined, isUser: m.senderType === 'user', timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
        setMessages(arr);

        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;
        const s = io(API_BASE, { auth: { token } });
        socketRef.current = s;
        s.emit('chat:joinThread', threadId);
        s.on('chat:message', (msg: any) => {
          if (msg.threadId !== threadIdRef.current) return;
          const img = msg.imageUrl ? (String(msg.imageUrl).startsWith('/') ? `${API_BASE}${msg.imageUrl}` : msg.imageUrl) : undefined;
          setMessages(prev => [...prev, { id: msg._id, text: msg.text || '', imageUrl: img, isUser: msg.senderType === 'user', timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        });
      } catch {}
    })();
    return () => { socketRef.current?.disconnect(); };
  }, []);

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

          <div className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
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
              onChange={(e) => setInputMessage(e.target.value)}
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
