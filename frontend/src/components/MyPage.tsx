import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  Wallet,
  DollarSign,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  Sparkles,
  Bell,
  X,
  Trash2,
  CheckCheck,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import api from "../services/api";
import { DEFAULT_VIP_THEME_KEY, normalizeVipId, vipThemes } from "../constants/vipThemes";
import { BottomNav } from "./BottomNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { translateNotification } from '../utils/notificationTranslator';

// ⚡ Lazy load sub-pages for faster initial load
const ShippingAddressPage = lazy(() => import('./ShippingAddressPage').then(m => ({ default: m.ShippingAddressPage })));
const TopUpPage = lazy(() => import('./TopUpPage').then(m => ({ default: m.TopUpPage })));
const WithdrawalPage = lazy(() => import('./WithdrawalPage').then(m => ({ default: m.WithdrawalPage })));
const TransactionHistoryPage = lazy(() => import('./TransactionHistoryPage').then(m => ({ default: m.TransactionHistoryPage })));
const SecurityCenterPage = lazy(() => import('./SecurityCenterPage').then(m => ({ default: m.SecurityCenterPage })));
const WithdrawalMethodsPage = lazy(() => import('./WithdrawalMethodsPage').then(m => ({ default: m.WithdrawalMethodsPage })));

type PageView = 'main' | 'address' | 'topup' | 'withdrawal' | 'history' | 'withdrawal-methods' | 'security';

// ⚡ Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export function MyPage() {
  const { t } = useTranslation(['common', 'my']);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current view from URL path
  const getCurrentView = (): PageView => {
    const path = location.pathname;
    if (path.includes('/my/address')) return 'address';
    if (path.includes('/my/topup')) return 'topup';
    if (path.includes('/my/withdrawal-methods')) return 'withdrawal-methods';
    if (path.includes('/my/withdrawal')) return 'withdrawal';
    if (path.includes('/my/history')) return 'history';
    if (path.includes('/my/security')) return 'security';
    return 'main';
  };

  const [currentView, setCurrentView] = useState<PageView>(getCurrentView());

  // Update currentView when URL changes
  useEffect(() => {
    setCurrentView(getCurrentView());
  }, [location.pathname]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [freezeBalance, setFreezeBalance] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenReason, setFrozenReason] = useState('');
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vipTierId, setVipTierId] = useState<string>(DEFAULT_VIP_THEME_KEY);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bellShake, setBellShake] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string | number>>(new Set());

  // ⚡ Fetch data in parallel, not sequential
  useEffect(() => {
    // Fire requests simultaneously
    const profilePromise = api.profile().catch(() => null);
    const vipPromise = api.vipStatus().catch(() => null);
    const notifyPromise = api.getNotifications().catch(() => null);

    Promise.all([profilePromise, vipPromise, notifyPromise]).then(([profileRes, vipRes, notifyRes]) => {
      // Handle profile
      const user = profileRes?.data?.user;
      if (user) {
        setAvailableBalance(Number(user.balance || 0));
        setFreezeBalance(Number(user.frozenBalance || 0)); // Fix: use frozenBalance not freezeBalance
        setUserId(String(user._id || user.id || '').toUpperCase());
        setFullName(user.fullName || '');
        setPhoneNumber(user.phoneNumber || '');
        setIsFrozen(Boolean(user.isFrozen));
        setFrozenReason(user.frozenReason || '');
      }

      // Handle VIP status
      const currentLevel = vipRes?.data?.currentLevel;
      if (currentLevel?.id) setVipTierId(String(currentLevel.id));

      // Handle notifications
      if (notifyRes?.data?.notifications) {
        setNotifications(notifyRes.data.notifications);
      }
    });

    // Handle real-time notifications
    const handleNewNotify = (e: any) => {
      const newNotify = e.detail;
      setNotifications(prev => [
        { ...newNotify, id: `temp-${Date.now()}`, createdAt: new Date(), isRead: false },
        ...prev
      ].slice(0, 50));

      // Trigger bell shake animation
      setBellShake(true);
      setTimeout(() => setBellShake(false), 1000);
    };

    window.addEventListener('notification:new', handleNewNotify);
    return () => window.removeEventListener('notification:new', handleNewNotify);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const markAsRead = async (id: string | number) => {
    try {
      if (typeof id === 'string' && !id.startsWith('temp-')) {
        await api.markNotificationAsRead(id);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { }
  };

  const toggleExpanded = (id: string | number) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const clearAll = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch { }
  };

  const menuItems = [
    { id: 'address' as PageView, labelKey: 'my:menu.shippingAddress', icon: MapPin, color: 'text-blue-600', bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100' },
    { id: 'topup' as PageView, labelKey: 'my:menu.topUp', icon: Wallet, color: 'text-green-600', bgColor: 'bg-gradient-to-br from-green-50 to-green-100' },
    { id: 'withdrawal' as PageView, labelKey: 'my:menu.withdrawal', icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100' },
    { id: 'history' as PageView, labelKey: 'my:menu.history', icon: FileText, color: 'text-orange-600', bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100' },
    { id: 'withdrawal-methods' as PageView, labelKey: 'my:menu.withdrawalMethods', icon: CreditCard, color: 'text-indigo-600', bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100' },
    { id: 'security' as PageView, labelKey: 'my:menu.securityCenter', icon: Shield, color: 'text-teal-600', bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100' },
  ];

  // ⚡ Memoize computed values
  const normalizedVipKey = useMemo(() => normalizeVipId(vipTierId), [vipTierId]);
  const vipTheme = useMemo(() => vipThemes[normalizedVipKey], [normalizedVipKey]);
  const vipDisplayLabel = vipTheme.label; // Always use English label from theme
  const vipSubtitle = useMemo(() => t(`my:vip.subtitles.${normalizedVipKey}`), [t, normalizedVipKey]);

  const handleMenuClick = (id: PageView) => {
    // Navigate to URL instead of just changing state
    navigate(`/my/${id}`);
    setCurrentView(id);
  };

  const handleBackToMain = () => {
    navigate('/my');
    setCurrentView('main');
  };

  const handleLogout = () => {
    try {
      // Clear all auth and user-specific data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 🔧 Clear any stats data that might be cached
      localStorage.removeItem('stats:lastDate');
      localStorage.removeItem('stats:dailyCommission');
      localStorage.removeItem('stats:ordersReceived');

      // Or clear everything (more aggressive but safer)
      // localStorage.clear();
    } catch { }
    // Redirect to login/home
    window.location.href = '/';
  };

  // Render different pages based on currentView
  if (currentView === 'address') {
    return <Suspense fallback={<PageLoader />}><ShippingAddressPage onBack={handleBackToMain} /></Suspense>;
  }
  if (currentView === 'topup') {
    return <Suspense fallback={<PageLoader />}><TopUpPage onBack={handleBackToMain} /></Suspense>;
  }
  if (currentView === 'withdrawal') {
    return <Suspense fallback={<PageLoader />}><WithdrawalPage onBack={handleBackToMain} onNavigateToBankCards={() => { navigate('/my/withdrawal-methods'); setCurrentView('withdrawal-methods'); }} /></Suspense>;
  }
  if (currentView === 'history') {
    return <Suspense fallback={<PageLoader />}><TransactionHistoryPage onBack={handleBackToMain} /></Suspense>;
  }
  if (currentView === 'withdrawal-methods') {
    return <Suspense fallback={<PageLoader />}><WithdrawalMethodsPage onBack={handleBackToMain} /></Suspense>;
  }
  if (currentView === 'security') {
    return <Suspense fallback={<PageLoader />}><SecurityCenterPage onBack={handleBackToMain} /></Suspense>;
  }

  return (
    <div className="bg-white min-h-screen relative">
      <div className="pb-40 overflow-y-auto">
        {/* Header with Premium Gradient */}
        <div className="relative overflow-hidden z-0">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-white">
          </div>

          <div className="relative px-6 pt-4 pb-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold text-lg tracking-tight">{t('my:title')}</h1>
                  <p className="text-gray-400 text-xs">{t('my:manageAccount')}</p>
                </div>
              </motion.div>

              {/* Bell Icon for Notifications + Language Switcher + Logout */}
              <div className="flex items-center gap-2">
                <LanguageSwitcher />

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: bellShake ? [0, -15, 15, -15, 15, 0] : 0
                  }}
                  transition={{
                    delay: 0.2,
                    rotate: { duration: 0.5, ease: "easeInOut" }
                  }}
                >
                  <button
                    onClick={() => setShowNotifications(true)}
                    className={`p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 relative transition-all active:scale-95 ${bellShake ? 'ring-2 ring-gray-300' : ''}`}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-lg"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </button>
                </motion.div>

                {/* Logout Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-all active:scale-95"
                  title={t('common:buttons.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* VIP overview card synced with Home VIP element */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative overflow-hidden rounded-2xl p-3 shadow-2xl border border-white/20 z-0 ${vipTheme.gradient}`}
              style={{
                backgroundColor: vipTheme.bgColor || undefined,
                backgroundImage: vipTheme.backgroundPattern || undefined,
                backgroundSize: vipTheme.backgroundPattern ? '20px 20px' : undefined,
              }}
            >
              {/* VIP Background Image - Watermark */}
              {vipTheme.badgeImage && (
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${vipTheme.watermarkOpacity || 'opacity-40'} pointer-events-none`}>
                  <img
                    src={vipTheme.badgeImage}
                    alt={`${vipTheme.label} Background`}
                    className="w-24 h-24 object-contain brightness-110 contrast-100 rounded-2xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Lock Icon */}
              <div className={`absolute top-3 right-3 p-1.5 ${vipTheme.chipBgClass} rounded-full`}>
                {isFrozen ? (
                  <Lock className="w-4 h-4 text-red-500" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="w-14 h-14 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-xl relative overflow-hidden"
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                    </motion.div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-base font-bold drop-shadow-lg tracking-wide"
                        style={{ color: vipTheme.titleColor || '#fcd34d' }}
                      >
                        {vipDisplayLabel}
                      </motion.h2>
                      {vipTheme.badgeImage && (
                        <div className={`${vipTheme.badgeSize || 'w-8 h-9'} flex items-center justify-center`}>
                          <img
                            src={vipTheme.badgeImage}
                            alt={`${vipTheme.label} Badge`}
                            className="w-full h-full object-contain drop-shadow-md rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-xs leading-tight font-medium"
                      style={{ color: vipTheme.subtitleColor || '#fef3c7' }}
                    >
                      {vipSubtitle}
                    </motion.p>
                    <div className="flex flex-col mt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="text-[11px] font-bold tracking-wide"
                          style={{ color: vipTheme.titleColor || '#ffffff' }}
                        >
                          {fullName}
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-[10px] font-bold opacity-90"
                          style={{ color: vipTheme.idColor || '#fde68a' }}
                        >
                          • {phoneNumber}
                        </motion.p>
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="text-[10px] font-bold mt-0.5"
                        style={{ color: vipTheme.idColor || '#fde68a' }}
                      >
                        ID: {userId}
                      </motion.p>
                    </div>
                  </div>
                </div>
                {/* Enhanced Balance Display */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="p-2 relative"
                  >
                    <div className="relative">
                      <p className="text-[9px] mb-0.5 font-bold" style={{ color: vipTheme.detailLabelColor || '#fde68a' }}>{t('my:balance.available')}</p>
                      <p className="text-lg drop-shadow-md font-bold" style={{ color: vipTheme.detailValueColor || '#fcd34d' }}>${availableBalance.toFixed(2)}</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="p-2 relative"
                  >
                    <div className="relative">
                      <p className="text-[9px] mb-0.5 font-bold" style={{ color: vipTheme.detailLabelColor || '#fde68a' }}>{t('my:balance.freeze')}</p>
                      <p className="text-lg drop-shadow-md font-bold" style={{ color: vipTheme.detailValueColor || '#fcd34d' }}>${freezeBalance.toFixed(2)}</p>
                    </div>
                  </motion.div>
                </div>

                {/* Frozen Status Warning */}
                {isFrozen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-2 p-2 bg-red-500/20 rounded-xl border border-red-300/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-white" />
                      <p className="text-xs font-bold text-white">{t('orders:frozen.title')}</p>
                    </div>
                    <p className="text-xs text-white">{t('orders:frozen.message')}</p>
                    {frozenReason && (
                      <p className="text-xs text-white mt-1">{t('orders:frozen.reason')}: {frozenReason}</p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Menu Items with Modern Design */}
        <div className="px-6 -mt-6 relative z-0">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50"
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: index * 0.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-gray-50 active:bg-gray-100 ${index !== menuItems.length - 1 ? 'border-b border-gray-100/50' : ''
                    }`}
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className={`${item.bgColor} p-3 rounded-2xl shadow-sm`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </motion.div>
                  <span className="flex-1 text-left text-gray-700">{t(item.labelKey)}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <BottomNav activeTab="my" onTabChange={() => { }} />

        {/* Notifications Side Drawer / Modal */}
        <AnimatePresence>
          {showNotifications && (
            <div className="fixed inset-0 z-[1000] flex items-end justify-center px-0 sm:px-4 pb-32">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-white rounded-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] max-h-[70vh] h-auto flex flex-col mb-20"
              >
                {/* Drawer Handle */}
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 flex-shrink-0" />

                <div className="px-6 pb-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('my:notifications.title')}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await api.markAllNotificationsAsRead();
                              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            } catch { }
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title={t('my:notifications.markAllRead', 'Mark all as read')}
                        >
                          <CheckCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={clearAll}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title={t('my:notifications.clearAll')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 custom-scrollbar" style={{ maxHeight: 'calc(70vh - 180px)' }}>
                  {notifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Bell className="w-10 h-10 text-gray-200" />
                      </div>
                      <p className="text-gray-900 font-bold text-lg">{t('my:notifications.noNotifications')}</p>
                      <p className="text-gray-400 text-sm max-w-[200px] mt-2">
                        {t('my:notifications.noNotificationsDesc')}
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const translated = translateNotification({ title: n.title, message: n.message });
                      const isExpanded = expandedNotifications.has(n.id);
                      const maxLength = 100;
                      const shouldTruncate = translated.message.length > maxLength;
                      const displayMessage = shouldTruncate && !isExpanded
                        ? translated.message.slice(0, maxLength) + '...'
                        : translated.message;

                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={n.id}
                          className={`group p-4 rounded-2xl transition-all border ${n.isRead
                            ? 'bg-white border-gray-100 hover:border-gray-200'
                            : 'bg-blue-50/50 border-blue-100 hover:border-blue-200 shadow-sm'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                <p className={`font-bold text-sm ${n.isRead ? 'text-gray-600' : 'text-blue-900'}`}>{translated.title}</p>
                              </div>
                              <div className="mt-1">
                                <p className="text-sm text-gray-600 leading-relaxed break-words whitespace-pre-wrap">
                                  {displayMessage}
                                </p>
                                {shouldTruncate && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(n.id);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 inline-flex items-center gap-1"
                                  >
                                    {isExpanded ? (
                                      <>
                                        {t('my:notifications.showLess', 'Show less')}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                      </>
                                    ) : (
                                      <>
                                        {t('my:notifications.showMore', 'Show more')}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div
                              className="flex-shrink-0 mt-1 cursor-pointer"
                              onClick={() => !n.isRead && markAsRead(n.id)}
                            >
                              {n.isRead ? (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <CheckCheck className="w-4 h-4 text-gray-300" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
