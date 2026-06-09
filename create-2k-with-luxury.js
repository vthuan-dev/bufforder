const fs = require('fs');
const path = require('path');

console.log('🔨 TẠO FILE SQL 2000 SẢN PHẨM (BAO GỒM GIÁ CAO)\n');

// Đọc file SQL đầy đủ
const sqlFile = path.join(__dirname, 'backend/prisma/amazon_products_full.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

// Tách các dòng INSERT
const insertLines = sqlContent.split('\n').filter(line => line.trim().startsWith('('));

const allProducts = [];

insertLines.forEach(line => {
  const match = line.match(/\('([^']+)',\s*'([^']+)',\s*'([^']*)',\s*(\d+\.?\d*),\s*'([^']*)',\s*'([^']*)'/);
  
  if (match) {
    const [, name, category, subcategory, price, imageUrl, productUrl] = match;
    const priceNum = parseFloat(price);
    
    allProducts.push({
      name,
      category,
      subcategory,
      price: priceNum,
      imageUrl,
      productUrl,
      insertLine: line
    });
  }
});

console.log(`📊 Tổng số sản phẩm: ${allProducts.length}`);

// Phân loại sản phẩm
const lowPrice = allProducts.filter(p => p.price < 1000);
const midPrice = allProducts.filter(p => p.price >= 1000 && p.price < 10000);
const highPrice = allProducts.filter(p => p.price >= 10000 && p.price <= 30000);

console.log(`   < $1,000: ${lowPrice.length} sản phẩm`);
console.log(`   $1k-$10k: ${midPrice.length} sản phẩm`);
console.log(`   $10k-$30k: ${highPrice.length} sản phẩm\n`);

// Chọn sản phẩm theo tỷ lệ:
// - 1600 sản phẩm giá thấp (< $1000)
// - 300 sản phẩm giá trung (1k-10k)
// - 100 sản phẩm giá cao (10k-30k)

const selectedProducts = [];

// Shuffle và chọn ngẫu nhiên
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

selectedProducts.push(...shuffle(lowPrice).slice(0, 1600));
selectedProducts.push(...shuffle(midPrice).slice(0, 300));
selectedProducts.push(...shuffle(highPrice).slice(0, 100));

console.log(`✅ Đã chọn ${selectedProducts.length} sản phẩm\n`);

// Phân tích sản phẩm đã chọn
const stats = {
  total: selectedProducts.length,
  minPrice: Math.min(...selectedProducts.map(p => p.price)),
  maxPrice: Math.max(...selectedProducts.map(p => p.price)),
  avgPrice: selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length
};

console.log('📈 THỐNG KÊ SẢN PHẨM ĐÃ CHỌN:');
console.log(`   Tổng số: ${stats.total} sản phẩm`);
console.log(`   Giá thấp nhất: $${stats.minPrice.toFixed(2)}`);
console.log(`   Giá cao nhất: $${stats.maxPrice.toLocaleString()}`);
console.log(`   Giá trung bình: $${stats.avgPrice.toFixed(2)}\n`);

// Tạo file SQL
const sqlHeader = `-- Amazon Products with Real Images and Prices
-- Total: ${selectedProducts.length} products
-- Price range: $${stats.minPrice.toFixed(2)} - $${stats.maxPrice.toLocaleString()}
-- Generated: ${new Date().toISOString()}

INSERT INTO products (name, category, subcategory, price, image_url, product_url) VALUES
`;

const sqlValues = selectedProducts.map(p => p.insertLine).join(',\n');
const sqlFooter = ';\n';

const finalSql = sqlHeader + sqlValues + sqlFooter;

// Lưu file
const outputFile = path.join(__dirname, 'backend/prisma/amazon_2k_mixed_prices.sql');
fs.writeFileSync(outputFile, finalSql);

console.log(`💾 Đã tạo file: backend/prisma/amazon_2k_mixed_prices.sql`);
console.log(`   Kích thước: ${(finalSql.length / 1024).toFixed(2)} KB\n`);

// Hiển thị mẫu sản phẩm giá cao
console.log('🏆 MẪU SẢN PHẨM GIÁ CAO ($10K-$30K):');
console.log('='.repeat(80));

const luxuryProducts = selectedProducts.filter(p => p.price >= 10000).slice(0, 5);
luxuryProducts.forEach((p, i) => {
  console.log(`\n${i + 1}. ${p.name.substring(0, 60)}...`);
  console.log(`   Giá: $${p.price.toLocaleString()}`);
  console.log(`   Danh mục: ${p.category}`);
});

console.log('\n\n✅ HOÀN TẤT!\n');
