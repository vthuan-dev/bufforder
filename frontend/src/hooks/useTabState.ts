import { useState, useEffect, useCallback } from 'react';

export type TabType = 'bank' | 'usdt';

const TAB_STATE_KEY = 'withdrawal-methods-active-tab';

export function useTabState(defaultTab: TabType = 'bank') {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Try to restore from localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(TAB_STATE_KEY);
      if (saved === 'bank' || saved === 'usdt') {
        return saved;
      }
    }
    return defaultTab;
  });

  // Persist to localStorage whenever tab changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TAB_STATE_KEY, activeTab);
    }
  }, [activeTab]);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return {
    activeTab,
    switchTab,
    isBank: activeTab === 'bank',
    isUSDT: activeTab === 'usdt',
  };
}
