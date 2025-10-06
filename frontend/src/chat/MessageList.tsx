import React, { useEffect, useRef } from 'react';
import styles from './MessageList.module.css';
import { ChatMessage } from './ChatView';

interface Props {
  messages: ChatMessage[];
  name: string;
  color?: string;
}

export function MessageList({ messages }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, [messages]);
  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.inner}>
        {messages.map(m => (
          <div key={m.id} className={styles.row + ' ' + (m.from === 'me' ? styles.me : styles.them)}>
            <div className={styles.bubble}>{m.text}</div>
            <div className={styles.time}>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


