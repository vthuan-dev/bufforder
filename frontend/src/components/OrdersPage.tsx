import React, { useState, useEffect } from 'react';
// Use native button here for full control over styles
import { OrderProgressModal } from './OrderProgressModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import api from '../services/api';
import toast from 'react-hot-toast';

// Diverse product catalog matching backend
const allProducts = [
  // Luxury Watches
  { id: 1, name: "Rolex Submariner", brand: "Rolex", category: "Watches", image: "https://24kara.com/files/sanpham/4581/1/jpg/dong-ho-rolex-submariner-date-40-m116613lb-0005-116613lb-0005-thep-oystersteel-va-vang-kim-18ct-mat-xanh-luot.jpg", price: 8500 },
  { id: 2, name: "Omega Speedmaster", brand: "Omega", category: "Watches", image: "https://i.ebayimg.com/images/g/8QMAAeSw5YNoowXB/s-l1600.webp", price: 5500 },
  { id: 3, name: "Patek Philippe Calatrava", brand: "Patek Philippe", category: "Watches", image: "https://i.ebayimg.com/images/g/srcAAeSwXdlopIOi/s-l1600.webp", price: 25000 },
  { id: 4, name: "Audemars Piguet Royal Oak", brand: "Audemars Piguet", category: "Watches", image: "https://24kara.com/files/sanpham/31574/1/jpg/dong-ho-piaget-polo-perpetual-calendar-ultra-thin-g0a48006.jpg", price: 18000 },
  { id: 5, name: "Cartier Santos", brand: "Cartier", category: "Watches", image: "https://bizweb.dktcdn.net/100/175/988/products/wro16ms27rb21aa-1-copy.jpg?v=1722223341387", price: 7200 },
  
  // Luxury Handbags
  { id: 21, name: "Hermès Birkin Bag", brand: "Hermès", category: "Handbags", image: "", price: 15000 },
  { id: 22, name: "Chanel Classic Flap", brand: "Chanel", category: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop", price: 8500 },

  // Fashion & Shoes
  { id: 31, name: "Balenciaga Triple S Sneakers", brand: "Balenciaga", category: "Shoes", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/39728db5eed29247de6835853e910f6e.webp", price: 1200 },
  { id: 32, name: "Off-White Air Jordan 1", brand: "Off-White", category: "Shoes", image: "https://i.ebayimg.com/images/g/~mMAAOSwIY1oEIlQ/s-l1600.webp", price: 1800 },

  // Jewelry
  { id: 41, name: "Tiffany & Co. Diamond Ring", brand: "Tiffany & Co.", category: "Jewelry", image: "https://cdn.shopify.com/s/files/1/0097/1276/2940/products/Natural_Round_Cut_3_Row_Micro_Pave_Unique_Diamond_Engagement_Ring_Profile_View_White_Gold_Platinum_be378a38-79f3-4e1e-b901-ecaff3b22aa2.jpg?v=1651252990", price: 12000 },
  { id: 42, name: "Cartier Love Bracelet", brand: "Cartier", category: "Jewelry", image: "https://d3vfig6e0r0snz.cloudfront.net/rcYjnYuenaTH5vyDF/images/products/858aa5f08d22028bf064340dcada0b9a.webp", price: 8500 },

  // Fashion Accessories
  { id: 51, name: "Hermès Silk Scarf", brand: "Hermès", category: "Accessories", image: "https://i.ebayimg.com/images/g/VowAAeSwgnBohkwK/s-l1600.webp", price: 450 },
  { id: 52, name: "Gucci GG Belt", brand: "Gucci", category: "Accessories", image: "https://i.ebayimg.com/images/g/l7EAAeSwSORodzog/s-l1600.webp", price: 650 },

  // Tech & Electronics
  { id: 61, name: "Apple iPhone 17 Pro", brand: "Apple", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-820l4-megx9gfulgcmf4.webp", price: 1299 },
  { id: 62, name: "Samsung Galaxy S24 Ultra", brand: "Samsung", category: "Electronics", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mdofu5fqmt2p5f.webp", price: 1199 },
  { id: 63, name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", image: "https://songlongmedia.com/media/product/3123_untitled.jpg", price: 399 },

  { id: 71, name: "Dyson Supersonic Hair Dryer", brand: "Dyson", category: "Beauty", image: "https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/markets/vietnam/campaigns/pdp/hd16-kanzan-pink-case-storage-bag.png", price: 429 },
  { id: 72, name: "La Mer Moisturizing Cream", brand: "La Mer", category: "Beauty", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lvyfnpdrsn2xba.webp", price: 345 },

  // Sports & Outdoors
 
];

interface OrderData {
  productName: string;
  productPrice: number;
  brand: string;
  category: string;
  image: string;
  productId: number;
  commissionAmount: number;
  commissionRate: number;
}

export function OrdersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentOrderData, setCurrentOrderData] = useState<OrderData | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  
  // Order statistics
  const [commission, setCommission] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [ordersGrabbed, setOrdersGrabbed] = useState(0);
  const [totalDailyTasks, setTotalDailyTasks] = useState(100);

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getOrderStats(token);
      if (response.success) {
        setCommission(response.data.commission);
        setAvailableBalance(response.data.balance);
        setCompletedToday(response.data.completedToday);
        setOrdersGrabbed(response.data.ordersGrabbed);
        setTotalDailyTasks(response.data.totalDailyTasks);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  // No inline preview of selected product per requirement

  const handleTakeOrder = async () => {
    if (ordersGrabbed >= totalDailyTasks) {
      toast.error('Bạn đã hoàn thành số đơn hôm nay!');
      return;
    }

    // Check if user has sufficient balance (minimum $200 for cheapest product)
    if (availableBalance < 200) {
      toast.error('Số dư không đủ để nhận đơn. Vui lòng nạp thêm.');
      return;
    }

    setIsLoading(true);
    setShowProgressModal(true);

    // Simulate order processing
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to take orders');
          return;
        }

        // Call backend to get a random product selection
        const response = await api.takeOrder(token);
        if (response.success) {
          toast.success('Product selected successfully!');
          // Store selected product data
          setCurrentOrderData(response.data.selectedProduct);
          // Update local state with new data from backend
          setCommission(response.data.newCommission || commission);
          setAvailableBalance(response.data.newBalance || availableBalance);
          setCompletedToday(response.data.newCompletedToday || completedToday);
          setOrdersGrabbed(response.data.newOrdersGrabbed || ordersGrabbed);
          setShowProgressModal(false);
          setShowConfirmationModal(true);
        } else {
          toast.error(response.message || 'Failed to select product');
          setShowProgressModal(false);
        }
      } catch (error) {
        console.error('Error taking order:', error);
        toast.error('Connection error when taking order');
        setShowProgressModal(false);
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Simulate 2 seconds of processing
  };

  const handleProgressComplete = () => {
    setShowProgressModal(false);
    setShowConfirmationModal(true);
  };

  const handleCloseModals = () => {
    setShowProgressModal(false);
    setShowConfirmationModal(false);
  };

  const handleOrderComplete = (orderData: any) => {
    // Update stats after order completion
    setCommission(prev => prev + orderData.profit);
    setAvailableBalance(prev => prev + orderData.profit);
    setCompletedToday(prev => prev + 1);
    setOrdersGrabbed(prev => prev + 1);
    
    // Close confirmation modal
    setShowConfirmationModal(false);
    setCurrentOrderData(null);
  };

  const progressPercentage = Math.min((ordersGrabbed / totalDailyTasks) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Complete orders to earn commission</p>
        </div>
        </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Order Statistics */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Progress</h2>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Orders Completed</span>
                <span>{ordersGrabbed}/{totalDailyTasks}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">${commission.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Commission</div>
          </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">${availableBalance.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Available Balance</div>
            </div>
            </div>
          </div>
        </div>

        {/* Take Order Button */}
        <div className="text-center relative z-20 mb-4 sticky bottom-4">
          <button
            onClick={handleTakeOrder}
            disabled={isLoading || ordersGrabbed >= totalDailyTasks || availableBalance < 200}
            className="inline-flex items-center justify-center w-full px-5 py-3 text-lg font-semibold text-white rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40 active:scale-[.99] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:from-blue-500 disabled:to-indigo-500"
          >
            {isLoading ? 'Processing...' : 'Take Order'}
          </button>
          
          {ordersGrabbed >= totalDailyTasks && (
            <p className="text-sm text-gray-500 mt-2">Daily limit reached</p>
          )}
          
          {availableBalance < 200 && (
            <p className="text-sm text-red-500 mt-2">Insufficient balance (minimum $200 required)</p>
          )}
        </div>

        {/* Selected product preview removed */}

        {/* Available Products grid (showcase) */}
        <div className="bg-white rounded-lg shadow-sm border p-4 relative z-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sản phẩm có sẵn</h3>
          <div className="grid grid-cols-2 gap-4">
            {allProducts.slice(0, visibleCount).map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-100 overflow-hidden bg-white">
                <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-600 truncate">{p.brand}</div>
                  <div className="text-sm text-red-500 mt-1">${p.price.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            {visibleCount < allProducts.length ? (
              <button
                onClick={() => setVisibleCount((c) => Math.min(c + 12, allProducts.length))}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Xem thêm
              </button>
            ) : (
              <button
                onClick={() => setVisibleCount(12)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700"
              >
                Thu gọn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrderProgressModal 
        isOpen={showProgressModal}
        onClose={handleCloseModals}
        onComplete={handleProgressComplete}
      />
      
      <OrderConfirmationModal 
        isOpen={showConfirmationModal}
        onClose={handleCloseModals}
        onOrderComplete={handleOrderComplete}
        orderData={currentOrderData}
      />
    </div>
  );
}