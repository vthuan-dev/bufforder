import React, { useEffect, useState } from 'react';
import { getUserSocket } from '../lib/socket';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageCircle, Send, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function HelpPage() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('main');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'agent', message: 'Hello! Welcome to Ashford Customer Service. How can I help you today?', timestamp: '10:30 AM' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const storageKey = user?._id ? `userThreadId:${user._id}` : 'userThreadId';
  const [threadId, setThreadId] = useState(localStorage.getItem(storageKey) as string | null);

  useEffect(() => {
    const socket = getUserSocket();
    socket.on('connect', () => setSocketReady(true));
    return () => {
      // no-op
    };
  }, []);

  // Lắng nghe realtime theo threadId (giống cơ chế bên admin)
  useEffect(() => {
    if (!threadId) return;
    const s = getUserSocket();
    s.emit('chat:joinThread', threadId);
    const onConnect = () => {
      s.emit('chat:joinThread', threadId);
    };
    s.on('connect', onConnect);
    const onMsg = (msg: any) => {
      if (msg.threadId !== threadId) return;
      if (msg.senderType !== 'admin') return; // chỉ hiển thị tin từ admin
      setChatMessages(prev => [...prev, {
        id: String(msg._id),
        type: 'agent',
        message: msg.text,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    };
    s.on('chat:message', onMsg);
    return () => { s.off('chat:message', onMsg); s.off('connect', onConnect); };
  }, [threadId]);

  // Open/get thread and load history when entering chat screen
  useEffect(() => {
    if (currentScreen !== 'chat') return;
    (async () => {
      try {
        let id = threadId;
        if (!id) {
          const opened = await api.userOpenThread();
          id = opened.data?.threadId;
          if (id) {
            setThreadId(id);
            localStorage.setItem(storageKey, id);
            // join socket room for history updates
            const s = getUserSocket();
            s.emit('chat:joinThread', id);
          }
        }
        if (id) {
          const hist = await api.userThreadMessages(id);
          const mapped = (hist.data?.messages || []).map((m: any) => ({
            id: String(m._id),
            type: m.senderType === 'admin' ? 'agent' : 'user',
            message: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          // Merge lịch sử với tin hiện có để tránh ghi đè tin realtime vừa tới
          setChatMessages(prev => {
            const existing = new Set(prev.map((x: any) => String(x.id)));
            const merged = [...prev, ...mapped.filter((m: any) => !existing.has(String(m.id)))];
            return merged.length ? merged : mapped;
          });
        }
      } catch (e) {
        // ignore load errors for now
      }
    })();
  }, [currentScreen]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    // Hiển thị ngay tin của user để realtime tại giao diện người gửi
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        message: currentMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    try {
      let id = threadId;
      if (!id) {
        const opened = await api.userOpenThread();
        id = opened.data?.threadId;
        if (id) {
          setThreadId(id);
          localStorage.setItem(storageKey, id);
          const s = getUserSocket();
          s.emit('chat:joinThread', id);
        }
      }
      if (id) {
        const socket = getUserSocket();
        if (socket.connected) {
          socket.emit('chat:send', { threadId: id, text: currentMessage });
        } else {
          await api.userSendMessage(id, currentMessage);
        }
      }
    } catch {}
    setCurrentMessage('');
  };

  // Main Screen
  if (currentScreen === 'main') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-100">
          <div className="flex items-center p-4">
            <ArrowLeft className="w-5 h-5 text-gray-700 mr-4" />
            <h1 className="text-lg font-medium text-gray-900">Customer Service</h1>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-800 text-center">
              If you have any questions or need help, please contact online customer service.
            </p>
          </div>
          
          <Button 
            onClick={() => setCurrentScreen('chat')}
            className="w-full bg-gray-900 text-white py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contact Customer Service
          </Button>
        </div>
      </div>
    );
  }

  // Chat Screen - Fixed layout to prevent jumping
  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: '80vh' }}>
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center p-4">
          <ArrowLeft className="w-5 h-5 text-gray-700 mr-4" onClick={() => setCurrentScreen('main')} />
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">Live Support</h1>
              <p className="text-xs text-green-600">● Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              message.type === 'user'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-800 border border-gray-200'
            }`}>
              <p className="text-sm">{message.message}</p>
              <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Input Area */}
      <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-gray-200"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}