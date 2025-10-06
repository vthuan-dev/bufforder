import React from 'react';
import styles from './ChatHeader.module.css';
import { ArrowLeft as IconArrowLeft, Phone as IconPhone, Video as IconVideo, Info as IconInfo } from 'lucide-react';

interface Props {
  name: string;
  color?: string;
  onBack: () => void;
}

export function ChatHeader({ name, color = '#3b82f6', onBack }: Props) {
  const initials = (n: string) => n.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <button className={styles.iconBtn} onClick={onBack} aria-label="Back">
          <IconArrowLeft size={16} />
        </button>
        <div className={styles.avatar} style={{ background: color }}>{initials(name)}</div>
        <div>
          <div className={styles.name}>{name}</div>
          <div className={styles.status}>Đang hoạt động</div>
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Call"><IconPhone size={16} /></button>
        <button className={styles.iconBtn} aria-label="Video"><IconVideo size={16} /></button>
        <button className={styles.iconBtn} aria-label="Info"><IconInfo size={16} /></button>
      </div>
    </div>
  );
}


