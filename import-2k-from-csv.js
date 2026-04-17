/**
 * Import exactly 2000 products from CSV to database
 * Uses REAL prices from CSV (not randomized)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

console.log('📦 Importing 2000 products from CSV to database...\n');

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  return fields;
}

function parsePrice(priceStr) {
  if (!priceStr) return 99.99;
  
  // Remove $, commas, spaces
  const cleaned = priceStr.replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  
  return isNaN(price) ? 99.99 : price;
}

async function importProducts() {
  try {
    // Read CSV
    const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    console.log(`📊 Total products in CSV: ${lines.length}`);
    console.log('🗑️  Deleting existing products...\n');
    
    // Delete existing products
    await prisma.product.deleteMany({});
    console.log('✅ Deleted all existing products\n');
    
    // Take first 2000 products
    const selectedLines = lines.slice(0, 2000);
    const products = [];
    
    console.log('📦 Processing 2000 products...\n');
    
    for (let i = 0; i < selectedLines.length; i++) {
      const line = selectedLines[i];
      if (!line.trim()) continue;
      
      const fields = parseCSVLine(line);
      
      // CSV structure: index, category, subcategory, name, url, price, rating, ratings, image
      const category = fields[1] || 'Electronics';
      const subcategory = fields[2] || 'General';
      const name = fields[3] || `Product ${i + 1}`;
      const productUrl = fields[4] || 'https://www.amazon.com';
      const priceStr = fields[5] || '$99.99';
      const image = fields[8] || 'https://via.placeholder.com/400';
      
      // Parse real price from CSV
      const price = parsePrice(priceStr);
      
      products.push({
        name: name.substring(0, 500), // Limit length
        brand: subcategory.substring(0, 100),
        category: category.substring(0, 100),
        price: price,
        image: image,
        productUrl: productUrl,
        isActive: true
      });
      
      if ((i + 1) % 200 === 0) {
        console.log(`   Processed: ${i + 1}/2000 products`);
      }
    }
    
    console.log(`\n💾 Inserting ${products.length} products into database...\n`);
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch,
        skipDuplicates: true
      });
      console.log(`   Inserted: ${Math.min(i + batchSize, products.length)}/${products.length} products`);
    }
    
    // Calculate statistics
    const prices = products.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    console.log('\n✅ IMPORT COMPLETE!\n');
    console.log('📊 STATISTICS:');
    console.log(`   Products imported: ${products.length}`);
    console.log(`   Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
    console.log(`   Average price: $${avgPrice.toFixed(2)}`);
    
    // Verify in database
    const count = await prisma.product.count();
    console.log(`\n✅ Verified in database: ${count} products`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
