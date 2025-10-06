const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { getVipLevelByAmount } = require('../config/vipLevels');
const { authenticateToken } = require('../middleware/auth');

// GET /api/orders/stats - Get user order statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get today's orders
    const todayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    // Calculate commission from completed orders
    const completedOrders = todayOrders.filter(order => order.status === 'completed');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    // Get VIP level info
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const commissionRate = vipLevel ? vipLevel.commissionRate : 0;

    res.json({
      success: true,
      data: {
        commission: user.commission + totalCommission,
        balance: user.balance,
        totalDailyTasks: 100,
        completedToday: completedOrders.length,
        ordersGrabbed: todayOrders.length,
        vipLevel: user.vipLevel,
        commissionRate: commissionRate
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics'
    });
  }
});

// POST /api/orders/take - Take a new order
router.post('/take', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check daily limit
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    if (todayOrders.length >= 100) {
      return res.status(400).json({
        success: false,
        message: 'Daily order limit reached (100 orders)'
      });
    }

    // Get VIP level and commission rate
    const vipLevel = getVipLevelByAmount(user.totalDeposited);
    const commissionRate = vipLevel ? vipLevel.commissionRate : 0;

    // Use the same 20 watch products from frontend
    const watchProducts = [
      { id: 1, name: "Rolex Submariner", price: 8500, brand: "Rolex" },
      { id: 2, name: "Omega Speedmaster", price: 5500, brand: "Omega" },
      { id: 3, name: "Patek Philippe Calatrava", price: 25000, brand: "Patek Philippe" },
      { id: 4, name: "Audemars Piguet Royal Oak", price: 18000, brand: "Audemars Piguet" },
      { id: 5, name: "Cartier Santos", price: 7200, brand: "Cartier" },
      { id: 6, name: "TAG Heuer Carrera", price: 3200, brand: "TAG Heuer" },
      { id: 7, name: "Breitling Navitimer", price: 4800, brand: "Breitling" },
      { id: 8, name: "IWC Portugieser", price: 12000, brand: "IWC" },
      { id: 9, name: "Jaeger-LeCoultre Reverso", price: 9500, brand: "Jaeger-LeCoultre" },
      { id: 10, name: "Vacheron Constantin Overseas", price: 22000, brand: "Vacheron Constantin" },
      { id: 11, name: "Panerai Luminor", price: 6800, brand: "Panerai" },
      { id: 12, name: "Zenith El Primero", price: 7500, brand: "Zenith" },
      { id: 13, name: "Girard-Perregaux Laureato", price: 15000, brand: "Girard-Perregaux" },
      { id: 14, name: "Hublot Big Bang", price: 16000, brand: "Hublot" },
      { id: 15, name: "Richard Mille RM 011", price: 45000, brand: "Richard Mille" },
      { id: 16, name: "Blancpain Fifty Fathoms", price: 11000, brand: "Blancpain" },
      { id: 17, name: "Glashütte Original Senator", price: 8500, brand: "Glashütte Original" },
      { id: 18, name: "A. Lange & Söhne Lange 1", price: 35000, brand: "A. Lange & Söhne" },
      { id: 19, name: "Breguet Classique", price: 28000, brand: "Breguet" },
      { id: 20, name: "F.P. Journe Chronomètre", price: 40000, brand: "F.P. Journe" }
    ];

    // Filter products that user can afford
    const affordableProducts = watchProducts.filter(product => product.price <= user.balance);
    
    // Check if there are any products within user's budget
    if (affordableProducts.length === 0) {
      const minPrice = Math.min(...watchProducts.map(p => p.price));
      return res.status(400).json({
        success: false,
        message: `No products available within your budget. Minimum product price is $${minPrice.toLocaleString()} but you only have $${user.balance.toLocaleString()}. Please deposit more money to your account.`
      });
    }
    
    // Select random product from affordable products only
    const randomProduct = affordableProducts[Math.floor(Math.random() * affordableProducts.length)];
    
    // Calculate commission
    const commissionAmount = (randomProduct.price * commissionRate) / 100;

    // Don't create order yet - just return the selected product for confirmation

    // Get updated stats
    const updatedTodayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const completedOrders = updatedTodayOrders.filter(order => order.status === 'completed');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    res.json({
      success: true,
      data: {
        newCommission: user.commission,
        newBalance: user.balance,
        newCompletedToday: completedOrders.length,
        newOrdersGrabbed: updatedTodayOrders.length,
        selectedProduct: {
          productName: randomProduct.name,
          productPrice: randomProduct.price,
          commissionAmount: commissionAmount,
          commissionRate: commissionRate,
          brand: randomProduct.brand,
          productId: randomProduct.id
        }
      }
    });
  } catch (error) {
    console.error('Error taking order:', error);
    res.status(500).json({
      success: false,
      message: 'Error taking order'
    });
  }
});

// POST /api/orders/complete - Create and complete an order
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { productData } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        message: 'Product data is required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user still has sufficient balance
    if (user.balance < productData.productPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to complete this order'
      });
    }

    // Create new order with completed status
    const newOrder = new Order({
      userId: userId,
      productId: productData.productId,
      productName: productData.productName,
      productPrice: productData.productPrice,
      commissionRate: productData.commissionRate,
      commissionAmount: productData.commissionAmount,
      status: 'completed',
      completedAt: new Date(),
      orderDate: new Date()
    });

    await newOrder.save();

    // Update user balance and commission
    user.balance += newOrder.commissionAmount;
    user.commission += newOrder.commissionAmount;
    await user.save();

    // Get updated stats
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const updatedTodayOrders = await Order.find({
      userId: userId,
      orderDate: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const completedOrders = updatedTodayOrders.filter(order => order.status === 'completed');
    const totalCommission = completedOrders.reduce((sum, order) => sum + order.commissionAmount, 0);

    res.json({
      success: true,
      data: {
        newCommission: user.commission,
        newBalance: user.balance,
        newCompletedToday: completedOrders.length,
        newOrdersGrabbed: updatedTodayOrders.length,
        order: {
          productName: newOrder.productName,
          productPrice: newOrder.productPrice,
          commissionAmount: newOrder.commissionAmount
        }
      }
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing order'
    });
  }
});

// GET /api/orders/history - Get order history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order history'
    });
  }
});

module.exports = router;
