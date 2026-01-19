import React, { useEffect, useState } from "react";
import { PackageOpen, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { vipThemes, normalizeVipId } from "../constants/vipThemes";

export function RecordPage() {
  const { t } = useTranslation(['common', 'record', 'orders']);
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('pending');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [freezeBalance, setFreezeBalance] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userVipLevel, setUserVipLevel] = useState<string>('vip-0');

  const tabs = [
    { id: 'pending', labelKey: 'record:tabs.pending' },
    { id: 'processing', labelKey: 'record:tabs.processing' },
    { id: 'shipped', labelKey: 'record:tabs.shipped' },
    { id: 'delivered', labelKey: 'record:tabs.delivered' },
    { id: 'cancelled', labelKey: 'record:tabs.cancelled' }
  ] as const;

  // Get VIP theme based on user's VIP level
  const vipThemeKey = normalizeVipId(userVipLevel);
  const vipTheme = vipThemes[vipThemeKey];

  const loadStats = async () => {
    try {
      const res = await api.userOrderStats();
      if (res.success) {
        setAvailableBalance(res.data.balance || 0);
        setFreezeBalance(res.data.freezeBalance || 0);
        // Get user VIP level
        if (res.data.vipLevel) {
          setUserVipLevel(res.data.vipLevel);
        }
      }
    } catch {}
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.userOrderHistory({ status: activeTab, page: 1, limit: 20, sortBy: 'orderDate', sortOrder: 'desc' });
      if (res.success) setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);
  // Listen for cross-page order updates (e.g., user completed an order from OrdersPage)
  useEffect(() => {
    const onOrderUpdated = () => {
      loadStats();
      loadOrders();
    };
    window.addEventListener('orderUpdated', onOrderUpdated as any);
    return () => window.removeEventListener('orderUpdated', onOrderUpdated as any);
  }, [activeTab]);
  useEffect(() => { loadOrders(); }, [activeTab]);

  return (
    <div className="pb-32 bg-white min-h-screen">
      {/* Header - Synced with VIP Theme */}
      <div 
        className={`${vipTheme.gradient} px-6 py-8 relative overflow-hidden`}
        style={{
          backgroundColor: vipTheme.bgColor || undefined,
          backgroundImage: vipTheme.backgroundPattern || undefined,
          backgroundSize: vipTheme.backgroundPattern ? '20px 20px' : undefined,
        }}
      >
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mb-6 text-3xl font-bold relative z-10 ${vipTheme.titleClass}`}
          style={vipTheme.titleColor ? { color: vipTheme.titleColor } : undefined}
        >
          {t('record:title')}
        </motion.h1>
        
        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
          >
            <p className="text-gray-500 text-xs mb-1">{t('record:availableBalance')}</p>
            <p className="text-green-600 text-2xl font-semibold">${availableBalance.toFixed(2)}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
          >
            <p className="text-gray-500 text-xs mb-1">{t('record:frozenBalance')}</p>
            <p className="text-red-500 text-2xl font-semibold">${freezeBalance.toFixed(2)}</p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm relative transition-colors text-center ${
                activeTab === tab.id
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-400'
              }`}
            >
              <span className="relative inline-block">
                {t(tab.labelKey)}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-4 left-0 right-0 h-0.5 bg-blue-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area with Tab Switching Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-20 px-6"
        >
          {/* Orders list or empty state */}
          {loading ? (
            <p className="text-gray-500">{t('record:loading')}</p>
          ) : (orders.filter(o => !activeTab || String(o.status).toLowerCase() === activeTab).length === 0) ? (
            <>
            {/* Empty State Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-8"
          >
            {/* Main icon container */}
            <div className="relative bg-gray-100 rounded-full p-10">
              <PackageOpen className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-gray-600 mb-2">{t('record:empty.title')}</p>
            <p className="text-gray-400 text-sm max-w-xs">
              {t('record:empty.description')}
            </p>
          </motion.div>
            </>
          ) : (
            <div className="w-full px-4 space-y-3">
              {orders
                .filter(o => !activeTab || String(o.status).toLowerCase() === activeTab)
                .map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <ImageWithFallback
                      src={o.image || ''}
                      alt="product"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 text-sm">{o.productName}</p>
                        {o.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            <Lock className="w-3 h-3" />
                            {t('orders:status.suspended')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{new Date(o.orderDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 text-sm">${o.productPrice.toFixed(2)}</p>
                    {o.status === 'suspended' ? (
                      <p className="text-orange-600 text-xs">{t('orders:frozen.orderSuspended')}</p>
                    ) : (
                      <p className="text-green-600 text-xs">+${o.commissionAmount.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
