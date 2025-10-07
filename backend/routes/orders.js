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
    const numberOfOrders = vipLevel && vipLevel.numberOfOrders ? vipLevel.numberOfOrders : 100;

    res.json({
      success: true,
      data: {
        commission: user.commission + totalCommission,
        balance: user.balance,
        totalDailyTasks: numberOfOrders,
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

    // Diverse product catalog with real images
    const allProducts = [
      // Luxury Watches
      { id: 1, name: "Rolex Submariner", price: 8500, brand: "Rolex", category: "Watches", image: "https://24kara.com/files/sanpham/4581/1/jpg/dong-ho-rolex-submariner-date-40-m116613lb-0005-116613lb-0005-thep-oystersteel-va-vang-kim-18ct-mat-xanh-luot.jpg" },
      { id: 2, name: "Omega Speedmaster", price: 5500, brand: "Omega", category: "Watches", image: "https://i.ebayimg.com/images/g/8QMAAeSw5YNoowXB/s-l1600.webp" },
      { id: 3, name: "Patek Philippe Calatrava", price: 25000, brand: "Patek Philippe", category: "Watches", image: "https://i.ebayimg.com/images/g/srcAAeSwXdlopIOi/s-l1600.webp" },
      { id: 4, name: "Audemars Piguet Royal Oak", price: 18000, brand: "Audemars Piguet", category: "Watches", image: "https://24kara.com/files/sanpham/31574/1/jpg/dong-ho-piaget-polo-perpetual-calendar-ultra-thin-g0a48006.jpg" },
      { id: 5, name: "Cartier Santos", price: 7200, brand: "Cartier", category: "Watches", image: "https://bizweb.dktcdn.net/100/175/988/products/wro16ms27rb21aa-1-copy.jpg?v=1722223341387" },
      
      // Luxury Handbags
      { id: 21, name: "Hermès Birkin Bag", price: 15000, brand: "Hermès", category: "Handbags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop" },
      { id: 22, name: "Chanel Classic Flap", price: 8500, brand: "Chanel", category: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop" },
      { id: 23, name: "Louis Vuitton Neverfull", price: 2200, brand: "Louis Vuitton", category: "Handbags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop" },
      { id: 24, name: "Gucci Dionysus", price: 2800, brand: "Gucci", category: "Handbags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop" },
      { id: 25, name: "Dior Lady Dior", price: 4500, brand: "Dior", category: "Handbags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop" },
      
      // Fashion & Clothing
      { id: 31, name: "Balenciaga Triple S Sneakers", price: 1200, brand: "Balenciaga", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop" },
      { id: 32, name: "Off-White Air Jordan 1", price: 1800, brand: "Off-White", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop" },
      { id: 33, name: "Yeezy Boost 350", price: 800, brand: "Adidas", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop" },
      { id: 34, name: "Gucci Ace Sneakers", price: 650, brand: "Gucci", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop" },
      { id: 35, name: "Versace Medusa Sneakers", price: 950, brand: "Versace", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=500&fit=crop" },
      
      // Jewelry
      { id: 41, name: "Tiffany & Co. Diamond Ring", price: 12000, brand: "Tiffany & Co.", category: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop" },
      { id: 42, name: "Cartier Love Bracelet", price: 8500, brand: "Cartier", category: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop" },
      { id: 43, name: "Bulgari Serpenti Necklace", price: 15000, brand: "Bulgari", category: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop" },
      { id: 44, name: "Van Cleef & Arpels Alhambra", price: 3500, brand: "Van Cleef & Arpels", category: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop" },
      { id: 45, name: "Chopard Happy Diamonds", price: 22000, brand: "Chopard", category: "Jewelry", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop" },
      
      // Fashion Accessories
      { id: 51, name: "Hermès Silk Scarf", price: 450, brand: "Hermès", category: "Accessories", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop" },
      { id: 52, name: "Gucci GG Belt", price: 650, brand: "Gucci", category: "Accessories", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop" },
      { id: 53, name: "Louis Vuitton Monogram Wallet", price: 750, brand: "Louis Vuitton", category: "Accessories", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop" },
      { id: 54, name: "Chanel Quilted Sunglasses", price: 550, brand: "Chanel", category: "Accessories", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop" },
      { id: 55, name: "Prada Nylon Backpack", price: 1200, brand: "Prada", category: "Accessories", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop" },

      // Tech & Electronics
      { id: 61, name: "Apple iPhone 15 Pro", price: 1299, brand: "Apple", category: "Electronics", image: "https://images.unsplash.com/photo-1695048130818-3cf2a2e3c1b5?w=500&h=500&fit=crop" },
      { id: 62, name: "Samsung Galaxy S24 Ultra", price: 1199, brand: "Samsung", category: "Electronics", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=500&fit=crop" },
      { id: 63, name: "Sony WH-1000XM5 Headphones", price: 399, brand: "Sony", category: "Electronics", image: "https://images.unsplash.com/photo-1518444028785-8f9f2a1f4d8b?w=500&h=500&fit=crop" },
      { id: 64, name: "Canon EOS R6 Camera", price: 2499, brand: "Canon", category: "Electronics", image: "https://images.unsplash.com/photo-1519183071298-a2962be96f83?w=500&h=500&fit=crop" },
      { id: 65, name: "Apple MacBook Pro 14\"", price: 1999, brand: "Apple", category: "Electronics", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop" },
      { id: 66, name: "iPad Pro 12.9\"", price: 1299, brand: "Apple", category: "Electronics", image: "https://images.unsplash.com/photo-1584735175315-9d5df9b4e2ae?w=500&h=500&fit=crop" },
      { id: 67, name: "Nintendo Switch OLED", price: 349, brand: "Nintendo", category: "Electronics", image: "https://images.unsplash.com/photo-1614292251646-6efc2d0df2ff?w=500&h=500&fit=crop" },
      { id: 68, name: "DJI Mini 4 Pro Drone", price: 959, brand: "DJI", category: "Electronics", image: "https://images.unsplash.com/photo-1505744386214-51f5d51b1fd5?w=500&h=500&fit=crop" },
      { id: 69, name: "GoPro Hero 12", price: 399, brand: "GoPro", category: "Electronics", image: "https://images.unsplash.com/photo-1519183071298-a2962be96f83?w=500&h=500&fit=crop" },
      { id: 70, name: "Kindle Paperwhite", price: 159, brand: "Amazon", category: "Electronics", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=500&fit=crop" },

      // Beauty
      { id: 71, name: "Dyson Supersonic Hair Dryer", price: 429, brand: "Dyson", category: "Beauty", image: "https://images.unsplash.com/photo-1500840216050-6ffa99d75147?w=500&h=500&fit=crop" },
      { id: 72, name: "La Mer Moisturizing Cream", price: 345, brand: "La Mer", category: "Beauty", image: "https://images.unsplash.com/photo-1585238341986-35f370b2823d?w=500&h=500&fit=crop" },
      { id: 73, name: "Chanel No.5 Perfume", price: 150, brand: "Chanel", category: "Beauty", image: "https://images.unsplash.com/photo-1592945403244-2818f7b2b0f3?w=500&h=500&fit=crop" },
      { id: 74, name: "Dior Lip Glow", price: 40, brand: "Dior", category: "Beauty", image: "https://images.unsplash.com/photo-1617051166131-8f9d24d78208?w=500&h=500&fit=crop" },
      { id: 75, name: "SK-II Facial Treatment Essence", price: 185, brand: "SK-II", category: "Beauty", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&h=500&fit=crop" },

      // Sports & Outdoors
      { id: 81, name: "Garmin Fenix 7", price: 699, brand: "Garmin", category: "Sports", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop" },
      { id: 82, name: "Theragun Elite", price: 399, brand: "Therabody", category: "Sports", image: "https://images.unsplash.com/photo-1617957743124-4f538a6e7ca3?w=500&h=500&fit=crop" },
      { id: 83, name: "Adidas Ultraboost 22", price: 180, brand: "Adidas", category: "Sports", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop" },
      { id: 84, name: "Nike Air Zoom Pegasus", price: 140, brand: "Nike", category: "Sports", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop" },
      { id: 85, name: "Specialized Road Bike", price: 2999, brand: "Specialized", category: "Sports", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&h=500&fit=crop" },

      // Home & Living
      { id: 91, name: "Dyson V15 Detect Vacuum", price: 699, brand: "Dyson", category: "Home", image: "https://images.unsplash.com/photo-1604335399105-dce77e7b4b5b?w=500&h=500&fit=crop" },
      { id: 92, name: "Nespresso Vertuo Next", price: 199, brand: "Nespresso", category: "Home", image: "https://images.unsplash.com/photo-1526406915894-6c1d6c1d0d9b?w=500&h=500&fit=crop" },
      { id: 93, name: "KitchenAid Stand Mixer", price: 399, brand: "KitchenAid", category: "Home", image: "https://images.unsplash.com/photo-1586201375761-83865001e31b?w=500&h=500&fit=crop" },
      { id: 94, name: "Le Creuset Dutch Oven", price: 379, brand: "Le Creuset", category: "Home", image: "https://images.unsplash.com/photo-1590165482129-1b8a2d3bdc52?w=500&h=500&fit=crop" },
      { id: 95, name: "Philips Airfryer XXL", price: 299, brand: "Philips", category: "Home", image: "https://images.unsplash.com/photo-1567016523899-2f3b73d9f027?w=500&h=500&fit=crop" },

      // Toys & Kids
      { id: 101, name: "LEGO Technic Porsche 911", price: 349, brand: "LEGO", category: "Toys", image: "https://images.unsplash.com/photo-1617957771976-44e07dc58035?w=500&h=500&fit=crop" },
      { id: 102, name: "Hot Wheels Mega Garage", price: 89, brand: "Hot Wheels", category: "Toys", image: "https://images.unsplash.com/photo-1547414367-76bcadfb4f2c?w=500&h=500&fit=crop" },
      { id: 103, name: "Barbie Dreamhouse", price: 199, brand: "Mattel", category: "Toys", image: "https://images.unsplash.com/photo-1606207893121-7e3b1f78f3ea?w=500&h=500&fit=crop" },
      { id: 104, name: "Nintendo Pokémon Game", price: 59, brand: "Nintendo", category: "Toys", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=500&fit=crop" },
      { id: 105, name: "Razor Electric Scooter", price: 259, brand: "Razor", category: "Toys", image: "https://images.unsplash.com/photo-1520974841046-6c0e3f7c3b58?w=500&h=500&fit=crop" }
    ];

    // Filter products that user can afford
    const affordableProducts = allProducts.filter(product => product.price <= user.balance);
    
    // Check if there are any products within user's budget
    if (affordableProducts.length === 0) {
      const minPrice = Math.min(...allProducts.map(p => p.price));
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
          productId: randomProduct.id,
          category: randomProduct.category,
          image: randomProduct.image
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
