import React, { useEffect, useState } from "react";
import { PackageOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function RecordPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('pending');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [freezeBalance, setFreezeBalance] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ] as const;

  const loadStats = async () => {
    try {
      const res = await api.userOrderStats();
      if (res.success) {
        setAvailableBalance(res.data.balance || 0);
        setFreezeBalance(res.data.freezeBalance || 0);
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
    <div className="pb-20 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          Order History
        </motion.h1>
        
        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-4 shadow-lg"
          >
            <div className="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded mb-3">
              Available Balance
            </div>
            <p className="text-blue-600 text-2xl">${availableBalance.toFixed(2)}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-4 shadow-lg"
          >
            <div className="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded mb-3">
              Freeze Balance
            </div>
            <p className="text-blue-600 text-2xl">${freezeBalance.toFixed(2)}</p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm relative transition-colors text-center ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="relative inline-block">
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-4 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"
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
            <p className="text-gray-500">Loading...</p>
          ) : (orders.filter(o => !activeTab || String(o.status).toLowerCase() === activeTab).length === 0) ? (
            <>
            {/* Empty State Illustration */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mb-8"
          >
            {/* Decorative circles */}
            <motion.div
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-32 h-32 border-2 border-yellow-200 border-dashed rounded-full"></div>
            </motion.div>
            
            {/* Main icon container */}
            <div className="relative bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full p-12 shadow-xl">
              <PackageOpen className="w-20 h-20 text-yellow-600" strokeWidth={1.5} />
            </div>

            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full shadow-lg"
            />
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-2 -left-2 w-3 h-3 bg-yellow-300 rounded-full shadow-lg"
            />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <p className="text-gray-600 mb-2">No data yet</p>
            <p className="text-gray-400 text-sm max-w-xs">
              Complete orders to see your history here
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
                      <p className="text-gray-900 text-sm">{o.productName}</p>
                      <p className="text-xs text-gray-500">{new Date(o.orderDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 text-sm">${o.productPrice.toFixed(2)}</p>
                    <p className="text-green-600 text-xs">+${o.commissionAmount.toFixed(2)}</p>
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
