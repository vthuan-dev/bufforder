import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { TABS_CONFIG, getEnabledTabs } from "../config/tabs.config";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [helpUnread, setHelpUnread] = useState<number>(0);

  useEffect(() => {
    // Load initial unread count from localStorage
    try {
      const saved = parseInt(localStorage.getItem('client:helpUnread') || '0', 10);
      if (!isNaN(saved) && saved > 0) setHelpUnread(saved);
    } catch { }

    // Listen for updates
    const handler = (e: any) => {
      const n = Number(e?.detail || 0);
      if (!isNaN(n)) setHelpUnread(n);
    };
    window.addEventListener('client:chatUnreadUpdated', handler as any);
    return () => window.removeEventListener('client:chatUnreadUpdated', handler as any);
  }, []);

  // Preload components on hover for instant navigation
  const handlePreload = (tabId: string) => {
    // Preload via dynamic import to match lazy loading pattern in App.tsx
    if (tabId === 'help') {
      import('./HelpPage').then(module => module.HelpPage).catch(() => { });
    } else if (tabId === 'my') {
      import('./MyPage').then(module => module.MyPage).catch(() => { });
    } else if (tabId === 'orders') {
      import('./OrdersPage').then(module => module.OrdersPage).catch(() => { });
    } else if (tabId === 'home') {
      import('./HomePage').then(module => module.HomePage).catch(() => { });
    } else if (tabId === 'record') {
      import('./RecordPage').then(module => module.RecordPage).catch(() => { });
    }
  };

  // Get tabs from config - easy to change in tabs.config.ts
  const tabs = getEnabledTabs(TABS_CONFIG);

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50">
      {/* Shadow overlay for depth */}
      <div className="absolute inset-x-0 -top-2 h-2 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-around px-4 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                onMouseEnter={() => handlePreload(tab.id)}
                onTouchStart={() => handlePreload(tab.id)}
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center justify-center flex-1 py-1.5 relative touch-manipulation"
              >
                {/* Active indicator - top bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}

                {/* Icon container with animated background */}
                <motion.div
                  animate={isActive ? {
                    scale: 1.05,
                  } : {
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative flex flex-col items-center gap-0.5"
                >
                  {/* Glowing background for active icon */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl blur-xl -z-10"
                    />
                  )}

                  {/* Icon with gradient on active */}
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive
                        ? 'text-blue-600'
                        : 'text-gray-400'
                        }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {/* Help tab unread indicator - simple red dot */}
                    {tab.id === 'help' && helpUnread > 0 && (
                      <span className="absolute -top-2 -right-1 w-2 h-2 rounded-full bg-red-500 shadow" />
                    )}
                  </div>

                  {/* Label */}
                  <motion.span
                    className={`text-[9px] transition-all duration-200 ${isActive
                      ? 'text-blue-600'
                      : 'text-gray-500'
                      }`}
                    animate={isActive ? {
                      opacity: 1,
                      y: 0
                    } : {
                      opacity: 0.8,
                      y: 0
                    }}
                  >
                    {tab.label}
                  </motion.span>
                </motion.div>

                {/* Ripple effect on tap */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 bg-blue-500/20 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Safe area for notch phones */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}
