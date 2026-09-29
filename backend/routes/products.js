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

    let rawProducts = [];

    // Helper: Deduplicate by product name and image, then Fisher-Yates shuffle
    const deduplicateAndShuffle = (items, limit = 80) => {
      const seenNames = new Set();
      const seenImages = new Set();
      const result = [];

      for (const item of items) {
        // Normalize name: lowercase, alpha-numeric, first 3 words
        const normName = (item.name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .slice(0, 3)
          .join(' ');

        // Normalize image URL: ignore query strings
        const normImage = (item.image || '')
          .split('?')[0]
          .trim()
          .toLowerCase();

        if (normName && !seenNames.has(normName) && (!normImage || !seenImages.has(normImage))) {
          seenNames.add(normName);
          if (normImage) seenImages.add(normImage);
          result.push(item);
        }
      }

      // Fisher-Yates shuffle
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result.slice(0, limit);
    };

    if (targetProductPrice && targetProductPrice > 0) {
      let minPrice = targetProductPrice * 0.85; // -15%
      let maxPrice = targetProductPrice * 1.15; // +15%

      // 1. Fetch products within user's target price range
      let normalProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          price: { gte: minPrice, lte: maxPrice }
        },
        take: 300
      });

      // If pool is small (< 40), broaden to ±25% for rich product diversity
      if (normalProducts.length < 40) {
        minPrice = targetProductPrice * 0.75;
        maxPrice = targetProductPrice * 1.25;
        normalProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            price: { gte: minPrice, lte: maxPrice }
          },
          take: 300
        });
      }

      rawProducts.push(...normalProducts);

      // 2. If admin specified a target product for freeze, always include it
      let targetProduct = null;
      if (freezeConfig.targetProductId) {
        targetProduct = await prisma.product.findUnique({
          where: { id: parseInt(freezeConfig.targetProductId) }
        });
        if (targetProduct && targetProduct.isActive) {
          rawProducts.push(targetProduct);
        }
      }

      // 3. If freeze is enabled, include a diverse set of luxury products (> balance)
      if (freezeConfig.enabled) {
        const luxuryProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            price: { gt: userBalance + 0.01 }
          },
          take: 40
        });
        rawProducts.push(...luxuryProducts);
      }

      console.log(`[Products API] Filtering for user ${userId}: normal range=[$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}], normalFound=${normalProducts.length}, targetProductId=${freezeConfig.targetProductId}`);
    } else {
      // No target price configured: fetch active products across categories
      rawProducts = await prisma.product.findMany({
        where: { isActive: true },
        take: 300
      });
    }

    // Deduplicate and randomize
    const finalProducts = deduplicateAndShuffle(rawProducts, 100);

    // Ensure the freeze target product is ALWAYS included if configured
    if (freezeConfig.targetProductId) {
      const targetId = parseInt(freezeConfig.targetProductId);
      const exists = finalProducts.some(p => p.id === targetId);
      if (!exists) {
        const tp = await prisma.product.findUnique({ where: { id: targetId } });
        if (tp) finalProducts.unshift(tp);
      }
    }

    console.log(`[Products API] Returning ${finalProducts.length} unique products for user ${userId}`);

    res.json({
      success: true,
      data: finalProducts
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
