import React from 'react';
import styles from './ChatPage.module.css';
import api from '../../../services/api';
import { getAdminSocket } from '../../../lib/socket';
import { FaSearch, FaPaperclip, FaPaperPlane, FaUser, FaPhone, FaEnvelope, FaClock, FaEye, FaTrash } from 'react-icons/fa';

type Message = { 
  id: string; 
  senderId: 'me' | 'other'; 
  text: string; 
  createdAt: string;
  imageUrl?: string;
};

type UserEntry = { 
  userId: string; 
  userName: string; 
  userEmail: string;
  phone?: string; 
  threadId: string; 
  lastMessageText?: string; 
  lastMessageAt?: string;
  unreadCount?: number;
};

type Conversations = Record<string, Message[]>; // key: threadId

export function ChatPage() {
  const [users, setUsers] = React.useState([]);
  const [activeConversationId, setActiveConversationId] = React.useState(null);
  const [conversations, setConversations] = React.useState({} as Conversations);
  const [unread, setUnread] = React.useState({} as Record<string, number>);
  const [text, setText] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Load thread list once
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.adminChatThreads({ page: 1, limit: 200 });
        const raw = res.data?.threads || [];
        // Keep ONLY latest thread per user
        const latestByUser: Record<string, any> = {};
        for (const t of raw) {
          const uid = String(t.userId?._id || t.userId?.id || t.userId);
          const current = latestByUser[uid];
          if (!current || new Date(t.lastMessageAt || 0) > new Date(current.lastMessageAt || 0)) {
            latestByUser[uid] = t;
          }
        }
        const list: UserEntry[] = Object.values(latestByUser).map((t: any) => ({
          userId: String(t.userId?._id || t.userId?.id || t.userId),
          userName: t.userId?.fullName || t.userId?.username || 'Unknown User',
          userEmail: t.userId?.email || '',
          phone: t.userId?.phoneNumber || t.userId?.phone || '',
          threadId: t._id || t.id,
          lastMessageText: t.lastMessageText,
          lastMessageAt: t.lastMessageAt,
          unreadCount: t.unreadForAdmin || 0
        })).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());

        // Nếu vẫn có "Unknown User", thử query lại từ database
        const unknownUsers = list.filter(user => user.userName === 'Unknown User' && user.phone);
        for (const user of unknownUsers) {
          try {
            const userRes = await api.adminGetUserByPhone(user.phone);
            if (userRes.data?.user?.fullName) {
              user.userName = userRes.data.user.fullName;
            }
          } catch (error) {
            console.log('Could not fetch user info for phone:', user.phone);
          }
        }

        setUsers(list);
        // initialize unread counts using backend unreadForAdmin
        const unreadMap: Record<string, number> = {};
        for (const t of Object.values(latestByUser)) {
          unreadMap[(t as any)._id || (t as any).id] = (t as any).unreadForAdmin || 0;
        }
        setUnread(unreadMap);
        const first = list[0];
        if (!activeConversationId && first) {
          setActiveConversationId(first.threadId);
          await loadMessagesFor(first.threadId);
        }
      } catch (error) {
        console.error('Error loading threads:', error);
      } finally {
        setLoading(false);
      }
    })();
    
    const s = getAdminSocket();
    s.on('chat:threadUpdated', async (payload: any) => {
      const threadId = payload?.threadId;
      if (!threadId) return;
      setUnread(prev => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
      // Update preview text for the user entry
      setUsers(prev => prev.map(u => u.threadId === threadId ? { ...u, lastMessageText: payload.lastMessageText } : u));
    });
    
    return () => {
      s.off('chat:threadUpdated');
    };
  }, []);

  // Join room và lắng nghe tin nhắn realtime theo thread đang mở
  React.useEffect(() => {
    if (!activeConversationId) return;
    const s = getAdminSocket();
    s.emit('chat:joinThread', activeConversationId);
    const onMsg = (msg: any) => {
      if (msg.threadId !== activeConversationId) return;
      if (msg.senderType !== 'user') return; // chỉ hiển thị tin từ user
      setConversations(prev => ({
        ...prev,
        [msg.threadId]: [
          ...(prev[msg.threadId] || []),
          { 
            id: msg._id, 
            senderId: 'other', 
            text: msg.text, 
            createdAt: new Date(msg.createdAt).toLocaleTimeString(),
            imageUrl: msg.imageUrl
          }
        ]
      }));
      setUnread(prev => ({ ...prev, [msg.threadId]: 0 }));
    };
    s.on('chat:message', onMsg);
    return () => { s.off('chat:message', onMsg); };
  }, [activeConversationId]);

  const loadMessagesFor = async (threadId: string) => {
    try {
      const msgs = await api.adminThreadMessages(threadId);
      const mapped: Message[] = (msgs.data?.messages || []).map((m: any) => ({
        id: m._id,
        senderId: m.senderType === 'admin' ? 'me' : 'other',
        text: m.text,
        createdAt: new Date(m.createdAt).toLocaleTimeString(),
        imageUrl: m.imageUrl
      }));
      setConversations(prev => ({ ...prev, [threadId]: mapped }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setConversations(prev => ({ ...prev, [threadId]: [] }));
    }
  };

  const handleSelectConversation = async (threadId: string) => {
    setActiveConversationId(threadId);
    // mark as read
    setUnread(prev => ({ ...prev, [threadId]: 0 }));
    try { 
      await api.adminMarkThreadRead(threadId); 
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
    if (!conversations[threadId]) {
      await loadMessagesFor(threadId);
    }
  };

  const onSend = async () => {
    const value = text.trim();
    if (!value || !activeConversationId) return;
    try {
      await api.adminSendMessage(activeConversationId, value);
      setConversations(prev => ({
        ...prev,
        [activeConversationId]: [
          ...(prev[activeConversationId] || []),
          { 
            id: String(Date.now()), 
            senderId: 'me', 
            text: value, 
            createdAt: new Date().toLocaleTimeString() 
          },
        ],
      }));
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const onUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    try {
      await api.adminSendImage(activeConversationId, file);
      setConversations(prev => ({
        ...prev,
        [activeConversationId]: [
          ...(prev[activeConversationId] || []),
          { 
            id: String(Date.now()), 
            senderId: 'me', 
            text: '[image sent]', 
            createdAt: new Date().toLocaleTimeString() 
          },
        ],
      }));
      // update preview
      setUsers(prev => prev.map(u => u.threadId === activeConversationId ? { ...u, lastMessageText: '[image]' } : u));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hôm nay';
    } else if (diffDays === 2) {
      return 'Hôm qua';
    } else if (diffDays <= 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter users based on search term
  const filteredUsers = React.useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    return users.filter(user => 
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm)
    );
  }, [users, searchTerm]);

  const currentMessages: Message[] = activeConversationId ? (conversations[activeConversationId] || []) : [];
  const activeThreadUser = users.find(u => u.threadId === activeConversationId) || null;

  const onDeleteThread = async () => {
    if (!activeConversationId) return;
    if (!confirm('Xóa toàn bộ cuộc trò chuyện này?')) return;
    try {
      await api.adminDeleteThread(activeConversationId);
      // remove from local state
      setUsers(prev => prev.filter(u => u.threadId !== activeConversationId));
      setConversations(prev => {
        const copy = { ...prev } as any;
        delete copy[activeConversationId];
        return copy;
      });
      setActiveConversationId(null as any);
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Panel - User List */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Cuộc trò chuyện</h2>
          <div className={styles.searchBox}>
            <FaSearch />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        
        <div className={styles.userList}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              <p>Đang tải cuộc trò chuyện...</p>
      </div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <FaUser />
              <p>Không tìm thấy cuộc trò chuyện nào</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.userId}
                className={`${styles.userItem} ${activeConversationId === user.threadId ? styles.active : ''}`}
                onClick={() => handleSelectConversation(user.threadId)}
              >
                <div className={styles.userAvatar}>
                  {user.userName.charAt(0).toUpperCase()}
                </div>
                
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.userName}</div>
                  <div className={styles.userContact}>
                    <div className={styles.contactItem}>
                      <FaEnvelope />
                      <span className={styles.contactText}>{user.userEmail}</span>
                    </div>
                    {user.phone && (
                      <div className={styles.contactItem}>
                        <FaPhone />
                        <span className={styles.contactText}>{user.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {user.lastMessageText && (
                    <div className={styles.lastMessage}>
                      <span className={styles.messagePreview}>{user.lastMessageText}</span>
                      {user.lastMessageAt && (
                        <span className={styles.messageTime}>
                          {formatTime(user.lastMessageAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {unread[user.threadId] > 0 && (
                  <div className={styles.unreadBadge}>
                    {unread[user.threadId]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Messages */}
      <div className={styles.rightPanel}>
        {activeThreadUser ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.chatUserInfo}>
                <div className={styles.chatUserAvatar}>
                  {activeThreadUser.userName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.chatUserDetails}>
                  <div className={styles.chatUserName}>{activeThreadUser.userName}</div>
                  <div className={styles.chatUserContact}>
                    <div className={styles.chatContactItem}>
                      <FaEnvelope />
                      <span>{activeThreadUser.userEmail}</span>
                    </div>
                    {activeThreadUser.phone && (
                      <div className={styles.chatContactItem}>
                        <FaPhone />
                        <span>{activeThreadUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.chatActions}>
                <button className={styles.chatActionBtn} title="Xem thông tin">
                  <FaEye />
                </button>
                <button className={styles.chatActionBtn} title="Xóa cuộc trò chuyện" onClick={onDeleteThread}>
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <div className={styles.messagesContainer}>
              <div className={styles.messages}>
                {currentMessages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <FaUser />
                    <p>Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                  </div>
                ) : (
                  currentMessages.map(message => {
                    const isMine = message.senderId === 'me';
                    return (
                      <div key={message.id} className={`${styles.messageRow} ${isMine ? styles.messageMine : ''}`}>
                        {!isMine && (
                          <div className={styles.messageAvatar}>
                            {activeThreadUser.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div className={`${styles.messageBubble} ${isMine ? styles.messageBubbleMine : ''}`}>
                          {message.imageUrl ? (
                            <div className={styles.messageImage}>
                              <img src={message.imageUrl} alt="Sent image" />
                            </div>
                          ) : (
                            <div className={styles.messageText}>{message.text}</div>
                          )}
                          <div className={styles.messageTime}>{message.createdAt}</div>
                        </div>
                        
                        {isMine && (
                          <div className={styles.messageAvatar}>
                            A
                          </div>
                        )}
              </div>
            );
                  })
                )}
              </div>
        </div>
            
            <div className={styles.messageInput}>
              <label className={styles.uploadBtn}>
                <FaPaperclip />
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={onUpload} 
                />
          </label>
              
          <input
                className={styles.textInput}
                placeholder="Nhập tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
          />
              
              <button 
                className={styles.sendBtn} 
                onClick={onSend}
                disabled={!text.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noConversation}>
            <FaUser />
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Hãy chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu chat</p>
        </div>
        )}
      </div>
    </div>
  );
}


