import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { OrderProgressModal } from './OrderProgressModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import api from '../services/api';
import toast from 'react-hot-toast';

// 20 sản phẩm đồng hồ ngẫu nhiên
const watchProducts = [
  {
    id: 1,
    name: "Rolex Submariner",
    brand: "Rolex",
    image: "https://24kara.com/files/sanpham/4581/1/jpg/dong-ho-rolex-submariner-date-40-m116613lb-0005-116613lb-0005-thep-oystersteel-va-vang-kim-18ct-mat-xanh-luot.jpg",
    price: 8500
  },
  {
    id: 2,
    name: "Omega Speedmaster",
    brand: "Omega",
    image: "https://i.ebayimg.com/images/g/8QMAAeSw5YNoowXB/s-l1600.webp",
    price: 5500
  },
  {
    id: 3,
    name: "Patek Philippe Calatrava",
    brand: "Patek Philippe",
    image: "https://i.ebayimg.com/images/g/srcAAeSwXdlopIOi/s-l1600.webp",
    price: 25000,
  },
  {
    id: 4,
    name: "Audemars Piguet Royal Oak",
    brand: "Audemars Piguet",
    image: "https://24kara.com/files/sanpham/31574/1/jpg/dong-ho-piaget-polo-perpetual-calendar-ultra-thin-g0a48006.jpg",
    price: 18000,
  },
  {
    id: 5,
    name: "Cartier Santos",
    brand: "Cartier",
    image: "https://bizweb.dktcdn.net/100/175/988/products/wro16ms27rb21aa-1-copy.jpg?v=1722223341387",
    price: 7200,
  },
  {
    id: 6,
    name: "TAG Heuer Carrera",
    brand: "TAG Heuer",
    image: "https://i.ebayimg.com/images/g/racAAeSwJrBoprh~/s-l1600.webp",
    price: 3200,
  },
  {
    id: 7,
    name: "Breitling Navitimer",
    brand: "Breitling",
    image: "https://24kara.com/files/sanpham/17101/1/jpg/dong-ho-breitling-chronomat-b01-bentley-ab01343a1l1a1.jpg",
    price: 4800,
  },
  {
    id: 8,
    name: "IWC Portugieser",
    brand: "IWC",
    image: "https://i.ebayimg.com/images/g/TzgAAeSwFb5o3ZQe/s-l1600.webp",
    price: 12000,
  },
  {
    id: 9,
    name: "Jaeger-LeCoultre Reverso",
    brand: "Jaeger-LeCoultre",
    image: "https://cdn.casio-vietnam.vn/wp-content/uploads/2021/12/EFV-500GL-2AV.png",
    price: 9500,
  },
  {
    id: 10,
    name: "Vacheron Constantin Overseas",
    brand: "Vacheron Constantin",
    image: "https://paganidesign.vn/wp-content/uploads/2024/09/clbb15.png",
    price: 22000,
  },
  {
    id: 11,
    name: "Panerai Luminor",
    brand: "Panerai",
    image: "https://cdn.casio-vietnam.vn/wp-content/uploads/2021/04/ECB-900GL-1A.png",
    price: 6800,
  },
  {
    id: 12,
    name: "Zenith El Primero",
    brand: "Zenith",
    image: "https://cdn.casio-vietnam.vn/wp-content/uploads/2019/09/EFR-549L-7BV.png",
    price: 7500,
  },
  {
    id: 13,
    name: "Girard-Perregaux Laureato",
    brand: "Girard-Perregaux",
    image: "https://24kara.com/files/sanpham/17281/1/jpg/dong-ho-girard-perregaux-laureato-81010-11-431-11a.jpg",
    price: 15000,
  },
  {
    id: 14,
    name: "Hublot Big Bang",
    brand: "Hublot",
    image: "hhttps://cdn.casio-vietnam.vn/wp-content/uploads/2019/08/MRG-G2000HA-1A.png",
    price: 16000,
  },
  {
    id: 15,
    name: "Richard Mille RM 011",
    brand: "Richard Mille",
    image: "https://picsum.photos/seed/watch-15/300/300",
    price: 45000,
  },
  {
    id: 16,
    name: "Blancpain Fifty Fathoms",
    brand: "Blancpain",
    image: "https://picsum.photos/seed/watch-16/300/300",
    price: 11000,
  },
  {
    id: 17,
    name: "Glashütte Original Senator",
    brand: "Glashütte Original",
    image: "https://picsum.photos/seed/watch-17/300/300",
    price: 8500,
  },
  {
    id: 18,
    name: "A. Lange & Söhne Lange 1",
    brand: "A. Lange & Söhne",
    image: "https://picsum.photos/seed/watch-18/300/300",
    price: 35000,
  },
  {
    id: 19,
    name: "Breguet Classique",
    brand: "Breguet",
    image: "https://picsum.photos/seed/watch-19/300/300",
    price: 28000,
  },
  {
    id: 20,
    name: "F.P. Journe Chronomètre",
    brand: "F.P. Journe",
    image: "https://picsum.photos/seed/watch-20/300/300",
    price: 40000,
  }
];

export function OrdersPage() {
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // Dynamic data states
  const [commission, setCommission] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalDailyTasks, setTotalDailyTasks] = useState(100);
  const [completedToday, setCompletedToday] = useState(0);
  const [ordersGrabbed, setOrdersGrabbed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Order data states
  const [currentOrderData, setCurrentOrderData] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Fetch order stats from backend
  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để xem thông tin đơn hàng');
        return;
      }

      const response = await api.getOrderStats(token);
      if (response.success) {
        setCommission(response.data.commission || 0);
        setAvailableBalance(response.data.balance || 0);
        const tasksFromStats = response.data.totalDailyTasks;
        if (typeof tasksFromStats === 'number' && tasksFromStats > 0) {
          setTotalDailyTasks(tasksFromStats);
        } else {
          // Fallback: derive from VIP status
          try {
            const vipRes = await api.getVipStatus(token);
            const numOrders = vipRes?.data?.currentLevel?.numberOfOrders;
            setTotalDailyTasks(typeof numOrders === 'number' ? numOrders : 100);
          } catch {
            setTotalDailyTasks(100);
          }
        }
        setCompletedToday(response.data.completedToday || 0);
        setOrdersGrabbed(response.data.ordersGrabbed || 0);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
      // Use fallback data if API fails
      setCommission(4.71);
      setAvailableBalance(10039.30);
      setTotalDailyTasks(100);
      setCompletedToday(0);
      setOrdersGrabbed(0);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrderStats();
  }, []);

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

  const handleOrderComplete = (orderData) => {
    // Update stats when order is completed
    setCommission(prev => prev + orderData.profit);
    setAvailableBalance(prev => prev + orderData.profit);
    setCompletedToday(prev => prev + 1);
    
    toast.success('Order completed successfully!');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Content Section */}
      <div className="flex-1 px-4 py-6">
        {/* Sample Image */}
        <div className="mb-6">
          <img 
            src="https://cdn.pixabay.com/photo/2016/06/16/16/44/clock-1461689_1280.jpg" 
            alt="Sample Order Image" 
            className="w-full h-48 object-cover rounded-lg shadow-md"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/400x200?text=Sample+Order+Image";
            }}
          />
        </div>

        {/* Take Order Button */}
        <Button 
          onClick={handleTakeOrder}
          className="w-full bg-gray-800 text-white py-4 rounded-xl hover:bg-gray-700 mb-8"
          disabled={isLoading || ordersGrabbed >= totalDailyTasks || availableBalance < 200}
        >
          {isLoading ? 'Processing...' : 
           availableBalance < 200 ? 'No Products Available' : 
           ordersGrabbed >= totalDailyTasks ? 'Completed Today' : 'TAKE ORDER'}
        </Button>

        {/* Key Metrics Grid */}
        <div className="space-y-6">
          {/* Top Row */}
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Get commission</p>
              <p className="text-red-500 text-2xl">{commission.toFixed(2)}$</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Available balance</p>
              <p className="text-blue-600 text-2xl font-bold">{availableBalance.toFixed(2)}$</p>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Today is Tasks</p>
              <p className="text-gray-800 text-2xl">{totalDailyTasks}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Completed today</p>
              <p className="text-gray-800 text-2xl">{completedToday}</p>
            </div>
          </div>
        </div>

        {/* Number of Orders Grabbed */}
        <div className="mt-8 mb-6">
          <div className="text-center">
            <p className="text-gray-600 text-lg font-medium mb-2">Number of Orders Grabbed</p>
            <p className="text-3xl font-bold text-gray-800">{ordersGrabbed}/{totalDailyTasks}</p>
          </div>
        </div>

        {/* Procedure Instructions */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Procedure:</h3>
          <div className="space-y-2 text-blue-700">
            <p>1. Click the "Start Task" button and follow the prompts to complete the task.</p>
            <p>2. After completing the task, you can settle the commission to the balance</p>
          </div>
        </div>

        {/* Watch Products Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Available Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {watchProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x300?text=Watch";
                    }}
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{product.brand}</h4>
                  <p className="text-xs text-gray-600 mb-2">{product.name}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Unit price: ${product.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
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