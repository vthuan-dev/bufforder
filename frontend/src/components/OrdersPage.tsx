import React, { useState, useEffect } from "react";
import { TrendingUp, Wallet, CheckCircle, Target, ShoppingBag, Package, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
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

export function OrdersPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [progress, setProgress] = useState(0);
  const [commissionRate, setCommissionRate] = useState<number>(0.002); // default 0.2%

  // Daily stats with auto-reset at new day
  const [dailyCommission, setDailyCommission] = useState<number>(0);
  const [ordersReceived, setOrdersReceived] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [todaysTask, setTodaysTask] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [totalOrdersLimit, setTotalOrdersLimit] = useState<number>(100);

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
        }
      } catch {}

      // Fetch VIP status to determine commission rate
      try {
        const vs = await api.vipStatus();
        const currentLevel = vs?.data?.currentLevel;
        const vipKey = normalizeVipId(currentLevel?.id || currentLevel?.name || currentLevel?.label);
        const vipCommissionRates: Record<VipThemeKey, number> = {
          royal: 0.025,
          ssvip: 0.022,
          svip: 0.02,
          vip7: 0.018,
          vip6: 0.015,
          vip5: 0.012,
          vip4: 0.009,
          vip3: 0.007,
          vip2: 0.005,
          vip1: 0.003,
          vip0: 0.002,
        };
        setCommissionRate(vipCommissionRates[vipKey] ?? 0.002);
      } catch {}
    })();
  }, []);

  // Persist when stats change
  useEffect(() => {
    localStorage.setItem("stats:dailyCommission", String(dailyCommission));
  }, [dailyCommission]);
  useEffect(() => {
    localStorage.setItem("stats:ordersReceived", String(ordersReceived));
  }, [ordersReceived]);

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

  // Diverse product catalog matching backend (provided list)
  const allProducts = [
    { id: 1, name: "Rolex Submariner", brand: "Rolex", category: "Watches", image: "https://24kara.com/files/sanpham/4581/1/jpg/dong-ho-rolex-submariner-date-40-m116613lb-0005-116613lb-0005-thep-oystersteel-va-vang-kim-18ct-mat-xanh-luot.jpg", price: 8500 },
    { id: 2, name: "Omega Speedmaster", brand: "Omega", category: "Watches", image: "https://i.ebayimg.com/images/g/8QMAAeSw5YNoowXB/s-l1600.webp", price: 5500 },
    { id: 3, name: "Patek Philippe Calatrava", brand: "Patek Philippe", category: "Watches", image: "https://i.ebayimg.com/images/g/srcAAeSwXdlopIOi/s-l1600.webp", price: 25000 },
    { id: 4, name: "Audemars Piguet Royal Oak", brand: "Audemars Piguet", category: "Watches", image: "https://24kara.com/files/sanpham/31574/1/jpg/dong-ho-piaget-polo-perpetual-calendar-ultra-thin-g0a48006.jpg", price: 18000 },
    { id: 5, name: "Cartier Santos", brand: "Cartier", category: "Watches", image: "https://bizweb.dktcdn.net/100/175/988/products/wro16ms27rb21aa-1-copy.jpg?v=1722223341387", price: 7200 },
    { id: 21, name: "Hermès Birkin Bag", brand: "Hermès", category: "Handbags", image: "https://product.hstatic.net/200000465663/product/2b92308f-7d4c-4845-b8d3-7af5c333b83b_33d3cb42159a434a856ab0537f181c85_master.jpg", price: 15000 },
    { id: 22, name: "Chanel Classic Flap", brand: "Chanel", category: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop", price: 8500 },
    { id: 31, name: "Balenciaga Triple S Sneakers", brand: "Balenciaga", category: "Shoes", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/39728db5eed29247de6835853e910f6e.webp", price: 1200 },
    { id: 32, name: "Off-White Air Jordan 1", brand: "Off-White", category: "Shoes", image: "https://i.ebayimg.com/images/g/~mMAAOSwIY1oEIlQ/s-l1600.webp", price: 1800 },
    { id: 41, name: "Tiffany & Co. Diamond Ring", brand: "Tiffany & Co.", category: "Jewelry", image: "https://cdn.shopify.com/s/files/1/0097/1276/2940/products/Natural_Round_Cut_3_Row_Micro_Pave_Unique_Diamond_Engagement_Ring_Profile_View_White_Gold_Platinum_be378a38-79f3-4e1e-b901-ecaff3b22aa2.jpg?v=1651252990", price: 12000 },
    { id: 42, name: "Cartier Love Bracelet", brand: "Cartier", category: "Jewelry", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/858aa5f08d22028bf064340dcada0b9a.webp", price: 8500 },
    { id: 51, name: "Hermès Silk Scarf", brand: "Hermès", category: "Accessories", image: "https://i.ebayimg.com/images/g/VowAAeSwgnBohkwK/s-l1600.webp", price: 450 },
    { id: 52, name: "Gucci GG Belt", brand: "Gucci", category: "Accessories", image: "https://i.ebayimg.com/images/g/l7EAAeSwSORodzog/s-l1600.webp", price: 650 },
    { id: 61, name: "Apple iPhone 17 Pro", brand: "Apple", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-megx9gfulgcmf4.webp", price: 1299 },
    { id: 62, name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mdofu5fqmt2p5f.webp", price: 1199 },
    { id: 63, name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", image: "https://songlongmedia.com/media/product/3123_untitled.jpg", price: 399 },
    { id: 71, name: "Dyson Supersonic Hair Dryer", brand: "Dyson", category: "Beauty", image: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/markets/vietnam/campaigns/pdp/hd16-kanzan-pink-case-storage-bag.png", price: 429 },
    { id: 72, name: "La Mer Moisturizing Cream", brand: "La Mer", category: "Beauty", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lvyfnpdrsn2xba.webp", price: 345 },
  ];

  const products: Product[] = allProducts.map((p) => ({
    id: String(p.id),
    name: p.name,
    brand: p.brand,
    price: p.price,
    commission: +(p.price * commissionRate).toFixed(2),
    image: p.image,
  }));

  // Auto-rotate carousel with performance optimization
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000); // Reduced from 5000ms to 4000ms for faster rotation
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const handleTakeOrder = () => {
    setShowOrderPopup(true);
    setProgress(0);
    
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
        // Random select a product after loading completes
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        setSelectedProduct(randomProduct);
      }
    }, stepDuration);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;
    try {
      // Take order -> create a pending order only; admin will update status later
      const takeRes = await api.userOrderTake({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        brand: selectedProduct.brand,
        category: 'General',
        image: selectedProduct.image,
      });
      // Update UI: count order grabbed; commission updates when admin delivers
      setOrdersReceived((prev) => prev + 1);

      // Refresh stats from api to sync UI (balance, tasks, completed, received)
      try {
        const stats = await api.userOrderStats();
        if (stats.success) {
          setAvailableBalance(stats.data.balance || 0);
          setTodaysTask(Number(stats.data.totalDailyTasks || 0));
          setCompletedToday(Number(stats.data.completedToday || 0));
          setTotalOrdersLimit(Number(stats.data.totalDailyTasks || 0));
          setOrdersReceived(Number(stats.data.ordersGrabbed || 0));
        }
      } catch {}

      setShowOrderPopup(false);
      setSelectedProduct(null);
      // notify other pages (Record) to refresh
      try { window.dispatchEvent(new Event('orderUpdated')); } catch {}
    } catch (e: any) {
      alert(e?.message || 'Order failed');
    }
  };

  const handleCancelQueue = () => {
    setShowOrderPopup(false);
    setSelectedProduct(null);
    setProgress(0);
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
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative h-56"
            >
              <ImageWithFallback
                src={carouselImages[currentSlide]}
                alt="Order banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {/* Ashford overlay */}
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">Ashford Collection</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel Indicators */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Take Order Button */}
      <div className="px-6 pt-6">
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-6 shadow-inner">
          <motion.button
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTakeOrder}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-5 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all relative overflow-hidden group"
          >
            {/* Animated background shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ transform: 'skewX(-20deg)' }}
            />
            
            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-2xl"
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-3">
              <Package className="w-6 h-6" strokeWidth={2.5} />
              <span className="text-lg">Take an order now</span>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm" />
          </motion.button>

          {/* Helper text */}
          <p className="text-center text-sm text-gray-600 mt-3">
            Click the button to take an order now
          </p>
        </div>
      </div>

      {/* Stats Grid with images */}
      <div className="px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Earned commission */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <img src={imgEarned} alt="Earned commission" className="w-24 h-24 object-contain mb-1" />
            <p className="text-xs text-gray-600">Earned commission</p>
            <p className="text-lg text-red-500 mt-1">{dailyCommission.toFixed(2)}$</p>
          </div>

          {/* Available balance */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <img src={imgAvailable} alt="Available balance" className="w-24 h-24 object-contain mb-1" />
            <p className="text-xs text-gray-600">Available balance</p>
            <p className="text-lg text-red-500 mt-1">{availableBalance.toFixed(2)}$</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Today's task */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <img src={imgToday} alt="Today's task" className="w-24 h-24 object-contain mb-1" />
            <p className="text-xs text-gray-600">Today's task</p>
            <p className="text-lg text-red-500 mt-1">{todaysTask.toFixed(2)}</p>
          </div>

          {/* Completed today */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <img src={imgCompleted} alt="Completed today" className="w-24 h-24 object-contain mb-1" />
            <p className="text-xs text-gray-600">Completed today</p>
            <p className="text-lg text-red-500 mt-1">{completedToday}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-700">Orders received</p>
            <p className="text-red-500">{ordersReceived}/{totalOrdersLimit}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(ordersReceived / totalOrdersLimit) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 pb-4">
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <p className="text-gray-800 mb-3">Procedure:</p>
          <ol className="text-xs text-gray-700 space-y-2">
            <li>1 Click the "Start Task" button and follow the instructions to complete the task.</li>
            <li>2 After finishing, you can settle the commission to your balance.</li>
          </ol>
        </div>
      </div>

      {/* Products Grid at bottom */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
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
          transform: scale(0.5);
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
                        <span className="text-gray-800 font-mono">ASH{Date.now().toString().slice(-8)}{Math.floor(Math.random() * 1000).toString().padStart(3, '0')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="text-gray-800">{((selectedProduct.commission / selectedProduct.price) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Profit from this order:</span>
                        <span className="text-red-600">${selectedProduct.commission.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelQueue}
                        className="flex-1 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                      >
                        Later
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmOrder}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white shadow-lg shadow-gray-900/30 hover:shadow-xl hover:shadow-gray-900/40 transition-all"
                      >
                        Submit Order
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
