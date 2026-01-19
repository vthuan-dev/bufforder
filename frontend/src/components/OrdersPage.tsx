import React, { useState, useEffect } from "react";
import { TrendingUp, Wallet, CheckCircle, Target, ShoppingBag, Package, X, Sparkles, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import api from "../services/api";
const imgEarned = new URL("../assets/orders/Earned.png", import.meta.url).toString();
const imgAvailable = new URL("../assets/orders/Available.png", import.meta.url).toString();
const imgToday = new URL("../assets/orders/Today.png", import.meta.url).toString();
const imgCompleted = new URL("../assets/orders/Completed.png", import.meta.url).toString();

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  commission: number;
  image: string;
}

interface ProductFromAPI {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  image: string | null;
  isActive: boolean;
}

export function OrdersPage() {
  const { t } = useTranslation(['common', 'orders']);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [commissionRate, setCommissionRate] = useState<number>(0.002); // default 0.2%
  const [submitting, setSubmitting] = useState<boolean>(false);
  const submittingRef = React.useRef<boolean>(false); // Immediate tracking
  const [lastClientRequestId, setLastClientRequestId] = useState<string | null>(null);

  // Products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [displayedProductsCount, setDisplayedProductsCount] = useState(8); // Initial: show 8 products
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]); // Shuffled products for display

  // Daily stats with auto-reset at new day
  const [dailyCommission, setDailyCommission] = useState<number>(0);
  const [ordersReceived, setOrdersReceived] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [todaysTask, setTodaysTask] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [totalOrdersLimit, setTotalOrdersLimit] = useState<number>(100);
  const [dailyTarget, setDailyTarget] = useState<number>(0); // Daily commission target from VIP level

  // Freeze status
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [frozenBalance, setFrozenBalance] = useState<number>(0);
  const [frozenReason, setFrozenReason] = useState<string>('');
  const [freezeThreshold, setFreezeThreshold] = useState<number | null>(null); // Threshold order number
  const [freezeTargetProductId, setFreezeTargetProductId] = useState<number | null>(null); // Admin-specified product for freeze

  // Fetch products from API
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getProducts();
        if (res.success && res.data) {
          const apiProducts: Product[] = res.data.map((p: ProductFromAPI) => ({
            id: String(p.id),
            name: p.name,
            brand: p.brand,
            price: p.price,
            // Commission: price × rate × 0.9 (10% system fee deduction)
            commission: +(p.price * commissionRate * 0.9).toFixed(2),
            image: p.image || '',
          }));
          setProducts(apiProducts);
          // Initial shuffle
          setShuffledProducts([...apiProducts].sort(() => Math.random() - 0.5));
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [commissionRate]);

  // Auto-shuffle products every 5 seconds
  useEffect(() => {
    if (products.length === 0) return;
    
    const interval = setInterval(() => {
      setShuffledProducts([...products].sort(() => Math.random() - 0.5));
    }, 5000); // Shuffle every 5 seconds

    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const lastDate = localStorage.getItem("stats:lastDate");

    if (lastDate !== todayKey) {
      // New day: reset daily stats
      localStorage.setItem("stats:lastDate", todayKey);
      localStorage.setItem("stats:dailyCommission", "0");
      localStorage.setItem("stats:ordersReceived", "0");
      setDailyCommission(0);
      setOrdersReceived(0);
    } else {
      // Load persisted stats for today
      const savedCommission = parseFloat(localStorage.getItem("stats:dailyCommission") || "0");
      const savedOrders = parseInt(localStorage.getItem("stats:ordersReceived") || "0", 10);
      setDailyCommission(isNaN(savedCommission) ? 0 : savedCommission);
      setOrdersReceived(isNaN(savedOrders) ? 0 : savedOrders);
    }
    // load current balance and vip from api
    (async () => {
      try {
        const stats = await api.userOrderStats();
        if (stats.success) {
          setAvailableBalance(stats.data.balance || 0);
          setTodaysTask(Number(stats.data.totalDailyTasks || 0));
          setCompletedToday(Number(stats.data.completedToday || 0));
          setTotalOrdersLimit(Number(stats.data.totalDailyTasks || 0));
          setOrdersReceived(Number(stats.data.ordersGrabbed || 0));
          // Sync today's earned commission from backend
          // Backend commissionAmount is credited 100% to the user's balance.
          // UI shows Earned commission = total commission earned today.
          const earnedToday = Number(stats.data?.dailyEarnings?.totalCommission || 0);
          setDailyCommission(isNaN(earnedToday) ? 0 : earnedToday);
          // Get daily target from VIP level or custom config
          const target = Number(stats.data?.dailyTarget || stats.data?.dailyEarnings?.targetTotal || 0);
          setDailyTarget(target);

          // ✅ Use commission rate from API (resolves from user's commissionConfig or VIP level)
          // This ensures admin's custom config is applied correctly
          const apiCommissionRate = Number(stats.data?.commissionRate || 0);
          if (apiCommissionRate > 0) {
            setCommissionRate(apiCommissionRate);
          }

          // ✅ Load freeze status
          setIsFrozen(Boolean(stats.data?.isFrozen));
          setFrozenBalance(Number(stats.data?.frozenBalance || 0));
          setFrozenReason(stats.data?.frozenReason || '');
          setFreezeThreshold(stats.data?.freezeThreshold || null);
          setFreezeTargetProductId(stats.data?.freezeTargetProductId || null);
        }
      } catch { }
    })();
  }, []);

  // Persist when stats change
  useEffect(() => {
    localStorage.setItem("stats:dailyCommission", String(dailyCommission));
  }, [dailyCommission]);
  useEffect(() => {
    localStorage.setItem("stats:ordersReceived", String(ordersReceived));
  }, [ordersReceived]);

  // 🔔 Listen for real-time balance updates (from socket)
  useEffect(() => {
    const handleBalanceUpdate = (e: Event) => {
      const data = (e as CustomEvent).detail;
      console.log('[OrdersPage] Real-time balance update:', data);

      // Update balance immediately with new value
      if (data.newBalance != null) {
        console.log('[OrdersPage] Setting availableBalance to:', data.newBalance);
        setAvailableBalance(Number(data.newBalance));
      }

      // Update daily commission by adding increment
      if (data.commissionIncrement != null && data.commissionIncrement > 0) {
        console.log('[OrdersPage] Adding to dailyCommission:', data.commissionIncrement);
        setDailyCommission(prev => {
          const newVal = prev + Number(data.commissionIncrement);
          console.log('[OrdersPage] New dailyCommission:', newVal);
          return newVal;
        });
      }

      // Update completed today count
      setCompletedToday(prev => prev + 1);
      setOrdersReceived(prev => prev + 1);

      // Show appropriate toast based on source
      const isFromOrderGrab = data.source === 'order_grab';
      if (!isFromOrderGrab) {
        // Only show toast for admin-delivered orders (order_grab already has its own toast)
        toast.success(`Order delivered! +$${data.commissionIncrement?.toFixed(2) || '0.00'}`, {
          description: `New balance: $${data.newBalance?.toFixed(2)}`,
          duration: 4000,
        });
      }
    };

    window.addEventListener('balance:updated', handleBalanceUpdate);
    return () => window.removeEventListener('balance:updated', handleBalanceUpdate);
  }, []);

  const carouselImages = [
    // Smartphones
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80&auto=format&fit=crop",
    // Luxury watch close-up
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=80&auto=format&fit=crop",
    // Headphones / electronics lifestyle
    "https://iphonethanhnhan.vn/upload/product/iphone-17-pro-max-6-9245.jpg",
    // Bags
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop",
    // Sneakers
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop",
    // Jewelry
    "https://www.explorerealm.com/cdn/shop/files/Luxurious_Jewelry_for_surprisingly_less_from_REALM_081122-193_RT_banner.jpg?v=1660685265&width=5760",
    // Handbag red
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80&auto=format&fit=crop",
    // Camera
    "https://kyma.vn/cdn-cgi/imagedelivery/ZeGtsGSjuQe1P3UP_zk3fQ/75bef658-3b0d-466f-7df0-b9227c548d00/storedata",
    // Laptop
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
    // Gaming console
    "https://cellphones.com.vn/sforum/wp-content/uploads/2023/03/game-console-2.jpg",
    // Fashion watch
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=80&auto=format&fit=crop",
    // Headphones alt
    "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/09/hinh-nen-may-tinh-4k-cong-nghe-4.jpg"
  ];

  // Auto-rotate carousel with performance optimization
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000); // Reduced from 5000ms to 4000ms for faster rotation
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const handleTakeOrder = () => {
    // PREVENT DOUBLE CLICK - Critical fix for duplicate orders
    if (showOrderPopup || submitting) {
      console.warn('[Orders] Take order blocked: popup already open or submitting');
      return;
    }

    // Check if products loaded
    if (loadingProducts || products.length === 0) {
      toast.error('Products are loading. Please wait...');
      return;
    }

    // Check if VIP 0
    if (commissionRate === 0) {
      toast.warning('VIP Upgrade Required! 🚀', {
        description: 'Your current VIP level (VIP 0) does not support earning commission. Please upgrade to VIP 1 or higher to start taking orders.',
        duration: 5000,
        action: {
          label: 'Upgrade Now',
          onClick: () => window.location.hash = '#/my' // Redirect to My page or VIP page if exists
        }
      });
      return;
    }

    // Check daily task limit
    if (ordersReceived >= totalOrdersLimit) {
      toast.warning('Daily tasks completed! 🎯', {
        description: `You've completed all ${totalOrdersLimit} tasks for today. Come back tomorrow!`,
        duration: 5000,
      });
      return;
    }

    setShowOrderPopup(true);
    setProgress(0);

    // Generate idempotency key IMMEDIATELY when popup opens
    const newClientRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setLastClientRequestId(newClientRequestId);
    console.log('[Orders] Generated new idempotency key:', newClientRequestId);

    // Optimized progress animation - faster and smoother
    const duration = 2000; // Fast animation for better UX
    const steps = 50; // Reduced steps for better performance
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 2; // Increment by 2 for faster progress
      setProgress(Math.min(currentStep, 100));

      if (currentStep >= 100) {
        clearInterval(interval);
        
        // 🔒 Check if user is at freeze threshold
        // If at threshold, ONLY show products with price > balance to trigger freeze
        const nextOrderNumber = ordersReceived + 1; // This will be the order number
        const isAtFreezeThreshold = freezeThreshold != null && nextOrderNumber >= freezeThreshold;
        
        let filteredProducts: Product[];
        if (isAtFreezeThreshold) {
          // At freeze threshold: ONLY products with price > balance
          filteredProducts = products.filter(p => p.price > availableBalance);
          console.log(`[Orders] 🔒 At freeze threshold (order #${nextOrderNumber} >= threshold ${freezeThreshold}), filtering products > balance ($${availableBalance})`);
          console.log(`[Orders] Found ${filteredProducts.length} products with price > balance`);
        } else {
          // Normal: products that user can afford (price <= balance)
          filteredProducts = products.filter(p => p.price <= availableBalance);
          console.log(`[Orders] Normal order #${nextOrderNumber}, filtering affordable products <= balance ($${availableBalance})`);
        }

        if (filteredProducts.length === 0) {
          console.error('[Orders] No products available for current condition');
          const message = isAtFreezeThreshold 
            ? 'Không có sản phẩm phù hợp để kích hoạt cơ chế đóng băng. Vui lòng liên hệ admin.'
            : t('orders:notifications.noProducts');
          toast.error(message, {
            description: t('orders:notifications.yourBalance', { balance: availableBalance.toFixed(2) }),
            duration: 5000,
          });
          setShowOrderPopup(false);
          setProgress(0);
          return;
        }

        // 🎯 Check if admin specified a target product for freeze
        let selectedProductForOrder: Product | null = null;
        
        if (isAtFreezeThreshold && freezeTargetProductId != null) {
          // Use admin-specified target product
          const targetProduct = products.find(p => p.id === String(freezeTargetProductId));
          if (targetProduct) {
            console.log(`[Orders] 🎯 Using admin-specified target product at freeze threshold: ${targetProduct.name} - $${targetProduct.price}`);
            selectedProductForOrder = targetProduct;
          } else {
            console.warn(`[Orders] ⚠️ Target product ID ${freezeTargetProductId} not found, falling back to random selection`);
          }
        }
        
        // If no target product specified or not found, use random selection from filtered products
        if (!selectedProductForOrder) {
          selectedProductForOrder = filteredProducts[Math.floor(Math.random() * filteredProducts.length)];
          console.log(`[Orders] Selected random product: ${selectedProductForOrder.name} - $${selectedProductForOrder.price}`);
        }
        
        setSelectedProduct(selectedProductForOrder);
        // Generate a stable order number for this popup session
        const ts = Date.now().toString();
        const suffix = ts.slice(-8);
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setOrderNumber(`ASH${suffix}${rand}`);
      }
    }, stepDuration);
  };

  const handleConfirmOrder = async () => {
    console.log('[Orders] handleConfirmOrder called');
    console.log('[Orders] selectedProduct:', selectedProduct);
    console.log('[Orders] submitting:', submitting);
    console.log('[Orders] availableBalance:', availableBalance);

    if (!selectedProduct) {
      console.error('[Orders] No selected product');
      return;
    }
    if (submitting) {
      console.warn('[Orders] Confirm blocked: already submitting');
      return;
    }

    // Check if user has enough balance
    // EXCEPTION: Allow price > balance when at freeze threshold (to trigger freeze mechanism)
    const nextOrderNumber = ordersReceived + 1;
    const isAtFreezeThreshold = freezeThreshold != null && nextOrderNumber >= freezeThreshold;
    
    if (!isAtFreezeThreshold && availableBalance < selectedProduct.price) {
      console.error('[Orders] Insufficient balance:', availableBalance, '<', selectedProduct.price);
      toast.error(t('orders:notifications.insufficientBalance', { 
        need: selectedProduct.price.toLocaleString(), 
        have: availableBalance.toFixed(2) 
      }));
      return;
    }
    
    // Log if allowing expensive product at freeze threshold
    if (isAtFreezeThreshold && availableBalance < selectedProduct.price) {
      console.log(`[Orders] 🔒 Allowing expensive product at freeze threshold (order #${nextOrderNumber})`);
    }

    // CRITICAL: Use the idempotency key generated when popup opened
    const clientRequestId = lastClientRequestId;
    if (!clientRequestId) {
      console.error('[Orders] No idempotency key found!');
      alert('Session error. Please try again.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('[Orders] Submitting order with key:', clientRequestId);
      console.log('[Orders] Product data:', {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        brand: selectedProduct.brand,
      });

      // Take order -> create a pending order only; admin will update status later
      const takeRes = await api.userOrderTake({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        brand: selectedProduct.brand,
        category: 'General',
        image: selectedProduct.image,
      }, clientRequestId);

      console.log('[Orders] Order submitted successfully');

      // Add delay for better UX (looks more professional)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ Check if account was frozen
      if (takeRes?.data?.accountFrozen) {
        const freezeNotif = takeRes.data.freezeNotification;
        toast.error(freezeNotif?.title || t('orders:frozen.orderSuspended'), {
          description: freezeNotif?.message || t('orders:frozen.orderSuspendedMessage'),
          duration: 8000,
          action: {
            label: t('orders:frozen.topUpNow'),
            onClick: () => window.location.hash = '#/topup'
          }
        });
        
        // Update freeze status
        setIsFrozen(true);
        setFrozenBalance(freezeNotif?.frozenBalance || 0);
        setFrozenReason(freezeNotif?.message || '');
        setAvailableBalance(0); // Balance moved to frozen
        
        setShowOrderPopup(false);
        setSelectedProduct(null);
        return; // Stop here, don't show success toast
      }

      // Show success toast
      const commissionEarned = Number(takeRes?.data?.selectedProduct?.commissionAmount || 0);
      
      if (commissionEarned === 0 || commissionRate === 0) {
        toast.warning(t('orders:notifications.noCommission'), {
          description: t('orders:notifications.vip0Warning'),
          duration: 5000,
          action: {
            label: t('orders:notifications.upgradeVip'),
            onClick: () => window.location.hash = '#/'
          }
        });
      } else {
        toast.success(t('orders:notifications.orderSuccess'), {
          description: t('orders:notifications.commission', { amount: commissionEarned.toFixed(2) }),
          duration: 3000,
        });
      }

      // ✅ OPTIMISTIC UPDATE: Update UI immediately from response
      const newBalance = Number(takeRes?.data?.newBalance || availableBalance);
      const newCommission = Number(takeRes?.data?.newCommission || dailyCommission);

      // Update balance and commission instantly
      setAvailableBalance(newBalance);
      setDailyCommission(newCommission);

      console.log('[Orders] ✅ Optimistic update:', {
        commissionEarned,
        newBalance,
        newCommission: newCommission
      });

      // Update UI: count order grabbed AND completed today IMMEDIATELY
      const newOrdersReceived = ordersReceived + 1;
      const newCompletedToday = completedToday + 1;
      setOrdersReceived(newOrdersReceived);
      setCompletedToday(newCompletedToday);

      console.log('[Orders] ✅ Counters updated:', {
        ordersReceived: newOrdersReceived,
        completedToday: newCompletedToday
      });

      // Refresh full stats from API to sync everything else (tasks, limits, etc)
      try {
        const stats = await api.userOrderStats();
        if (stats.success) {
          // Only update these fields, don't overwrite counters we just incremented
          setTodaysTask(Number(stats.data.totalDailyTasks || 0));
          setTotalOrdersLimit(Number(stats.data.totalDailyTasks || 0));
          
          // Use MAX to ensure we don't go backwards if API is slow
          const apiCompleted = Number(stats.data.completedToday || 0);
          const apiGrabbed = Number(stats.data.ordersGrabbed || 0);
          setCompletedToday((prev) => Math.max(prev, apiCompleted));
          setOrdersReceived((prev) => Math.max(prev, apiGrabbed));

           // Update daily target in case it changed
          const target = Number(stats.data?.dailyTarget || stats.data?.dailyEarnings?.targetTotal || 0);
          setDailyTarget(target);
        }
      } catch { }

      setShowOrderPopup(false);
      setSelectedProduct(null);
      // DON'T RESET idempotency key here - let it expire naturally on next Take Order
      // setLastClientRequestId(null); // ← BUG WAS HERE!

      // notify other pages (Record) to refresh
      try { window.dispatchEvent(new Event('orderUpdated')); } catch { }
    } catch (e: any) {
      console.error('[Orders] Submit error:', e);
      // Close popup first so user can see the toast error message
      setShowOrderPopup(false);
      setSelectedProduct(null);
      setProgress(0);
      setOrderNumber('');
      // Show error toast after popup is closed
      toast.error(e?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelQueue = () => {
    console.log('[Orders] Order cancelled by user');
    setShowOrderPopup(false);
    setSelectedProduct(null);
    setProgress(0);
    setOrderNumber('');
    // DON'T reset idempotency key on cancel - keep it for retry protection
    // setLastClientRequestId(null);
  };

  // Orders View (Full view with products below)
  const OrdersView = () => (
    <>
      {/* Header */}
      <div className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <img
            src={new URL("../assets/image.png", import.meta.url).toString()}
            alt="Ashford Logo"
            className="h-8 w-auto"
          />
        </motion.div>
      </div>

      {/* Carousel */}
      <div className="px-6 pt-6">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ height: '180px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={carouselImages[currentSlide]}
                alt="Order banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder on error
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${index === currentSlide
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Freeze Warning Banner */}
      {isFrozen && (
        <div className="px-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm mb-1">{t('orders:frozen.title')}</h3>
                <p className="text-white/90 text-xs mb-2">{t('orders:frozen.message')}</p>
                {frozenBalance > 0 && (
                  <p className="text-white/90 text-xs mb-2">
                    {t('orders:frozen.frozenBalance')}: <span className="font-bold">${frozenBalance.toFixed(2)}</span>
                  </p>
                )}
                {frozenReason && (
                  <p className="text-white/80 text-xs mb-3">
                    {t('orders:frozen.reason')}: {frozenReason}
                  </p>
                )}
                <p className="text-white/90 text-xs mb-3">{t('orders:frozen.contactAdmin')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.hash = '#/my'}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg text-xs font-medium hover:bg-white/90 transition-colors"
                  >
                    {t('orders:frozen.topUpNow')}
                  </button>
                  <button
                    onClick={() => window.location.hash = '#/help'}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
                  >
                    {t('orders:frozen.contactSupport')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Daily Target Warning Banner - REMOVED per user request to focus on task count */}

      {/* Take Order Button - Compact */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-4 shadow-inner">
          <motion.button
            whileHover={(!showOrderPopup && !submitting && !loadingProducts && ordersReceived < totalOrdersLimit) ? { scale: 1.02 } : {}}
            whileTap={(!showOrderPopup && !submitting && !loadingProducts && ordersReceived < totalOrdersLimit) ? { scale: 0.98 } : {}}
            onClick={handleTakeOrder}
            disabled={showOrderPopup || submitting || loadingProducts || ordersReceived >= totalOrdersLimit}
            className={`w-full py-3 rounded-xl shadow-lg transition-all relative overflow-hidden group ${showOrderPopup || submitting || loadingProducts || ordersReceived >= totalOrdersLimit
              ? 'bg-gray-400 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white hover:shadow-blue-500/50'
              }`}
          >
            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Package className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-base">
                {loadingProducts
                  ? 'Loading...'
                  : ordersReceived >= totalOrdersLimit
                    ? 'Wait for Tomorrow'
                    : (showOrderPopup || submitting)
                      ? t('orders:processing')
                      : t('orders:purchaseOrder')}
              </span>
            </div>
          </motion.button>
          <p className="text-center text-xs text-gray-500 mt-2">
            {t('orders:clickToOrder')}
          </p>
        </div>
      </div>

      {/* Stats Grid - Compact 2x2 with smaller cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Earned commission */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgEarned} alt="Earned" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">{t('orders:commissionEarned')}</p>
              <p className="text-xs font-semibold text-red-500">{dailyCommission.toFixed(2)} USD</p>
            </div>
          </div>

          {/* Available balance */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgAvailable} alt="Available" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">{t('orders:availableBalance')}</p>
              <p className="text-xs font-semibold text-red-500">{availableBalance.toFixed(2)} USD</p>
            </div>
          </div>

          {/* Today's task */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgToday} alt="Today" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">{t('orders:todaysTasks')}</p>
              <p className="text-xs font-semibold text-red-500">{todaysTask.toFixed(2)}</p>
            </div>
          </div>

          {/* Completed today */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgCompleted} alt="Completed" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">{t('orders:completedToday')}</p>
              <p className="text-xs font-semibold text-red-500">{completedToday}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar - More Compact */}
        <div className="bg-white rounded-lg p-2 mt-2 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-600">{t('orders:ordersReceived')}</p>
            <p className="text-[10px] font-semibold text-red-500">{ordersReceived} / {totalOrdersLimit}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${(ordersReceived / totalOrdersLimit) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="px-4 pb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">{t('orders:availableProducts')}</p>
        <div className="grid grid-cols-2 gap-2">
          {shuffledProducts.slice(0, displayedProductsCount).map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="aspect-square bg-gray-50">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-800 truncate font-medium">{product.name}</p>
                <p className="text-[10px] text-gray-500">{product.brand}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-red-500 font-semibold">${product.price.toLocaleString()}</span>
                  <span className="text-[10px] text-green-600">+${product.commission.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More / Show Less Button */}
        {shuffledProducts.length > 8 && (
          <div className="mt-4 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (displayedProductsCount >= shuffledProducts.length) {
                  setDisplayedProductsCount(8); // Reset to initial count
                } else {
                  setDisplayedProductsCount(prev => Math.min(prev + 8, shuffledProducts.length)); // Load 8 more
                }
              }}
              className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              {displayedProductsCount >= shuffledProducts.length ? t('orders:showLess') : t('orders:loadMore')}
            </motion.button>
          </div>
        )}
      </div>

      {/* Instructions - Compact */}
    </>
  );

  // Products View (Only products)
  const ProductsView = () => (
    <>
      {/* Header */}
      <div className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <img
            src={new URL("../assets/image.png", import.meta.url).toString()}
            alt="Ashford Logo"
            className="h-8 w-auto"
          />
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100"
        >
          <p className="text-gray-800 mb-3">Procedure:</p>
          <ol className="text-xs text-gray-700 space-y-2">
            <li>1 Click the "Start Task" button and follow the instructions to complete the task.</li>
            <li>2 After finishing, you can settle the commission to your balance.</li>
          </ol>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-gray-800 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{product.brand}</p>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Unit price:</span>
                    <span className="text-red-600">{product.price}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Rebate:</span>
                    <span className="text-red-600">{product.commission.toFixed(3)}</span>
                  </div>
                </div>

                {/* Start Task button removed */}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div id="orders-root" className="pb-20 bg-gray-50 min-h-screen">
      <style>{`
        #orders-root > div:nth-child(1) > div:nth-child(2) { 
          transform: scale(0.2) !important;
          transform-origin: top left;     
        }
      `}</style>
      <OrdersView />

      {/* Order Popup Modal */}
      <AnimatePresence>
        {showOrderPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  y: 50
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 50
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  duration: 0.3
                }}
                className="bg-white rounded-3xl shadow-2xl max-w-[340px] w-full overflow-hidden relative"
              >
                {!selectedProduct ? (
                  // Loading State
                  <div className="p-6">
                    {/* Title */}
                    <h2 className="text-center text-lg text-gray-800 mb-6">
                      {t('orders:popup.title')}
                    </h2>

                    {/* Circular Progress */}
                    <div className="flex items-center justify-center mb-6">
                      <motion.div className="relative w-24 h-24">
                        {/* Background circle */}
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="#E5E7EB"
                            strokeWidth="6"
                            fill="none"
                          />
                          {/* Animated progress circle */}
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="42"
                            stroke="url(#gradient)"
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${(progress / 100) * 264} 264`}
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#F59E0B" />
                              <stop offset="100%" stopColor="#F97316" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {/* Percentage text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl text-gray-700">
                            {progress}%
                          </span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Description Text - More Prominent */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-3 mb-6"
                    >
                      {/* Main message - Very prominent with background */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                        <p className="text-base font-extrabold text-gray-900 leading-relaxed text-center">
                          {t('orders:popup.queueMessage')}
                        </p>
                      </div>
                      {/* VIP tip - Orange highlight */}
                      <p className="text-sm text-orange-600 font-bold text-center">
                        {t('orders:popup.vipTip')}
                      </p>
                    </motion.div>

                    {/* Cancel Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelQueue}
                      className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {t('orders:popup.cancelQueue')}
                    </motion.button>
                  </div>
                ) : (
                  // Product Display State - New Design
                  <div className="p-5">
                    {/* Close Button */}
                    <button
                      onClick={handleCancelQueue}
                      className="absolute top-3 right-3 z-10 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* Title */}
                    <h2 className="text-lg text-gray-800 mb-4">{t('orders:confirmation.title')}</h2>

                    {/* Product Row */}
                    <div className="flex gap-3 mb-4">
                      {/* Product Image - Small */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-gray-800 mb-0.5 truncate">{selectedProduct.name}</h3>
                        <p className="text-xs text-gray-500">{selectedProduct.brand}</p>
                      </div>
                    </div>

                    {/* Price - Large Red */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl sm:text-2xl text-red-600">${selectedProduct.price}</span>
                      <span className="text-sm text-gray-500">x1</span>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3 mb-5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('orders:confirmation.orderNumber')}</span>
                        <span className="text-gray-800 font-mono">{orderNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('orders:confirmation.commissionRate')}</span>
                        <span className="text-gray-800">{(commissionRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('orders:confirmation.profitFromOrder')}</span>
                        <span className="text-red-600">${selectedProduct.commission.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelQueue}
                        disabled={submitting}
                        className={`flex-1 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {t('orders:confirmation.later')}
                      </motion.button>
                      <motion.button
                        whileHover={!submitting ? { scale: 1.02 } : {}}
                        whileTap={!submitting ? { scale: 0.98 } : {}}
                        onClick={handleConfirmOrder}
                        disabled={submitting}
                        className={`flex-1 py-3 rounded-xl text-white text-sm flex items-center justify-center gap-2 ${submitting ? 'bg-blue-500 cursor-wait' : 'bg-blue-600'}`}
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('orders:confirmation.processing')}
                          </>
                        ) : t('orders:confirmation.confirmOrder')}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
