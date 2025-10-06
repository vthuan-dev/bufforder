import { ChatMessage } from './ChatView';
import { ConversationItemData } from './ConversationList';

export const conversationsMock: ConversationItemData[] = [
  { id: 'c1', name: 'Người dùng', avatarColor: '#3b82f6', lastText: 'xin chào', lastAt: new Date().toISOString() },
  { id: 'c2', name: 'Minh Trần', avatarColor: '#10b981', lastText: 'Hẹn gặp 7h nhé', lastAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'c3', name: 'Lan Phạm', avatarColor: '#ef4444', lastText: 'Đã nhận', lastAt: new Date(Date.now() - 7200000).toISOString() },
];

export const messagesByConversationMock: Record<string, ChatMessage[]> = {
  c1: [
    { id: 'm1', text: 'xin chào', at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), from: 'them' },
    { id: 'm2', text: 'Mình có thể giúp gì?', at: new Date(Date.now() - 58 * 60 * 1000).toISOString(), from: 'me' },
  ],
  c2: [
    { id: 'm3', text: 'Ok bạn', at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), from: 'me' },
  ],
  c3: [
    { id: 'm4', text: 'Cảm ơn!', at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), from: 'them' },
  ],
};


