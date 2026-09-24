const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const { parseJsonField, getFreezeConfig } = require('../lib/utils');

// GET /api/products - Lấy danh sách sản phẩm (authenticated - filter by user's target price)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's commission config to check for target product price
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { commissionConfig: true, balance: true, isFrozen: true, vipLevel: true }
    });
    
    const commissionConfig = parseJsonField(user?.commissionConfig, {});
    const targetProductPrice = commissionConfig.targetProductPrice;
    const freezeConfig = getFreezeConfig(user);
    const userBalance = Number(user?.balance || 0);
    
    let whereClause = { isActive: true };
    
    // If user has a target product price, filter products within ±15% range for normal orders,
    // while ALSO including the freeze target product and expensive products (> balance)
    if (targetProductPrice && targetProductPrice > 0) {
      const minPrice = targetProductPrice * 0.85; // -15%
      const maxPrice = targetProductPrice * 1.15; // +15%
      
      const orConditions = [
        { price: { gte: minPrice, lte: maxPrice } }
      ];

      // 1. If admin specified a target product for freeze, always include it
      if (freezeConfig.targetProductId) {
        orConditions.push({ id: parseInt(freezeConfig.targetProductId) });
      }

      // 2. If freeze is enabled (random or custom), always include expensive products (> balance)
      // so there is always a pool of products available to trigger freeze
      if (freezeConfig.enabled) {
        orConditions.push({ price: { gt: userBalance + 0.01 } });
      }

      whereClause = {
        isActive: true,
        OR: orConditions
      };
      
      console.log(`[Products API] Filtering for user ${userId}: normal range=[$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}], targetProductId=${freezeConfig.targetProductId}, freezeEnabled=${freezeConfig.enabled}`);
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { id: 'asc' }
    });

    console.log(`[Products API] Returning ${products.length} products for user ${userId}`);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách sản phẩm'
    });
  }
});

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin sản phẩm'
    });
  }
});

module.exports = router;
