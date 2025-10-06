import React, { useEffect, useMemo, useState } from 'react';
import styles from './ChatPage.module.css';
import { ConversationList } from './ConversationList';
import { ChatView } from './ChatView';
import api from '../services/api';
import { getUserSocket } from '../lib/socket';

export function ChatPage() {
  const [threadId, setThreadId] = useState(localStorage.getItem('userThreadId') as any);
  const [messages, setMessages] = useState([] as any[]);
  const [showListOnMobile, setShowListOnMobile] = useState(true as boolean);
  const conversations = useMemo(() => [{ id: 'support', name: 'Customer Support' }], []);
  const activeId = 'support';
  const activeConversation = { id: 'support', name: 'Customer Support' } as any;

  useEffect(() => {
    // join socket and append incoming messages
    const s = getUserSocket();
    s.on('chat:message', (msg: any) => {
      setMessages(prev => [...prev, {
        id: msg._id || Date.now(),
        text: msg.text,
        at: new Date(msg.createdAt).toISOString(),
        from: msg.senderType === 'admin' ? 'them' : 'me'
      }]);
    });
    return () => { s.off('chat:message'); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        let id = threadId;
        if (!id) {
          const opened = await api.userOpenThread();
          id = opened.data?.threadId;
          if (id) {
            setThreadId(id);
            localStorage.setItem('userThreadId', id);
            const socket = getUserSocket();
            socket.emit('chat:joinThread', id);
          }
        }
        if (id) {
          const hist = await api.userThreadMessages(id);
          const mapped = (hist.data?.messages || []).map((m: any) => ({
            id: m._id,
            text: m.text,
            at: new Date(m.createdAt).toISOString(),
            from: m.senderType === 'admin' ? 'them' : 'me'
          }));
          setMessages(mapped);
        }
      } catch {}
    })();
  }, []);

  const handleSelectConversation = (_id: string) => {
    setShowListOnMobile(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.left + ' ' + (showListOnMobile ? styles.leftVisible : styles.leftHidden)}>
          <ConversationList
            items={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
          />
        </aside>

        <main className={styles.right}>
          <ChatView
            conversation={activeConversation}
            messages={messages}
            onBack={() => setShowListOnMobile(true)}
          />
        </main>
      </div>
    </div>
  );
}


