import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TABS_CONFIG, getEnabledTabs } from "../config/tabs.config";

// Partner brands data - Only verified working logos from simpleicons.org
const partnerBrands = [
  { name: 'Overstock', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIlCIfFGzy0VjSHixjtECQzN_I0AMsS-_ZMugdJiHxuw&s=10' },
  { name: 'Starbucks', logo: 'https://cdn.simpleicons.org/starbucks/00704A' },
  { name: 'Target', logo: 'https://cdn.simpleicons.org/target/CC0000' },
  { name: 'Apple', logo: 'https://cdn.simpleicons.org/apple/000000' },
  { name: 'Nike', logo: 'https://cdn.simpleicons.org/nike/000000' },
  { name: 'Uniqlo', logo: 'https://cdn.simpleicons.org/uniqlo/ED1C24' },
  { name: 'eBay', logo: 'https://cdn.simpleicons.org/ebay/E53238' },
  { name: 'Etsy', logo: 'https://cdn.simpleicons.org/etsy/F16521' },
  { name: 'Shopify', logo: 'https://cdn.simpleicons.org/shopify/7AB55C' },
  { name: 'Alibaba', logo: 'https://cdn.simpleicons.org/alibabadotcom/FF6A00' },
  { name: 'AliExpress', logo: 'https://cdn.simpleicons.org/aliexpress/FF4747' },
  { name: 'Ikea', logo: 'https://cdn.simpleicons.org/ikea/0058A3' },
  { name: 'Samsung', logo: 'https://cdn.simpleicons.org/samsung/1428A0' },
  { name: 'LG', logo: 'https://cdn.simpleicons.org/lg/A50034' },
  { name: 'Dell', logo: 'https://cdn.simpleicons.org/dell/007DB8' },
  { name: 'HP', logo: 'https://cdn.simpleicons.org/hp/0096D6' },
  { name: 'Lenovo', logo: 'https://cdn.simpleicons.org/lenovo/E2231A' },
  { name: 'Google', logo: 'https://cdn.simpleicons.org/google/4285F4' },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useTranslation(['common']);
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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-10">
      {/* Shadow overlay for depth */}
      <div className="absolute inset-x-0 -top-2 h-2 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

      {/* Partner Brands Marquee - Hidden on help and orders tabs */}
      {activeTab !== 'help' && activeTab !== 'orders' && (
        <div className="px-3 pt-2 pb-1.5 border-b border-gray-100">
          <p className="text-center text-[10px] text-gray-500 mb-1 font-medium">
            {t('common:sponsors')}
          </p>
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 py-1.5 rounded-md" style={{ minHeight: '44px', maxHeight: '54px' }}>
            <div className="partner-marquee">
              <div className="partner-marquee-content">
                {partnerBrands.map((brand, index) => (
                  <div key={`brand-1-${index}`} className="partner-item">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="partner-logo"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
                {partnerBrands.map((brand, index) => (
                  <div key={`brand-2-${index}`} className="partner-item">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="partner-logo"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {t(tab.labelKey)}
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
