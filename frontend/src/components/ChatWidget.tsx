import React, { useEffect, useState } from 'react';
import { AdminChat } from './AdminChat';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-admin-chat', handleOpen as EventListener);
    return () => {
      window.removeEventListener('open-admin-chat', handleOpen as EventListener);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setIsOpen(false)}
      />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[640px] lg:w-[880px] bg-white shadow-xl">
        <AdminChat onBack={() => setIsOpen(false)} />
      </div>
    </div>
  );
}


