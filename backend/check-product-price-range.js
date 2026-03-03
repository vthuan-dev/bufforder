#!/usr/bin/env node

/**
 * Product Price Range Checker
 * Kiểm tra phân bố giá sản phẩm trong database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductPriceRange() {
  console.log('💰 CHECKING PRODUCT PRICE RANGE...\n');
  console.log('='.repeat(80));

  try {
    // 1. Basic Statistics
    console.log('\n📊 1. BASIC PRICE STATISTICS');
    console.log('-'.repeat(80));

    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_products,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        STDDEV(price) as std_dev
      FROM product
      WHERE isActive = 1
    `;

    const stat = stats[0];
    console.log(`Total Products    : ${stat.total_products.toLocaleString()}`);
    console.log(`Min Price         : $${stat.min_price.toFixed(2)}`);
    console.log(`Max Price         : $${stat.max_price.toFixed(2)}`);
    console.log(`Average Price     : $${stat.avg_price.toFixed(2)}`);
    console.log(`Standard Deviation: $${stat.std_dev ? stat.std_dev.toFixed(2) : 'N/A'}`);

    // 2. Price Distribution by Ranges
    console.log('\n\n📈 2. PRICE DISTRIBUTION BY RANGES');
    console.log('-'.repeat(80));

    const ranges = [
      { min: 0, max: 50, label: '$0 - $50' },
      { min: 50, max: 100, label: '$50 - $100' },
      { min: 100, max: 200, label: '$100 - $200' },
      { min: 200, max: 500, label: '$200 - $500' },
      { min: 500, max: 1000, label: '$500 - $1,000' },
      { min: 1000, max: 2000, label: '$1,000 - $2,000' },
      { min: 2000, max: 5000, label: '$2,000 - $5,000' },
      { min: 5000, max: 10000, label: '$5,000 - $10,000' },
      { min: 10000, max: 999999, label: '$10,000+' }
    ];

    const totalProducts = Number(stat.total_products);
    const rangeData = [];
    
    for (const range of ranges) {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM product
        WHERE isActive = 1
          AND price >= ${range.min}
          AND price < ${range.max}
      `;
      
      const count = Number(result[0].count);
      rangeData.push({ ...range, count });
    }

    // Find max count for scaling
    const maxCount = Math.max(...rangeData.map(r => r.count));
    
    console.log('\n');
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                     PRODUCT PRICE DISTRIBUTION CHART                        │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    console.log('│                                                                             │');
    
    // Print chart from top to bottom
    const chartHeight = 15;
    for (let h = chartHeight; h > 0; h--) {
      let line = '│ ';
      for (const range of rangeData) {
        const barHeight = Math.round((range.count / maxCount) * chartHeight);
        if (barHeight >= h) {
          line += '████ ';
        } else {
          line += '     ';
        }
      }
      line += ' │';
      console.log(line);
    }
    
    // Print x-axis
    console.log('│ ' + '─────'.repeat(9) + ' │');
    console.log('│ $0-50 $50  $100 $200 $500 $1K  $2K  $5K  $10K+│');
    console.log('│       $100 $200 $500 $1K  $2K  $5K  $10K      │');
    console.log('│                                                                             │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ Price Range          │ Count    │ Percentage │ Products                    │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');
    
    for (const range of rangeData) {
      const percentage = ((range.count / totalProducts) * 100).toFixed(1);
      const barLength = Math.round((range.count / totalProducts) * 30);
      const bar = '█'.repeat(barLength);
      
      console.log(
        `│ ${range.label.padEnd(20)} │ ${range.count.toString().padStart(8)} │ ${percentage.padStart(6)}%   │ ${bar.padEnd(28)}│`
      );
    }
    
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');

    // 3. Price Distribution by Category
    console.log('\n\n📦 3. PRICE STATISTICS BY CATEGORY');
    console.log('-'.repeat(80));

    const categoryStats = await prisma.$queryRaw`
      SELECT 
        category,
        COUNT(*) as count,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM product
      WHERE isActive = 1
      GROUP BY category
      ORDER BY count DESC
    `;

    console.log('\nCategory              | Count  | Min Price  | Max Price   | Avg Price');
    console.log('-'.repeat(80));

    categoryStats.forEach(cat => {
      console.log(
        `${cat.category.padEnd(20)} | ${cat.count.toString().padStart(6)} | $${cat.min_price.toFixed(2).padStart(9)} | $${cat.max_price.toFixed(2).padStart(10)} | $${cat.avg_price.toFixed(2).padStart(9)}`
      );
    });

    // 4. Top 10 Most Expensive Products
    console.log('\n\n💎 4. TOP 10 MOST EXPENSIVE PRODUCTS');
    console.log('-'.repeat(80));

    const expensive = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { price: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true
      }
    });

    expensive.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Brand: ${product.brand} | Category: ${product.category}`);
      console.log(`   Price: $${product.price.toFixed(2)}`);
    });

    // 5. Top 10 Cheapest Products
    console.log('\n\n💵 5. TOP 10 CHEAPEST PRODUCTS');
    console.log('-'.repeat(80));

    const cheapest = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        price: true
      }
    });

    cheapest.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Brand: ${product.brand} | Category: ${product.category}`);
      console.log(`   Price: $${product.price.toFixed(2)}`);
    });

    // 6. Price Percentiles
    console.log('\n\n📊 6. PRICE PERCENTILES');
    console.log('-'.repeat(80));

    const percentiles = [10, 25, 50, 75, 90, 95, 99];
    
    for (const p of percentiles) {
      const offset = Math.floor((totalProducts * p) / 100);
      const result = await prisma.$queryRaw`
        SELECT price
        FROM product
        WHERE isActive = 1
        ORDER BY price
        LIMIT 1 OFFSET ${offset}
      `;
      
      if (result.length > 0) {
        console.log(`${p}th percentile: $${result[0].price.toFixed(2)}`);
      }
    }

    // 7. Products by Brand (Top 10)
    console.log('\n\n🏷️  7. TOP 10 BRANDS BY PRODUCT COUNT');
    console.log('-'.repeat(80));

    const brandStats = await prisma.$queryRaw`
      SELECT 
        brand,
        COUNT(*) as count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM product
      WHERE isActive = 1
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 10
    `;

    console.log('\nBrand                 | Count  | Avg Price  | Min Price  | Max Price');
    console.log('-'.repeat(80));

    brandStats.forEach(brand => {
      console.log(
        `${brand.brand.padEnd(20)} | ${brand.count.toString().padStart(6)} | $${brand.avg_price.toFixed(2).padStart(9)} | $${brand.min_price.toFixed(2).padStart(9)} | $${brand.max_price.toFixed(2).padStart(9)}`
      );
    });

    // 8. Price Anomalies
    console.log('\n\n⚠️  8. POTENTIAL PRICE ANOMALIES');
    console.log('-'.repeat(80));

    // Products with price = 0
    const zeroPrice = await prisma.product.count({
      where: { 
        isActive: true,
        price: 0
      }
    });

    // Products with very high prices (> $50,000)
    const veryExpensive = await prisma.product.count({
      where: { 
        isActive: true,
        price: { gt: 50000 }
      }
    });

    // Products with very low prices (< $1)
    const veryCheap = await prisma.product.count({
      where: { 
        isActive: true,
        price: { lt: 1 }
      }
    });

    console.log(`Products with $0 price      : ${zeroPrice}`);
    console.log(`Products > $50,000          : ${veryExpensive}`);
    console.log(`Products < $1               : ${veryCheap}`);

    if (zeroPrice > 0 || veryExpensive > 0 || veryCheap > 0) {
      console.log('\n⚠️  Warning: Some price anomalies detected!');
    } else {
      console.log('\n✅ No major price anomalies detected');
    }

    // 9. Summary
    console.log('\n\n📋 9. SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Total Active Products : ${totalProducts.toLocaleString()}`);
    console.log(`Price Range           : $${stat.min_price.toFixed(2)} - $${stat.max_price.toFixed(2)}`);
    console.log(`Average Price         : $${stat.avg_price.toFixed(2)}`);
    console.log(`Total Categories      : ${categoryStats.length}`);
    console.log(`Total Brands          : ${brandStats.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ PRODUCT PRICE RANGE CHECK COMPLETED\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkProductPriceRange()
  .catch(console.error);
