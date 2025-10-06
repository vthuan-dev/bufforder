import React from 'react';
import styles from './ChatView.module.css';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ConversationInfo {
  id: string;
  name: string;
  avatarColor?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  at: string; // ISO
  from: 'me' | 'them';
}

interface ChatViewProps {
  conversation: ConversationInfo;
  messages: ChatMessage[];
  onBack: () => void;
}

export function ChatView({ conversation, messages, onBack }: ChatViewProps) {
  return (
    <div className={styles.wrap}>
      <ChatHeader name={conversation.name} color={conversation.avatarColor} onBack={onBack} />
      <MessageList messages={messages} name={conversation.name} color={conversation.avatarColor} />
      <MessageInput onSend={(t) => { /* hook up later */ }} />
    </div>
  );
}


