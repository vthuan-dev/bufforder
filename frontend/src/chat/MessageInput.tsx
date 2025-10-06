import React, { useState } from 'react';
import styles from './MessageInput.module.css';
import { Paperclip as IconPaperclip, Smile as IconSmile, Send as IconSend } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
}

export function MessageInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };
  return (
    <div className={styles.wrap}>
      <button className={styles.leftBtn} aria-label="Attach"><IconPaperclip size={16} /></button>
      <input
        className={styles.input}
        placeholder="Aa"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
      />
      <button className={styles.iconBtn} aria-label="Emoji"><IconSmile size={16} /></button>
      <button className={styles.sendBtn} aria-label="Send" onClick={handleSend}><IconSend size={16} /></button>
    </div>
  );
}


