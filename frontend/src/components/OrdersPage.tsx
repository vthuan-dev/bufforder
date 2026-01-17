import React, { useState, useEffect } from "react";
import { TrendingUp, Wallet, CheckCircle, Target, ShoppingBag, Package, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import api from "../services/api";
import { normalizeVipId, VipThemeKey } from "../constants/vipThemes";
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [commissionRate, setCommissionRate] = useState<number>(0.002); // default 0.2%
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lastClientRequestId, setLastClientRequestId] = useState<string | null>(null);

  // Products from API
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Daily stats with auto-reset at new day
  const [dailyCommission, setDailyCommission] = useState<number>(0);
  const [ordersReceived, setOrdersReceived] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [todaysTask, setTodaysTask] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [totalOrdersLimit, setTotalOrdersLimit] = useState<number>(100);
  const [dailyTarget, setDailyTarget] = useState<number>(0); // Daily commission target from VIP level

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
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [commissionRate]);

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
        }
      } catch { }

      // Fetch VIP status to determine commission rate
      try {
        const vs = await api.vipStatus();
        const currentLevel = vs?.data?.currentLevel;
        const vipKey = normalizeVipId(currentLevel?.id || currentLevel?.name || currentLevel?.label);
        // VIP commission rates (matching backend vipLevels.js)
        const vipCommissionRates: Record<VipThemeKey, number> = {
          royal: 0.025,  // 2.5% → thực nhận 2.25%
          ssvip: 0.022,  // Extra level? Keep as is or sync with table
          svip: 0.02,    // 2.0% → thực nhận 1.80%
          vip7: 0.018,   // 1.8% → thực nhận 1.62%
          vip6: 0.015,   // 1.5% → thực nhận 1.35%
          vip5: 0.012,   // 1.2% → thực nhận 1.08%
          vip4: 0.009,   // 0.9% → thực nhận 0.81%
          vip3: 0.007,   // 0.7% → thực nhận 0.63%
          vip2: 0.006,   // 0.6% → thực nhận 0.54%
          vip1: 0.005,   // 0.5% → thực nhận 0.45%
          vip0: 0,
        };
        setCommissionRate(vipCommissionRates[vipKey] ?? 0);
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
    const duration = 2000; // Reduced from 3000ms to 2000ms
    const steps = 50; // Reduced steps for better performance
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 2; // Increment by 2 for faster progress
      setProgress(Math.min(currentStep, 100));

      if (currentStep >= 100) {
        clearInterval(interval);
        // Filter products that user can afford (price <= balance)
        const affordableProducts = products.filter(p => p.price <= availableBalance);

        if (affordableProducts.length === 0) {
          console.error('[Orders] No affordable products available');
          toast.error('No products available within your balance. Please top up.', {
            description: `Your balance: $${availableBalance.toFixed(2)}`,
            duration: 5000,
          });
          setShowOrderPopup(false);
          setProgress(0);
          return;
        }

        const randomProduct = affordableProducts[Math.floor(Math.random() * affordableProducts.length)];
        setSelectedProduct(randomProduct);
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
    if (availableBalance < selectedProduct.price) {
      console.error('[Orders] Insufficient balance:', availableBalance, '<', selectedProduct.price);
      toast.error(`Insufficient balance! Need $${selectedProduct.price.toLocaleString()} but you only have $${availableBalance.toFixed(2)}. Please top up.`);
      return;
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

      // Show success toast
      toast.success('Order placed successfully! 🎉', {
        description: `Commission: +$${takeRes?.data?.selectedProduct?.commissionAmount?.toFixed(2) || '0.00'}`,
        duration: 3000,
      });

      // ✅ OPTIMISTIC UPDATE: Update UI immediately from response
      const commissionEarned = Number(takeRes?.data?.selectedProduct?.commissionAmount || 0);
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

      // Update UI: count order grabbed
      setOrdersReceived((prev) => prev + 1);

      // Refresh full stats from API to sync everything else (tasks, limits, etc)
      try {
        const stats = await api.userOrderStats();
        if (stats.success) {
          // Only update these fields, don't overwrite balance/commission we just set
          setTodaysTask(Number(stats.data.totalDailyTasks || 0));
          setCompletedToday(Number(stats.data.completedToday || 0));
          setTotalOrdersLimit(Number(stats.data.totalDailyTasks || 0));
          const grabbed = Number(stats.data.ordersGrabbed || 0);
          setOrdersReceived((prev) => Math.max(prev, grabbed));

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
                      ? 'Processing...'
                      : 'Submit'}
              </span>
            </div>
          </motion.button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Click the button to place an order now
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
              <p className="text-[9px] text-gray-500 leading-tight">Commission Earned</p>
              <p className="text-xs font-semibold text-red-500">{dailyCommission.toFixed(2)} USD</p>
            </div>
          </div>

          {/* Available balance */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgAvailable} alt="Available" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">Available Balance</p>
              <p className="text-xs font-semibold text-red-500">{availableBalance.toFixed(2)} USD</p>
            </div>
          </div>

          {/* Today's task */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgToday} alt="Today" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">Today's Tasks</p>
              <p className="text-xs font-semibold text-red-500">{todaysTask.toFixed(2)}</p>
            </div>
          </div>

          {/* Completed today */}
          <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 flex items-center gap-2">
            <img src={imgCompleted} alt="Completed" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-[9px] text-gray-500 leading-tight">Completed Today</p>
              <p className="text-xs font-semibold text-red-500">{completedToday}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar - More Compact */}
        <div className="bg-white rounded-lg p-2 mt-2 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-gray-600">Orders Received</p>
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
        <p className="text-sm font-medium text-gray-700 mb-3">Available Products</p>
        <div className="grid grid-cols-2 gap-2">
          {products.map((product) => (
            <div
              key={product.id}
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
            </div>
          ))}
        </div>
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
                      Order is processing
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

                    {/* Description Text */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-3 mb-6"
                    >
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Many users are competing for orders at your current level. The system is allocating orders and you are currently in queue position 11. Please wait patiently.
                      </p>
                      <p className="text-xs text-orange-600">
                        Tip: Upgrading your VIP level may help you receive orders faster.
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
                      Cancel queue
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
                    <h2 className="text-lg text-gray-800 mb-4">Order confirmation</h2>

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
                        <span className="text-gray-600">Order Number:</span>
                        <span className="text-gray-800 font-mono">{orderNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="text-gray-800">{(commissionRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Profit from this order:</span>
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
                        Later
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
                            Processing...
                          </>
                        ) : 'Confirm Order'}
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
