import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { OrderProgressModal } from './OrderProgressModal';
import { OrderConfirmationModal } from './OrderConfirmationModal';
import api from '../services/api';
import toast from 'react-hot-toast';

// 20 sản phẩm đồng hồ cao cấp với hình ảnh thật
const watchProducts = [
  {
    id: 1,
    name: "Submariner Date",
    brand: "Rolex",
    image: "https://content.rolex.com/dam/2024/upright-bba-with-shadow/m126610lv-0002.png",
    price: 12950
  },
  {
    id: 2,
    name: "Seamaster Diver 300M",
    brand: "Omega",
    image: "https://www.omegawatches.com/media/catalog/product/cache/a5c37fddc1a529a1a44fea55d527b9a116f3738da3a2cc38006fcc613c37c391/o/m/omega-seamaster-diver-300m-21030422003001-l.png",
    price: 5800
  },
  {
    id: 3,
    name: "Nautilus 5711",
    brand: "Patek Philippe",
    image: "https://www.patek.com/images/articles/face/5711-1A-014-face.png",
    price: 34890
  },
  {
    id: 4,
    name: "Royal Oak Automatic",
    brand: "Audemars Piguet",
    image: "https://www.audemarspiguet.com/content/dam/ap/com/products/watches/collections/royal-oak/15500ST.OO.1220ST.02/15500ST.OO.1220ST.02_angle_1.png",
    price: 28500
  },
  {
    id: 5,
    name: "Santos de Cartier",
    brand: "Cartier",
    image: "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw12345678/images/large/WSSA0029_0.png",
    price: 7250
  },
  {
    id: 6,
    name: "Carrera Calibre 16",
    brand: "TAG Heuer",
    image: "https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw12345678/TAG_Heuer_Carrera_Calibre_16_Day-Date_Automatic_watch_CV2A1R.BA0799_1.png",
    price: 4950
  },
  {
    id: 7,
    name: "Navitimer B01 Chronograph",
    brand: "Breitling",
    image: "https://www.breitling.com/media/image/3/gallery_square/asset-version-12345678/ab0138241b1p1-navitimer-b01-chronograph-43-rolled-up.png",
    price: 9250
  },
  {
    id: 8,
    name: "Portugieser Chronograph",
    brand: "IWC",
    image: "https://www.iwc.com/content/dam/rcq/iwc/21/45/67/9/2145679.png.transform.global_image_png_320_2x.png",
    price: 15200
  },
  {
    id: 9,
    name: "Reverso Classic Medium",
    brand: "Jaeger-LeCoultre",
    image: "https://www.jaeger-lecoultre.com/media/catalog/product/cache/image/e9c3970ab036de70892d86c6d221abfe/J/L/JL_Q2518410_0_a.png",
    price: 8900
  },
  {
    id: 10,
    name: "Overseas Chronograph",
    brand: "Vacheron Constantin",
    image: "https://www.vacheron-constantin.com/content/dam/rcq/vac/21/01/55/8/2101558.png.transform.vac-w610-1x.png",
    price: 32500
  },
  {
    id: 11,
    name: "Luminor Marina",
    brand: "Panerai",
    image: "https://www.panerai.com/content/dam/panerai/catalog/products/PAM01312/PAM01312_1.png.transform/panerai-zoom-860x860/image.png",
    price: 8500
  },
  {
    id: 12,
    name: "Chronomaster Sport",
    brand: "Zenith",
    image: "https://www.zenith-watches.com/media/catalog/product/cache/image/e9c3970ab036de70892d86c6d221abfe/0/3/03.3100.3600_69.m3100_a.png",
    price: 9900
  },
  {
    id: 13,
    name: "Laureato 42mm",
    brand: "Girard-Perregaux",
    image: "https://www.girard-perregaux.com/media/catalog/product/8/1/81010-11-431-11a.png",
    price: 14750
  },
  {
    id: 14,
    name: "Big Bang Unico",
    brand: "Hublot",
    image: "https://www.hublot.com/sites/default/files/styles/watch_item_desktop_1x_scale_50/public/2023-09/441.NX_.1170.RX_.png",
    price: 21800
  },
  {
    id: 15,
    name: "RM 011 Felipe Massa",
    brand: "Richard Mille",
    image: "https://www.richardmille.com/sites/default/files/rm011-fm-front.png",
    price: 145000
  },
  {
    id: 16,
    name: "Fifty Fathoms Automatique",
    brand: "Blancpain",
    image: "https://www.blancpain.com/sites/default/files/2023-09/5015-1130-71S.png",
    price: 16500
  },
  {
    id: 17,
    name: "Senator Excellence",
    brand: "Glashütte Original",
    image: "https://www.glashuette-original.com/media/catalog/product/cache/image/e9c3970ab036de70892d86c6d221abfe/1/-/1-36-01-01-02-30.png",
    price: 11950
  },
  {
    id: 18,
    name: "Lange 1",
    brand: "A. Lange & Söhne",
    image: "https://www.alange-soehne.com/assets/Modelle/LANGE-1/LANGE-1-191-032/191-032_front.png",
    price: 38500
  },
  {
    id: 19,
    name: "Classique 5177",
    brand: "Breguet",
    image: "https://www.breguet.com/sites/default/files/styles/three_quarter_scale_50/public/5177BB_29_9V6_A.png",
    price: 19800
  },
  {
    id: 20,
    name: "Chronomètre Souverain",
    brand: "F.P. Journe",
    image: "https://www.fpjourne.com/sites/default/files/CS_SS_PT_40_srgb.png",
    price: 52000
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