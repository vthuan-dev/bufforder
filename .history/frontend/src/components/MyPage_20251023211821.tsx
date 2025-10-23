import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  Wallet, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Shield, 
  LogOut,
  ChevronRight,
  Star,
  Sparkles,
  
} from "lucide-react";
import { motion } from "motion/react";
import { ShippingAddressPage } from "./ShippingAddressPage";
import { TopUpPage } from "./TopUpPage";
import { WithdrawalPage } from "./WithdrawalPage";
import { TransactionHistoryPage } from "./TransactionHistoryPage";
import { BankCardPage } from "./BankCardPage";
import { SecurityCenterPage } from "./SecurityCenterPage";
import api from "../services/api";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { DEFAULT_VIP_THEME_KEY, normalizeVipId, vipThemes } from "../constants/vipThemes";

type PageView = 'main' | 'address' | 'topup' | 'withdrawal' | 'history' | 'card' | 'security';

export function MyPage() {
  const [currentView, setCurrentView] = useState<PageView>('main');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [freezeBalance, setFreezeBalance] = useState(0);
  const [userId, setUserId] = useState('');
  const [vipLabel, setVipLabel] = useState<string>(vipThemes[DEFAULT_VIP_THEME_KEY].label);
  const [vipTierId, setVipTierId] = useState<string>(DEFAULT_VIP_THEME_KEY);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.profile();
        const user = res?.data?.user;
        if (user) {
          setAvailableBalance(Number(user.balance || 0));
          setFreezeBalance(Number(user.freezeBalance || 0));
          setUserId(String(user._id || '').toUpperCase());
        }
      } catch (e) {
        // ignore, keep defaults
      }
      try {
        const vs = await api.vipStatus();
        const currentLevel = vs?.data?.currentLevel;
        if (currentLevel?.name) setVipLabel(currentLevel.name);
        else setVipLabel(vipThemes[DEFAULT_VIP_THEME_KEY].label);
        if (currentLevel?.id) setVipTierId(String(currentLevel.id));
        else setVipTierId(DEFAULT_VIP_THEME_KEY);
      } catch {}
    })();
  }, []);

  const menuItems = [
    { id: 'address' as PageView, label: 'Shipping Address', icon: MapPin, color: 'text-blue-600', bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100' },
    { id: 'topup' as PageView, label: 'Top up', icon: Wallet, color: 'text-green-600', bgColor: 'bg-gradient-to-br from-green-50 to-green-100' },
    { id: 'withdrawal' as PageView, label: 'Withdrawal', icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100' },
    { id: 'history' as PageView, label: 'Deposit and Withdrawal Records', icon: FileText, color: 'text-orange-600', bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100' },
    { id: 'card' as PageView, label: 'Withdrawal bank card', icon: CreditCard, color: 'text-indigo-600', bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100' },
    { id: 'security' as PageView, label: 'Security Center', icon: Shield, color: 'text-teal-600', bgColor: 'bg-gradient-to-br from-teal-50 to-teal-100' },
  ];

  const normalizedVipKey = normalizeVipId(vipTierId);
  const vipTheme = vipThemes[normalizedVipKey];
  const vipDisplayLabel = vipLabel || vipTheme.label;
  const vipSubtitle = vipTheme.subtitle;

  const handleMenuClick = (id: PageView) => {
    setCurrentView(id);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    // Redirect to login/home
    window.location.href = '/';
  };

  // Render different pages based on currentView
  if (currentView === 'address') {
    return <ShippingAddressPage onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'topup') {
    return <TopUpPage onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'withdrawal') {
    return <WithdrawalPage onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'history') {
    return <TransactionHistoryPage onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'card') {
    return <BankCardPage onBack={() => setCurrentView('main')} />;
  }
  if (currentView === 'security') {
    return <SecurityCenterPage onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen">
      {/* Header with Premium Gradient */}
      <div className="relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600">
          <motion.div 
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              repeatType: 'reverse' 
            }}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
              backgroundSize: '100% 100%',
            }}
          />
        </div>

        <div className="relative px-6 pt-8 pb-20">
          {/* Top Bar (buttons removed) */}
          <div className="flex items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h1 className="text-white drop-shadow-lg">My Profile</h1>
            </motion.div>
          </div>

          {/* VIP overview card synced with Home VIP element */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-[2rem] p-6 shadow-2xl border border-white/20 ${vipTheme.gradient}`}
          >
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay" />
            
            {vipTheme.badgeImage && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-12 pointer-events-none">
                <ImageWithFallback 
                  src={vipTheme.badgeImage} 
                  alt={`${vipTheme.label} Background`} 
                  className="w-36 h-36 object-contain"
                />
              </div>
            )}
            <div className="absolute -top-24 -right-24 w-52 h-52 bg-white/20 rounded-full blur-3xl opacity-60" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 rounded-[1.5rem] flex items-center justify-center shadow-xl relative overflow-hidden"
                  >
                    {/* Animated shine effect */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      style={{ transform: 'skewX(-20deg)' }}
                    />
                    <span className="text-white relative z-10">A</span>
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-lg" 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <motion.h2 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`text-xl font-semibold ${vipTheme.titleClass}`}
                    >
                      {vipDisplayLabel}
                    </motion.h2>
                    {vipTheme.badgeImage && (
                      <div className="w-10 h-12 flex items-center justify-center">
                        <ImageWithFallback 
                          src={vipTheme.badgeImage} 
                          alt={`${vipTheme.label} Badge`} 
                          className="w-full h-full object-contain drop-shadow-lg"
                        />
                      </div>
                    )}
                    <motion.div
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  </div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    className={`text-sm ${vipTheme.subtitleClass}`}
                  >
                    {vipSubtitle}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className={`text-xs font-medium ${vipTheme.idClass}`}
                  >
                    ID: {userId}
                  </motion.p>
                </div>
              </div>
              {/* Enhanced Balance Display */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden"
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-full" />
                  
                  <div className="relative z-10">
                    <p className="text-xs text-white/90 mb-2 font-medium">Available Balance</p>
                    <p className="text-white text-2xl drop-shadow-md">${availableBalance.toFixed(2)}</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden"
                >
                  {/* Decorative circles */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-full" />
                  
                  <div className="relative z-10">
                    <p className="text-xs text-white/90 mb-2 font-medium">Freeze Balance</p>
                    <p className="text-white text-2xl drop-shadow-md">${freezeBalance.toFixed(2)}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Menu Items with Modern Design */}
      <div className="px-6 -mt-12">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
          className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/50"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.1 + index * 0.05 }}
                whileHover={{ x: 6, backgroundColor: 'rgba(249, 250, 251, 1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100/50' : ''
                }`}
              >
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  className={`${item.bgColor} p-3 rounded-2xl shadow-sm`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </motion.div>
                <span className="flex-1 text-left text-gray-700">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Premium Logout Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-[1.5rem] shadow-xl px-6 py-4 flex items-center justify-center gap-3 text-white hover:shadow-2xl transition-all relative overflow-hidden group"
          onClick={handleLogout}
        >
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transform: 'skewX(-20deg)' }}
          />
          <LogOut className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Logout</span>
        </motion.button>
      </div>
    </div>
  );
}
