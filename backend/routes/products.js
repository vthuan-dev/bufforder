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

    // Helper: Deduplicate by product name and image
    const deduplicateItems = (items) => {
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
      return result;
    };

    // Helper: Stratified Category Sampling - guarantees even representation across all categories
    // This prevents any single category (like Handbags) from dominating the candidate pool
    const stratifyByCategory = (items, targetLimit = 100) => {
      const unique = deduplicateItems(items);
      const byCat = {};

      for (const item of unique) {
        const cat = item.category || 'Khác';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(item);
      }

      // Fisher-Yates shuffle products within each category
      const categories = Object.keys(byCat);
      for (const cat of categories) {
        const list = byCat[cat];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }

      // Round-robin selection evenly across all categories
      const result = [];
      let round = 0;
      let added = true;

      while (result.length < targetLimit && added) {
        added = false;
        // Shuffle category order per round for fairness
        const shuffledCats = [...categories].sort(() => Math.random() - 0.5);
        for (const cat of shuffledCats) {
          if (byCat[cat] && byCat[cat].length > round) {
            result.push(byCat[cat][round]);
            added = true;
            if (result.length >= targetLimit) break;
          }
        }
        round++;
      }

      // Final shuffle of the combined pool
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result.slice(0, targetLimit);
    };

    let finalProducts = [];

    if (targetProductPrice && targetProductPrice > 0) {
      let minPrice = targetProductPrice * 0.85; // -15%
      let maxPrice = targetProductPrice * 1.15; // +15%

      // 1. Fetch wide pool of products within user's target price range across all categories
      let normalProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          price: { gte: minPrice, lte: maxPrice }
        },
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          price: true,
          image: true,
          isActive: true
        },
        take: 1500
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
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
            price: true,
            image: true,
            isActive: true
          },
          take: 1500
        });
      }

      // Stratify normal products across available categories (up to 85 items)
      finalProducts = stratifyByCategory(normalProducts, 85);

      // 2. If freeze is enabled, include diverse luxury products (> balance)
      if (freezeConfig.enabled) {
        const luxuryProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            price: { gt: userBalance + 0.01 }
          },
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
            price: true,
            image: true,
            isActive: true
          },
          take: 100
        });
        const stratifiedLuxury = stratifyByCategory(luxuryProducts, 15);
        finalProducts.push(...stratifiedLuxury);
      }

      console.log(`[Products API] Filtering for user ${userId}: normal range=[$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)}], found=${normalProducts.length}, stratified=${finalProducts.length}`);
    } else {
      // No target price configured: fetch active products across all categories and stratify
      const allActive = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          price: true,
          image: true,
          isActive: true
        },
        take: 2000
      });
      finalProducts = stratifyByCategory(allActive, 100);
    }

    // Ensure the freeze target product is ALWAYS included if configured
    if (freezeConfig.targetProductId) {
      const targetId = parseInt(freezeConfig.targetProductId);
      const exists = finalProducts.some(p => p.id === targetId);
      if (!exists) {
        const tp = await prisma.product.findUnique({
          where: { id: targetId },
          select: { id: true, name: true, brand: true, category: true, price: true, image: true, isActive: true }
        });
        if (tp) finalProducts.unshift(tp);
      }
    }

    console.log(`[Products API] Returning ${finalProducts.length} unique stratified products for user ${userId}`);

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
