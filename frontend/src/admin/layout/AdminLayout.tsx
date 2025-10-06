import React from 'react';
import styles from './AdminLayout.module.css';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
  onLogout?: () => void;
  adminData?: any;
}

export function AdminLayout({ children, onLogout, adminData }: AdminLayoutProps) {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Sidebar onLogout={onLogout} adminData={adminData} />
      </aside>
      <section className={styles.main}>
        <header className={styles.header}>
          <h1></h1>
        </header>
        <main className={styles.content}>{children}</main>
      </section>
    </div>
  );
}


