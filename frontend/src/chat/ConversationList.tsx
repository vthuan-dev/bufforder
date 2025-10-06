import React, { useMemo, useState } from 'react';
import styles from './ConversationList.module.css';
import { ConversationListItem } from './ConversationListItem';

export interface ConversationItemData {
  id: string;
  name: string;
  avatarColor?: string;
  lastText?: string;
  lastAt?: string; // ISO
}

interface ConversationListProps {
  items: ConversationItemData[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ items, activeId, onSelect }: ConversationListProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it => it.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>Tin nhắn</div>
      <div className={styles.searchRow}>
        <input
          type="search"
          placeholder="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
        />
      </div>
      <div className={styles.list}>
        {filtered.map(item => (
          <ConversationListItem
            key={item.id}
            data={item}
            active={item.id === activeId}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </div>
  );
}


