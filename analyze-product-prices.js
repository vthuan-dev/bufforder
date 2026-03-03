const fs = require('fs');
const path = require('path');

// Đọc file CSV
const csvPath = path.join(__dirname, 'backend/prisma/archive/amazon_products_cleaned.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

// Tìm index của cột giá
const priceIndex = headers.findIndex(h => h.includes('Product Price'));

const prices = [];
const categories = {};
const subcategories = {};

// Bỏ qua header và dòng trống
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  // Parse dòng CSV (xử lý trường hợp có dấu phẩy trong quotes)
  const matches = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  if (!matches || matches.length < priceIndex) continue;
  
  const category = matches[1]?.replace(/"/g, '').trim();
  const subcategory = matches[2]?.replace(/"/g, '').trim();
  const priceStr = matches[priceIndex]?.replace(/"/g, '').trim();
  
  if (!priceStr) continue;
  
  // Chuyển đổi giá từ string sang number
  const priceMatch = priceStr.match(/[\d,]+\.?\d*/);
  if (!priceMatch) continue;
  
  const price = parseFloat(priceMatch[0].replace(/,/g, ''));
  if (isNaN(price) || price <= 0) continue;
  
  prices.push(price);
  
  // Thống kê theo category
  if (category) {
    if (!categories[category]) {
      categories[category] = { prices: [], count: 0 };
    }
    categories[category].prices.push(price);
    categories[category].count++;
  }
  
  // Thống kê theo subcategory
  if (subcategory) {
    if (!subcategories[subcategory]) {
      subcategories[subcategory] = { prices: [], count: 0 };
    }
    subcategories[subcategory].prices.push(price);
    subcategories[subcategory].count++;
  }
}

// Hàm tính toán thống kê
function calculateStats(priceArray) {
  if (priceArray.length === 0) return null;
  
  const sorted = [...priceArray].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = priceArray.reduce((sum, p) => sum + p, 0) / priceArray.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Tính quartiles
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  
  return {
    count: priceArray.length,
    min: min.toFixed(2),
    max: max.toFixed(2),
    avg: avg.toFixed(2),
    median: median.toFixed(2),
    q1: q1.toFixed(2),
    q3: q3.toFixed(2)
  };
}

// Phân tích tổng quan
console.log('='.repeat(80));
console.log('PHÂN TÍCH RANGE GIÁ SẢN PHẨM TỔNG QUAN');
console.log('='.repeat(80));
const overallStats = calculateStats(prices);
console.log(`Tổng số sản phẩm: ${overallStats.count}`);
console.log(`Giá thấp nhất: $${overallStats.min}`);
console.log(`Giá cao nhất: $${overallStats.max}`);
console.log(`Giá trung bình: $${overallStats.avg}`);
console.log(`Giá trung vị: $${overallStats.median}`);
console.log(`Quartile 1 (25%): $${overallStats.q1}`);
console.log(`Quartile 3 (75%): $${overallStats.q3}`);

// Phân loại theo khoảng giá
const priceRanges = {
  'Dưới $50': prices.filter(p => p < 50).length,
  '$50 - $100': prices.filter(p => p >= 50 && p < 100).length,
  '$100 - $200': prices.filter(p => p >= 100 && p < 200).length,
  '$200 - $500': prices.filter(p => p >= 200 && p < 500).length,
  '$500 - $1000': prices.filter(p => p >= 500 && p < 1000).length,
  'Trên $1000': prices.filter(p => p >= 1000).length
};

console.log('\n' + '='.repeat(80));
console.log('PHÂN BỐ THEO KHOẢNG GIÁ');
console.log('='.repeat(80));
Object.entries(priceRanges).forEach(([range, count]) => {
  const percentage = ((count / prices.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(percentage / 2));
  console.log(`${range.padEnd(20)} ${count.toString().padStart(6)} sản phẩm (${percentage}%) ${bar}`);
});

// Phân tích theo category
console.log('\n' + '='.repeat(80));
console.log('PHÂN TÍCH THEO DANH MỤC (CATEGORY)');
console.log('='.repeat(80));
Object.entries(categories)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10)
  .forEach(([cat, data]) => {
    const stats = calculateStats(data.prices);
    console.log(`\n${cat}:`);
    console.log(`  Số lượng: ${stats.count} sản phẩm`);
    console.log(`  Giá: $${stats.min} - $${stats.max}`);
    console.log(`  Trung bình: $${stats.avg} | Trung vị: $${stats.median}`);
  });

// Phân tích theo subcategory
console.log('\n' + '='.repeat(80));
console.log('PHÂN TÍCH THEO DANH MỤC PHỤ (SUBCATEGORY) - TOP 15');
console.log('='.repeat(80));
Object.entries(subcategories)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 15)
  .forEach(([subcat, data]) => {
    const stats = calculateStats(data.prices);
    console.log(`\n${subcat}:`);
    console.log(`  Số lượng: ${stats.count} sản phẩm`);
    console.log(`  Giá: $${stats.min} - $${stats.max}`);
    console.log(`  Trung bình: $${stats.avg} | Trung vị: $${stats.median}`);
  });

console.log('\n' + '='.repeat(80));
console.log('HOÀN TẤT PHÂN TÍCH');
console.log('='.repeat(80));
