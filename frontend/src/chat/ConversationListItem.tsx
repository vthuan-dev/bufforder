import React from 'react';
import styles from './ConversationListItem.module.css';

import { ConversationItemData } from './ConversationList';

interface Props {
  data: ConversationItemData;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationListItem({ data, active, onClick }: Props) {
  const initials = (name: string) => name.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <button className={styles.item + ' ' + (active ? styles.active : '')} onClick={onClick}>
      <div className={styles.avatar} style={{ background: data.avatarColor || '#3b82f6' }}>
        {initials(data.name)}
      </div>
      <div className={styles.meta}>
        <div className={styles.topRow}>
          <div className={styles.name}>{data.name}</div>
          {data.lastAt && <div className={styles.time}>{new Date(data.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        </div>
        <div className={styles.preview}>{data.lastText || ''}</div>
      </div>
    </button>
  );
}


