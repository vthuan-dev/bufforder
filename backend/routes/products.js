const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

// Helper to parse JSON field safely
function parseJsonField(field, defaultValue = {}) {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field;
  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
}

// GET /api/products - Lấy danh sách sản phẩm (authenticated - filter by user's target price)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's commission config to check for target product price
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { commissionConfig: true }
    });
    
    const commissionConfig = parseJsonField(user?.commissionConfig, {});
    const targetProductPrice = commissionConfig.targetProductPrice;
    
    let whereClause = { isActive: true };
    
    // If user has a target product price, filter products within ±15% range
    if (targetProductPrice && targetProductPrice > 0) {
      const minPrice = targetProductPrice * 0.85; // -15%
      const maxPrice = targetProductPrice * 1.15; // +15%
      
      whereClause.price = {
        gte: minPrice,
        lte: maxPrice
      };
      
      console.log(`[Products API] Filtering for user ${userId}: target=$${targetProductPrice}, range=$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}`);
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
